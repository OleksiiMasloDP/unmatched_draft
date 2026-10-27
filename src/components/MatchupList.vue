<template>
  <div
    v-if="items && items.length"
    class="mu-list"
    :class="{ 'is-threat': isThreat }"
    :style="{ '--mu-hl-rgb': highlightRgb }"
  >
    <div
      v-for="enemy in items"
      :key="enemy.id || enemy.name"
      class="mu-item-row"
      :class="{ 'is-highlight': isHighlighted(enemy) }"
    >
      <span>vs {{ enemy.name }}</span>
      <span :class="isThreat ? 'text-danger fw-bold' : 'mu-percent-accent'">
        {{ getTargetWinrate(enemy) }}%
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";

const props = defineProps({
  charName: {
    type: String,
    required: true,
  },
  opponentPicks: {
    type: Array,
    required: true,
  },
  isThreat: {
    type: Boolean,
    default: false,
  },
  ignoredIds: {
    type: Object,
    default: () => new Set(),
  },
  highlightIds: {
    type: Array,
    default: () => [],
  },
  highlightRgb: {
    type: String,
    default: "255, 79, 109",
  },
});

const { getWinrate } = useDraftState();

function isHighlighted(enemy) {
  return Boolean(enemy.id) && props.highlightIds.includes(enemy.id);
}

const items = computed(() => {
  if (!props.opponentPicks) return [];
  return props.opponentPicks.filter((enemy) => {
    if (enemy.id && props.ignoredIds.has(enemy.id)) return false;

    return getWinrate(props.charName, enemy.name) !== null;
  });
});

function getTargetWinrate(enemy) {
  return enemy.winrate !== undefined
    ? enemy.winrate
    : getWinrate(props.charName, enemy.name);
}
</script>

<style scoped>
.mu-list {
  width: 100%;
  font-size: 0.72rem;
  margin-top: 6px;
}

.mu-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: 1.4;
  padding: 3px 0;
}

.mu-item-row span:first-child,
.mu-percent-accent {
  font-weight: 500;
}

.mu-list:not(.is-threat) {
  background: rgba(var(--ban-color-rgb), 0.2);
  border-radius: 4px;
  padding: 4px 6px;
  border: 1px solid var(--border-light);
}

.mu-list:not(.is-threat) .mu-item-row:not(:last-child) {
  border-bottom: 1px solid rgba(var(--color-player-rgb), 0.15);
}

.mu-item-row.is-highlight {
  margin: 0 -6px;
  padding-left: 6px;
  padding-right: 6px;
  background: rgba(var(--mu-hl-rgb), 0.22);
  box-shadow: inset 3px 0 0 rgba(var(--mu-hl-rgb), 0.95);
}

.mu-item-row.is-highlight span:first-child {
  color: var(--text-white);
  font-weight: 800;
}

.mu-list.is-threat {
  border-radius: 4px;
  padding: 4px 6px;
  background: rgba(var(--color-opponent-rgb), 0.08);
  border: 1px solid rgba(var(--color-opponent-rgb), 0.15);
}

.mu-list.is-threat .mu-item-row span:first-child {
  color: var(--text-light);
}

.mu-list.is-threat .mu-item-row:not(:last-child) {
  border-bottom: 1px dashed rgba(var(--color-opponent-rgb), 0.15);
}
</style>
