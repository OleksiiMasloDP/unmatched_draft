<template>
  <div class="maps-phase">
    <h6 v-if="draftMode" class="map-select-header">{{ t("selectMap") }}</h6>

    <h6 v-if="!hasAnyDataForSelection">
      {{ t("heroNoMapDataYet") }}
    </h6>

    <div v-else class="maps-grid">
      <MapCard
        v-for="map in displayMaps"
        :key="map.id"
        :map="map"
        :selected="selectedMapId === map.id"
        :show-percent="draftMode"
        :is-preview="!draftMode"
        @click="selectMap(map.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";
import MapCard from "./MapCard.vue";

const {
  selectedMapId,
  filteredMaps,
  maps,
  search,
  t,
  selectMap,
  getMapGroups,
  selectedPreviewHeroIds,
} = useDraftState();

const props = defineProps({
  draftMode: {
    type: Boolean,
    default: false,
  },
});

function mapHasData(map) {
  if (props.draftMode || !selectedPreviewHeroIds.value.length) return true;
  const groups = getMapGroups(map, { isPreview: true });
  return (
    groups.goodFor.length + groups.neutralFor.length + groups.badFor.length > 0
  );
}

const baseMaps = computed(() => {
  if (props.draftMode) {
    return filteredMaps.value;
  }

  const query = search.value.toLowerCase().trim();
  let list = [...(maps.value || [])];

  if (query) {
    list = list.filter((map) => map.name.toLowerCase().includes(query));
  }

  return list;
});

const displayMaps = computed(() => {
  if (props.draftMode || !selectedPreviewHeroIds.value.length) {
    return baseMaps.value;
  }

  return [...baseMaps.value].sort((a, b) => {
    const aHas = mapHasData(a) ? 0 : 1;
    const bHas = mapHasData(b) ? 0 : 1;
    return aHas - bHas;
  });
});

const hasAnyDataForSelection = computed(() => {
  if (props.draftMode || !selectedPreviewHeroIds.value.length) return true;
  return baseMaps.value.some((map) => mapHasData(map));
});
</script>

<style scoped>
.map-select-header {
  margin-bottom: 16px;
}
</style>
