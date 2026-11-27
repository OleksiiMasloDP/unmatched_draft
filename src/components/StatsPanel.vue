<template>
  <div class="sp">
    <div class="sp-tabs">
      <button
        v-for="item in tabs"
        :key="item"
        type="button"
        class="sp-tab"
        :class="{ on: tab === item }"
        @click="tab = item"
      >
        {{ L.statTabs[item] }}
      </button>
    </div>

    <template v-if="tab !== 'league'">
      <div v-if="tab === 'modes'" class="sp-chips">
        <button
          v-for="item in modeChips"
          :key="item"
          type="button"
          class="sp-chip"
          :class="{ on: modeSel === item }"
          @click="modeSel = item"
        >
          {{ item === "all" ? L.all : L.modes[item] }}
        </button>
      </div>
      <p class="sp-note">{{ L.xpRate[tab] }}</p>
      <div class="sp-kpis">
        <div class="sp-kpi">
          <b>{{ view.wins }}</b><span>{{ L.wins }}</span>
        </div>
        <div class="sp-kpi">
          <b>{{ view.losses }}</b><span>{{ L.losses }}</span>
        </div>
        <div class="sp-kpi">
          <b>{{ rate(view.wins, view.wins + view.losses) }}%</b
          ><span>{{ L.winrate }}</span>
        </div>
        <div v-if="tab === 'modes' && modeSel !== 'packDraft'" class="sp-kpi">
          <b>{{ data.modes.runsWon }}/{{ data.modes.runs }}</b
          ><span>{{ L.runs }}</span>
        </div>
        <div v-else-if="tab !== 'modes'" class="sp-kpi">
          <b>{{ view.dealt }}</b><span>{{ L.damage }}</span>
        </div>
      </div>
      <h3 class="sp-h">{{ L.byHero }}</h3>
      <p v-if="!view.heroes.length" class="sp-note">{{ L.noStats }}</p>
      <HeroBars :rows="view.heroes.slice(0, limit)" :L="L" />
      <button
        v-if="view.heroes.length > 8"
        type="button"
        class="sp-more"
        @click="showAll = !showAll"
      >
        {{ showAll ? L.tl.showLess : L.tl.showAll }}
      </button>
    </template>

    <template v-else>
      <slot name="league-form"></slot>
      <template v-if="data.league">
        <div class="sp-sum">
          <b>{{ data.league.username }}</b>
          <span v-if="data.league.rating"
            >{{ L.tl.rating }}: {{ data.league.rating
            }}<template v-if="data.league.deviation">
              ± {{ data.league.deviation }}</template
            >
            · {{ data.league.ratedMatches }} {{ L.tl.rated }}</span
          >
          <span v-if="data.league.importedAt"
            >{{ L.tl.imported }}:
            {{ new Date(data.league.importedAt).toLocaleDateString() }}</span
          >
        </div>
        <div v-if="own" class="sp-toggles">
          <label
            ><input
              type="checkbox"
              :checked="prefs.leaguePrimary"
              @change="setPref('leaguePrimary', $event.target.checked)"
            />
            {{ L.leaguePrimary }}</label
          >
          <label
            ><input
              type="checkbox"
              :checked="prefs.leagueMerge"
              @change="setPref('leagueMerge', $event.target.checked)"
            />
            {{ L.leagueMerge }}</label
          >
        </div>
        <div class="sp-kpis">
          <div class="sp-kpi">
            <b>{{ leagueView.wins }}</b><span>{{ L.wins }}</span>
          </div>
          <div class="sp-kpi">
            <b>{{ leagueView.losses }}</b><span>{{ L.losses }}</span>
          </div>
          <div class="sp-kpi">
            <b>{{ rate(leagueView.wins, leagueView.games) }}%</b
            ><span>{{ L.winrate }}</span>
          </div>
        </div>
        <h3 class="sp-h">{{ L.byHero }}</h3>
        <HeroBars :rows="leagueView.heroes.slice(0, limit)" :L="L" />
        <button
          v-if="leagueView.heroes.length > 8"
          type="button"
          class="sp-more"
          @click="showAll = !showAll"
        >
          {{ showAll ? L.tl.showLess : L.tl.showAll }}
        </button>
      </template>
      <p v-else-if="!own" class="sp-note">{{ L.noLeague }}</p>
    </template>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, ref, watch } from "vue";
import { heroImage, heroName } from "../profile/profileStore";

const props = defineProps({
  data: { type: Object, required: true },
  L: { type: Object, required: true },
  prefs: { type: Object, required: true },
  own: { type: Boolean, default: false },
});
const emit = defineEmits(["pref"]);

const setPref = (key, value) => emit("pref", key, value);

