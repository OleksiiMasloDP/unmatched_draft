<template>
  <section class="saved-decks">
    <h2 class="saved-decks-title">
      {{ t("packSavedDecksTitle") }}
      <span v-if="decks.length">({{ decks.length }})</span>
    </h2>

    <p v-if="!decks.length" class="saved-decks-empty">
      {{ t("packSavedDecksEmpty") }}
    </p>

    <div v-else class="saved-decks-list">
      <div v-for="deck in decks" :key="deck.id" class="saved-deck">
        <img
          v-if="heroOf(deck) && heroOf(deck).image"
          class="saved-deck-img"
          :src="heroOf(deck).image"
          :alt="heroOf(deck).name"
        />
        <div class="saved-deck-info">
          <input
            v-if="editingId === deck.id"
            v-model="draftName"
            class="form-control form-control-sm search-field"
            maxlength="40"
            @keyup.enter="commitRename(deck)"
            @keyup.esc="cancelRename"
          />
          <div v-else class="saved-deck-name">{{ deck.name }}</div>
          <div class="saved-deck-meta">
            {{ heroOf(deck) ? heroOf(deck).name : "" }} ·
            {{ t("packDeckCards").replace("{n}", deck.cardIds.length) }}
          </div>
        </div>

        <div class="saved-deck-actions">
          <template v-if="editingId === deck.id">
            <button
              type="button"
              class="btn btn-success btn-sm action-btn"
              :disabled="!draftName.trim()"
              @click="commitRename(deck)"
            >
              ✓
            </button>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary action-btn"
              @click="cancelRename"
            >
              ×
            </button>
          </template>
          <template v-else>
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary action-btn"
              :title="t('packDeckRename')"
              @click="startRename(deck)"
            >
              ✎
            </button>
            <button
              type="button"
              class="btn btn-danger btn-sm action-btn"
              :class="{ 'is-confirming': pendingId === deck.id }"
              :title="t('packDeckDelete')"
              @click="onDelete(deck.id)"
            >
              {{ pendingId === deck.id ? t("formatsDeleteConfirm") : "🗑" }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { useSavedDecks } from "../composables/useSavedDecks";
import { getHero } from "../gameDecks";

const { t } = useDraftState();
const { savedDecks, deleteDeck, renameDeck } = useSavedDecks();

// Нові колоди зверху.
const decks = computed(() => [...savedDecks.value].reverse());
const heroOf = (deck) => getHero(deck.heroId);

const editingId = ref(null);
const draftName = ref("");
const pendingId = ref(null);
let pendingTimer = null;

function startRename(deck) {
  editingId.value = deck.id;
  draftName.value = deck.name;
}

function cancelRename() {
  editingId.value = null;
  draftName.value = "";
}

function commitRename(deck) {
  if (!draftName.value.trim()) return;
  renameDeck(deck.id, draftName.value);
  cancelRename();
}

function onDelete(id) {
  if (pendingId.value !== id) {
    pendingId.value = id;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => (pendingId.value = null), 3000);
    return;
  }
  clearTimeout(pendingTimer);
  pendingId.value = null;
  deleteDeck(id);
}
</script>

<style scoped>
.saved-decks {
  margin-top: 18px;
}

.saved-decks-title {
  margin: 0 0 10px;
  color: var(--text-white);
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.saved-decks-empty {
  margin: 0;
  color: var(--text-dim);
  font-size: 13px;
}

.saved-decks-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}

.saved-deck {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 10px;
}

.saved-deck-img {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
}

.saved-deck-info {
  flex: 1 1 auto;
  min-width: 0;
}

.saved-deck-name {
  overflow: hidden;
  color: var(--text-white);
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.saved-deck-meta {
  color: var(--text-dim);
  font-size: 12px;
}

.saved-deck-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
}
</style>
