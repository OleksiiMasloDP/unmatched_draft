<template>
  <div class="lb">
    <div class="lb-wrap">
      <h1 class="lb-title">{{ L.title }}</h1>
      <p class="lb-sub">{{ L.sub }}</p>

      <div class="lb-cats">
        <button
          v-for="item in categories"
          :key="item.id"
          type="button"
          class="lb-cat"
          :class="{ on: cat === item.id }"
          @click="cat = item.id"
        >
          <RogueIcon
            :name="item.icon"
            :metal="cat === item.id ? 'gold' : 'silver'"
            size="20px"
          />
          <span>{{ L.cats[item.id] }}</span>
        </button>
      </div>

      <div v-if="cat === 'hero'" class="lb-heroes">
        <button
          v-for="key in heroKeys"
          :key="key"
          type="button"
          class="lb-hero"
          :class="{ on: hero === key }"
          :title="heroName(key)"
          @click="hero = key"
        >
          <img :src="heroImage(key)" alt="" />
        </button>
      </div>

      <div class="lb-card">
        <div class="lb-head">
          <b>
            {{ L.cats[cat] }}
            <template v-if="cat === 'hero'"> · {{ heroName(hero) }}</template>
          </b>
          <span>{{ ranked.length }} {{ L.players }}</span>
        </div>

        <p v-if="boardState === 'loading'" class="lb-note">{{ L.loading }}</p>
        <p v-else-if="boardState === 'error'" class="lb-note warn">
          {{ L.error }}
        </p>
        <p v-if="cat === 'winrate'" class="lb-note">{{ L.winrateNote }}</p>

        <ol v-if="top.length" class="lb-list">
          <li
            v-for="row in top"
            :key="row.id"
            class="lb-row"
            :class="['p' + Math.min(row.rank, 4), { me: row.id === myId }]"
          >
            <span class="lb-rank">{{ row.rank }}</span>
            <img class="lb-ava" :src="heroImage(row.avatar)" alt="" />
            <div class="lb-who">
              <b>{{ row.nick }}</b>
              <span v-if="row.id === myId" class="lb-you">{{ L.you }}</span>
              <small
                >{{ titleOf(row.title) }} · {{ L.units.level }}
                {{ row.level }}</small
              >
            </div>
            <div class="lb-val">
              <b>{{ row.score }}{{ current.suffix || "" }}</b>
              <small>{{ L.units[cat] }}</small>
            </div>
          </li>
        </ol>
        <p v-else-if="boardState !== 'loading'" class="lb-note">
          {{ L.empty }}
        </p>

        <div v-if="!user" class="lb-sign">
          <span>{{ L.signin }}</span>
          <button type="button" class="lb-btn" @click="openAuth('signin')">
            {{ L.signinBtn }}
          </button>
        </div>
        <div v-else class="lb-mine">
          <span>{{ L.yourRank }}</span>
          <b>{{ myRank ? "#" + myRank : L.notRanked }}</b>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import RogueIcon from "../RogueIcon.vue";
import { useDraftState } from "../../composables/useDraftState";
import { openAuth, user } from "../../cloud/useAuth";
import {
  board,
  boardState,
  categories,
  loadBoard,
} from "../../profile/leaderboard";
import { matchStats } from "../../profile/matchStats";
import { heroImage, heroKeys, heroName } from "../../profile/profileStore";
import { boardDict } from "../../profile/boardDict";
import { profileDict } from "../../profile/profileDict";

const { lang } = useDraftState();
const key = computed(() => (lang.value === "ua" ? "ua" : "en"));
const L = computed(() => boardDict[key.value]);
const titleOf = (id) => profileDict[key.value].titles?.[id] || id;

const cat = ref("wins");
const hero = ref(heroKeys[0]);
const myId = computed(() => (user.value ? user.value.id : null));
const current = computed(() =>
  categories.find((item) => item.id === cat.value),
);

const ranked = computed(() => {
  const def = current.value;
  return board.value
    .map((row) => ({ ...row, score: def.value(row, hero.value) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.nick.localeCompare(b.nick))
    .map((row, index) => ({ ...row, rank: index + 1 }));
});

const top = computed(() => ranked.value.slice(0, 50));
const myRank = computed(
  () => ranked.value.find((row) => row.id === myId.value)?.rank || 0,
);

onMounted(loadBoard);
watch(() => [user.value?.id, matchStats.games], loadBoard);
</script>

<style scoped>
.lb {
  --fg: #e2e8f0;
  --mut: #94a3b8;
  --card: rgba(20, 28, 48, 0.78);
  --line: rgba(255, 255, 255, 0.1);
  --acc: #facc15;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 80px 16px 60px;
  color: var(--fg);
  background:
    radial-gradient(
      900px 400px at 50% -80px,
      rgba(59, 107, 255, 0.28),
      transparent
    ),
    #0b0f19;
}

.lb-wrap {
  max-width: 820px;
  margin: 0 auto;
}

.lb-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 900;
  color: #fff;
}

.lb-sub {
  margin: 6px 0 18px;
  color: var(--mut);
}

.lb-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.lb-cat {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px 8px 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--mut);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.lb-cat.on {
  color: #1a1204;
  background: var(--acc);
  border-color: var(--acc);
}

.lb-heroes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.lb-hero {
  width: 44px;
  height: 44px;
  padding: 2px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: var(--card);
  cursor: pointer;
}

.lb-hero.on {
  border-color: var(--acc);
}

.lb-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 9px;
  display: block;
}

.lb-card {
  padding: 16px;
  border-radius: 18px;
  background: var(--card);
  border: 1px solid var(--line);
}

.lb-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
  color: #fff;
}

.lb-head span,
.lb-note {
  color: var(--mut);
  font-size: 13px;
}

.lb-note.warn {
  color: #fca5a5;
}

.lb-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.lb-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
}

.lb-row.me {
  border-color: var(--acc);
  background: rgba(250, 204, 21, 0.1);
}

.lb-rank {
  flex: none;
  width: 30px;
  text-align: center;
  font-weight: 900;
  font-size: 1.1rem;
  color: var(--mut);
}

.p1 .lb-rank {
  color: #facc15;
  font-size: 1.4rem;
}

.p2 .lb-rank {
  color: #e2e8f0;
  font-size: 1.3rem;
}

.p3 .lb-rank {
  color: #f59e6b;
  font-size: 1.2rem;
}

.p1 {
  background: linear-gradient(
    90deg,
    rgba(250, 204, 21, 0.16),
    rgba(255, 255, 255, 0.04)
  );
}

.lb-ava {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: cover;
}

.lb-who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
}

.lb-who b {
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.lb-who small {
  flex-basis: 100%;
  color: var(--mut);
}

.lb-you {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--acc);
  color: #1a1204;
  font-size: 11px;
  font-weight: 900;
}

.lb-val {
  text-align: right;
}

.lb-val b {
  display: block;
  font-size: 1.2rem;
  color: var(--acc);
}

.lb-val small {
  color: var(--mut);
}

.lb-sign,
.lb-mine {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--mut);
}

.lb-mine b {
  color: var(--acc);
  font-size: 1.1rem;
}

.lb-btn {
  padding: 8px 18px;
  border: 0;
  border-radius: 10px;
  background: #3b6bff;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}
</style>
