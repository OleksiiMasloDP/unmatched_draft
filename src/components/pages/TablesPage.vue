<template>
  <div class="tb">
    <header class="tb-head">
      <div>
        <h1 class="tb-title">{{ L.title }}</h1>
        <p class="tb-lead">{{ L.lead }}</p>
      </div>
      <button type="button" class="tb-create" @click="openCreate">
        + {{ L.create }}
      </button>
    </header>

    <section v-if="mine" class="tb-mine">
      <div class="tb-mine-main">
        <span class="tb-badge">{{ L.yours }}</span>
        <b>{{ mine.name }}</b>
        <span class="tb-dim">
          {{ mine.status === "playing" ? L.playing : L.waiting }}
          <template v-if="mine.code"> · {{ L.code }}: {{ mine.code }}</template>
        </span>
      </div>
      <div class="tb-mine-actions">
        <button type="button" class="tb-btn" @click="toGame">
          {{ L.toGame }}
        </button>
        <button type="button" class="tb-btn ghost" @click="closeMine">
          {{ L.cancel }}
        </button>
      </div>
    </section>

    <div class="tb-bar">
      <input v-model="query" class="tb-search" :placeholder="L.search" />
      <div class="tb-chips">
        <button
          v-for="item in filters"
          :key="item"
          type="button"
          class="tb-chip"
          :class="{ on: filter === item }"
          @click="filter = item"
        >
          {{ L[item] }}
        </button>
      </div>
    </div>

    <ul v-if="shown.length" class="tb-list">
      <li v-for="item in shown" :key="item.id" class="tb-row">
        <span class="tb-lock" :class="{ on: item.hasPassword }">
          <svg viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path
              :d="
                item.hasPassword
                  ? 'M8 11V8a4 4 0 0 1 8 0v3'
                  : 'M8 11V8a4 4 0 0 1 7.500-2'
              "
            />
          </svg>
        </span>
        <div class="tb-main">
          <b class="tb-name">
            {{ item.name }}
            <em v-if="item.demo" class="tb-demo">{{ L.demo }}</em>
          </b>
          <span class="tb-dim">
            {{ L.by }} {{ item.hostName }} · {{ ago(item.createdAt) }}
          </span>
        </div>
        <span class="tb-seats">{{ item.status === "open" ? 1 : 2 }}/2</span>
        <span class="tb-state" :class="item.status">
          {{ item.status === "open" ? L.open : L.playing }}
        </span>
        <button
          type="button"
          class="tb-btn"
          :disabled="item.status !== 'open'"
          @click="tryJoin(item)"
        >
          {{ item.status === "open" ? L.join : L.full }}
        </button>
      </li>
    </ul>
    <p v-else class="tb-empty">{{ query ? L.noMatch : L.empty }}</p>
    <p class="tb-scope">{{ L.scope }}</p>

    <div v-if="dialog" class="tb-modal" @click.self="dialog = ''">
      <form class="tb-dialog" @submit.prevent="submit">
        <h2>{{ dialog === "create" ? L.createTitle : L.enterPass }}</h2>
        <template v-if="dialog === 'create'">
          <label>{{ L.name }}</label>
          <input v-model="form.name" maxlength="32" class="tb-input" />
          <label>{{ L.password }}</label>
          <input
            v-model="form.password"
            type="password"
            maxlength="32"
            class="tb-input"
            autocomplete="off"
          />
          <small>{{ L.passwordHint }}</small>
        </template>
        <template v-else>
          <input
            v-model="form.password"
            type="password"
            class="tb-input"
            autocomplete="off"
            autofocus
          />
        </template>
        <p v-if="error" class="tb-error">{{ error }}</p>
        <div class="tb-dialog-actions">
          <button type="button" class="tb-btn ghost" @click="dialog = ''">
            {{ L.close }}
          </button>
          <button type="submit" class="tb-btn">
            {{ dialog === "create" ? L.submit : L.join }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useDraftState } from "../../composables/useDraftState";
import { lobbyDict } from "../../lobby/lobbyDict";
import {
  closeMine,
  createTable,
  joinTable,
  lobby,
  mine,
  playerName,
  refresh,
} from "../../lobby/lobbyStore";

const { lang } = useDraftState();
const router = useRouter();
const L = computed(() => lobbyDict[lang.value === "ua" ? "ua" : "en"]);

const query = ref("");
const filter = ref("all");
const filters = ["all", "open", "free", "locked"];
const dialog = ref("");
const error = ref("");
const target = ref(null);
const form = reactive({ name: "", password: "" });

const shown = computed(() => {
  const text = query.value.trim().toLowerCase();
  return lobby.list.filter((item) => {
    if (filter.value === "open" && item.status !== "open") return false;
    if (filter.value === "free" && item.hasPassword) return false;
    if (filter.value === "locked" && !item.hasPassword) return false;
    if (!text) return true;
    return (
      item.name.toLowerCase().includes(text) ||
      item.hostName.toLowerCase().includes(text)
    );
  });
});

