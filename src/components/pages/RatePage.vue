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
        <span v-if="!user" class="rt-warn">{{ L.guest }}</span>
      </div>

      <div v-if="pair" class="rt-stage">
        <div class="rt-pair" :class="fly">
          <div class="rt-hero">
            <img :src="pair[0].image" :alt="pair[0].name" />
            <b>{{ pair[0].name }}</b>
          </div>
          <span class="rt-vs">VS</span>
          <div class="rt-hero">
            <img :src="pair[1].image" :alt="pair[1].name" />
            <b>{{ pair[1].name }}</b>
          </div>
        </div>
        <p class="rt-q">{{ L.q.replace("{a}", pair[0].name) }}</p>
        <div class="rt-btns">
          <button
            v-for="item in scales"
            :key="item.score"
            type="button"
            class="rt-btn"
            :class="tone(item.score)"
            @click="vote(item.score)"
          >
            <b>{{ item.label }}</b>
            <small>{{ item.pct }}%</small>
          </button>
        </div>
        <div class="rt-row">
          <button type="button" class="rt-ghost" @click="skip">
            {{ L.skip }}
          </button>
          <button v-if="last" type="button" class="rt-ghost" @click="undo">
            {{ L.undo }}
          </button>
        </div>
        <p class="rt-keys">{{ L.keys }}</p>
      </div>
      <p v-else class="rt-done">{{ ready ? L.done : L.loading }}</p>

      <div class="rt-export">
        <button type="button" class="rt-ghost" @click="exportMine">
          {{ L.exportMine }}
        </button>
        <button type="button" class="rt-ghost" @click="exportAll">
          {{ L.exportAll }}
        </button>
        <span v-if="note" class="rt-note">{{ note }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { user } from "../../cloud/useAuth";
import {
  castVote,
  cloudExport,
  hasVote,
  localExport,
  scales,
  syncVotes,
  undoVote,
  votes,
} from "../../profile/matchupVotes";

const { lang, characters, getWinrate, loadChars } = useDraftState();

const dict = {
  en: {
    title: "Rate matchups",
    sub: "These pairs have no data yet. Say who has the edge.",
    rated: "Rated",
    left: "Left",
    guest: "Sign in to send votes to the site",
    q: "How good is {a} in this matchup?",
    skip: "Skip",
    undo: "Undo",
    keys: "Keys: 1–7 to vote, S to skip",
    done: "No more pairs to rate. Thank you!",
    loading: "Loading…",
    exportMine: "Copy my votes",
    exportAll: "Copy all results",
    copied: "Copied to clipboard",
    empty: "Nothing to copy yet",
  },
  ua: {
    title: "Оцінка матчапів",
    sub: "Для цих пар ще немає даних. Скажи, хто має перевагу.",
    rated: "Оцінено",
    left: "Залишилось",
    guest: "Увійди, щоб голоси потрапили на сайт",
    q: "Наскільки сильний {a} в цьому матчапі?",
    skip: "Пропустити",
    undo: "Скасувати",
    keys: "Клавіші: 1–7 — оцінка, S — пропустити",
    done: "Пар для оцінки більше немає. Дякуємо!",
    loading: "Завантаження…",
    exportMine: "Копіювати мої голоси",
    exportAll: "Копіювати всі результати",
    copied: "Скопійовано",
    empty: "Поки нічого копіювати",
  },
};
const L = computed(() => dict[lang.value === "ua" ? "ua" : "en"]);

const ready = ref(false);
const skipped = ref(new Set());
const pair = ref(null);
const last = ref(null);
const fly = ref("");
const note = ref("");

const pool = computed(() => {
  const list = characters.value;
  const out = [];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      if (getWinrate(a.name, b.name) !== null) continue;
      if (hasVote(a.name, b.name)) continue;
      out.push([a, b]);
    }
  return out;
});

const ratedCount = computed(() => Object.keys(votes).length);

const tone = (score) => (score > 0 ? "up" : score < 0 ? "down" : "mid");

const next = () => {
  const list = pool.value.filter(
    ([a, b]) => !skipped.value.has(`${a.name}|${b.name}`),
  );
  const source = list.length ? list : pool.value;
  if (!source.length) {
    pair.value = null;
    return;
  }
  const pick = source[Math.floor(Math.random() * source.length)];
  pair.value = Math.random() < 0.5 ? pick : [pick[1], pick[0]];
};

const animate = (cls) => {
  fly.value = cls;
  setTimeout(() => {
    fly.value = "";
    next();
  }, 180);
};

const vote = (score) => {
  if (!pair.value) return;
  const [a, b] = pair.value;
  castVote(a.name, b.name, score);
  last.value = [a, b];
  animate(score > 0 ? "go-up" : score < 0 ? "go-down" : "go-mid");
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
};

const copy = async (rows) => {
  if (!rows || !rows.length) {
    note.value = L.value.empty;
    return;
  }
  const text = JSON.stringify(rows, null, 1);
  try {
    await navigator.clipboard.writeText(text);
    note.value = L.value.copied;
  } catch {
    window.prompt("", text);
  }
  setTimeout(() => (note.value = ""), 2500);
};

const exportMine = () => copy(localExport());
const exportAll = async () => copy(await cloudExport());

const onKey = (event) => {
  if (event.target && /input|textarea/i.test(event.target.tagName)) return;
  if (/^[1-7]$/.test(event.key)) vote(scales[Number(event.key) - 1].score);
  if (event.key === "s" || event.key === "S") skip();
};

onMounted(async () => {
  if (!characters.value.length) await loadChars();
  ready.value = true;
  next();
  syncVotes();
  window.addEventListener("keydown", onKey);
});

onUnmounted(() => window.removeEventListener("keydown", onKey));

watch(user, () => syncVotes());
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
.rt-warn {
  color: #fbbf24;
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
.rt-q {
  margin: 18px 0 10px;
  font-weight: 600;
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
.rt-keys {
  font-size: 12px;
  color: #64748b;
  margin: 10px 0 0;
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
