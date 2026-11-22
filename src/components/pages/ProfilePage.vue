<template>
  <div class="pf" :class="'v' + variant">
    <div v-if="!user" class="pf-empty">
      <p>{{ L.needLogin }}</p>
      <button type="button" class="pf-btn" @click="openAuth('signin')">
        {{ L.signin }}
      </button>
    </div>

    <template v-else>
      <div class="pf-bg" :class="'bn-' + profile.banner">
        <img :src="heroImage(profile.favHero)" alt="" />
        <span class="pf-bg-shade"></span>
      </div>
      <div class="pf-wrap">
        <aside class="pf-side">
          <section class="pf-head">
            <img class="pf-head-art" :src="heroImage(profile.favHero)" alt="" />
            <div class="pf-ava" :class="'fr-' + profile.frame">
              <img :src="heroImage(profile.avatar)" alt="" />
              <span class="pf-lvl">{{ lvl.level }}</span>
            </div>
            <div class="pf-id">
              <h1 class="pf-nick">{{ profile.nick || L.noNick }}</h1>
              <p class="pf-title">{{ titleText(profile.title) }}</p>
              <div class="pf-xp">
                <span class="pf-xp-fill" :style="{ width: xpPct + '%' }"></span>
                <span class="pf-xp-text"
                  >{{ L.level }} {{ lvl.level }} · {{ lvl.xp }}/{{
                    lvl.need
                  }}
                  XP</span
                >
              </div>
              <p class="pf-chips">
                <span>{{ stats.games }} {{ L.games }}</span>
                <span>{{ winrate }}% {{ L.winrate }}</span>
                <span>{{ doneCount }} / {{ achievements.length }} ★</span>
              </p>
            </div>
          </section>

          <nav class="pf-tabs">
            <button
              v-for="item in tabs"
              :key="item"
              type="button"
              class="pf-tab"
              :class="{ on: tab === item }"
              @click="tab = item"
            >
              <RogueIcon :name="tabIcons[item]" metal="silver" size="18px" />
              <span>{{ L.tabs[item] }}</span>
            </button>
          </nav>
        </aside>

        <div class="pf-main">
          <section v-if="tab === 'overview'" class="pf-grid">
            <div class="pf-card">
              <h2 class="pf-h">{{ L.about }}</h2>
              <p class="pf-bio">{{ profile.bio || L.noBio }}</p>
              <div class="pf-kpis">
                <div class="pf-kpi">
                  <b>{{ stats.games }}</b><span>{{ L.games }}</span>
                </div>
                <div class="pf-kpi">
                  <b>{{ winrate }}%</b><span>{{ L.winrate }}</span>
                </div>
                <div class="pf-kpi">
                  <b>{{ stats.bestStreak }}</b><span>{{ L.bestStreak }}</span>
                </div>
                <div class="pf-kpi">
                  <b>{{ stats.hours }}</b><span>{{ L.hours }}</span>
                </div>
              </div>
            </div>

            <div class="pf-card">
              <h2 class="pf-h">{{ L.showcase }}</h2>
              <div class="pf-show">
                <div
                  v-for="item in showcaseItems"
                  :key="item.id"
                  class="pf-badge"
                  :class="['r-' + item.rarity, { dim: !item.done }]"
                >
                  <RogueIcon
                    :name="item.icon"
                    :metal="metalOf(item.rarity)"
                    size="38px"
                  />
                  <b>{{ L.ach[item.id].name }}</b>
                </div>
              </div>
            </div>

            <div class="pf-card pf-wide">
              <h2 class="pf-h">{{ L.recent }}</h2>
              <ul class="pf-list">
                <li v-for="row in history.slice(0, 5)" :key="row.id">
                  <HistoryRow :row="row" :L="L" />
                </li>
              </ul>
            </div>
          </section>

          <section v-else-if="tab === 'history'" class="pf-card">
            <h2 class="pf-h">{{ L.tabs.history }}</h2>
            <div class="pf-filters">
              <button
                v-for="item in historyFilters"
                :key="item"
                type="button"
                class="pf-chip"
                :class="{ on: histFilter === item }"
                @click="histFilter = item"
              >
                {{ item === "all" ? L.all : L.modes[item] }}
              </button>
            </div>
            <ul class="pf-list">
              <li v-for="row in filteredHistory" :key="row.id">
                <HistoryRow :row="row" :L="L" />
              </li>
            </ul>
          </section>

          <section v-else-if="tab === 'stats'" class="pf-grid">
            <div class="pf-card pf-wide">
              <div class="pf-kpis">
                <div class="pf-kpi">
                  <b>{{ stats.wins }}</b><span>{{ L.wins }}</span>
                </div>
                <div class="pf-kpi">
                  <b>{{ stats.losses }}</b><span>{{ L.losses }}</span>
                </div>
                <div class="pf-kpi">
                  <b>{{ stats.curStreak }}</b><span>{{ L.curStreak }}</span>
                </div>
                <div class="pf-kpi">
                  <b>{{ stats.runsWon }}/{{ stats.runs }}</b
                  ><span>{{ L.runs }}</span>
                </div>
                <div class="pf-kpi">
                  <b>{{ stats.damage }}</b><span>{{ L.damage }}</span>
                </div>
              </div>
            </div>
            <div class="pf-card">
              <h2 class="pf-h">{{ L.byHero }}</h2>
              <div
                v-for="row in stats.perHero"
                :key="row.hero"
                class="pf-bar-row"
              >
                <img :src="heroImage(row.hero)" alt="" />
                <div class="pf-bar-main">
                  <div class="pf-bar-top">
                    <span>{{ heroName(row.hero) }}</span>
                    <span>{{ row.wins }}/{{ row.played }}</span>
                  </div>
                  <div class="pf-bar">
                    <i
                      :style="{ width: (row.wins / row.played) * 100 + '%' }"
                    ></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="pf-card">
              <h2 class="pf-h">{{ L.byMode }}</h2>
              <div
                v-for="row in stats.perMode"
                :key="row.mode"
                class="pf-bar-row"
              >
                <div class="pf-bar-main">
                  <div class="pf-bar-top">
                    <span>{{ L.modes[row.mode] }}</span>
                    <span>{{ row.wins }}/{{ row.played }}</span>
                  </div>
                  <div class="pf-bar">
                    <i
                      :style="{ width: (row.wins / row.played) * 100 + '%' }"
                    ></i>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="tab === 'achievements'" class="pf-card">
            <h2 class="pf-h">
              {{ L.tabs.achievements }} · {{ doneCount }}/{{
                achievements.length
              }}
            </h2>
            <div class="pf-ach">
              <div
                v-for="item in achievements"
                :key="item.id"
                class="pf-ach-item"
                :class="['r-' + item.rarity, { dim: !item.done }]"
              >
                <RogueIcon
                  :name="item.icon"
                  :metal="metalOf(item.rarity)"
                  size="44px"
                />
                <div class="pf-ach-text">
                  <b>{{ L.ach[item.id].name }}</b>
                  <span>{{ L.ach[item.id].text }}</span>
                  <div class="pf-bar">
                    <i
                      :style="{
                        width: (item.progress / item.goal) * 100 + '%',
                      }"
                    ></i>
                  </div>
                  <small
                    >{{ item.progress }}/{{ item.goal }} ·
                    {{ L.rarity[item.rarity] }}</small
                  >
                </div>
              </div>
            </div>
          </section>

          <section v-else class="pf-grid">
            <div class="pf-card">
              <h2 class="pf-h">{{ L.identity }}</h2>
              <label class="pf-label">{{ L.nick }}</label>
              <input v-model="profile.nick" class="pf-input" maxlength="20" />
              <label class="pf-label">{{ L.bio }}</label>
              <textarea
                v-model="profile.bio"
                class="pf-input"
                rows="3"
                maxlength="120"
              ></textarea>
              <label class="pf-label">{{ L.avatar }}</label>
              <div class="pf-picker">
                <button
                  v-for="key in heroKeys"
                  :key="key"
                  type="button"
                  class="pf-pick"
                  :class="{ on: profile.avatar === key }"
                  @click="profile.avatar = key"
                >
                  <img :src="heroImage(key)" alt="" />
                </button>
              </div>
              <label class="pf-label">{{ L.favHero }}</label>
              <div class="pf-picker">
                <button
                  v-for="key in heroKeys"
                  :key="key"
                  type="button"
                  class="pf-pick"
                  :class="{ on: profile.favHero === key }"
                  @click="profile.favHero = key"
                >
                  <img :src="heroImage(key)" alt="" />
                </button>
              </div>
            </div>

            <div class="pf-card">
              <h2 class="pf-h">{{ L.style }}</h2>
              <label class="pf-label">{{ L.frame }}</label>
              <div class="pf-opts">
                <button
                  v-for="item in frames"
                  :key="item.id"
                  type="button"
                  class="pf-opt"
                  :class="{
                    on: profile.frame === item.id,
                    lock: lvl.level < item.lvl,
                  }"
                  :disabled="lvl.level < item.lvl"
                  @click="profile.frame = item.id"
                >
                  <span
                    class="pf-swatch pf-ava-mini"
                    :class="'fr-' + item.id"
                  ></span>
                  <small>{{
                    lvl.level < item.lvl
                      ? L.lvl + " " + item.lvl
                      : L.frames[item.id]
                  }}</small>
                </button>
              </div>
              <label class="pf-label">{{ L.banner }}</label>
              <div class="pf-opts">
                <button
                  v-for="item in banners"
                  :key="item.id"
                  type="button"
                  class="pf-opt"
                  :class="{
                    on: profile.banner === item.id,
                    lock: lvl.level < item.lvl,
                  }"
                  :disabled="lvl.level < item.lvl"
                  @click="profile.banner = item.id"
                >
                  <span class="pf-swatch wide" :class="'bn-' + item.id"></span>
                  <small>{{
                    lvl.level < item.lvl
                      ? L.lvl + " " + item.lvl
                      : L.banners[item.id]
                  }}</small>
                </button>
              </div>
              <label class="pf-label">{{ L.titleLabel }}</label>
              <div class="pf-filters">
                <button
                  v-for="item in titles"
                  :key="item.id"
                  type="button"
                  class="pf-chip"
                  :class="{ on: profile.title === item.id }"
                  :disabled="lvl.level < item.lvl"
                  @click="profile.title = item.id"
                >
                  {{
                    lvl.level < item.lvl
                      ? L.lvl + " " + item.lvl
                      : titleText(item.id)
                  }}
                </button>
              </div>
              <label class="pf-label">{{ L.showcasePick }}</label>
              <div class="pf-filters">
                <button
                  v-for="item in achievements"
                  :key="item.id"
                  type="button"
                  class="pf-chip"
                  :class="{ on: profile.showcase.includes(item.id) }"
                  @click="toggleShowcase(item.id)"
                >
                  {{ L.ach[item.id].name }}
                </button>
              </div>
              <label class="pf-check"
                ><input v-model="profile.showStats" type="checkbox" />
                {{ L.showStats }}</label
              >
              <label class="pf-check"
                ><input v-model="profile.showHistory" type="checkbox" />
                {{ L.showHistory }}</label
              >
            </div>

            <div class="pf-card pf-wide">
              <h2 class="pf-h">{{ L.mini }}</h2>
              <div class="pf-mini" :class="'bn-' + profile.banner">
                <div class="pf-ava small" :class="'fr-' + profile.frame">
                  <img :src="heroImage(profile.avatar)" alt="" />
                  <span class="pf-lvl">{{ lvl.level }}</span>
                </div>
                <div class="pf-mini-text">
                  <b>{{ profile.nick || L.noNick }}</b>
                  <span>{{ titleText(profile.title) }}</span>
                </div>
                <div class="pf-mini-badges">
                  <RogueIcon
                    v-for="item in showcaseItems"
                    :key="item.id"
                    :name="item.icon"
                    :metal="metalOf(item.rarity)"
                    size="26px"
                  />
                </div>
              </div>
              <p class="pf-note">{{ L.testNote }}</p>
            </div>
          </section>
        </div>
      </div>
    </template>

    <div class="pf-switch">
      <button
        v-for="n in 10"
        :key="n"
        type="button"
        :class="{ on: variant === n }"
        @click="setVariant(n)"
      >
        {{ n }}
      </button>
      <span>{{ variantNames[variant - 1] }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, h, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import RogueIcon from "../RogueIcon.vue";
import { useDraftState } from "../../composables/useDraftState";
import { openAuth, user } from "../../cloud/useAuth";
import {
  banners,
  buildAchievements,
  buildHistory,
  buildStats,
  frames,
  heroImage,
  heroKeys,
  heroName,
  levelOf,
  profile,
  titles,
} from "../../profile/profileStore";
import { profileDict } from "../../profile/profileDict";

const { lang } = useDraftState();
const route = useRoute();
const router = useRouter();
const variantNames = [
  "Cover",
  "Steam",
  "Card",
  "Sidebar",
  "Parchment",
  "Neon",
  "Poster",
  "Aurora",
  "HUD",
  "Minimal",
];
const variant = computed(() => {
  const value = Number(route.query.v);
  return value >= 1 && value <= 10 ? value : 1;
});
const setVariant = (n) => router.replace({ query: { ...route.query, v: n } });
const L = computed(() => profileDict[lang.value === "ua" ? "ua" : "en"]);

const tabs = ["overview", "history", "stats", "achievements", "customize"];
const tabIcons = {
  overview: "castle",
  history: "scrollUnfurled",
  stats: "scales",
  achievements: "trophy",
  customize: "pentacle",
};
const tab = ref("overview");
const histFilter = ref("all");
const historyFilters = ["all", "bot", "roguelike", "online", "packDraft"];

const seedId = computed(() => (user.value ? user.value.id : "guest"));
const history = computed(() => buildHistory(seedId.value));
const stats = computed(() => buildStats(seedId.value));
const achievements = computed(() => buildAchievements(seedId.value));
const lvl = computed(() => levelOf(stats.value, achievements.value));
const xpPct = computed(() => Math.round((lvl.value.xp / lvl.value.need) * 100));
const winrate = computed(() =>
  Math.round((stats.value.wins / Math.max(1, stats.value.games)) * 100),
);
const doneCount = computed(
  () => achievements.value.filter((item) => item.done).length,
);
const filteredHistory = computed(() =>
  history.value.filter(
    (row) => histFilter.value === "all" || row.mode === histFilter.value,
  ),
);
const showcaseItems = computed(() =>
  profile.showcase
    .map((id) => achievements.value.find((item) => item.id === id))
    .filter(Boolean),
);

const metals = {
  common: "bronze",
  rare: "silver",
  epic: "ruby",
  legendary: "gold",
};
const metalOf = (rarity) => metals[rarity];
const titleText = (id) => L.value.titles[id];

const toggleShowcase = (id) => {
  const index = profile.showcase.indexOf(id);
  if (index >= 0) profile.showcase.splice(index, 1);
  else if (profile.showcase.length < 3) profile.showcase.push(id);
};

const HistoryRow = {
  props: { row: Object, L: Object },
  setup(props) {
    return () =>
      h("div", { class: ["pf-row", props.row.win ? "win" : "loss"] }, [
        h("img", { src: heroImage(props.row.hero), alt: "" }),
        h("div", { class: "pf-row-main" }, [
          h(
            "b",
            `${heroName(props.row.hero)} ${props.L.vs} ${heroName(props.row.enemy)}`,
          ),
          h(
            "span",
            `${props.L.modes[props.row.mode]} · ${props.row.turns} ${props.L.turns} · ${new Date(props.row.at).toLocaleDateString()}`,
          ),
        ]),
        h("em", props.row.win ? props.L.win : props.L.loss),
      ]);
  },
};
</script>

<style scoped>
.pf-empty {
  text-align: center;
  padding: 80px 0;
}

.pf-btn {
  padding: 10px 22px;
  border: 0;
  border-radius: 10px;
  background: #3b6bff;
  color: #fff;
  font-weight: 800;
}

.pf-ava {
  position: relative;
  flex: none;
  width: 104px;
  height: 104px;
  border-radius: 22px;
  padding: 4px;
  box-sizing: border-box;
}

.pf-ava.small {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  padding: 3px;
}

.pf-ava img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  display: block;
}

