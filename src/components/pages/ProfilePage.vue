<template>
  <div class="pf">
    <div v-if="!user" class="pf-empty">
      <p>{{ L.needLogin }}</p>
      <button type="button" class="pf-btn" @click="openAuth('signin')">
        {{ L.signin }}
      </button>
    </div>

    <template v-else>
      <section class="pf-hero" :class="'bn-' + profile.banner">
        <img class="pf-hero-art" :src="heroImage(profile.favHero)" alt="" />
        <div class="pf-hero-shade"></div>
        <div class="pf-hero-body">
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
          </div>
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
          <div v-for="row in stats.perHero" :key="row.hero" class="pf-bar-row">
            <img :src="heroImage(row.hero)" alt="" />
            <div class="pf-bar-main">
              <div class="pf-bar-top">
                <span>{{ heroName(row.hero) }}</span>
                <span>{{ row.wins }}/{{ row.played }}</span>
              </div>
              <div class="pf-bar">
                <i :style="{ width: (row.wins / row.played) * 100 + '%' }"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="pf-card">
          <h2 class="pf-h">{{ L.byMode }}</h2>
          <div v-for="row in stats.perMode" :key="row.mode" class="pf-bar-row">
            <div class="pf-bar-main">
              <div class="pf-bar-top">
                <span>{{ L.modes[row.mode] }}</span>
                <span>{{ row.wins }}/{{ row.played }}</span>
              </div>
              <div class="pf-bar">
                <i :style="{ width: (row.wins / row.played) * 100 + '%' }"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="tab === 'achievements'" class="pf-card">
        <h2 class="pf-h">
          {{ L.tabs.achievements }} · {{ doneCount }}/{{ achievements.length }}
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
                  :style="{ width: (item.progress / item.goal) * 100 + '%' }"
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
    </template>
  </div>
</template>

<script setup>
import { computed, h, ref } from "vue";
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
.pf {
  max-width: 980px;
  margin: 0 auto;
  padding: 72px 14px 60px;
  color: #e2e8f0;
}

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

.pf-hero {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-height: 190px;
}

.pf-hero-art {
  position: absolute;
  right: 0;
  top: 0;
  width: 60%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  opacity: 0.55;
  mask-image: linear-gradient(to left, #000 30%, transparent);
  -webkit-mask-image: linear-gradient(to left, #000 30%, transparent);
}

.pf-hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(8, 11, 22, 0.75), transparent 70%);
}

.pf-hero-body {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 18px;
  padding: 56px 22px 20px;
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
  position: absolute;
  right: -6px;
  bottom: -6px;
  min-width: 28px;
  padding: 2px 6px;
  box-sizing: border-box;
  border-radius: 10px;
  background: #0b0f19;
  border: 2px solid #facc15;
  color: #facc15;
  font-size: 13px;
  font-weight: 900;
  text-align: center;
}

.pf-ava.small .pf-lvl {
  font-size: 11px;
  min-width: 22px;
}

.fr-iron {
  background: linear-gradient(135deg, #94a3b8, #475569);
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
  color: #facc15;
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
  background: linear-gradient(90deg, #f59e0b, #facc15);
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.6);
  color: #94a3b8;
  font-weight: 800;
  font-size: 13px;
}

.pf-tab.on {
  color: #fff;
  border-color: #facc15;
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
  background: rgba(20, 28, 48, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.pf-h {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #cbd5e1;
}

.pf-bio {
  margin: 0 0 14px;
  color: #94a3b8;
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
  background: rgba(255, 255, 255, 0.05);
  text-align: center;
}

.pf-kpi b {
  display: block;
  font-size: 1.4rem;
  color: #fff;
}

.pf-kpi span {
  font-size: 11px;
  color: #94a3b8;
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
  background: rgba(255, 255, 255, 0.05);
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
  background: rgba(255, 255, 255, 0.04);
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
  color: #94a3b8;
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
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
}

.pf-chip.on {
  color: #1a1204;
  background: #facc15;
  border-color: #facc15;
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
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.pf-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #3b6bff, #22d3ee);
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
  background: rgba(255, 255, 255, 0.04);
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
  color: #94a3b8;
}

.pf-label {
  display: block;
  margin: 14px 0 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

.pf-input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(8, 11, 22, 0.6);
  color: #fff;
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
  border-color: #facc15;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: #cbd5e1;
}

.pf-opt.on {
  border-color: #facc15;
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
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.pf-mini-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pf-mini-text span {
  font-size: 12px;
  color: #facc15;
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
  .pf-hero-body {
    padding: 44px 14px 16px;
    gap: 12px;
  }
}
</style>
