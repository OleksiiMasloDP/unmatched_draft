<template>
  <div class="maps-phase">
    <h6 v-if="draftMode" class="map-select-header">{{ t("selectMap") }}</h6>

    <div class="maps-grid">
      <div
        v-for="map in displayMaps"
        :key="map.id"
        class="map-card"
        :class="{ 'map-selected': selectedMapId === map.id }"
        @click="selectMap(map.id)"
      >
        <img class="map-img" :src="map.image" :alt="map.name" loading="lazy" />

        <div
          v-if="draftMode"
          class="map-percent-badge"
          :class="getMapPercentClass(map.dynamicRating)"
        >
          {{ map.dynamicRating }}%
        </div>

        <div class="map-card-name">
          <div class="map-card-title">{{ map.name }}</div>
          <div class="map-card-set">{{ map.set }}</div>

          <div class="map-analysis-wrapper">
            <template
              v-for="block in [
                {
                  type: 'good',
                  title: t('mapSuitableFor'),
                  heroes: getMapGroups(map, { isPreview: !draftMode }).goodFor,
                },
                {
                  type: 'neutral',
                  title: t('mapNeutralFor'),
                  heroes: getMapGroups(map, { isPreview: !draftMode })
                    .neutralFor,
                },
                {
                  type: 'bad',
                  title: t('mapUnsuitableFor'),
                  heroes: getMapGroups(map, { isPreview: !draftMode }).badFor,
                },
              ]"
              :key="block.type"
            >
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
                      borderColor:
                        char.side === 'opponent' ? '#ef4444' : '#4f7cff',
                    }"
                  >
                    <img :src="char.image" class="hero-img-contain" />
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";

const { lang, selectedMapId, filteredMaps, maps, t, selectMap, getMapGroups } =
  useDraftState();

const props = defineProps({
  draftMode: {
    type: Boolean,
    default: false,
  },
});

const displayMaps = computed(() => {
  if (props.draftMode) {
    return filteredMaps.value;
  }

  return [...(maps.value || [])];
});

function getMapPercentClass(rating) {
  if (rating >= 65) return "map-pct-green";
  if (rating >= 45) return "map-pct-yellow";
  if (rating >= 30) return "map-pct-orange";
  return "map-pct-red";
}
</script>

<style scoped>
.analysis-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.map-select-header {
  margin-bottom: 16px;
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
  color: #22c55e;
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.25);
}
.analysis-group-title.good::before {
  background-color: #4ade80;
  box-shadow: 0 0 6px #22c55e;
}

.analysis-group-title.neutral {
  color: rgb(79, 124, 255);
  background: rgba(79, 124, 255, 0.12);
  border-color: rgba(79, 124, 255, 0.25);
}

.analysis-group-title.neutral::before {
  background-color: rgb(120, 155, 255);
  box-shadow: 0 0 6px rgb(79, 124, 255);
}

.analysis-group-title.bad {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.25);
}

.analysis-group-title.bad::before {
  background-color: #f87171;
  box-shadow: 0 0 6px #ef4444;
}
</style>
