<template>
  <div class="pp">
    <div class="pp-wrap">
      <button type="button" class="pp-back" @click="goBack">
        ← {{ L.back }}
      </button>
      <p v-if="state === 'loading'" class="pp-note">…</p>
      <p v-else-if="state === 'missing'" class="pp-note">
        {{ L.playerNotFound }}
      </p>
      <template v-else>
        <div class="pp-bg" :class="'bn-' + card.banner">
          <img :src="heroImage(card.favHero)" alt="" />
          <span class="pp-shade"></span>
        </div>
        <section class="pp-head">
          <div class="pp-ava" :class="'fr-' + card.frame">
            <img :src="heroImage(row.avatar)" alt="" />
            <span class="pp-lvl">{{ card.level.level }}</span>
          </div>
          <div class="pp-id">
            <h1>{{ row.nick }}</h1>
            <p class="pp-title">{{ L.titles[row.title] }}</p>
            <p class="pp-chips">
              <span>{{ totals.games }} {{ L.games }}</span>
              <span>{{ rate }}% {{ L.winrate }}</span>
              <span>{{ card.done.length }} / {{ defs.length }} ★</span>
            </p>
            <p v-if="card.bio" class="pp-bio">{{ card.bio }}</p>
          </div>
          <router-link v-if="isMe" :to="{ name: 'profile' }" class="pp-edit">
            {{ L.tabs.customize }}
          </router-link>
        </section>

        <div class="pp-grid">
          <div class="pp-cardbox">
            <ProfileCard
              :nick="row.nick"
              :title="L.titles[row.title]"
              :art="heroImage(card.favHero)"
              :avatar="heroImage(row.avatar)"
              :frame="card.cardFrame"
              :effect="card.cardEffect"
              :avatar-frame="card.frame"
              :level="card.level"
              :games="totals.games"
              :winrate="rate"
              :badges="badges"
            />
          </div>
          <section class="pp-box">
            <h2>{{ L.tabs.stats }}</h2>
            <StatsPanel
              v-if="card.data"
              :data="card.data"
              :L="L"
              :prefs="card"
            />
            <p v-else class="pp-note">{{ L.hiddenStats }}</p>
          </section>
        </div>

        <section class="pp-box">
          <h2>{{ L.tabs.achievements }}</h2>
          <div class="pp-ach">
            <div
              v-for="item in defs"
              :key="item.id"
              class="pp-badge"
              :class="{ dim: !card.done.includes(item.id) }"
            >
              <RogueIcon
                :name="item.icon"
                :metal="metals[item.rarity]"
                size="34px"
              />
              <b>{{ L.ach[item.id].name }}</b>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import RogueIcon from "../RogueIcon.vue";
import ProfileCard from "../ProfileCard.vue";
import StatsPanel from "../StatsPanel.vue";
import { useDraftState } from "../../composables/useDraftState";
import { user } from "../../cloud/useAuth";
import { loadPlayer } from "../../profile/leaderboard";
import { heroImage } from "../../profile/profileStore";
import { profileDict } from "../../profile/profileDict";
import { buildAchievements } from "../../profile/achievements";
import { empty } from "../../profile/matchStats";
import { mainTotals } from "../../profile/publicProfile";

const { lang } = useDraftState();
const route = useRoute();
const router = useRouter();
const L = computed(() => profileDict[lang.value === "ua" ? "ua" : "en"]);

const metals = {
  common: "bronze",
  rare: "silver",
  epic: "ruby",
  legendary: "gold",
};
const defs = buildAchievements(empty());

const state = ref("loading");
const row = ref(null);
const card = computed(() => row.value.card);
const isMe = computed(() => user.value && row.value.id === user.value.id);

const load = async () => {
  state.value = "loading";
  const found = await loadPlayer(String(route.params.id));
  if (!found) {
    state.value = "missing";
    return;
  }
  row.value = found;
  state.value = "ready";
};
watch(() => route.params.id, load, { immediate: true });

const totals = computed(() => {
  const data = card.value.data;
  if (!data)
    return { games: row.value.stats.games, wins: row.value.stats.wins };
  return mainTotals(data, card.value.leaguePrimary, card.value.leagueMerge);
});
const rate = computed(() =>
  Math.round((totals.value.wins / Math.max(1, totals.value.games)) * 100),
);
const badges = computed(() =>
  card.value.showcase
    .map((id) => defs.find((item) => item.id === id))
    .filter(Boolean)
    .map((item) => ({
      id: item.id,
      icon: item.icon,
      metal: metals[item.rarity],
    })),
);

const goBack = () => {
  if (window.history.length > 1) router.back();
  else router.push({ name: "leaderboard" });
};
</script>

<style scoped>
.pp {
  min-height: 100vh;
  background: #0b1220;
  padding: 20px 16px 60px;
  color: #e2e8f0;
}

.pp-wrap {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
}

.pp-back,
.pp-edit {
  display: inline-block;
  margin-bottom: 12px;
  padding: 7px 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.6);
  color: inherit;
  font-weight: 700;
  text-decoration: none;
}

.pp-note {
  padding: 40px 0;
  text-align: center;
  color: #94a3b8;
}

.pp-bg {
  position: relative;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
}

.pp-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.55;
}

.pp-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 30%, rgba(8, 12, 24, 0.85));
}

.pp-head {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  margin: -48px 16px 20px;
}

.pp-ava {
  position: relative;
  flex: none;
  width: 104px;
  height: 104px;
  padding: 4px;
  border-radius: 50%;
}

.pp-ava img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #0f172a;
}

.pp-lvl {
  position: absolute;
  right: -4px;
  bottom: -4px;
  min-width: 30px;
  padding: 2px 6px;
  border: 2px solid #facc15;
  border-radius: 999px;
  background: #0f172a;
  color: #facc15;
  font-weight: 900;
  font-size: 13px;
  text-align: center;
}

.pp-id {
  flex: 1;
  min-width: 200px;
}

.pp-id h1 {
  margin: 0;
  font-size: 1.7rem;
}

.pp-title {
  margin: 2px 0 8px;
  color: #facc15;
  font-weight: 700;
}

.pp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
}

.pp-chips span {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  font-size: 13px;
  font-weight: 700;
}

.pp-bio {
  margin: 10px 0 0;
  color: #cbd5e1;
}

.pp-grid {
  display: grid;
  grid-template-columns: minmax(240px, 300px) 1fr;
  gap: 16px;
  margin-bottom: 16px;
  align-items: start;
}

.pp-cardbox {
  padding: 6px 6px 30px;
}

.pp-box {
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.6);
}

.pp-box h2 {
  margin: 0 0 12px;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pp-ach {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.pp-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.1);
  text-align: center;
  font-size: 12px;
}

.pp-badge.dim {
  opacity: 0.35;
  filter: grayscale(1);
}

@media (max-width: 760px) {
  .pp-grid {
    grid-template-columns: 1fr;
  }

  .pp-cardbox {
    max-width: 300px;
    margin: 0 auto;
  }
}
</style>
