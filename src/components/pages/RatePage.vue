<template>
  <div class="rt">
    <div class="rt-wrap">
      <h1 class="rt-title">{{ L.title }}</h1>
      <p class="rt-sub">{{ L.sub }}</p>
      <div class="rt-stat">
        <span
          >{{ L.rated }}: <b>{{ ratedCount }}</b></span
        >
        <span
          >{{ L.left }}: <b>{{ pool.length }}</b></span
        >
        <span v-if="locked" class="rt-lockinfo"> 🔒 {{ locked.name }} </span>
      </div>

      <div v-if="pair" class="rt-stage">
        <div class="rt-pair" :class="fly">
          <div class="rt-hero" :class="{ on: isLocked(pair[0]) }">
            <button
              type="button"
              class="rt-lock"
              :class="{ on: isLocked(pair[0]) }"
              :title="L.lock"
              @click="toggleLock(pair[0])"
            >
              {{ isLocked(pair[0]) ? "🔒" : "🔓" }}
            </button>
            <img :src="pair[0].image" :alt="pair[0].name" />
            <b>{{ pair[0].name }}</b>
          </div>
          <span class="rt-vs">VS</span>
          <div class="rt-hero" :class="{ on: isLocked(pair[1]) }">
            <button
              type="button"
              class="rt-lock"
              :class="{ on: isLocked(pair[1]) }"
              :title="L.lock"
              @click="toggleLock(pair[1])"
            >
              {{ isLocked(pair[1]) ? "🔒" : "🔓" }}
            </button>
            <img :src="pair[1].image" :alt="pair[1].name" />
            <b>{{ pair[1].name }}</b>
          </div>
        </div>
        <div class="rt-pct">
          <button type="button" class="rt-step" @click="bump(-1)">−</button>
          <div class="rt-big">
            <b>{{ pct }}%</b>
            <i>:</i>
            <b>{{ 100 - pct }}%</b>
          </div>
          <button type="button" class="rt-step" @click="bump(1)">+</button>
        </div>
        <input
          v-model.number="pct"
          class="rt-range"
          type="range"
          min="1"
          max="99"
        />
        <div class="rt-btns">
          <button
            v-for="item in presets"
            :key="item.label"
            type="button"
            class="rt-btn"
            :class="[tone(item.pct), { on: pct === item.pct }]"
            @click="pct = item.pct"
          >
            <b>{{ item.label }}</b>
            <small>{{ item.pct }}%</small>
          </button>
        </div>
        <div class="rt-row">
          <button type="button" class="rt-ok" @click="submit">
            {{ L.ok }}
          </button>
          <button type="button" class="rt-ghost" @click="skip">
            {{ L.skip }}
          </button>
          <button v-if="last" type="button" class="rt-ghost" @click="undo">
            {{ L.undo }}
          </button>
        </div>
      </div>
      <p v-else class="rt-done">{{ ready ? L.done : L.loading }}</p>

      <div class="rt-export">
        <button type="button" class="rt-ghost" @click="copyAll">
          {{ L.copy }}
        </button>
        <span v-if="note" class="rt-note">{{ note }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import {
  castVote,
  exportRows,
  hasVote,
  presets,
  undoVote,
  votes,
} from "../../profile/matchupVotes";

const { lang, characters, getWinrate, loadChars } = useDraftState();

const dict = {
  en: {
    title: "Rate matchups",
    sub: "These pairs have no data yet. Set the first hero's win chance.",
    rated: "Rated",
    left: "Left",
    lock: "Lock this hero to rate him against everyone",
    ok: "Save and next",
    skip: "Skip",
    undo: "Undo",
    done: "No more pairs to rate.",
    loading: "Loading…",
    copy: "Copy JSON",
    copied: "Copied",
  },
  ua: {
    title: "Оцінка матчапів",
    sub: "Для цих пар ще немає даних. Постав шанс перемоги першого героя.",
    rated: "Оцінено",
    left: "Залишилось",
    lock: "Зафіксувати героя, щоб оцінити його проти всіх",
    ok: "Зберегти й далі",
    skip: "Пропустити",
    undo: "Скасувати",
    done: "Пар для оцінки більше немає.",
    loading: "Завантаження…",
    copy: "Копіювати JSON",
    copied: "Скопійовано",
  },
};
const L = computed(() => dict[lang.value === "ua" ? "ua" : "en"]);

const ready = ref(false);
const skipped = ref(new Set());
const pair = ref(null);
const last = ref(null);
const fly = ref("");
const note = ref("");
const pct = ref(50);
const locked = ref(null);

const isLocked = (hero) => locked.value && locked.value.id === hero.id;

const pool = computed(() => {
  const list = characters.value;
  const out = [];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (locked.value && a.id !== locked.value.id && b.id !== locked.value.id)
        continue;
      if (getWinrate(a.name, b.name) !== null) continue;
      if (hasVote(a.name, b.name)) continue;
      out.push([a, b]);
    }
  return out;
});

const ratedCount = computed(() => Object.keys(votes).length);

const tone = (value) => (value > 50 ? "up" : value < 50 ? "down" : "mid");

const next = () => {
  const list = pool.value.filter(
    ([a, b]) => !skipped.value.has(`${a.name}|${b.name}`),
  );
  const source = list.length ? list : pool.value;
  pct.value = 50;
  if (!source.length) {
    pair.value = null;
    return;
  }
  const pick = source[Math.floor(Math.random() * source.length)];
  const lockedFirst = locked.value && pick[1].id === locked.value.id;
  const flip = locked.value ? lockedFirst : Math.random() < 0.5;
  pair.value = flip ? [pick[1], pick[0]] : pick;
};

const animate = (cls) => {
  fly.value = cls;
  setTimeout(() => {
    fly.value = "";
    next();
  }, 180);
};

