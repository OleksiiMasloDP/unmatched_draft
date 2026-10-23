<template>
  <div class="formats-page container">
    <h1 class="page-main-title">{{ t("formatsTitle") }}</h1>

    <p class="engine-sub-desc engine-sub-desktop formats-note">
      {{ t("formatsStorageNote") }}
    </p>

    <div class="formats-toolbar">
      <router-link
        :to="{ name: 'format-new' }"
        class="btn btn-primary btn-sm action-btn"
      >
        + {{ t("formatsCreate") }}
      </router-link>
    </div>

    <p v-if="!customFormats.length" class="formats-empty">
      {{ t("formatsEmpty") }}
    </p>

    <div v-else class="formats-list">
      <div v-for="format in customFormats" :key="format.id" class="format-card">
        <div class="format-info">
          <div class="format-name">{{ format.name }}</div>
          <div class="format-meta">
            {{ banPresets[format.banPreset].name }} ·
            {{ format.allowedHeroIds.length }} {{ t("formatsHeroesWord") }} ·
            {{ mapsCount(format) }} {{ t("formatsMapsWord") }}
          </div>
        </div>

        <div class="format-actions">
          <button
            class="btn btn-success btn-sm action-btn"
            @click="applyFormat(format.id)"
          >
            {{ t("formatsUse") }}
          </button>
          <router-link
            :to="{ name: 'format-edit', params: { id: format.id } }"
            class="btn btn-primary btn-sm action-btn"
          >
            {{ t("formatsEdit") }}
          </router-link>
          <button
            class="btn btn-danger btn-sm action-btn"
            :class="{ 'is-confirming': pendingDeleteId === format.id }"
            @click="onDelete(format.id)"
          >
            {{
              pendingDeleteId === format.id
                ? t("formatsDeleteConfirm")
                : t("formatsDelete")
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useDraftState } from "../../composables/useDraftState.js";
import { banPresets } from "../../draftFormats.js";

const router = useRouter();
const {
  t,
  maps,
  customFormats,
  currentFormat,
  saveToStorage,
  deleteCustomFormat,
} = useDraftState();

// Видалення у два кліки: перший змінює підпис кнопки, другий підтверджує
const pendingDeleteId = ref(null);

function onDelete(id) {
  if (pendingDeleteId.value !== id) {
    pendingDeleteId.value = id;
    return;
  }
  deleteCustomFormat(id);
  pendingDeleteId.value = null;
}

function applyFormat(id) {
  currentFormat.value = id;
  saveToStorage();
  router.push({ name: "main" });
}

function mapsCount(format) {
  return format.allowedMapIds.includes("all")
    ? maps.value.length
    : format.allowedMapIds.length;
}
</script>

<style scoped>
.formats-page {
  padding: 2rem 1rem;
}

.formats-note {
  margin-bottom: 16px;
}

.formats-toolbar {
  display: flex;
  margin-bottom: 16px;
}

.formats-toolbar .action-btn {
  flex: 0 0 auto;
}

.formats-empty {
  color: var(--text-dim);
  font-size: 13px;
  font-style: italic;
}

.formats-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.format-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
}

.format-name {
  color: var(--text-light);
  font-weight: 800;
  font-size: 15px;
}

.format-meta {
  color: var(--text-dim);
  font-size: 12px;
  margin-top: 2px;
}

.format-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn.is-confirming {
  outline: 2px solid rgba(var(--color-danger-rgb), 0.6);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .format-actions {
    width: 100%;
  }
}
</style>
