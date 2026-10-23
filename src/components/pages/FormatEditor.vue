<template>
  <div class="format-editor container">
    <router-link :to="{ name: 'formats' }" class="editor-back">
      ← {{ t("formatBack") }}
    </router-link>

    <p v-if="notFound" class="editor-hint is-error">
      {{ t("formatNotFound") }}
    </p>

    <template v-else>
      <h1 class="page-main-title">
        {{ id ? t("formatEditorEdit") : t("formatEditorNew") }}
      </h1>

      <div class="editor-steps">
        <span
          class="editor-step"
          :class="{ active: draft.step === 1, done: draft.step > 1 }"
        >
          {{ t("formatStepHeroes") }}
        </span>
        <span class="editor-step" :class="{ active: draft.step === 2 }">
          {{ t("formatStepMaps") }}
        </span>
      </div>

      <!-- Крок 1: назва, схема банів, герої -->
      <section v-if="draft.step === 1">
        <div class="editor-fields">
          <div class="editor-field">
            <label class="editor-label" for="format-name">
              {{ t("formatNameLabel") }}
            </label>
            <input
              id="format-name"
              v-model="draft.name"
              class="form-control form-control-sm search-field"
              maxlength="40"
              :placeholder="t('formatNamePlaceholder')"
            />
          </div>

          <div class="editor-field">
            <label class="editor-label" for="format-preset">
              {{ t("formatBanPresetLabel") }}
            </label>
            <div class="custom-select-wrapper">
              <select id="format-preset" v-model="draft.banPreset">
                <option
                  v-for="(preset, key) in banPresets"
                  :key="key"
                  :value="key"
                >
                  {{ preset.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div class="editor-label">{{ t("formatHeroesLabel") }}</div>

        <div class="editor-toolbar">
          <input
            v-model="heroSearch"
            class="form-control form-control-sm search-field"
            :placeholder="t('searchPlaceholder')"
          />
          <button
            class="btn btn-primary btn-sm action-btn"
            @click="selectAllHeroes"
          >
            {{ t("formatSelectAll") }}
          </button>
          <button
            class="btn btn-danger btn-sm action-btn"
            @click="draft.heroIds.clear()"
          >
            {{ t("formatClearAll") }}
          </button>
        </div>

        <div class="editor-counter" :class="{ 'is-ok': enoughHeroes }">
          {{ t("formatSelectedCount") }}: {{ draft.heroIds.size }} /
          {{ requiredHeroes }}+
        </div>

        <div class="tile-grid hero-grid">
          <div
            v-for="char in shownCharacters"
            :key="char.id"
            class="pick-tile"
            :class="{ selected: draft.heroIds.has(char.id) }"
            :title="char.name"
            @click="toggleId(draft.heroIds, char.id)"
          >
            <img :src="char.image" :alt="char.name" loading="lazy" />
            <span v-if="draft.heroIds.has(char.id)" class="tile-check">✓</span>
            <span class="tile-name">{{ char.name }}</span>
          </div>
        </div>
      </section>

      <!-- Крок 2: мапи -->
      <section v-else>
        <div class="editor-label">{{ t("formatMapsLabel") }}</div>

        <div class="editor-toolbar">
          <input
            v-model="mapSearch"
            class="form-control form-control-sm search-field"
            :placeholder="t('searchMapPlaceholder')"
          />
          <button
            class="btn btn-primary btn-sm action-btn"
            @click="selectAllMaps"
          >
            {{ t("formatSelectAll") }}
          </button>
          <button
            class="btn btn-danger btn-sm action-btn"
            @click="draft.mapIds.clear()"
          >
            {{ t("formatClearAll") }}
          </button>
        </div>

        <div class="editor-counter" :class="{ 'is-ok': enoughMaps }">
          {{ t("formatSelectedCount") }}: {{ draft.mapIds.size }} /
          {{ maps.length }}
        </div>

        <div class="tile-grid map-grid">
          <div
            v-for="map in shownMaps"
            :key="map.id"
            class="pick-tile map-tile"
            :class="{ selected: draft.mapIds.has(map.id) }"
            :title="map.name"
            @click="toggleId(draft.mapIds, map.id)"
          >
            <img :src="map.image" :alt="map.name" loading="lazy" />
            <span v-if="draft.mapIds.has(map.id)" class="tile-check">✓</span>
            <span class="tile-name">{{ map.name }}</span>
          </div>
        </div>
      </section>

      <div class="editor-footer">
        <div v-if="draft.step === 1 && !nameValid" class="editor-hint">
          {{ t("formatNeedName") }}
        </div>
        <div v-else-if="draft.step === 1 && !enoughHeroes" class="editor-hint">
          {{ t("formatNeedHeroes") }} {{ requiredHeroes }}
        </div>
        <div v-else-if="draft.step === 2 && !enoughMaps" class="editor-hint">
          {{ t("formatNeedMaps") }}
        </div>

        <template v-if="draft.step === 1">
          <button
            class="btn btn-success btn-sm action-btn"
            :disabled="!canGoNext"
            @click="goNext"
          >
            {{ t("formatNext") }} →
          </button>
        </template>
        <template v-else>
          <button class="btn btn-primary btn-sm action-btn" @click="goBack">
            ← {{ t("formatBackStep") }}
          </button>
          <button
            class="btn btn-success btn-sm action-btn"
            :disabled="!canSave"
            @click="save"
          >
            {{ t("formatSave") }}
          </button>
        </template>
      </div>
    </template>

    <!-- Попередження про втрату даних при виході зі сторінки -->
    <div v-if="showLeaveDialog" class="modal d-block leave-modal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold text-white">
              ⚠️ {{ t("formatLeaveTitle") }}
            </h5>
          </div>
          <div class="modal-body">
            <p class="mb-0 modal-body-text">{{ t("formatLeaveDesc") }}</p>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-dark fw-semibold btn-modal-cancel"
              @click="answerLeave(false)"
            >
              {{ t("formatLeaveStay") }}
            </button>
            <button
              type="button"
              class="btn btn-danger fw-bold btn-modal-confirm"
              @click="answerLeave(true)"
            >
              {{ t("formatLeaveConfirm") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import { useDraftState } from "../../composables/useDraftState.js";
import { useFormatDraft } from "../../composables/useFormatDraft.js";
import { banPresets, getRequiredHeroCount } from "../../draftFormats.js";

const props = defineProps({
  // id приходить з маршруту /formats/:id; для /formats/new його немає
  id: {
    type: String,
    default: null,
  },
});

const router = useRouter();
const { t, characters, maps, getCustomFormat, saveCustomFormat } =
  useDraftState();
const { draft, isDirty, startDraft, clearDraft } = useFormatDraft();

const existing = props.id ? getCustomFormat(props.id) : null;
const notFound = Boolean(props.id) && !existing;

// Завжди починаємо з чистої (або завантаженої з існуючого формату) чернетки
startDraft(
  existing,
  maps.value.map((m) => m.id),
);

const heroSearch = ref("");
const mapSearch = ref("");

const sortedCharacters = computed(() =>
  [...characters.value].sort((a, b) => a.name.localeCompare(b.name)),
);
const sortedMaps = computed(() =>
  [...maps.value].sort((a, b) => a.name.localeCompare(b.name)),
);

function filterByName(list, query) {
  const q = query.toLowerCase().trim();
  if (!q) return list;
  return list.filter((item) => item.name.toLowerCase().includes(q));
}

const shownCharacters = computed(() =>
  filterByName(sortedCharacters.value, heroSearch.value),
);
const shownMaps = computed(() =>
  filterByName(sortedMaps.value, mapSearch.value),
);

const requiredHeroes = computed(() => getRequiredHeroCount(draft.banPreset));
const nameValid = computed(() => draft.name.trim().length > 0);
const enoughHeroes = computed(() => draft.heroIds.size >= requiredHeroes.value);
const enoughMaps = computed(() => draft.mapIds.size >= 1);
const canGoNext = computed(() => nameValid.value && enoughHeroes.value);
const canSave = computed(() => canGoNext.value && enoughMaps.value);

function toggleId(set, itemId) {
  if (set.has(itemId)) set.delete(itemId);
  else set.add(itemId);
}

function selectAllHeroes() {
  for (const char of shownCharacters.value) draft.heroIds.add(char.id);
}

function selectAllMaps() {
  for (const map of shownMaps.value) draft.mapIds.add(map.id);
}

function goNext() {
  if (!canGoNext.value) return;
  draft.step = 2;
  window.scrollTo({ top: 0 });
}

function goBack() {
  draft.step = 1;
  window.scrollTo({ top: 0 });
}

function sortedIds(set) {
  return [...set].sort((a, b) => a - b);
}

function save() {
  if (!canSave.value) return;

  saveCustomFormat({
    id: draft.editingId || undefined,
    name: draft.name.trim(),
    banPreset: draft.banPreset,
    allowedHeroIds: sortedIds(draft.heroIds),
    allowedMapIds: sortedIds(draft.mapIds),
  });

  // Дані збережено у форматі — чернетку з памʼяті прибираємо
  clearDraft();
  router.push({ name: "formats" });
}

// --- Попередження при виході зі сторінки -----------------------------------

const showLeaveDialog = ref(false);
let leaveResolver = null;

function askLeave() {
  showLeaveDialog.value = true;
  return new Promise((resolve) => {
    leaveResolver = resolve;
  });
}

function answerLeave(confirmed) {
  showLeaveDialog.value = false;
  if (leaveResolver) leaveResolver(confirmed);
  leaveResolver = null;
}

// Перехід на іншу сторінку (меню, логотип, кнопка "назад" у браузері)
onBeforeRouteLeave(async () => {
  if (!isDirty.value) {
    clearDraft();
    return true;
  }

  const confirmed = await askLeave();
  if (confirmed) clearDraft();
  return confirmed;
});

// Оновлення сторінки або закриття вкладки
function onBeforeUnload(event) {
  if (!isDirty.value) return;
  event.preventDefault();
  event.returnValue = "";
}

onMounted(() => {
  window.addEventListener("beforeunload", onBeforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", onBeforeUnload);
  clearDraft();
});
</script>

<style scoped>
.format-editor {
  padding: 2rem 1rem;
}

.editor-back {
  display: inline-block;
  margin-bottom: 12px;
  color: var(--text-dim);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.editor-back:hover {
  color: var(--color-player);
}

.editor-steps {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0 20px;
}

.editor-step {
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.editor-step.active {
  background: rgba(var(--color-player-rgb), 0.12);
  border-color: rgba(var(--color-player-rgb), 0.6);
  color: var(--text-white);
}

.editor-step.done {
  border-color: rgba(var(--color-proceed-rgb), 0.5);
  color: var(--color-success-light);
}

.editor-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}

.editor-label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.editor-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.editor-toolbar .search-field {
  flex: 1 1 200px;
}

.editor-toolbar .action-btn {
  flex: 0 0 auto;
}

.editor-counter {
  margin-bottom: 10px;
  color: var(--color-warning);
  font-size: 13px;
  font-weight: 700;
}

.editor-counter.is-ok {
  color: var(--color-success-light);
}

.tile-grid {
  display: grid;
  gap: 10px;
}

.hero-grid {
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
}

.map-grid {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

/* Та сама підсвітка при наведенні, що й у .character на сторінці драфту */
.pick-tile {
  position: relative;
  height: 120px;
  overflow: hidden;
  cursor: pointer;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  filter: grayscale(0.7) opacity(0.6);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}

.map-tile {
  height: 96px;
}

.pick-tile:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(var(--color-neon-rgb), 0.75);
  box-shadow: 0 8px 20px var(--border-strong);
  filter: none;
}

/* Обраний елемент: така ж неонова рамка, як в активних героях на сторінці мап */
.pick-tile.selected {
  filter: none;
  border-color: rgba(var(--color-neon-rgb), 0.75);
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.4),
    0 0 12px rgba(var(--color-neon-rgb), 0.15);
}

.pick-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tile-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-proceed);
  border-radius: 50%;
  color: var(--text-white);
  font-size: 12px;
  font-weight: 900;
}

.tile-name {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14px 6px 5px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.85), transparent);
  color: var(--text-white);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  text-align: center;
}

.editor-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
  padding: 12px 0;
  background: linear-gradient(to top, var(--bg-main) 60%, transparent);
}

.editor-footer .action-btn {
  flex: 0 0 auto;
}

.editor-hint {
  margin-right: auto;
  color: var(--color-warning);
  font-size: 13px;
  font-weight: 700;
}

.editor-hint.is-error {
  color: var(--color-danger);
}

.leave-modal {
  z-index: 1300;
  background: rgba(4, 6, 11, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

@media (max-width: 640px) {
  .editor-fields {
    grid-template-columns: 1fr;
  }

  /* Кнопки блоку "Герої/Мапи у пулі" на всю ширину */
  .editor-toolbar .action-btn {
    flex: 1 1 100% !important;
  }

  .editor-footer {
    flex-wrap: wrap;
  }

  .editor-hint {
    flex: 1 1 100%;
  }

  .editor-footer .action-btn {
    flex: 1 1 0 !important;
  }
}
</style>
