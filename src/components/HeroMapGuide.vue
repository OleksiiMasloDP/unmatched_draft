<template>
  <div class="maps-page">
    <h1 class="page-main-title">
      {{ t('heroMapGuide') }}
    </h1>

    <!-- Панель вибору персонажів для фільтрації -->
    <div class="hero-filter-section">
      <div class="filter-header">
        <span class="filter-title">{{ t('filterByHeroes') }}</span>
        
        <button 
          v-if="selectedPreviewHeroIds.length > 0" 
          @click="clearPreviewHeroes" 
          class="clear-filter-btn"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          {{ t('clearFilter') }}
        </button>
      </div>
      
      <div class="heroes-badge-grid">
        <div 
          v-for="char in getAllCharacters()" 
          :key="char.id" 
          class="hero-badge-item"
          :class="{ 'is-active': selectedPreviewHeroIds.includes(char.id) }"
          @click="toggleHeroFilter(char.id)"
        >
          <div class="hero-img-wrapper">
            <img :src="char.image" class="hero-badge-img" :alt="char.name" />
          </div>
          <span class="hero-badge-name">{{ char.name }}</span>
        </div>
      </div>
    </div>

    <div class="search-container">
      <input 
        id="search-input"
        v-model="search" 
        type="text"
        :placeholder="t('searchMapPlaceholder')"
        class="form-control form-control-sm search-field"
      />
    </div>

    <MapSelect previewMode/>
  </div>
</template>

<script setup>
import { useDraftState } from '../composables/useDraftState.js';
import MapSelect from './MapSelect.vue';

const { t, search, getAllCharacters, selectedPreviewHeroIds } = useDraftState();

// Функція для перемикання таба (додавання/видалення ID з масиву)
function toggleHeroFilter(heroId) {
  const index = selectedPreviewHeroIds.value.indexOf(heroId);
  if (index === -1) {
    selectedPreviewHeroIds.value.push(heroId);
  } else {
    selectedPreviewHeroIds.value.splice(index, 1);
  }
}

// Функція повного очищення вибору
function clearPreviewHeroes() {
  selectedPreviewHeroIds.value = [];
}
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

.hero-filter-section {
  margin: 24px 0;
  padding: 16px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.clear-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 79, 79, 0.1);
  border: 1px solid rgba(255, 79, 79, 0.2);
  color: #ff5f5f;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.clear-filter-btn:hover {
  background: rgba(255, 79, 79, 0.2);
  border-color: rgba(255, 79, 79, 0.4);
  transform: translateY(-1px);
}

.clear-filter-btn:active {
  transform: translateY(0);
}

.btn-icon {
  width: 14px;
  height: 14px;
}

.heroes-badge-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-badge-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.hero-badge-item:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.hero-img-wrapper {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.2s ease;
}

.hero-badge-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-badge-name {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  transition: color 0.2s ease;
}

.hero-badge-item.is-active {
  background: rgba(59, 255, 0, 0.06);
  border-color: rgba(59, 255, 0, 0.75);
  box-shadow: 0 0 12px rgba(59, 255, 0, 0.15), inset 0 0 6px rgba(59, 255, 0, 0.05);
}

.hero-badge-item.is-active .hero-img-wrapper {
  border-color: rgba(59, 255, 0, 0.5);
}

.hero-badge-item.is-active .hero-badge-name {
  color: #fff;
  text-shadow: 0 0 10px rgba(59, 255, 0, 0.2);
}

.page-header-wrapper {
  margin-bottom: 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 16px;
}

.page-main-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 6px 0;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-family: system-ui, -apple-system, sans-serif;
}

.page-subtitle {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.5px;
}
</style>