<template>
  <div class="char-picker-overlay" @click.self="emit('close')">
    <div class="char-picker-modal">
      <div class="char-picker-header">
        <input
          v-model="searchQuery"
          type="text"
          class="form-control form-control-sm search-field"
          :placeholder="t('searchPlaceholder')"
        />
        <button class="char-picker-close" @click="emit('close')">✕</button>
      </div>

      <div class="char-picker-grid scroll">
        <div
          v-for="char in filteredCharacters"
          :key="char.id"
          class="char-picker-item"
          :title="char.name"
          @click="emit('select', char)"
        >
          <img :src="char.image" :alt="char.name" loading="lazy" />

          <!-- Если передан refWinrate (для страницы матчапов) -->
          <span
            v-if="char.refWinrate !== undefined"
            class="stat-badge"
            :class="
              char.refWinrate === null
                ? 'unknown'
                : getPercentClass(char.refWinrate)
            "
          >
            {{ char.refWinrate === null ? "?" : char.refWinrate + "%" }}
          </span>
        </div>

        <p v-if="!filteredCharacters.length" class="no-maps-text">
          {{ t("matchupNoCharactersFound") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useDraftState } from "../composables/useDraftState";

const props = defineProps({
  charactersList: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["close", "select"]);
const { t, getPercentClass } = useDraftState();
const searchQuery = ref("");

const filteredCharacters = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  return props.charactersList.filter(
    (c) => !query || c.name.toLowerCase().includes(query),
  );
});
</script>

<style scoped>
.char-picker-overlay {
  position: fixed;
  inset: 0;
  height: 100vh;
  height: 100dvh;
  background: rgba(4, 6, 11, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.char-picker-modal {
  width: 100%;
  max-width: 640px;
  max-height: 80vh;
  background: #0f172a;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.char-picker-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.char-picker-header .search-field {
  flex: 1 1 auto;
}

.char-picker-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.char-picker-close:hover {
  background: #ef4444;
}

.char-picker-grid {
  padding: 16px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.char-picker-item {
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #121824;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  height: 140px;
}

.char-picker-item:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(59, 255, 0, 0.75);
  box-shadow: 0 8px 20px rgba(255, 255, 255, 0.15);
}

.char-picker-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.no-maps-text {
  color: #94a3b8;
  font-size: 13px;
  font-style: italic;
}
</style>
