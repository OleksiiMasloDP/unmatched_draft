<template>
  <div class="maps-phase">
    <h6 v-if="draftMode" class="map-select-header">{{ t("selectMap") }}</h6>

    <div class="maps-grid">
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

const { selectedMapId, filteredMaps, maps, search, t, selectMap } =
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

  const query = search.value.toLowerCase().trim();
  let list = [...(maps.value || [])];

  if (query) {
    list = list.filter((map) => map.name.toLowerCase().includes(query));
  }

  return list;
});
</script>

<style scoped>
.map-select-header {
  margin-bottom: 16px;
}
</style>
