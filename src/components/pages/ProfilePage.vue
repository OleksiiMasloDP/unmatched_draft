<template>
  <div class="pf">
    <div v-if="!user" class="pf-empty">
      <p>{{ L.needLogin }}</p>
      <button type="button" class="pf-btn" @click="openAuth('signin')">
        {{ L.signin }}
      </button>
    </div>

    <template v-else>
      <div class="pf-bg" :class="'bn-' + profile.banner">
        <img :src="bannerSrc" alt="" />
        <span class="pf-bg-shade"></span>
        <div class="pf-edit">
          <label class="pf-edit-btn">
            <svg viewBox="0 0 24 24">
              <path
                d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
              />
            </svg>
            {{ L.changeCover }}
            <input type="file" accept="image/*" @change="uploadBanner" />
          </label>
          <button
            v-if="profile.bannerImg"
            type="button"
            class="pf-edit-btn"
            @click="profile.bannerImg = ''"
          >
            {{ L.resetImg }}
          </button>
        </div>
      </div>
      <div class="pf-wrap">
        <aside class="pf-side">
          <section class="pf-head">
            <img class="pf-head-art" :src="heroImage(profile.favHero)" alt="" />
            <div class="pf-ava" :class="'fr-' + profile.frame">
              <img :src="avatarSrc" alt="" />
              <button
                v-if="profile.avatarImg"
                type="button"
                class="pf-ava-reset"
                @click="profile.avatarImg = ''"
              >
                ×
              </button>
              <label class="pf-ava-edit">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                  />
                </svg>
                <span>{{ L.changeAvatar }}</span>
                <input type="file" accept="image/*" @change="uploadAvatar" />
              </label>
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
          <section v-if="tab === 'overview'" class="pf-ov">
            <div class="pf-ov-card">
              <ProfileCard
                :nick="profile.nick || L.noNick"
                :title="titleText(profile.title)"
                :art="artSrc"
                :avatar="avatarSrc"
                :frame="profile.cardFrame"
                :effect="profile.cardEffect"
                :avatar-frame="profile.frame"
                :level="lvl"
                :games="stats.games"
                :winrate="winrate"
                :badges="cardBadges"
              />
            </div>
            <div class="pf-grid">
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
                    <b>{{ stats.healed }}</b><span>{{ L.healed }}</span>
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
                <p v-if="!history.length" class="pf-bio">{{ L.noBattles }}</p>
                <ul class="pf-list">
                  <li v-for="row in history.slice(0, 5)" :key="row.id">
                    <HistoryRow :row="row" :L="L" />
                  </li>
                </ul>
              </div>
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
            <p v-if="!filteredHistory.length" class="pf-bio">
              {{ L.noBattles }}
            </p>
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
                    <span class="pf-bar-val"
                      ><b>{{ Math.round((row.wins / row.played) * 100) }}%</b> ·
                      {{ L.winsWord }}: {{ row.wins }} {{ L.of }}
                      {{ row.played }}</span
                    >
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
                    <span class="pf-bar-val"
                      ><b>{{ Math.round((row.wins / row.played) * 100) }}%</b> ·
                      {{ L.winsWord }}: {{ row.wins }} {{ L.of }}
                      {{ row.played }}</span
                    >
                  </div>
                  <div class="pf-bar">
                    <i
                      :style="{ width: (row.wins / row.played) * 100 + '%' }"
                    ></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="pf-card pf-wide pf-tl">
              <h2 class="pf-h">{{ L.tl.title }}</h2>
              <p class="pf-note">{{ L.tl.hint }}</p>
              <form class="pf-tl-form" @submit.prevent="runImport">
                <input
                  v-model="tlInput"
                  class="pf-input"
                  type="text"
                  :placeholder="L.tl.placeholder"
                  :disabled="tlBusy"
                />
                <button type="submit" class="pf-btn" :disabled="tlBusy">
                  {{
                    tlBusy
                      ? L.tl.loading
                      : tabletop.current
                        ? L.tl.updateBtn
                        : L.tl.importBtn
                  }}
                </button>
                <button
                  v-if="tabletop.current"
                  type="button"
                  class="pf-btn ghost"
                  :disabled="tlBusy"
                  @click="revertTabletop"
                >
                  {{ L.tl.revert }}
                </button>
              </form>
              <p v-if="tlError" class="pf-note pf-tl-error">
                {{ L.tl.errors[tlError] }}
              </p>
              <template v-if="tabletop.current">
                <div class="pf-tl-sum">
                  <b>{{ tabletop.current.username }}</b>
                  <span v-if="tabletop.current.rating"
                    >{{ L.tl.rating }}: {{ tabletop.current.rating
                    }}<template v-if="tabletop.current.deviation">
                      ± {{ tabletop.current.deviation }}</template
                    >
                    · {{ tabletop.current.ratedMatches }} {{ L.tl.rated }}</span
                  >
                  <span
                    >{{ L.tl.imported }}:
                    {{
                      new Date(tabletop.current.importedAt).toLocaleDateString()
                    }}</span
                  >
                </div>
                <div v-for="row in tlRows" :key="row.name" class="pf-bar-row">
                  <img v-if="row.key" :src="heroImage(row.key)" alt="" />
                  <div class="pf-bar-main">
                    <div class="pf-bar-top">
                      <span>{{ row.name }}</span>
                      <span class="pf-bar-val"
                        ><b
                          >{{
                            row.games
                              ? Math.round((row.wins / row.games) * 100)
                              : 0
                          }}%</b
                        >
                        · {{ row.wins }}-{{ row.losses }} · {{ row.games }}
                        {{ L.tl.games }}</span
                      >
                    </div>
                    <div class="pf-bar">
                      <i
                        :style="{
                          width: row.games
                            ? (row.wins / row.games) * 100 + '%'
                            : '0%',
                        }"
                      ></i>
                    </div>
                  </div>
                </div>
                <button
                  v-if="tabletop.current.fighters.length > 8"
                  type="button"
                  class="pf-btn ghost"
                  @click="tlAll = !tlAll"
                >
                  {{ tlAll ? L.tl.showLess : L.tl.showAll }}
                </button>
              </template>
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
            <div class="pf-card pf-wide">
              <h2 class="pf-h">{{ L.mini }}</h2>
              <div class="pf-cardlab">
                <div class="pf-ov-card">
                  <ProfileCard
                    :nick="profile.nick || L.noNick"
                    :title="titleText(profile.title)"
                    :art="artSrc"
                    :avatar="avatarSrc"
                    :frame="profile.cardFrame"
                    :effect="profile.cardEffect"
                    :avatar-frame="profile.frame"
                    :level="lvl"
                    :games="stats.games"
                    :winrate="winrate"
                    :badges="cardBadges"
                  />
                </div>
                <div class="pf-cardopts">
                  <label class="pf-label">{{ L.cardFrame }}</label>
                  <div class="pf-filters">
                    <button
                      v-for="item in cardFrames"
                      :key="item.id"
                      type="button"
                      class="pf-chip"
                      :class="{ on: profile.cardFrame === item.id }"
                      :disabled="lvl.level < item.lvl"
                      @click="profile.cardFrame = item.id"
                    >
                      {{
                        lvl.level < item.lvl
                          ? L.lvl + " " + item.lvl
                          : L.cardFrames[item.id]
                      }}
                    </button>
                  </div>
                  <label class="pf-label">{{ L.cardEffect }}</label>
                  <div class="pf-filters">
                    <button
                      v-for="item in cardEffects"
                      :key="item.id"
                      type="button"
                      class="pf-chip"
                      :class="{ on: profile.cardEffect === item.id }"
                      :disabled="lvl.level < item.lvl"
                      @click="profile.cardEffect = item.id"
                    >
                      {{
                        lvl.level < item.lvl
                          ? L.lvl + " " + item.lvl
                          : L.cardEffects[item.id]
                      }}
                    </button>
                  </div>
                  <label class="pf-label">{{ L.cardArt }}</label>
                  <div class="pf-filters">
                    <button
                      v-for="item in ['hero', 'avatar', 'banner']"
                      :key="item"
                      type="button"
                      class="pf-chip"
                      :class="{ on: profile.cardArt === item }"
                      @click="profile.cardArt = item"
                    >
                      {{ L.cardArts[item] }}
                    </button>
                  </div>
                  <p class="pf-note">{{ L.testNote }}</p>
                </div>
              </div>
            </div>
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
              <div class="pf-uploads">
                <label class="pf-label">{{ L.uploads }}</label>
                <div class="pf-upl">
                  <label class="pf-btn pf-file">
                    {{ L.uploadAvatar }}
                    <input
                      type="file"
                      accept="image/*"
                      @change="uploadAvatar"
                    />
                  </label>
                  <button
                    v-if="profile.avatarImg"
                    type="button"
                    class="pf-btn ghost"
                    @click="profile.avatarImg = ''"
                  >
                    {{ L.resetImg }}
                  </button>
                  <label class="pf-btn pf-file">
                    {{ L.uploadBanner }}
                    <input
                      type="file"
                      accept="image/*"
                      @change="uploadBanner"
                    />
                  </label>
                  <button
                    v-if="profile.bannerImg"
                    type="button"
                    class="pf-btn ghost"
                    @click="profile.bannerImg = ''"
                  >
                    {{ L.resetImg }}
                  </button>
                </div>
                <p v-if="uploadError" class="pf-note">{{ uploadError }}</p>
              </div>
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
            <div class="pf-card pf-wide pf-account">
              <div>
                <h2 class="pf-h">{{ L.account }}</h2>
                <p class="pf-note">{{ user.email }}</p>
              </div>
              <button type="button" class="pf-btn danger" @click="doSignOut">
                {{ L.signout }}
              </button>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, h, ref } from "vue";
