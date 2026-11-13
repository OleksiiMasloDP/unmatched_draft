<template>
  <div class="rdeck" @click.self="emit('close')">
    <div class="rdeck-box">
      <div class="rdeck-head">
        <h3>📚 {{ t("rogueYourDeck").replace("{n}", cards.length) }}</h3>
        <button type="button" class="rdeck-close" @click="emit('close')">
          ✕
        </button>
      </div>
      <div class="rdeck-grid">
        <div
          v-for="group in groups"
          :key="group.key"
          class="rdeck-stack"
          :style="{ '--n': group.cards.length }"
        >
          <div
            v-for="(card, index) in group.cards"
            :key="index"
            class="rdeck-card"
            :style="{ '--i': index }"
          >
            <PackCard :card="card" />
          </div>
          <span v-if="group.cards.length > 1" class="rdeck-count">
            ×{{ group.cards.length }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";
import PackCard from "./PackCard.vue";

const props = defineProps({
  cards: { type: Array, required: true },
});

const emit = defineEmits(["close"]);
const { t } = useDraftState();

const groups = computed(() => {
  const map = new Map();
  for (const card of props.cards) {
    const key = `${card.heroId}:${card.key}`;
    if (!map.has(key)) map.set(key, { key, cards: [] });
    map.get(key).cards.push(card);
  }
  return [...map.values()];
});
</script>

<style scoped>
.rdeck {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.75);
}

.rdeck-box {
  width: min(960px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 16px;
  border: 2px solid #8a6c43;
  border-radius: 16px;
  background: #151a22;
}

.rdeck-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.rdeck-head h3 {
  margin: 0;
  font-size: 1.1rem;
}

.rdeck-close {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
}

.rdeck-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px 12px;
}

.rdeck-stack {
  --offset-x: 12px;
  --offset-y: 12px;
  position: relative;
  display: grid;
  width: 100%;
  padding-right: calc((var(--n) - 1) * var(--offset-x));
  padding-bottom: calc((var(--n) - 1) * var(--offset-y));
}

.rdeck-card {
  grid-area: 1 / 1;
  width: 100%;
  transform: translate(
    calc(var(--i) * var(--offset-x)),
    calc(var(--i) * var(--offset-y))
  );
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
}

.rdeck-count {
  position: absolute;
  top: -8px;
  left: -8px;
  z-index: 5;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--color-warning);
  color: #111827;
  font-size: 14px;
  font-weight: 800;
}

@media (max-width: 560px) {
  .rdeck-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }
}
</style>