.pf-lvl {
  color: var(--acc);
  position: absolute;
  right: -6px;
  bottom: -6px;
  min-width: 28px;
  padding: 2px 6px;
  box-sizing: border-box;
  border-radius: 10px;
  background: #0b0f19;
  border: 2px solid var(--acc);
  color: var(--acc);
  font-size: 13px;
  font-weight: 900;
  text-align: center;
}

.pf-ava.small .pf-lvl {
  font-size: 11px;
  min-width: 22px;
}

.fr-iron {
  background: linear-gradient(135deg, var(--mut), #475569);
}
.fr-gold {
  background: linear-gradient(135deg, #fde68a, #b45309);
  box-shadow: 0 0 18px rgba(250, 204, 21, 0.35);
}
.fr-flame {
  background: linear-gradient(135deg, #fb923c, #dc2626);
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.55);
  animation: pf-glow 2s ease-in-out infinite;
}
.fr-frost {
  background: linear-gradient(135deg, #bae6fd, #3b82f6);
  box-shadow: 0 0 20px rgba(125, 211, 252, 0.5);
}
.fr-emerald {
  background: linear-gradient(135deg, #6ee7b7, #047857);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
}
.fr-royal {
  background: linear-gradient(120deg, #f0abfc, #6366f1, #22d3ee, #f0abfc);
  background-size: 300% 300%;
  animation: pf-shift 4s linear infinite;
  box-shadow: 0 0 24px rgba(168, 85, 247, 0.6);
}

@keyframes pf-glow {
  50% {
    box-shadow: 0 0 30px rgba(251, 146, 60, 0.85);
  }
}

@keyframes pf-shift {
  to {
    background-position: 300% 0;
  }
}

.bn-dusk {
  background: linear-gradient(120deg, #1b2a55, #3b1d5e);
}
.bn-ember {
  background: linear-gradient(120deg, #4a1511, #1c1033);
}
.bn-ocean {
  background: linear-gradient(120deg, #0c3b5c, #12204a);
}
.bn-forest {
  background: linear-gradient(120deg, #123d2b, #0f1f2e);
}
.bn-void {
  background: linear-gradient(120deg, #0a0a14, #2b1245);
}
.bn-gold {
  background: linear-gradient(120deg, #5a3f0a, #1f1608);
}

.pf-id {
  flex: 1;
  min-width: 0;
}

.pf-nick {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 900;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pf-title {
  margin: 2px 0 10px;
  color: var(--acc);
  font-weight: 700;
  font-size: 0.9rem;
}

.pf-xp {
  position: relative;
  height: 20px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.45);
  overflow: hidden;
  max-width: 360px;
}

.pf-xp-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: linear-gradient(90deg, var(--acc2), var(--acc));
}

.pf-xp-text {
  position: relative;
  display: block;
  text-align: center;
  font-size: 11.5px;
  font-weight: 800;
  line-height: 20px;
  color: #fff;
  text-shadow: 0 1px 2px #000;
}

.pf-tabs {
  display: flex;
  gap: 6px;
  margin: 16px 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.pf-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  padding: 9px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.6);
  color: var(--mut);
  font-weight: 800;
  font-size: 13px;
}

.pf-tab.on {
  color: var(--strong);
  border-color: var(--acc);
  background: rgba(250, 204, 21, 0.12);
}

.pf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.pf-wide {
  grid-column: 1 / -1;
}

.pf-card {
  padding: 18px;
  border-radius: 18px;
  background: var(--card);
  border: 1px solid var(--line);
}

.pf-h {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--hc);
}

.pf-bio {
  margin: 0 0 14px;
  color: var(--mut);
  line-height: 1.5;
}

.pf-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 10px;
}

.pf-kpi {
  padding: 10px;
  border-radius: 12px;
  background: var(--kpi);
  text-align: center;
}

.pf-kpi b {
  display: block;
  font-size: 1.4rem;
  color: var(--strong);
}

.pf-kpi span {
  font-size: 11px;
  color: var(--mut);
  font-weight: 700;
}

.pf-show {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pf-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 96px;
  padding: 12px 6px;
  border-radius: 14px;
  background: var(--kpi);
  text-align: center;
  font-size: 11.5px;
}

.dim {
  opacity: 0.45;
}

.r-rare {
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.5);
}
.r-epic {
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.6);
}
.r-legendary {
  box-shadow: inset 0 0 0 1px rgba(250, 204, 21, 0.8);
}

.pf-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.pf :deep(.pf-row) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--kpi);
  border-left: 4px solid #64748b;
}

.pf :deep(.pf-row.win) {
  border-left-color: #22c55e;
}
.pf :deep(.pf-row.loss) {
  border-left-color: #ef4444;
}

.pf :deep(.pf-row) img {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  object-fit: cover;
}

.pf :deep(.pf-row-main) {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.pf :deep(.pf-row-main) b {
  font-size: 13.5px;
}

.pf :deep(.pf-row-main) span {
  font-size: 11.5px;
  color: var(--mut);
}

.pf :deep(.pf-row) em {
  font-style: normal;
  font-weight: 900;
  font-size: 12px;
}

.pf :deep(.pf-row.win) em {
  color: #4ade80;
}
.pf :deep(.pf-row.loss) em {
  color: #f87171;
}

.pf-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.pf-chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--mut);
  font-size: 12px;
  font-weight: 700;
}

.pf-chip.on {
  color: var(--onacc);
  background: var(--acc);
  border-color: var(--acc);
}

.pf-chip:disabled {
  opacity: 0.4;
}

.pf-bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.pf-bar-row img {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  object-fit: cover;
}

.pf-bar-main {
  flex: 1;
}

.pf-bar-top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 3px;
}

.pf-bar {
  height: 7px;
  border-radius: 4px;
  background: var(--line);
  overflow: hidden;
}

.pf-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--acc2), var(--acc));
}

