<template>
  <div class="maps-phase">
    <h6 class="map-select-header">{{ lang === 'ua' ? 'Виберіть карту' : 'Select a Map' }}</h6>
    <div class="maps-grid">
      <div
        v-for="map in filteredMaps"
        :key="map.id"
        class="map-card"
        :class="{ 'map-selected': selectedMapId === map.id }"
        @click="selectMap(map.id)"
      >
        <img class="map-img" :src="map.image" :alt="map.name" loading="lazy" />
        
        <div class="map-percent-badge" :class="getMapPercentClass(map.dynamicRating)">
          {{ map.dynamicRating }}%
        </div>
        
        <div class="map-card-name">
          <div class="map-card-title">{{ map.name }}</div>
          <div class="map-card-set">{{ map.set }}</div>
          
          <div class="map-analysis-wrapper">
            
            <div v-if="getMapGroups(map).goodFor.length > 0" class="analysis-group">
              <div class="analysis-group-title">{{ t('mapSuitableFor') }}</div>
              <div class="analysis-images-flex">
                <div 
                  v-for="(char, idx) in getMapGroups(map).goodFor" 
                  :key="idx"
                  class="rec-hero-card"
                  :style="{ borderColor: char.side === 'opponent' ? '#ef4444' : '#4f7cff' }"
                >
                  <img :src="char.image" class="hero-img-contain" />
                </div>
              </div>
            </div>

            <div v-if="getMapGroups(map).badFor.length > 0" class="analysis-group">
              <div class="analysis-group-title">{{ t('mapUnsuitableFor') }}</div>
              <div class="analysis-images-flex">
                <div 
                  v-for="(char, idx) in getMapGroups(map).badFor" 
                  :key="idx"
                  class="rec-hero-card"
                  :style="{ borderColor: char.side === 'opponent' ? '#ef4444' : '#4f7cff' }"
                >
                  <img :src="char.image" class="hero-img-contain" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useDraftState } from '../composables/useDraftState';

const { lang, selectedMapId, filteredMaps, t, selectMap, getMapGroups } = useDraftState();

function getMapPercentClass(rating) {
  if (rating >= 65) return "map-pct-green";
  if (rating >= 45) return "map-pct-yellow";
  if (rating >= 30) return "map-pct-orange";
  return "map-pct-red";
}
</script>

<style scoped>
.map-select-header {
  margin-bottom: 16px;
}
.map-analysis-wrapper {
  margin-top: 10px;
  display: flex;
  gap: 24px;
  text-align: left;
}
.analysis-group-title {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 4px;
}
.analysis-images-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.hero-img-contain {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>