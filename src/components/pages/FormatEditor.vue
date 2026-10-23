<template>
  <div class="container py-3 py-md-4 editor-page">
    <router-link :to="{ name: 'formats' }" class="editor-back">
      ← {{ t("formatBack") }}
    </router-link>

    <p v-if="notFound" class="editor-hint is-error">
      {{ t("formatNotFound") }}
    </p>

    <template v-else>
      <h4 class="fw-bold engine-title-text editor-title">
        {{ id ? t("formatEditorEdit") : t("formatEditorNew") }}
      </h4>

      <div class="editor-fields">
        <div class="editor-field">
          <label class="editor-label" for="format-name">
            {{ t("formatNameLabel") }}
          </label>
          <input
            id="format-name"
            v-model="name"
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
            <select id="format-preset" v-model="banPreset">
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
          v-model="search"
          class="form-control form-control-sm search-field"
          :placeholder="t('searchPlaceholder')"
        />
        <button class="btn btn-primary btn-sm" @click="selectAllShown">
          {{ t("formatSelectAll") }}
        </button>
        <button class="btn btn-dark btn-sm" @click="selected.clear()">
          {{ t("formatClearAll") }}
        </button>
      </div>

      <div class="editor-counter" :class="{ 'is-ok': enoughHeroes }">
        {{ t("formatSelectedCount") }}: {{ selected.size }} /
        {{ requiredHeroes }}+
      </div>

      <div class="hero-grid">
        <div
          v-for="char in shownCharacters"
          :key="char.id"
          class="hero-tile"
          :class="{ selected: selected.has(char.id) }"
          :title="char.name"
          @click="toggleHero(char.id)"
        >
          <img :src="char.image" :alt="char.name" loading="lazy" />
          <span v-if="selected.has(char.id)" class="hero-check">✓</span>
          <span class="hero-name">{{ char.name }}</span>
        </div>
      </div>

      <div class="editor-footer">
        <div class="editor-hint" v-if="!nameValid">
          {{ t("formatNeedName") }}
        </div>
        <div class="editor-hint" v-else-if="!enoughHeroes">
          {{ t("formatNeedHeroes") }} {{ requiredHeroes }}
        </div>

        <button
          class="btn btn-success fw-bold editor-save"
          :disabled="!canSave"
          @click="save"
        >
          {{ t("formatSave") }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDraftState } from "../../composables/useDraftState.js";
import {
  banPresets,
  DEFAULT_BAN_PRESET,
  getRequiredHeroCount,
} from "../../draftFormats.js";

const props = defineProps({
  // id приходить з маршруту /formats/:id; для /formats/new його немає
  id: {
    type: String,
    default: null,
  },
});

const router = useRouter();
const { t, characters, getCustomFormat, saveCustomFormat } = useDraftState();

const name = ref("");
const banPreset = ref(DEFAULT_BAN_PRESET);
const selected = ref(new Set());
const search = ref("");
const notFound = ref(false);

onMounted(() => {
  if (!props.id) return;

  const existing = getCustomFormat(props.id);
  if (!existing) {
    notFound.value = true;
    return;
  }

  name.value = existing.name;
  banPreset.value = existing.banPreset;
  selected.value = new Set(existing.allowedHeroIds);
});

const sortedCharacters = computed(() =>
  [...characters.value].sort((a, b) => a.name.localeCompare(b.name)),
);

const shownCharacters = computed(() => {
  const query = search.value.toLowerCase().trim();
  if (!query) return sortedCharacters.value;
  return sortedCharacters.value.filter((c) =>
    c.name.toLowerCase().includes(query),
  );
});

const requiredHeroes = computed(() => getRequiredHeroCount(banPreset.value));
const nameValid = computed(() => name.value.trim().length > 0);
const enoughHeroes = computed(
  () => selected.value.size >= requiredHeroes.value,
);
const canSave = computed(() => nameValid.value && enoughHeroes.value);

function toggleHero(heroId) {
  if (selected.value.has(heroId)) selected.value.delete(heroId);
  else selected.value.add(heroId);
}

function selectAllShown() {
  for (const char of shownCharacters.value) selected.value.add(char.id);
}

function save() {
  if (!canSave.value) return;

  saveCustomFormat({
    id: props.id || undefined,
    name: name.value.trim(),
    banPreset: banPreset.value,
    allowedHeroIds: [...selected.value].sort((a, b) => a - b),
  });

  router.push({ name: "formats" });
}
</script>

<style scoped>
.editor-page {
  max-width: 980px;
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

.editor-title {
  margin-bottom: 16px;
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
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
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

.editor-counter {
  margin-bottom: 10px;
  color: var(--color-warning);
  font-size: 13px;
  font-weight: 700;
}

.editor-counter.is-ok {
  color: var(--color-success-light);
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
}

.hero-tile {
  position: relative;
  height: 120px;
  overflow: hidden;
  cursor: pointer;
  background: var(--bg-card);
  border: 2px solid var(--border-medium);
  border-radius: 14px;
  filter: grayscale(0.7) opacity(0.6);
  transition:
    filter 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  user-select: none;
}

.hero-tile:hover {
  transform: translateY(-2px);
  filter: none;
}

.hero-tile.selected {
  filter: none;
  border-color: var(--color-proceed);
  box-shadow: 0 0 14px rgba(var(--color-proceed-rgb), 0.35);
}

.hero-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-check {
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

.hero-name {
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
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 18px;
  padding: 12px 0;
  background: linear-gradient(to top, var(--bg-main) 60%, transparent);
}

.editor-hint {
  color: var(--color-warning);
  font-size: 13px;
  font-weight: 700;
}

.editor-hint.is-error {
  color: var(--color-danger);
}

@media (max-width: 640px) {
  .editor-fields {
    grid-template-columns: 1fr;
  }
}
</style>