import { useRouter } from "vue-router";
import RogueIcon from "../RogueIcon.vue";
import ProfileCard from "../ProfileCard.vue";
import { useDraftState } from "../../composables/useDraftState";
import { openAuth, signOut, user } from "../../cloud/useAuth";
import {
  banners,
  cardEffects,
  cardFrames,
  readImage,
  frames,
  heroImage,
  heroKeys,
  heroName,
  profile,
  titles,
} from "../../profile/profileStore";
import { matchStats } from "../../profile/matchStats";
import {
  importTabletop,
  revertTabletop,
  tabletop,
} from "../../profile/tabletop";
import { buildAchievements, levelOf } from "../../profile/achievements";
import { profileDict } from "../../profile/profileDict";

const { lang } = useDraftState();
const router = useRouter();
const L = computed(() => profileDict[lang.value === "ua" ? "ua" : "en"]);

const doSignOut = async () => {
  await signOut();
  router.push({ name: "home" });
};

const tabs = ["overview", "history", "stats", "achievements", "customize"];
const tabIcons = {
  overview: "castle",
  history: "scrollUnfurled",
  stats: "scales",
  achievements: "trophy",
  customize: "pentacle",
};
const tab = ref("overview");
const tlInput = ref("");
const tlBusy = ref(false);
const tlError = ref("");
const tlAll = ref(false);
const tlRows = computed(() => {
  const rows = tabletop.current ? tabletop.current.fighters : [];
  return tlAll.value ? rows : rows.slice(0, 8);
});
const runImport = async () => {
  tlBusy.value = true;
  tlError.value = "";
  const result = await importTabletop(
    tlInput.value || (tabletop.current ? tabletop.current.username : ""),
  );
  tlBusy.value = false;
  if (result.error) tlError.value = result.error;
  else tlInput.value = "";
};
const histFilter = ref("all");
const historyFilters = ["all", "bot", "roguelike", "online", "packDraft"];