.pf-ach {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}

.pf-ach-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: var(--kpi);
}

.pf-ach-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pf-ach-text span,
.pf-ach-text small {
  font-size: 11.5px;
  color: var(--mut);
}

.pf-label {
  display: block;
  margin: 14px 0 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mut);
}

.pf-input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--inp);
  color: var(--strong);
  font: inherit;
}

.pf-picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(46px, 1fr));
  gap: 6px;
}

.pf-pick {
  padding: 0;
  border: 2px solid transparent;
  border-radius: 10px;
  background: none;
  overflow: hidden;
  aspect-ratio: 1;
}

.pf-pick.on {
  border-color: var(--acc);
}

.pf-pick img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pf-opts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pf-opt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--hc);
}

.pf-opt.on {
  border-color: var(--acc);
}

.pf-opt.lock {
  opacity: 0.4;
}

.pf-swatch {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.pf-swatch.wide {
  width: 64px;
}

.pf-check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 13px;
}

.pf-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 420px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--line);
}

.pf-mini-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pf-mini-text span {
  font-size: 12px;
  color: var(--acc);
}

.pf-mini-badges {
  display: flex;
  gap: 4px;
}

.pf-note {
  margin: 12px 0 0;
  font-size: 12px;
  color: #64748b;
}

.pf {
  --fg: #e2e8f0;
  --mut: #94a3b8;
  --hc: #cbd5e1;
  --card: rgba(20, 28, 48, 0.78);
  --kpi: rgba(255, 255, 255, 0.05);
  --line: rgba(255, 255, 255, 0.1);
  --inp: rgba(8, 11, 22, 0.6);
  --strong: #fff;
  --acc: #facc15;
  --acc2: #3b6bff;
  --onacc: #1a1204;
  --page: #0b0f19;
  position: relative;
  min-height: 100vh;
  box-sizing: border-box;
  padding-top: 60px;
  color: var(--fg);
}