const rate = (wins, games) => (games ? Math.round((wins / games) * 100) : 0);

const HeroBars = defineComponent({
  props: { rows: Array, L: Object },
  setup(p) {
    return () =>
      p.rows.map((row) =>
        h("div", { class: "sp-row", key: row.key || row.name }, [
          row.key
            ? h("img", { src: heroImage(row.key), alt: "" })
            : h("span", { class: "sp-noimg" }),
          h("div", { class: "sp-main" }, [
            h("div", { class: "sp-top" }, [
              h("span", row.key ? heroName(row.key) : row.name),
              h("span", { class: "sp-val" }, [
                h("b", `${rate(row.wins, row.played)}%`),
                ` · ${p.L.winsWord}: ${row.wins} ${p.L.of} ${row.played}`,
              ]),
            ]),
            h("div", { class: "sp-bar" }, [
              h("i", { style: { width: rate(row.wins, row.played) + "%" } }),
            ]),
          ]),
        ]),
      );
  },
});

const leagueOn = computed(() => Boolean(props.data.league));
const tabs = computed(() =>
  props.prefs.leaguePrimary && leagueOn.value
    ? ["league", "players", "bots", "modes"]
    : ["players", "bots", "modes", "league"],
);
const tab = ref(tabs.value[0]);
watch(
  () => props.prefs.leaguePrimary,
  () => {
    tab.value = tabs.value[0];
  },
);
const modeChips = ["all", "packDraft", "roguelike"];
const modeSel = ref("all");
const showAll = ref(false);
const limit = computed(() => (showAll.value ? 999 : 8));

const leagueRows = computed(() =>
  (props.data.league ? props.data.league.fighters : []).map((row) => ({
    key: row.key,
    name: row.name,
    played: row.games,
    wins: row.wins,
  })),
);

const leagueView = computed(() => {
  const heroes = leagueRows.value;
  const games = heroes.reduce((sum, row) => sum + row.played, 0);
  const wins = heroes.reduce((sum, row) => sum + row.wins, 0);
  return { wins, losses: games - wins, games, heroes };
});

const mergeRows = (base, extra) => {
  const map = new Map();
  [...base, ...extra].forEach((row) => {
    const id = row.key || "n:" + row.name;
    const have = map.get(id) || { ...row, played: 0, wins: 0 };
    have.played += row.played;
    have.wins += row.wins;
    map.set(id, have);
  });
  return [...map.values()].sort((a, b) => b.played - a.played);
};

const view = computed(() => {
  const d = props.data;
  if (tab.value === "modes") {
    if (modeSel.value === "all") return d.modes;
    const sub = d.modes.sub[modeSel.value];
    return {
      wins: sub.wins,
      losses: sub.played - sub.wins,
      dealt: 0,
      heroes: sub.heroes,
    };
  }
  const base = d[tab.value];
  if (tab.value === "players" && props.prefs.leagueMerge && d.league) {
    const league = leagueView.value;
    return {
      wins: base.wins + league.wins,
      losses: base.losses + league.losses,
      dealt: base.dealt,
      heroes: mergeRows(base.heroes, league.heroes),
    };
  }
  return base;
});
</script>

<style>
.sp-tabs,
.sp-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.sp-tab {
  padding: 8px 16px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  background: transparent;
  color: inherit;
  font-weight: 800;
  font-size: 14px;
}

.sp-tab.on {
  background: #3b6bff;
  border-color: #3b6bff;
  color: #fff;
}

.sp-chip {
  padding: 5px 13px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  background: transparent;
  color: inherit;
  font-weight: 700;
  font-size: 13px;
}

.sp-chip.on {
  background: rgba(59, 107, 255, 0.25);
  border-color: #3b6bff;
}

.sp-note {
  margin: 0 0 12px;
  font-size: 12px;
  color: #64748b;
}

.sp-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.sp-kpi {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 6px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.1);
}

.sp-kpi b {
  font-size: 22px;
}

.sp-kpi span {
  font-size: 12px;
  color: #94a3b8;
}

.sp-h {
  margin: 4px 0 10px;
  font-size: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #cbd5e1;
}

.sp-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.sp-row img,
.sp-noimg {
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  object-fit: cover;
  background: rgba(148, 163, 184, 0.15);
}

.sp-main {
  flex: 1;
  min-width: 0;
}

.sp-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 4px;
}

.sp-top > span:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}

.sp-val {
  flex: none;
  color: #94a3b8;
}

.sp-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
}

.sp-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #3b6bff, #f5c518);
}

.sp-more {
  margin-top: 4px;
  padding: 6px 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  background: transparent;
  color: inherit;
}

.sp-sum {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin: 8px 0 12px;
}

.sp-toggles {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 14px;
}
</style>