const history = computed(() => matchStats.history);
const byPlayed = (map) =>
  Object.entries(map)
    .map(([key, row]) => ({ key, played: row.played, wins: row.wins }))
    .sort((a, b) => b.played - a.played);
const stats = computed(() => ({
  games: matchStats.games,
  wins: matchStats.wins,
  losses: matchStats.losses,
  bestStreak: matchStats.bestStreak,
  curStreak: matchStats.curStreak,
  runs: matchStats.runs,
  runsWon: matchStats.runsWon,
  healed: matchStats.healed,
  damage: matchStats.dealt,
  perHero: byPlayed(matchStats.perHero).map((row) => ({
    ...row,
    hero: row.key,
  })),
  perMode: byPlayed(matchStats.perMode).map((row) => ({
    ...row,
    mode: row.key,
  })),
}));
const achievements = computed(() => buildAchievements(matchStats));
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

const avatarSrc = computed(
  () => profile.avatarImg || heroImage(profile.avatar),
);
const bannerSrc = computed(
  () => profile.bannerImg || heroImage(profile.favHero),
);
const artSrc = computed(() => {
  if (profile.cardArt === "avatar") return avatarSrc.value;
  if (profile.cardArt === "banner") return bannerSrc.value;
  return heroImage(profile.favHero);
});
const cardBadges = computed(() =>
  showcaseItems.value.map((item) => ({
    id: item.id,
    icon: item.icon,
    metal: metalOf(item.rarity),
  })),
);