.pf-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 340px;
  overflow: hidden;
  pointer-events: none;
}

.pf-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 22%;
  display: block;
}

.pf-bg-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, var(--page), transparent 80%);
}

.pf-wrap {
  position: relative;
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 14px 100px;
}

.pf-head {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 18px;
}

.pf-head-art,
.pf-chips {
  display: none;
}

.pf-chips {
  margin: 8px 0 0;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--mut);
}

.pf-chips span {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--kpi);
}

.pf-switch {
  position: fixed;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: calc(100vw - 20px);
  padding: 6px 8px;
  border-radius: 999px;
  background: rgba(8, 11, 22, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  overflow-x: auto;
}

.pf-switch button {
  flex: none;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #cbd5e1;
  font-weight: 800;
  font-size: 12px;
}

.pf-switch button.on {
  background: #facc15;
  color: #1a1204;
}

.pf-switch span {
  flex: none;
  padding: 0 8px 0 4px;
  font-size: 12px;
  font-weight: 800;
  color: #94a3b8;
}

/* 1 Cover */
.v1 .pf-bg {
  height: 430px;
}
.v1 .pf-bg img {
  opacity: 0.9;
}
.v1 .pf-wrap {
  padding-top: 240px;
}
.v1 .pf-ava {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  padding: 5px;
}
.v1 .pf-ava img {
  border-radius: 50%;
}
.v1 .pf-nick {
  font-size: 2.6rem;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.7);
}
.v1 .pf-chips {
  display: flex;
}
.v1 .pf-tabs {
  justify-content: center;
  gap: 4px;
  border-bottom: 1px solid var(--line);
}
.v1 .pf-tab {
  background: transparent;
  border: 0;
  border-bottom: 3px solid transparent;
  border-radius: 0;
  padding: 12px 18px;
}
.v1 .pf-tab.on {
  background: transparent;
  border-bottom-color: var(--acc);
}

