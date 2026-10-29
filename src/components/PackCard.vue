<template>
  <div
    class="pack-card"
    :class="{
      'is-keep': mark === 'keep',
      'is-discard': mark === 'discard',
      'is-image': showImage,
      'is-selected': selected,
      'is-dead': dead,
      'is-clickable': clickable,
    }"
    @click="clickable && emit('select', card.id)"
  >
    <div v-if="selected" class="pack-card-flag is-selected">✔</div>
    <div v-if="mark === 'keep'" class="pack-card-flag is-keep">
      {{ t("packMarkKeep") }}
    </div>
    <div v-if="mark === 'discard'" class="pack-card-flag is-discard">
      {{ t("packMarkDiscard") }}
    </div>
    <div v-if="mark === 'discard'" class="pack-card-cross">✕</div>
    <slot name="overlay" />
    <div v-if="showImage" class="pack-card-image">
      <img
        :src="card.image"
        :alt="card.name"
        loading="lazy"
        @error="imageFailed = true"
      />
      <div v-if="dead" class="pack-card-dead-badge">
        {{ t("packDeadCard") }}
      </div>
    </div>

    <div v-if="!showImage" class="pack-card-body">
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
import { computed, ref } from "vue";
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
  mark: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["select"]);

const imageFailed = ref(false);
const showImage = computed(
  () => Boolean(props.card.image) && !imageFailed.value,
);

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

.pack-card {
  position: relative;
}

.pack-card.is-selected {
  border-color: var(--color-proceed);
  box-shadow:
    0 0 0 3px var(--color-proceed),
    0 0 22px rgba(var(--color-proceed-rgb), 0.7);
  transform: translateY(-4px);
}

.pack-card.is-keep {
  border-color: var(--color-success-light);
  box-shadow:
    0 0 0 3px var(--color-success-light),
    0 0 22px rgba(var(--color-proceed-rgb), 0.7);
  transform: translateY(-4px);
}

.pack-card.is-discard {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px var(--color-danger);
}

.pack-card.is-discard .pack-card-image img,
.pack-card.is-discard .pack-card-body {
  filter: grayscale(0.8) brightness(0.55);
}

.pack-card-flag {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 2;
  padding: 2px 8px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.pack-card-flag.is-selected,
.pack-card-flag.is-keep {
  background: var(--color-success);
}

.pack-card-flag.is-discard {
  background: var(--color-danger);
}

.pack-card-cross {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-danger);
  font-size: 64px;
  font-weight: 900;
  text-shadow: 0 0 12px #000;
  pointer-events: none;
}

.pack-card.is-dead {
  opacity: 0.55;
}

.pack-card.is-image {
  min-height: 0;
  background: transparent;
  border-radius: 10px;
}

.pack-card-image {
  position: relative;
}

.pack-card-image img {
  display: block;
  width: 100%;
  aspect-ratio: 398 / 556;
  object-fit: cover;
}

.pack-card-dead-badge {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(var(--bg-dark-rgb), 0.85);
  color: var(--color-danger);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
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
