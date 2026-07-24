<template>
  <div
    class="map-card"
    :class="{ 'map-selected': selected, 'map-card--compact': compact }"
    @click="$emit('click')"
  >
    <img class="map-img" :src="map.image" :alt="map.name" loading="lazy" />

    <div
      v-if="showPercent"
      class="map-percent-badge"
      :class="getMapPercentClass(map.dynamicRating)"
    >
      {{ map.dynamicRating }}%
    </div>

    <div class="map-card-name">
      <div class="map-card-title">{{ map.name }}</div>
      <div v-if="!compact" class="map-card-set">{{ map.set }}</div>

      <div v-if="categories.length" class="map-analysis-wrapper">
        <template v-for="block in analysisBlocks" :key="block.type">
          <div class="analysis-group">
            <div class="analysis-group-title" :class="`${block.type}`">
              <span class="group-icon"></span>
              {{ block.title }}
            </div>

            <div class="analysis-images-flex">
              <div
                v-for="(char, idx) in block.heroes"
                :key="idx"
                class="rec-hero-card"
                :style="{
                  borderColor: char.side === 'opponent' ? '#ef4444' : '#4f7cff',
                }"
              >
                <img :src="char.image" class="hero-img-contain" />
              </div>
            </div>
          </div>
        </template>

        <div v-if="showNoData" class="analysis-group">
          <div class="analysis-group-title none">
            <span class="group-icon"></span>
            {{ t("mapNoDataForSelection") }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";

const { t, getMapGroups } = useDraftState();

const props = defineProps({
  map: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  showPercent: {
    type: Boolean,
    default: false,
  },
  isPreview: {
    type: Boolean,
    default: true,
  },
  categories: {
    type: Array,
    default: () => ["good", "neutral", "bad"],
  },
  heroesFilter: {
    type: Array,
    default: null,
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["click"]);

const groups = computed(() =>
  getMapGroups(props.map, { isPreview: props.isPreview }),
);

const allBlocks = computed(() => [
  { type: "good", title: t("mapSuitableFor"), heroes: groups.value.goodFor },
  {
    type: "neutral",
    title: t("mapNeutralFor"),
    heroes: groups.value.neutralFor,
  },
  { type: "bad", title: t("mapUnsuitableFor"), heroes: groups.value.badFor },
]);

const analysisBlocks = computed(() =>
  allBlocks.value
    .filter((block) => props.categories.includes(block.type))
    .map((block) => ({
      ...block,
      heroes: props.heroesFilter
        ? block.heroes.filter((h) => props.heroesFilter.includes(h.name))
        : block.heroes,
    }))
    .filter((block) => block.heroes.length > 0),
);

const showNoData = computed(
  () => props.isPreview && analysisBlocks.value.length === 0,
);

function getMapPercentClass(rating) {
  if (rating >= 65) return "green";
  if (rating >= 45) return "yellow";
  if (rating >= 30) return "orange";
  return "red";
}
</script>

<style scoped>
.analysis-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.map-analysis-wrapper {
  margin-top: 10px;
  display: flex;
  gap: 24px;
  text-align: left;
  flex-direction: column;
}

.analysis-images-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 46px;
}

.hero-img-contain {
  width: 100%;
  height: 100%;
  object-fit: cover;
  aspect-ratio: 1;
  border-radius: 4px;
}

.analysis-group-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 8px 3px 6px;
  border-radius: 6px;
  border: 1px solid transparent;
}

.analysis-group-title::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.analysis-group-title.good {
  color: var(--color-success);
  background: rgba(var(--color-success-rgb), 0.12);
  border-color: rgba(var(--color-success-rgb), 0.25);
}
.analysis-group-title.good::before {
  background-color: var(--color-success-light);
  box-shadow: 0 0 6px var(--color-success);
}

.analysis-group-title.neutral {
  color: var(--color-player);
  background: rgba(var(--color-player-rgb), 0.12);
  border-color: rgba(var(--color-player-rgb), 0.25);
}
.analysis-group-title.neutral::before {
  background-color: var(--color-player-light);
  box-shadow: 0 0 6px var(--color-player);
}

.analysis-group-title.bad {
  color: var(--color-danger);
  background: rgba(var(--color-danger-rgb), 0.12);
  border-color: rgba(var(--color-danger-rgb), 0.25);
}
.analysis-group-title.bad::before {
  background-color: var(--color-danger-light);
  box-shadow: 0 0 6px var(--color-danger);
}

.analysis-group-title.none {
  color: var(--text-dim);
  background: rgba(var(--border-light-rgb), 0.1);
  border-color: rgba(var(--border-light-rgb), 0.25);
}
.analysis-group-title.none::before {
  background-color: var(--text-dim);
  box-shadow: 0 0 6px var(--text-muted);
}

.map-card--compact .map-img {
  height: 150px;
}

.map-card--compact .map-card-name {
  padding: 10px 12px 12px;
}

.map-card--compact .map-card-title {
  font-size: 13px;
}

.map-card--compact .map-analysis-wrapper {
  gap: 12px;
  margin-top: 8px;
}

.map-card--compact .analysis-group-title {
  font-size: 0.65rem;
  padding: 2px 7px 2px 6px;
}

.map-card--compact .analysis-images-flex {
  min-height: 40px;
  gap: 6px;
}

.map-card--compact .rec-hero-card {
  width: 38px;
  height: 38px;
}
</style>
