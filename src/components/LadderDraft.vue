<template>
  <div class="ladder">
    <div class="ladder-intro">
      <h4 class="fw-bold mb-1 engine-title-text engine-title-desktop">
        {{ t("ladderPoolTitle") }}
      </h4>
      <p class="engine-sub-desc engine-sub-desktop mb-3">
        {{ t("ladderPoolDesc") }}
      </p>

      <div class="ladder-actions">
        <button
          class="btn btn-primary btn-sm action-btn"
          @click="opponentPickerOpen = true"
        >
          {{
            ladderChoice.opponent
              ? t("ladderChangeOpponent")
              : t("ladderChooseOpponent")
          }}
        </button>

        <button
          v-if="ladderStatus === 'mirror'"
          class="btn btn-danger btn-sm action-btn"
          @click="clearLadderChoices"
        >
          {{ t("ladderRepick") }}
        </button>
        <button
          v-else-if="ladderStatus !== 'empty'"
          class="btn btn-danger btn-sm action-btn"
          @click="clearLadderChoices"
        >
          {{ t("ladderClear") }}
        </button>
      </div>

      <div v-if="ladderStatus === 'ready'" class="proceed-maps-btn-wrap">
        <button class="btn-proceed-maps" @click="proceedToMapsEvent">
          {{ t("toMapsLabel") }}
        </button>
      </div>
    </div>

    <div class="controls-row ladder-controls">
      <div class="custom-select-wrapper">
        <select v-model="sortKey">
          <option value="average">{{ t("ladderSortAverage") }}</option>
          <option value="worst">{{ t("ladderSortWorst") }}</option>
          <option value="name">{{ t("ladderSortName") }}</option>
        </select>
      </div>
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
            'is-mine': ladderChoice.player?.id === row.char.id,
            'is-theirs': ladderChoice.opponent?.id === row.char.id,
          }"
          @click="setLadderChoice('player', row.char)"
        >
          <img :src="row.char.image" :alt="row.char.name" />

          <div
            class="stat-badge"
            :class="getPercentClass(row.stats.average)"
            :title="t('ladderAverage')"
          >
            {{ row.stats.average }}%
          </div>

          <div class="char-name">
            <div class="char-title">{{ row.char.name }}</div>

            <div class="ladder-stat-row">
              <span>{{ t("ladderAverage") }}</span>
              <span class="ladder-stat-value">{{ row.stats.average }}%</span>
            </div>

            <div v-if="row.stats.worst" class="ladder-stat-row">
              <span class="ladder-stat-label" :title="row.stats.worst.name">
                {{ t("ladderWorst") }}: {{ row.stats.worst.name }}
              </span>
              <span
                class="ladder-stat-value"
                :class="'text-' + worstTone(row.stats.worst.winrate)"
              >
                {{ row.stats.worst.winrate }}%
              </span>
            </div>

            <div v-if="row.stats.unknown" class="ladder-stat-row is-dim">
              {{ t("ladderUnknown") }}: {{ row.stats.unknown }}
            </div>

            <button
              type="button"
              class="ladder-toggle"
              @click.stop="toggleExpanded(row.char.id)"
            >
              {{
                expandedId === row.char.id
                  ? t("ladderHideMatchups")
                  : t("ladderShowMatchups")
              }}
            </button>

            <MatchupList
              v-if="expandedId === row.char.id"
              :char-name="row.char.name"
              :opponent-picks="matchupTargets(row.char)"
            />
          </div>
        </div>
      </div>
    </div>

    <CharPickerModal
      v-if="opponentPickerOpen"
      :characters-list="opponentPickerList"
      @close="opponentPickerOpen = false"
      @select="onOpponentSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { trackProceedToMaps } from "@/utils/gaAnalytics";
import CharPickerModal from "./CharPickerModal.vue";
import MatchupList from "./MatchupList.vue";

const {
  t,
  search,
  formatPool,
  ladderChoice,
  ladderStatus,
  setLadderChoice,
  clearLadderChoices,
  proceedLadderToMaps,
  proceedToMaps,
  getLadderStats,
  getWinrate,
  getPercentClass,
} = useDraftState();

const sortKey = ref("average");
const expandedId = ref(null);
const opponentPickerOpen = ref(false);

// Статистика рахується один раз на зміну пулу, а не при кожному кліку/пошуку
const rows = computed(() =>
  formatPool.value.map((char) => ({ char, stats: getLadderStats(char) })),
);

const shownRows = computed(() => {
  const q = search.value.toLowerCase().trim();
  const list = q
    ? rows.value.filter((row) => row.char.name.toLowerCase().includes(q))
    : [...rows.value];

  if (sortKey.value === "name") {
    return list.sort((a, b) => a.char.name.localeCompare(b.char.name));
  }

  // Герої без жодного відомого матчапу (worst === null) йдуть у кінець
  if (sortKey.value === "worst") {
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

// Для списку матчапів: найгірші зверху
function matchupTargets(char) {
  return formatPool.value
    .filter((enemy) => enemy.id !== char.id)
    .sort(
      (a, b) =>
        (getWinrate(char.name, a.name) ?? 101) -
        (getWinrate(char.name, b.name) ?? 101),
    );
}

// У списку вибору суперника показуємо вінрейт нашого героя проти кожного
const opponentPickerList = computed(() => {
  const mine = ladderChoice.player;
  return formatPool.value.map((char) =>
    mine ? { ...char, refWinrate: getWinrate(mine.name, char.name) } : char,
  );
});

function onOpponentSelect(char) {
  setLadderChoice("opponent", char);
  opponentPickerOpen.value = false;
}

function toggleExpanded(charId) {
  expandedId.value = expandedId.value === charId ? null : charId;
}

function worstTone(winrate) {
  return winrate < 43 ? "danger" : "warning";
}

function proceedToMapsEvent() {
  if (!proceedLadderToMaps()) return;
  trackProceedToMaps();
  proceedToMaps();
}
</script>

<style scoped>
.ladder-intro {
  margin-bottom: 16px;
}

.ladder-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ladder-controls {
  margin-bottom: 12px;
}

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

.ladder-card.is-mine.is-theirs {
  border-color: var(--color-danger) !important;
  box-shadow: 0 0 16px rgba(var(--color-danger-rgb), 0.55);
}

.ladder-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 11.5px;
}

.ladder-stat-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ladder-stat-value {
  flex: 0 0 auto;
  color: var(--text-white);
  font-weight: 800;
}

.ladder-stat-row.is-dim {
  color: var(--text-dim);
  font-style: italic;
}

.ladder-toggle {
  margin-top: 4px;
  padding: 4px 0;
  background: transparent;
  border: none;
  color: var(--color-player);
  font-size: 11px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.ladder-toggle:hover {
  color: var(--text-white);
}
</style>
