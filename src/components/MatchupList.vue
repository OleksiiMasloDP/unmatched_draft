<!-- MatchupList.vue -->
<template>
  <!-- Рендерим контейнер только если есть список целей/врагов -->
  <div
    v-if="items && items.length"
    class="mu-list"
    :class="{ 'is-threat': isThreat }"
  >
    <div
      v-for="enemy in items"
      :key="enemy.id || enemy.name"
      class="mu-item-row"
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
});

const { getWinrate } = useDraftState();

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
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mu-list:not(.is-threat) .mu-item-row:not(:last-child) {
  border-bottom: 1px solid rgba(79, 124, 255, 0.15);
}

.mu-list.is-threat {
  background: rgba(255, 79, 109, 0.08);
  border-radius: 4px;
  padding: 4px 6px;
  border: 1px solid rgba(255, 79, 109, 0.15);
}

.mu-list.is-threat .mu-item-row span:first-child {
  color: #f8fafc;
}

.mu-list.is-threat .mu-item-row:not(:last-child) {
  border-bottom: 1px dashed rgba(255, 79, 109, 0.15);
}
</style>