const ago = (time) => {
  const minutes = Math.floor((Date.now() - time) / 60000);
  return minutes < 1 ? L.value.now : `${minutes} ${L.value.ago}`;
};

const openCreate = () => {
  form.name = `${playerName.value} · ${L.value.defaultName}`;
  form.password = "";
  error.value = "";
  dialog.value = "create";
};

const toGame = () => router.push({ name: "game" });

const enter = async (item, password) => {
  const result = await joinTable(item, password);
  if (result.ok) {
    dialog.value = "";
    toGame();
    return;
  }
  if (result.reason === "password") error.value = L.value.wrongPass;
  else if (result.reason === "demo") error.value = L.value.demoNote;
  else error.value = L.value.closed;
  if (result.reason !== "password" && dialog.value === "") {
    target.value = null;
    window.alert(error.value);
  }
};

const tryJoin = async (item) => {
  error.value = "";
  target.value = item;
  form.password = "";
  if (item.hasPassword && !item.demo) {
    dialog.value = "join";
    return;
  }
  await enter(item, "");
};

const submit = async () => {
  if (dialog.value === "create") {
    const ok = await createTable({
      name: form.name,
      password: form.password,
    });
    if (ok) {
      dialog.value = "";
      toGame();
    }
    return;
  }
  await enter(target.value, form.password);
};

onMounted(refresh);
</script>

<style scoped>
.tb {
  max-width: 920px;
  margin: 0 auto;
  padding: 80px 14px 70px;
  color: #e2e8f0;
}

.tb-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.tb-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 900;
}

.tb-lead {
  margin: 6px 0 0;
  max-width: 560px;
  color: #94a3b8;
  font-size: 14px;
}

.tb-create {
  padding: 12px 22px;
  border: 0;
  border-radius: 12px;
  background: #facc15;
  color: #1a1204;
  font-weight: 900;
}

.tb-mine {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(250, 204, 21, 0.5);
  background: rgba(250, 204, 21, 0.08);
}

.tb-mine-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tb-badge {
  align-self: flex-start;
  padding: 1px 8px;
  border-radius: 999px;
  background: #facc15;
  color: #1a1204;
  font-size: 11px;
  font-weight: 900;
}

.tb-mine-actions {
  display: flex;
  gap: 8px;
}

.tb-bar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.tb-search {
  flex: 1;
  min-width: 220px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(8, 11, 22, 0.6);
  color: #fff;
  font: inherit;
}

.tb-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tb-chip {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: #94a3b8;
  font-size: 12.5px;
  font-weight: 700;
}

.tb-chip.on {
  background: #facc15;
  border-color: #facc15;
  color: #1a1204;
}

.tb-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.tb-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(20, 28, 48, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.tb-lock {
  flex: none;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #64748b;
}

.tb-lock.on {
  color: #facc15;
  background: rgba(250, 204, 21, 0.12);
}

.tb-lock svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}

.tb-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.tb-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tb-demo {
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
  font-size: 10px;
  font-style: normal;
  text-transform: uppercase;
}

.tb-dim {
  color: #94a3b8;
  font-size: 12px;
}

.tb-seats {
  font-weight: 800;
  color: #cbd5e1;
}

.tb-state {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 800;
}

.tb-state.open {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.tb-state.playing {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.tb-btn {
  padding: 9px 18px;
  border: 0;
  border-radius: 10px;
  background: #3b6bff;
  color: #fff;
  font-weight: 800;
  font-size: 13px;
}

.tb-btn:disabled {
  opacity: 0.4;
}

.tb-btn.ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #cbd5e1;
}

.tb-empty {
  padding: 40px 0;
  text-align: center;
  color: #94a3b8;
}

.tb-scope {
  margin-top: 16px;
  font-size: 12px;
  color: #64748b;
}

.tb-modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.6);
}

.tb-dialog {
  width: 100%;
  max-width: 400px;
  padding: 22px;
  border-radius: 18px;
  background: #121a2e;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.tb-dialog h2 {
  margin: 0 0 12px;
  font-size: 1.2rem;
  font-weight: 900;
}

.tb-dialog label {
  display: block;
  margin: 12px 0 5px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.tb-dialog small {
  display: block;
  margin-top: 5px;
  color: #64748b;
}

.tb-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(8, 11, 22, 0.7);
  color: #fff;
  font: inherit;
}

.tb-error {
  margin: 10px 0 0;
  color: #f87171;
  font-size: 13px;
}

.tb-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

@media (max-width: 640px) {
  .tb-row {
    flex-wrap: wrap;
  }
  .tb-seats,
  .tb-state {
    order: 3;
  }
  .tb-btn {
    margin-left: auto;
  }
}
</style>
