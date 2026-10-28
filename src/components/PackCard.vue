<template>
  <div
    class="pack-card"
    :class="{
      'is-selected': selected,
      'is-dead': dead,
      'is-clickable': clickable,
    }"
    @click="clickable && emit('select', card.id)"
  >
    <div v-if="card.image" class="pack-card-image">
      <img :src="card.image" :alt="card.name" loading="lazy" />
    </div>

    <div class="pack-card-body">
      <div class="pack-card-owner">{{ ownerLabel }}</div>
      <div class="pack-card-name">{{ card.name }}</div>

      <div v-if="card.type || card.value !== null" class="pack-card-meta">
        <span v-if="card.type" class="pack-card-type">
          {{ t("packType_" + card.type) }}
        </span>
        <span v-if="card.value !== null" class="pack-card-value">
          {{ card.value }}
        </span>
        <span v-if="card.boost !== null" class="pack-card-boost">
          {{ t("packBoost") }} {{ card.boost }}
        </span>
      </div>

      <p v-if="text" class="pack-card-text">{{ text }}</p>

      <div v-if="dead" class="pack-card-dead">{{ t("packDeadCard") }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { packDraftHeroes } from "../packDraftData";

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  dead: {
    type: Boolean,
    default: false,
  },
  clickable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select"]);

const { t, lang } = useDraftState();

const ownerLabel = computed(() => {
  if (props.card.kind === "sidekick") return props.card.sidekick;
  if (props.card.kind === "any") return t("packOwnerAny");
  return packDraftHeroes.find((hero) => hero.id === props.card.heroId)?.name;
});

const text = computed(
  () => props.card.text?.[lang.value] || props.card.text?.en || "",
);
</script>

<style scoped>
.pack-card {
  display: flex;
  flex-direction: column;
  min-height: 120px;
  overflow: hidden;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
  text-align: left;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.pack-card.is-clickable {
  cursor: pointer;
}

.pack-card.is-clickable:hover {
  transform: translateY(-3px);
  border-color: rgba(var(--color-player-rgb), 0.7);
  box-shadow: 0 0 18px rgba(var(--color-player-rgb), 0.35);
}

.pack-card.is-selected {
  border-color: var(--color-proceed);
  box-shadow: 0 0 18px rgba(var(--color-proceed-rgb), 0.5);
}

.pack-card.is-dead {
  opacity: 0.55;
}

.pack-card-image img {
  display: block;
  width: 100%;
  aspect-ratio: 5 / 7;
  object-fit: cover;
}

.pack-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
}

.pack-card-owner {
  color: var(--text-dim);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.pack-card-name {
  color: var(--text-white);
  font-size: 14px;
  font-weight: 800;
}

.pack-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
}

.pack-card-type {
  color: var(--color-info);
}

.pack-card-value {
  color: var(--text-white);
}

.pack-card-boost {
  color: var(--color-warning);
}

.pack-card-text {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-line;
}

.pack-card-dead {
  color: var(--color-danger);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
</style>
