<template>
  <div class="maps-page container">
    <Disclaimer
      title-key="mapDisclaimerTitle"
      text-key="mapDisclaimerText"
      storage-key="disclaimer_maps_dismissed"
    />
    <h1 class="page-main-title">
      {{ t("heroMapGuide") }}
    </h1>

    <div class="hero-filter-section">
      <div class="filter-header" @click="isHeroFilterOpen = !isHeroFilterOpen">
        <div class="header-title-group">
          <span class="filter-title">{{ t("filterByHeroes") }}</span>
          <svg
            class="chevron-icon"
            :class="{ 'is-open': isHeroFilterOpen }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <ClearFilterBtn
          v-if="selectedPreviewHeroIds.length > 0"
          @click.stop="clearPreviewHeroes"
        />
      </div>

      <div v-show="isHeroFilterOpen" class="heroes-badge-grid">
        <div
          v-for="char in getAllCharacters()"
          :key="char.id"
          class="hero-badge-item"
          :class="{ 'is-active': selectedPreviewHeroIds.includes(char.id) }"
          @click="toggleHeroFilter(char.id)"
          :title="char.name"
        >
          <div class="hero-img-wrapper">
            <img :src="char.image" class="hero-badge-img" :alt="char.name" />
          </div>
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

    <MapSelect />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useDraftState } from "../composables/useDraftState.js";
import MapSelect from "./MapSelect.vue";
import Disclaimer from "./Disclaimer.vue";
import ClearFilterBtn from "./buttons/ClearFilterBtn.vue";

const { t, search, getAllCharacters, selectedPreviewHeroIds } = useDraftState();

const isHeroFilterOpen = ref(false);

function toggleHeroFilter(heroId) {
  const index = selectedPreviewHeroIds.value.indexOf(heroId);
  if (index === -1) {
    selectedPreviewHeroIds.value.push(heroId);
  } else {
    selectedPreviewHeroIds.value.splice(index, 1);
  }
}

function clearPreviewHeroes() {
  selectedPreviewHeroIds.value = [];
}
</script>

<style scoped>
.maps-page {
  padding: 2rem 1rem;
}

.search-container {
  margin-bottom: 2rem;
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
  cursor: pointer;
  user-select: none;
}

.header-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.heroes-badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 8px;
  margin-top: 16px;
}

@media (min-width: 770px) {
  .heroes-badge-grid {
    grid-template-columns: repeat(auto-fill, 73.6px);
  }
}

.hero-badge-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
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
  transform: translateY(-2px);
}

.hero-img-wrapper {
  width: 100%;
  height: 100%;
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

.hero-badge-item.is-active {
  background: rgba(59, 255, 0, 0.06);
  border-color: rgba(59, 255, 0, 0.75);
  box-shadow:
    0 0 12px rgba(59, 255, 0, 0.15),
    inset 0 0 6px rgba(59, 255, 0, 0.05);
}

.hero-badge-item.is-active .hero-img-wrapper {
  border-color: rgba(59, 255, 0, 0.75);
}

.page-main-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 6px 0;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}
</style>
