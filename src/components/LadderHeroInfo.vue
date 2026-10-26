<template>
  <div class="ladder-info">
    <div class="ladder-stat-row">
      <span>{{ t("ladderAverage") }}</span>
      <span class="ladder-stat-value">{{ stats.average }}%</span>
    </div>

    <div v-if="stats.worst" class="ladder-stat-row">
      <span class="ladder-stat-label" :title="stats.worst.name">
        {{ t("ladderWorst") }}: {{ stats.worst.name }}
      </span>
      <span
        class="ladder-stat-value"
        :class="'text-' + worstTone(stats.worst.winrate)"
      >
        {{ stats.worst.winrate }}%
      </span>
    </div>

    <button
      type="button"
      class="ladder-toggle"
      :class="{ 'is-open': isOpen }"
      @click.stop="toggleLadderExpanded(expandKey)"
    >
      <span class="ladder-toggle-label">
        {{ isOpen ? t("ladderHideMatchups") : t("ladderShowMatchups") }}
      </span>
      <svg
        class="chevron-icon"
        :class="{ 'is-open': isOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <MatchupList
      v-if="isOpen"
      :char-name="char.name"
      :opponent-picks="targets"
      :highlight-ids="highlightIds"
      :highlight-rgb="highlightRgb"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";
import MatchupList from "./MatchupList.vue";

// Статистика героя проти всього пулу формату + розгортний список матчапів.
// Один і той самий блок показуємо в пулі та в колонках "Choosen heroes".
const props = defineProps({
  char: {
    type: Object,
    required: true,
  },
  // Унікальний ключ списку ("pool:12", "player:12"...): у кожної кнопки
  // свій незалежний стан
  expandKey: {
    type: String,
    required: true,
  },
  // Герої, яких виділяємо в списку (вже обрані іншою стороною)
  highlightIds: {
    type: Array,
    default: () => [],
  },
  highlightRgb: {
    type: String,
    default: "255, 79, 109",
  },
});

const {
  t,
  formatPool,
  ladderExpandedKeys,
  toggleLadderExpanded,
  getLadderStats,
  getWinrate,
} = useDraftState();

const stats = computed(() => getLadderStats(props.char));
const isOpen = computed(() =>
  ladderExpandedKeys.value.includes(props.expandKey),
);

// Виділені (вже обрані суперником) зверху, далі найгірші матчапи
const targets = computed(() =>
  formatPool.value
    .filter((enemy) => enemy.id !== props.char.id)
    .sort((a, b) => {
      const markA = props.highlightIds.includes(a.id) ? 0 : 1;
      const markB = props.highlightIds.includes(b.id) ? 0 : 1;
      if (markA !== markB) return markA - markB;

      return (
        (getWinrate(props.char.name, a.name) ?? 101) -
        (getWinrate(props.char.name, b.name) ?? 101)
      );
    }),
);

function worstTone(winrate) {
  return winrate < 43 ? "danger" : "warning";
}
</script>

<style scoped>
.ladder-info {
  width: 100%;
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

/* Той самий вигляд, що й заголовок блоку "Filter by heroes" на сторінці мап */
.ladder-toggle {
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 10px;
  color: var(--text-dim);
  cursor: pointer;
  user-select: none;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.ladder-toggle:hover,
.ladder-toggle.is-open {
  background: var(--bg-slate-hover);
  border-color: rgba(var(--color-player-rgb), 0.6);
  color: var(--text-white);
}

.ladder-toggle .chevron-icon {
  flex: 0 0 16px;
}

.ladder-toggle-label {
  min-width: 0;
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
</style>
