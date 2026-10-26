<template>
  <div class="ladder">
    <div v-if="ladderStatus === 'ready'" class="proceed-maps-btn-wrap">
      <button class="btn-proceed-maps" @click="proceedToMapsEvent">
        {{ t("toMapsLabel") }}
      </button>
    </div>

    <div class="row g-2 g-md-3">
      <div
        v-for="row in shownRows"
        :key="row.char.id"
        class="col-6 col-sm-6 col-md-4"
      >
        <div
          class="character ladder-card"
          :class="{
            'is-mine': isMine(row.char.id),
            'is-theirs': isTheirs(row.char.id),
            'is-mirror': ladderMirrorIds.includes(row.char.id),
            'threat-card': threatById.get(row.char.id).isThreat,
          }"
          @click="toggleLadderPlayer(row.char)"
        >
          <img :src="row.char.image" :alt="row.char.name" />

          <div
            class="stat-badge"
            :class="getPercentClass(row.stats.average)"
            :title="t('ladderAverage')"
          >
            {{ row.stats.average }}%
          </div>

          <div v-if="threatById.get(row.char.id).isThreat" class="threat-badge">
            ⚠️ {{ t("ghostThreat") }}
          </div>

          <div class="char-name">
            <div class="char-title">{{ row.char.name }}</div>

            <MatchupList
              v-if="threatById.get(row.char.id).isThreat"
              :char-name="row.char.name"
              :opponent-picks="threatById.get(row.char.id).targets"
              :is-threat="true"
            />

            <LadderHeroInfo
              :char="row.char"
              :expand-key="'pool:' + row.char.id"
              :highlight-ids="opponentIds"
              :highlight-rgb="OPPONENT_RGB"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { trackProceedToMaps } from "@/utils/gaAnalytics";
import MatchupList from "./MatchupList.vue";
import LadderHeroInfo from "./LadderHeroInfo.vue";

const {
  t,
  search,
  formatPool,
  ladderChoice,
  ladderStatus,
  ladderMirrorIds,
  ladderSort,
  toggleLadderPlayer,
  proceedLadderToMaps,
  proceedToMaps,
  getLadderStats,
  getLadderThreat,
  getPercentClass,
} = useDraftState();

// Колір підсвітки героїв, яких уже обрав суперник
const OPPONENT_RGB = "255, 79, 109";

const isMine = (id) => ladderChoice.player.some((c) => c.id === id);
const isTheirs = (id) => ladderChoice.opponent.some((c) => c.id === id);
const opponentIds = computed(() => ladderChoice.opponent.map((c) => c.id));

// Статистика рахується один раз на зміну пулу, а не при кожному кліку/пошуку
const rows = computed(() =>
  formatPool.value.map((char) => ({ char, stats: getLadderStats(char) })),
);

// "Загроза" залежить від моїх обраних героїв, тому перераховується при їх зміні
const threatById = computed(
  () =>
    new Map(rows.value.map((row) => [row.char.id, getLadderThreat(row.char)])),
);

const shownRows = computed(() => {
  const q = search.value.toLowerCase().trim();
  const list = q
    ? rows.value.filter((row) => row.char.name.toLowerCase().includes(q))
    : [...rows.value];

  if (ladderSort.value === "name") {
    return list.sort((a, b) => a.char.name.localeCompare(b.char.name));
  }

  // Герої без жодного відомого матчапу (worst === null) йдуть у кінець
  if (ladderSort.value === "worst") {
    const worstOf = (row) => row.stats.worst?.winrate ?? -1;
    return list.sort(
      (a, b) => worstOf(b) - worstOf(a) || b.stats.average - a.stats.average,
    );
  }

  return list.sort(
    (a, b) =>
      b.stats.average - a.stats.average ||
      a.char.name.localeCompare(b.char.name),
  );
});

function proceedToMapsEvent() {
  if (!proceedLadderToMaps()) return;
  trackProceedToMaps();
  proceedToMaps();
}
</script>

<style scoped>
.ladder-card {
  min-height: 0;
}

.ladder-card.is-mine {
  border-color: var(--color-player) !important;
  box-shadow: 0 0 16px rgba(var(--color-player-rgb), 0.5);
}

.ladder-card.is-theirs {
  border-color: var(--color-opponent) !important;
  box-shadow: 0 0 16px rgba(var(--color-opponent-rgb), 0.5);
}

.ladder-card.is-mirror {
  border-color: var(--color-danger) !important;
  box-shadow: 0 0 16px rgba(var(--color-danger-rgb), 0.55);
}

/* Така сама "загроза", як у звичайному драфті (CharacterDraft.vue) */
.ladder-card.threat-card:not(.is-mine):not(.is-theirs):not(.is-mirror) {
  border: 1px solid rgba(var(--color-opponent-rgb), 0.6) !important;
  box-shadow: 0 0 10px rgba(var(--color-opponent-rgb), 0.25);
  background: rgba(var(--color-opponent-rgb), 0.03);
}

.threat-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(var(--color-danger-rgb), 0.9);
  backdrop-filter: blur(4px);
  color: var(--text-white);
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