/* 2 Steam */
.v2 {
  --card: #16202d;
  --line: rgba(102, 192, 244, 0.18);
  --acc: #66c0f4;
  --acc2: #2a475e;
  --onacc: #0b1620;
  --page: #171a21;
  background: linear-gradient(180deg, #1b2838, #171a21 60%);
  font-family: "Motiva Sans", Arial, sans-serif;
}
.v2 .pf-bg {
  height: 260px;
}
.v2 .pf-bg img {
  filter: blur(6px);
  opacity: 0.28;
  transform: scale(1.1);
}
.v2 .pf-wrap {
  display: grid;
  grid-template-columns: 290px 1fr;
  gap: 18px;
  padding-top: 40px;
  align-items: start;
}
.v2 .pf-head {
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 14px;
  background: rgba(22, 32, 45, 0.9);
  border: 1px solid var(--line);
  border-radius: 3px;
}
.v2 .pf-ava {
  width: 150px;
  height: 150px;
  border-radius: 3px;
}
.v2 .pf-ava img {
  border-radius: 2px;
}
.v2 .pf-id {
  width: 100%;
}
.v2 .pf-xp {
  margin: 0 auto;
  border-radius: 2px;
}
.v2 .pf-chips {
  display: flex;
  justify-content: center;
}
.v2 .pf-tabs {
  flex-direction: column;
  margin: 12px 0 0;
  gap: 2px;
}
.v2 .pf-tab {
  border: 0;
  border-radius: 2px;
  background: rgba(22, 32, 45, 0.9);
}
.v2 .pf-tab.on {
  background: linear-gradient(90deg, #2a475e, #16202d);
  color: #fff;
}
.v2 .pf-card {
  border-radius: 3px;
}

/* 3 Card */
.v3 {
  --card: rgba(24, 14, 46, 0.8);
  --acc: #f0abfc;
  --acc2: #6366f1;
  --onacc: #1d0b2e;
  --page: #120a24;
  background:
    radial-gradient(circle at 50% 0%, #3b1d6e, transparent 60%), #120a24;
}
.v3 .pf-bg {
  display: none;
}
.v3 .pf-wrap {
  max-width: 800px;
  padding-top: 36px;
}
.v3 .pf-head {
  display: block;
  width: 300px;
  height: 420px;
  margin: 0 auto;
  border-radius: 22px;
  padding: 6px;
  box-sizing: border-box;
  background: conic-gradient(
    from 0deg,
    #f0abfc,
    #6366f1,
    #22d3ee,
    #facc15,
    #f0abfc
  );
  animation: pf-spin 8s linear infinite;
  box-shadow: 0 20px 60px rgba(168, 85, 247, 0.35);
}
@keyframes pf-spin {
  to {
    filter: hue-rotate(360deg);
  }
}
.v3 .pf-head-art {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 17px;
}
.v3 .pf-ava {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  padding: 3px;
}
.v3 .pf-id {
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 6px;
  padding: 40px 16px 14px;
  border-radius: 0 0 17px 17px;
  background: linear-gradient(0deg, rgba(10, 4, 24, 0.95), transparent);
}
.v3 .pf-nick {
  font-size: 1.6rem;
}
.v3 .pf-tabs {
  justify-content: center;
  flex-wrap: wrap;
  margin: 20px 0;
}
.v3 .pf-tab {
  border-radius: 999px;
}

/* 4 Sidebar */
.v4 {
  --card: #2b2d31;
  --kpi: #1e1f22;
  --inp: #1e1f22;
  --acc: #5865f2;
  --acc2: #8b95ff;
  --onacc: #fff;
  --line: rgba(255, 255, 255, 0.07);
  --page: #313338;
  background: #313338;
}
.v4 .pf-bg {
  display: none;
}
.v4 .pf-wrap {
  display: grid;
  grid-template-columns: 270px 1fr;
  gap: 16px;
  padding-top: 28px;
  align-items: start;
}
.v4 .pf-side {
  position: sticky;
  top: 74px;
  overflow: hidden;
  border-radius: 14px;
  background: #1e1f22;
}
.v4 .pf-head {
  flex-direction: column;
  align-items: flex-start;
  padding: 0 14px 12px;
  gap: 0;
}
.v4 .pf-head-art {
  display: block;
  width: calc(100% + 28px);
  margin: 0 -14px;
  height: 100px;
  object-fit: cover;
  object-position: center 20%;
}
.v4 .pf-ava {
  width: 80px;
  height: 80px;
  margin-top: -40px;
  border-radius: 50%;
  border: 5px solid #1e1f22;
  box-sizing: content-box;
  padding: 3px;
  z-index: 1;
}
.v4 .pf-ava img {
  border-radius: 50%;
}
.v4 .pf-id {
  margin-top: 8px;
  width: 100%;
}
.v4 .pf-nick {
  font-size: 1.25rem;
}
.v4 .pf-xp {
  height: 14px;
}
.v4 .pf-xp-text {
  font-size: 9px;
  line-height: 14px;
}
.v4 .pf-tabs {
  flex-direction: column;
  margin: 0;
  padding: 8px;
  gap: 2px;
  border-top: 1px solid var(--line);
}
.v4 .pf-tab {
  border: 0;
  background: transparent;
}
.v4 .pf-tab.on {
  background: #404249;
  color: #fff;
}

/* 5 Parchment */
.v5 {
  --card: #e8d6aa;
  --cardb: #8a6a35;
  --fg: #f1e4c3;
  --mut: #7a5f3a;
  --hc: #5b3d17;
  --kpi: rgba(90, 60, 20, 0.12);
  --line: rgba(90, 60, 20, 0.35);
  --inp: #f4e8c8;
  --strong: #3b2a17;
  --acc: #c58a1b;
  --acc2: #7c2d12;
  --onacc: #2a1d12;
  --page: #2a1d12;
  background:
    radial-gradient(circle at 50% 0%, #4a3320, transparent 70%), #2a1d12;
  font-family: Georgia, "Times New Roman", serif;
}
.v5 .pf-bg img {
  filter: sepia(0.8) contrast(1.1);
  opacity: 0.7;
}
.v5 .pf-wrap {
  padding-top: 150px;
}
.v5 .pf-nick {
  font-size: 2.3rem;
  color: #f6dfa0;
  letter-spacing: 0.04em;
}
.v5 .pf-title {
  font-style: italic;
}
.v5 .pf-ava {
  border-radius: 8px;
}
.v5 .pf-tabs {
  justify-content: center;
}
.v5 .pf-tab {
  border-radius: 4px 4px 14px 14px;
  background: #5a3f23;
  border-color: #8a6a35;
  color: #e8d6aa;
  font-family: inherit;
}
.v5 .pf-tab.on {
  background: #e8d6aa;
  color: #3b2a17;
  border-color: #c58a1b;
}
.v5 .pf-card {
  color: #3b2a17;
  border: 3px double #8a6a35;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
}
.v5 .pf-h {
  font-variant: small-caps;
  text-transform: none;
  letter-spacing: 0.08em;
  border-bottom: 1px solid var(--line);
  padding-bottom: 6px;
}
.v5 .pf-row-main b,
.v5 .pf-ach-text b,
.v5 .pf-badge b,
.v5 .pf-kpi span {
  color: #3b2a17;
}
.v5 .pf-chip {
  color: #5b3d17;
}

/* 6 Neon */
.v6 {
  --card: rgba(8, 4, 28, 0.82);
  --line: rgba(34, 211, 238, 0.35);
  --acc: #22d3ee;
  --acc2: #e879f9;
  --onacc: #031018;
  --hc: #f0abfc;
  --mut: #8b9bc7;
  --page: #05030f;
  background: #05030f;
  font-family: "Courier New", ui-monospace, monospace;
}
.v6 .pf-bg {
  height: 380px;
}
.v6 .pf-bg img {
  filter: hue-rotate(250deg) saturate(1.6) contrast(1.1);
  mix-blend-mode: screen;
  opacity: 0.7;
}
.v6 .pf-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.35) 0 1px,
    transparent 1px 4px
  );
}
.v6 .pf-wrap {
  padding-top: 200px;
}
.v6 .pf-nick {
  font-size: 2.4rem;
  text-transform: uppercase;
  color: #fff;
  text-shadow:
    0 0 12px #22d3ee,
    2px 0 #e879f9;
}
.v6 .pf-title {
  text-transform: uppercase;
  letter-spacing: 0.2em;
}
.v6 .pf-ava {
  border-radius: 4px;
  box-shadow: 0 0 22px rgba(34, 211, 238, 0.7);
}
.v6 .pf-tab {
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-color: var(--line);
  background: rgba(8, 4, 28, 0.8);
  font-family: inherit;
}
.v6 .pf-tab.on {
  background: rgba(34, 211, 238, 0.14);
  box-shadow:
    0 0 14px rgba(34, 211, 238, 0.5),
    inset 0 0 10px rgba(34, 211, 238, 0.25);
}
.v6 .pf-card {
  border-radius: 0;
  clip-path: polygon(
    0 0,
    calc(100% - 18px) 0,
    100% 18px,
    100% 100%,
    18px 100%,
    0 calc(100% - 18px)
  );
  box-shadow: inset 0 0 24px rgba(34, 211, 238, 0.12);
}
.v6 .pf-bar i,
.v6 .pf-xp-fill {
  box-shadow: 0 0 10px var(--acc);
}

/* 7 Poster */
.v7 {
  --card: #fff;
  --cardb: #111;
  --fg: #111;
  --mut: #555;
  --hc: #111;
  --kpi: #f3efe2;
  --line: #111;
  --inp: #fff;
  --strong: #111;
  --acc: #ffd400;
  --acc2: #111;
  --onacc: #111;
  --page: #f5f0e6;
  background: #f5f0e6;
  font-family: "Arial Black", Impact, sans-serif;
}
.v7 .pf-bg {
  top: 60px;
  left: auto;
  width: 62%;
  height: 520px;
}
.v7 .pf-bg img {
  filter: grayscale(1) contrast(1.5);
  mix-blend-mode: multiply;
  object-position: center 15%;
}
.v7 .pf-bg-shade {
  background: linear-gradient(90deg, #f5f0e6, transparent 40%);
}
.v7 .pf-wrap {
  padding-top: 80px;
}
.v7 .pf-head {
  flex-direction: column;
  align-items: flex-start;
  min-height: 340px;
  justify-content: flex-end;
}
.v7 .pf-ava {
  position: absolute;
  top: 0;
  right: 0;
  width: 96px;
  height: 96px;
  border-radius: 0;
  transform: rotate(4deg);
  box-shadow: 6px 6px 0 #111;
}
.v7 .pf-ava img {
  border-radius: 0;
}
.v7 .pf-nick {
  font-size: clamp(3rem, 13vw, 8.5rem);
  line-height: 0.85;
  text-transform: uppercase;
  letter-spacing: -0.04em;
  white-space: normal;
  word-break: break-all;
  color: #111;
}
.v7 .pf-title {
  display: inline-block;
  padding: 4px 10px;
  background: #111;
  color: #ffd400;
  text-transform: uppercase;
}
.v7 .pf-xp {
  border-radius: 0;
  border: 3px solid #111;
  background: #fff;
}
.v7 .pf-xp-text {
  color: #111;
  text-shadow: none;
}
.v7 .pf-chips {
  display: flex;
}
.v7 .pf-chips span {
  background: #ffd400;
  border: 2px solid #111;
  color: #111;
  border-radius: 0;
}
.v7 .pf-tab {
  border-radius: 0;
  border: 3px solid #111;
  background: #fff;
  color: #111;
  box-shadow: 4px 4px 0 #111;
  text-transform: uppercase;
}
.v7 .pf-tab.on {
  background: #ffd400;
}
.v7 .pf-card {
  border: 3px solid #111;
  border-radius: 0;
  box-shadow: 8px 8px 0 #111;
}
.v7 .pf-kpi,
.v7 .pf-row,
.v7 .pf-badge,
.v7 .pf-ach-item {
  border-radius: 0;
  border: 2px solid #111;
}
.v7 .pf-bar {
  background: #ddd;
  border-radius: 0;
  border: 2px solid #111;
  height: 10px;
}
.v7 .pf-bar i {
  background: #111;
}

/* 8 Aurora */
.v8 {
  --mut: #cbd5e1;
  --card: rgba(255, 255, 255, 0.07);
  --line: rgba(255, 255, 255, 0.18);
  --acc: #a5f3fc;
  --acc2: #c084fc;
  --onacc: #0b1120;
  --page: #0b1120;
  background: #0b1120;
  overflow: hidden;
}
.v8 .pf-bg {
  height: 100%;
}
.v8 .pf-bg img {
  filter: blur(46px) saturate(1.4);
  transform: scale(1.4);
  opacity: 0.32;
}
.v8 .pf-bg-shade {
  background:
    radial-gradient(
      circle at 15% 20%,
      rgba(192, 132, 252, 0.35),
      transparent 40%
    ),
    radial-gradient(circle at 85% 60%, rgba(34, 211, 238, 0.3), transparent 45%);
}
.v8 .pf-wrap {
  max-width: 860px;
  padding-top: 30px;
}
.v8 .pf-head {
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}
.v8 .pf-ava {
  width: 130px;
  height: 130px;
  border-radius: 50%;
}
.v8 .pf-ava img {
  border-radius: 50%;
}
.v8 .pf-xp {
  margin: 0 auto;
  width: 280px;
}
.v8 .pf-chips {
  display: flex;
  justify-content: center;
}
.v8 .pf-tabs {
  justify-content: center;
  width: fit-content;
  max-width: 100%;
  margin: 18px auto;
  padding: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
  border: 1px solid var(--line);
}
.v8 .pf-tab {
  border: 0;
  border-radius: 999px;
  background: transparent;
}
.v8 .pf-tab.on {
  background: rgba(255, 255, 255, 0.2);
}
.v8 .pf-card {
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-radius: 24px;
}

/* 9 HUD */
.v9 {
  --card: rgba(10, 18, 30, 0.88);
  --line: rgba(251, 146, 60, 0.3);
  --acc: #fb923c;
  --acc2: #14b8a6;
  --onacc: #1a0f05;
  --page: #080b14;
  background:
    linear-gradient(rgba(251, 146, 60, 0.04) 1px, transparent 1px) 0 0 / 100%
      32px,
    linear-gradient(90deg, rgba(251, 146, 60, 0.04) 1px, transparent 1px) 0 0 /
      32px 100%,
    #080b14;
}
.v9 .pf-bg {
  display: none;
}
.v9 .pf-wrap {
  padding-top: 30px;
}
.v9 .pf-head {
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(100deg, #101a2c 40%, #0b1220);
  border: 1px solid var(--line);
  clip-path: polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%);
  overflow: hidden;
}
.v9 .pf-head-art {
  display: block;
  position: absolute;
  right: 0;
  top: 0;
  width: 46%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
  clip-path: polygon(28% 0, 100% 0, 100% 100%, 0 100%);
}
.v9 .pf-ava {
  width: 112px;
  height: 126px;
  border-radius: 0;
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  padding: 5px;
}
.v9 .pf-ava img {
  border-radius: 0;
  clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
}
.v9 .pf-lvl {
  right: 6px;
  bottom: 14px;
}
.v9 .pf-id {
  position: relative;
}
.v9 .pf-nick {
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.v9 .pf-xp {
  border-radius: 0;
  height: 16px;
}
.v9 .pf-xp-fill {
  background: repeating-linear-gradient(
    90deg,
    var(--acc) 0 8px,
    transparent 8px 10px
  );
}
.v9 .pf-tabs {
  margin: 14px 0;
  gap: 8px;
}
.v9 .pf-tab {
  border-radius: 0;
  transform: skewX(-14deg);
  background: #101a2c;
  border-color: var(--line);
}
.v9 .pf-tab > * {
  transform: skewX(14deg);
}
.v9 .pf-card {
  border-radius: 0;
  border-left: 4px solid var(--acc);
  clip-path: polygon(
    0 0,
    100% 0,
    100% calc(100% - 16px),
    calc(100% - 16px) 100%,
    0 100%
  );
}

/* 10 Minimal */
.v10 {
  --fg: #0f172a;
  --mut: #64748b;
  --hc: #334155;
  --card: #fff;
  --cardb: #e5e7eb;
  --kpi: #f1f5f9;
  --line: #e2e8f0;
  --inp: #fff;
  --strong: #0f172a;
  --acc: #4f46e5;
  --acc2: #a5b4fc;
  --onacc: #fff;
  --page: #f8fafc;
  background: #f8fafc;
}
.v10 .pf-bg {
  position: relative;
  max-width: 1012px;
  height: 170px;
  margin: 14px auto 0;
  border-radius: 24px;
}
.v10 .pf-bg img {
  opacity: 1;
}
.v10 .pf-bg-shade {
  background: none;
}
.v10 .pf-wrap {
  margin-top: -50px;
}
.v10 .pf-head {
  padding: 0 18px;
  align-items: flex-start;
}
.v10 .pf-ava {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  box-shadow: 0 0 0 5px #f8fafc;
}
.v10 .pf-ava img {
  border-radius: 50%;
}
.v10 .pf-id {
  margin-top: 58px;
}
.v10 .pf-nick {
  color: #0f172a;
}
.v10 .pf-xp {
  height: 6px;
  background: #e2e8f0;
}
.v10 .pf-xp-text {
  display: none;
}
.v10 .pf-chips {
  display: flex;
}
.v10 .pf-tabs {
  width: fit-content;
  max-width: 100%;
  padding: 4px;
  border-radius: 12px;
  background: #e8ecf3;
}
.v10 .pf-tab {
  border: 0;
  background: transparent;
  color: #475569;
}
.v10 .pf-tab.on {
  background: #fff;
  color: #0f172a;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.15);
}
.v10 .pf-tab :deep(.ricon) {
  filter: brightness(0.5);
}
.v10 .pf-card {
  border-radius: 18px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05);
}
.v10 .pf-row-main b,
.v10 .pf-ach-text b,
.v10 .pf-badge b {
  color: #0f172a;
}
.v10 .pf-chip.on {
  color: #fff;
}

@media (max-width: 720px) {
  .pf-grid {
    grid-template-columns: 1fr;
  }
  .pf-ava {
    width: 80px;
    height: 80px;
  }
  .pf-nick {
    font-size: 1.4rem;
  }
  .pf-head {
    gap: 12px;
  }
  .v1 .pf-wrap {
    padding-top: 190px;
  }
  .v1 .pf-ava {
    width: 96px;
    height: 96px;
  }
  .v2 .pf-wrap,
  .v4 .pf-wrap {
    grid-template-columns: 1fr;
  }
  .v4 .pf-side {
    position: static;
  }
  .v2 .pf-ava {
    width: 110px;
    height: 110px;
  }
  .v3 .pf-ava,
  .v4 .pf-ava {
    width: 64px;
    height: 64px;
  }
  .v7 .pf-bg {
    width: 100%;
    opacity: 0.45;
  }
  .v7 .pf-ava {
    width: 70px;
    height: 70px;
  }
  .v7 .pf-card {
    box-shadow: 4px 4px 0 #111;
  }
  .v9 .pf-ava {
    width: 80px;
    height: 90px;
  }
  .v9 .pf-head {
    padding: 14px;
  }
  .v10 .pf-ava {
    width: 76px;
    height: 76px;
  }
}
</style>
