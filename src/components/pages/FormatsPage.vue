<template>
  <div class="container py-3 py-md-4 formats-page">
    <div class="formats-head">
      <h4 class="fw-bold mb-0 engine-title-text">
        {{ t("formatsCustomTitle") }}
      </h4>
      <router-link
        :to="{ name: 'format-new' }"
        class="btn btn-primary btn-sm formats-create-btn"
      >
        + {{ t("formatsCreate") }}
      </router-link>
    </div>

    <p class="engine-sub-desc engine-sub-desktop formats-note">
      {{ t("formatsStorageNote") }}
    </p>

    <p v-if="!customFormats.length" class="formats-empty">
      {{ t("formatsEmpty") }}
    </p>

    <div v-else class="formats-list">
      <div v-for="format in customFormats" :key="format.id" class="format-card">
        <div class="format-info">
          <div class="format-name">{{ format.name }}</div>
          <div class="format-meta">
            {{ banPresets[format.banPreset].name }} ·
            {{ format.allowedHeroIds.length }} {{ t("formatsHeroesWord") }}
          </div>
        </div>

        <div class="format-actions">
          <button
            class="btn btn-success btn-sm"
            @click="applyFormat(format.id)"
          >
            {{ t("formatsUse") }}
          </button>
          <router-link
            :to="{ name: 'format-edit', params: { id: format.id } }"
            class="btn btn-primary btn-sm"
          >
            {{ t("formatsEdit") }}
          </router-link>
          <button
            class="btn btn-danger btn-sm"
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
const { t, customFormats, currentFormat, saveToStorage, deleteCustomFormat } =
  useDraftState();

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
</script>

<style scoped>
.formats-page {
  max-width: 820px;
}

.formats-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.formats-create-btn {
  font-weight: 700;
}

.formats-note {
  margin-bottom: 16px;
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
  padding: 14px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 14px;
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

.format-actions .btn {
  font-weight: 700;
}

.btn.is-confirming {
  background: var(--color-danger-dark);
  border-color: var(--color-danger-dark);
}
</style>