const uploadError = ref("");
const upload = async (event, size, key) => {
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if (!file) return;
  uploadError.value = "";
  try {
    profile[key] = await readImage(file, size);
  } catch {
    uploadError.value = L.value.uploadFail;
  }
};
const uploadAvatar = (event) =>
  upload(event, { width: 256, height: 256 }, "avatarImg");
const uploadBanner = (event) =>
  upload(event, { width: 1280, height: 512 }, "bannerImg");

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
            props.row.enemy
              ? `${heroName(props.row.hero)} ${props.L.vs} ${heroName(props.row.enemy)}`
              : heroName(props.row.hero),
          ),
          h(
            "span",
            `${props.L.modes[props.row.mode]} · ${props.row.turns} ${props.row.mode === "roguelike" ? props.L.runWinsWord : props.L.turns} · ${new Date(props.row.at).toLocaleDateString()}`,
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

.pf-tl-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}

.pf-tl-form .pf-input {
  flex: 1 1 220px;
}

.pf-tl-sum {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin: 8px 0 12px;
}

.pf-tl-error {
  color: #ff8a8a;
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

/* 1 Cover */
.pf .pf-bg {
  height: 430px;
}
.pf .pf-bg img {
  opacity: 0.9;
}
.pf .pf-wrap {
  padding-top: 240px;
}
.pf .pf-ava {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  padding: 5px;
}
.pf .pf-ava img {
  border-radius: 50%;
}
.pf .pf-nick {
  font-size: 2.6rem;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.7);
}
.pf .pf-chips {
  display: flex;
}
.pf .pf-tabs {
  justify-content: center;
  gap: 4px;
  border-bottom: 1px solid var(--line);
}
.pf .pf-tab {
  background: transparent;
  border: 0;
  border-bottom: 3px solid transparent;
  border-radius: 0;
  padding: 12px 18px;
}
.pf .pf-tab.on {
  background: transparent;
  border-bottom-color: var(--acc);
}

.pf-ov {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;
}

.pf-ov .pf-grid {
  grid-template-columns: 1fr;
}

.pf-cardlab {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 22px;
  align-items: start;
}

.pf-upl {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pf-btn {
  cursor: pointer;
  font-size: 13px;
}

.pf-btn.ghost {
  background: transparent;
  border: 1px solid var(--line);
  color: var(--mut);
}

.pf-file input {
  display: none;
}

@media (max-width: 720px) {
  .pf-ov,
  .pf-cardlab {
    grid-template-columns: 1fr;
  }
  .pf-ov-card {
    display: flex;
    justify-content: center;
  }
  .pf-grid {
    grid-template-columns: 1fr;
  }
  .pf-ava {
    width: 96px;
    height: 96px;
  }
  .pf-nick {
    font-size: 1.6rem;
  }
  .pf-head {
    gap: 12px;
  }
  .pf .pf-wrap {
    padding-top: 190px;
  }
}

.pf-bg {
  pointer-events: auto;
}

.pf-bg-shade {
  pointer-events: none;
}

.pf-wrap {
  pointer-events: none;
}

.pf-wrap > * {
  pointer-events: auto;
}

.pf-edit {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding-bottom: 120px;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.2s;
}

.pf-bg:hover .pf-edit,
.pf-edit:focus-within {
  opacity: 1;
}

.pf-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 999px;
  background: rgba(8, 11, 22, 0.75);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.pf-edit-btn:hover {
  background: #fff;
  color: #0b0f19;
}

.pf-edit-btn svg,
.pf-ava-edit svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linejoin: round;
}

.pf-edit-btn input,
.pf-ava-edit input {
  display: none;
}

.pf-ava-edit {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: inherit;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}

.pf-ava:hover .pf-ava-edit,
.pf-ava-edit:focus-within {
  opacity: 1;
}

.pf-uploads {
  display: none;
}

.pf-ava-reset {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 3;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 50%;
  background: #0b0f19;
  color: #fff;
  font-weight: 900;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s;
}

.pf-ava:hover .pf-ava-reset {
  opacity: 1;
}

@media (hover: none), (max-width: 720px) {
  .pf-edit,
  .pf-ava-edit,
  .pf-ava-reset {
    display: none;
  }
  .pf-uploads {
    display: block;
  }
}

.pf-account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pf-account .pf-h,
.pf-account .pf-note {
  margin: 0;
}

.pf-btn.danger {
  background: transparent;
  border: 1px solid rgba(248, 113, 113, 0.6);
  color: #f87171;
}
</style>
