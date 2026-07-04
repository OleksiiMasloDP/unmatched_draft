<!-- MapsAnalysis.vue (Страница анализа карт) -->
<template>
  <div class="maps-page">
    <div class="search-container">
      <input 
        v-model="search" 
        type="text"
        :placeholder="t('searchPlaceholder')"
        class="form-control form-control-sm search-field"
      />
    </div>

    <MapSelect previewMode/>
  </div>
</template>

<script setup>
import { useDraftState } from '../composables/useDraftState';
import MapSelect from './MapSelect.vue';

const { search, t } = useDraftState();
</script>

<style scoped>
.maps-page {
  padding: 2rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
}
.search-container {
  margin-bottom: 2rem;
}

.maps-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.map-analysis-card {
  width: 100%;
  background: #1e1e24;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
.map-card-header {
  background: rgba(255, 255, 255, 0.02);
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.map-name {
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
}
.map-card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.analysis-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.analysis-group-title {
  font-size: 0.9rem;
  font-weight: bold;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.analysis-images-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.rec-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 70px;
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.2);
}
.hero-img-contain {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
}
.hero-mini-name {
  font-size: 0.65rem;
  color: #cbd5e1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
</style>