const bump = (step) => {
  pct.value = Math.min(99, Math.max(1, pct.value + step));
};

const submit = () => {
  if (!pair.value) return;
  const [a, b] = pair.value;
  castVote(a.name, b.name, pct.value);
  last.value = [a, b];
  animate(pct.value > 50 ? "go-up" : pct.value < 50 ? "go-down" : "go-mid");
};

const skip = () => {
  if (!pair.value) return;
  const [a, b] = pair.value;
  skipped.value.add(`${a.name}|${b.name}`);
  skipped.value.add(`${b.name}|${a.name}`);
  animate("go-mid");
};

const undo = () => {
  if (!last.value) return;
  undoVote(last.value[0].name, last.value[1].name);
  pair.value = last.value;
  last.value = null;
  pct.value = 50;
};

const toggleLock = (hero) => {
  if (!pair.value) return;
  if (isLocked(hero)) {
    locked.value = null;
    return;
  }
  locked.value = hero;
  const other = pair.value[0].id === hero.id ? pair.value[1] : pair.value[0];
  pair.value = [hero, other];
};

const json = () => JSON.stringify(exportRows(), null, 1);

const flash = (text) => {
  note.value = text;
  setTimeout(() => (note.value = ""), 2500);
};

const copyAll = async () => {
  try {
    await navigator.clipboard.writeText(json());
    flash(L.value.copied);
  } catch {
    window.prompt("", json());
  }
};

const onKey = (event) => {
  if (event.target && /textarea|input/i.test(event.target.tagName)) {
    if (event.target.type !== "range") return;
  }
  if (/^[1-7]$/.test(event.key)) pct.value = presets[Number(event.key) - 1].pct;
  else if (event.key === "ArrowLeft") bump(-1);
  else if (event.key === "ArrowRight") bump(1);
  else if (event.key === "ArrowUp") bump(5);
  else if (event.key === "ArrowDown") bump(-5);
  else if (event.key === "Enter") submit();
  else if (event.key === "s" || event.key === "S") skip();
  else if ((event.key === "l" || event.key === "L") && pair.value)
    toggleLock(pair.value[0]);
  else return;
  event.preventDefault();
};

onMounted(async () => {
  if (!characters.value.length) await loadChars();
  ready.value = true;
  next();
  window.addEventListener("keydown", onKey);
});

onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>

<style scoped>
.rt {
  padding: 24px 16px 60px;
  color: #e5e7eb;
}
.rt-wrap {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}
.rt-title {
  font-size: 28px;
  margin: 0 0 6px;
}
.rt-sub {
  color: #94a3b8;
  margin: 0 0 12px;
}
.rt-stat {
  display: flex;
  justify-content: center;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 18px;
}
.rt-stat b {
  color: #fff;
}
.rt-lockinfo {
  color: #fbbf24;
}
.rt-hero {
  position: relative;
}
.rt-hero.on {
  border-color: #fbbf24;
}
.rt-lock {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid #475569;
  background: rgba(10, 14, 26, 0.8);
  font-size: 18px;
  cursor: pointer;
}
.rt-lock.on {
  background: #78350f;
  border-color: #fbbf24;
}
.rt-pct {
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}
.rt-big {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
}
.rt-big i {
  color: #64748b;
  font-style: normal;
  font-size: 28px;
}
.rt-big b {
  display: block;
  font-size: 40px;
  line-height: 1;
}
.rt-big small {
  color: #94a3b8;
}
.rt-step {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #334155;
  background: #11182b;
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}
.rt-range {
  width: 100%;
  margin: 14px 0;
}
.rt-btn.on {
  border-color: #818cf8;
  background: #1e2547;
}
.rt-ok {
  background: #4f46e5;
  border: 0;
  color: #fff;
  border-radius: 8px;
  padding: 8px 20px;
  font-weight: 700;
  cursor: pointer;
}

.rt-pair {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition:
    transform 0.18s ease,
    opacity 0.18s ease;
}
.rt-pair.go-up {
  transform: translateY(-40px) scale(1.05);
  opacity: 0;
}
.rt-pair.go-down {
  transform: translateY(40px) scale(0.95);
  opacity: 0;
}
.rt-pair.go-mid {
  transform: scale(0.9);
  opacity: 0;
}
.rt-hero {
  flex: 1;
  max-width: 250px;
  background: #11182b;
  border: 1px solid #2a3350;
  border-radius: 16px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rt-hero img {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border-radius: 10px;
}
.rt-vs {
  font-weight: 800;
  color: #f87171;
}
.rt-btns {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.rt-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 0;
  border-radius: 10px;
  border: 1px solid #2a3350;
  background: #11182b;
  color: #fff;
  cursor: pointer;
}
.rt-btn b {
  font-size: 16px;
}
.rt-btn small {
  color: #94a3b8;
  font-size: 11px;
}
.rt-btn.up:hover {
  background: #14532d;
  border-color: #22c55e;
}
.rt-btn.down:hover {
  background: #7f1d1d;
  border-color: #ef4444;
}
.rt-btn.mid:hover {
  background: #334155;
}
.rt-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 12px;
}
.rt-ghost {
  background: none;
  border: 1px solid #334155;
  color: #cbd5e1;
  border-radius: 8px;
  padding: 7px 14px;
  cursor: pointer;
}
.rt-done {
  padding: 40px 0;
  color: #94a3b8;
}
.rt-export {
  margin-top: 30px;
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}
.rt-note {
  color: #4ade80;
  font-size: 13px;
}
@media (max-width: 480px) {
  .rt-btn {
    padding: 8px 0;
  }
  .rt-btn b {
    font-size: 14px;
  }
}
</style>
