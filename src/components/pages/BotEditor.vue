<template>
  <div class="bot-editor container">
    <h1 class="page-main-title">{{ t("botEdTitle") }}</h1>
    <p class="bot-editor-hint">{{ t("botEdHint") }}</p>

    <section class="bot-editor-panel">
      <b>{{ t("botEdTypes") }}</b>
      <div class="bot-editor-types">
        <label v-for="type in types" :key="type" class="bot-editor-field">
          {{ type }}
          <input
            type="range"
            min="0"
            max="10"
            :value="data.types[type] ?? typeDefaults[type]"
            @input="setType(type, Number($event.target.value))"
          />
          <b>{{ data.types[type] ?? typeDefaults[type] }}</b>
        </label>
      </div>
    </section>

    <div class="bot-editor-heroes">
      <span class="bot-editor-label">{{ t("botEdHeroes") }}</span>
      <button
        v-for="item in packDraftHeroes"
        :key="item.id"
        class="btn btn-sm"
        :class="item.id === heroId ? 'btn-info' : 'btn-outline-light'"
        @click="heroId = item.id"
      >
        {{ item.name }}{{ touched(item.id) ? " ✎" : "" }}
      </button>
    </div>

    <section class="bot-editor-panel">
      <b>{{ t("botEdHero") }}: {{ hero.name }}</b>
      <label class="bot-editor-field">
        {{ t("botEdAggro") }}
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          :value="heroSettings.aggro ?? 1"
          @input="setHero('aggro', Number($event.target.value))"
        />
        <b>{{ heroSettings.aggro ?? 1 }}</b>
        <span class="bot-editor-muted">{{ t("botEdAggroHint") }}</span>
      </label>
      <label class="bot-editor-field bot-editor-notes">
        {{ t("botEdNotes") }}
        <input
          type="text"
          class="form-control form-control-sm"
          :value="heroSettings.notes || ''"
          @input="setHero('notes', $event.target.value)"
        />
      </label>
    </section>

    <section class="bot-editor-panel">
      <b>{{ t("botEdSidekick") }}</b>
      <template v-if="hero.sidekick">
        <div class="bot-editor-kid">
          <img
            :src="assetUrl(hero.sidekick.image)"
            :alt="hero.sidekick.name"
            class="bot-editor-kid-img"
          />
          <div>
            {{ hero.sidekick.name }} · {{ hero.sidekick.hp }} HP ·
            {{ hero.sidekick.attack }}
            <span v-if="hero.sidekick.count"> ×{{ hero.sidekick.count }}</span>
          </div>
        </div>
        <label class="bot-editor-field">
          {{ t("botEdKidImportance") }}
          <input
            type="range"
            min="0"
            max="10"
            :value="kid.importance"
            @input="setKid('importance', Number($event.target.value))"
          />
          <b>{{ kid.importance }}</b>
          <span class="bot-editor-muted">{{
            t("botEdKidImportanceHint")
          }}</span>
        </label>
        <label class="bot-editor-field">
          {{ t("botEdKidBlock") }}
          <input
            type="range"
            min="0"
            max="10"
            :value="kid.block"
            @input="setKid('block', Number($event.target.value))"
          />
          <b>{{ kid.block }}</b>
          <span class="bot-editor-muted">{{ t("botEdKidBlockHint") }}</span>
        </label>
      </template>
      <p v-else class="bot-editor-muted">{{ t("botEdNoKid") }}</p>
    </section>

    <section class="bot-editor-panel">
      <b>{{ t("botEdCards") }} ({{ cards.length }})</b>
      <div class="bot-editor-table">
        <div
          v-for="card in cards"
          :key="card.key"
          class="bot-editor-row"
          :class="'type-' + card.type"
        >
          <div class="bot-editor-card">
            <b>{{ card.name }}</b>
            <span class="bot-editor-badge">{{ card.type }}</span>
            <span class="bot-editor-muted">
              {{ card.value ?? "-" }}/{{ card.boost ?? "-" }} ×{{ card.qty }}
            </span>
            <div class="bot-editor-text" :title="card.text.en">
              {{ card.text.en }}
            </div>
          </div>
          <label class="bot-editor-field bot-editor-score">
            <input
              type="range"
              min="0"
              max="10"
              :value="importanceOf(card)"
              @input="setCard(card, 'importance', Number($event.target.value))"
            />
            <b>{{ importanceOf(card) }}</b>
          </label>
          <label class="bot-editor-check" :title="t('botEdHoldHint')">
            <input
              type="checkbox"
              :checked="flag(card, 'hold')"
              @change="setCard(card, 'hold', $event.target.checked)"
            />
            {{ t("botEdHold") }}
          </label>
          <label class="bot-editor-check" :title="t('botEdFodderHint')">
            <input
              type="checkbox"
              :checked="flag(card, 'fodder')"
              @change="setCard(card, 'fodder', $event.target.checked)"
            />
            {{ t("botEdFodder") }}
          </label>
        </div>
      </div>
    </section>

    <section class="bot-editor-panel">
      <b>{{ t("botEdExport") }}</b>
      <textarea class="form-control bot-editor-json" readonly :value="json" />
      <div class="bot-editor-bar">
        <button class="btn btn-sm btn-info" @click="copy">
          {{ copied ? t("botEdCopied") : t("botEdCopy") }}
        </button>
        <button class="btn btn-sm btn-outline-light" @click="download">
          {{ t("botEdDownload") }}
        </button>
        <button class="btn btn-sm btn-outline-warning" @click="resetHero">
          {{ t("botEdResetHero") }}
        </button>
        <button class="btn btn-sm btn-outline-danger" @click="resetAll">
          {{ t("botEdResetAll") }}
        </button>
      </div>
      <b>{{ t("botEdImport") }}</b>
      <textarea
        v-model="importText"
        class="form-control bot-editor-json"
        :placeholder="t('botEdImportHint')"
      />
      <div class="bot-editor-bar">
        <button class="btn btn-sm btn-outline-light" @click="applyImport">
          {{ t("botEdApply") }}
        </button>
        <span v-if="importError" class="bot-editor-error">
          {{ t("botEdBadJson") }}
        </span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import {
  BOT_DATA_KEY,
  cardId,
  kidDefaults,
  loadBotData,
  typeDefaults,
} from "../../botData";
import { buildAllCards, packDraftHeroes } from "../../packDraftData";

const { t } = useDraftState();

const types = Object.keys(typeDefaults);
const data = reactive(loadBotData());
const heroId = ref(packDraftHeroes[0].id);
const copied = ref(false);
const importText = ref("");
const importError = ref(false);

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
const hero = computed(() => packDraftHeroes.find((h) => h.id === heroId.value));
const heroSettings = computed(() => data.heroes[heroId.value] || {});
const kid = computed(() => ({
  ...kidDefaults,
  ...(data.sidekicks[heroId.value] || {}),
}));

const allCards = buildAllCards();
const cards = computed(() => {
  const seen = new Map();
  for (const card of allCards) {
    if (card.heroId !== heroId.value) continue;
    if (seen.has(card.key)) seen.get(card.key).qty += 1;
    else seen.set(card.key, { ...card, qty: 1 });
  }
  return [...seen.values()];
});

const importanceOf = (card) =>
  data.cards[cardId(card)]?.importance ??
  data.types[card.type] ??
  typeDefaults[card.type] ??
  5;
const flag = (card, name) => Boolean(data.cards[cardId(card)]?.[name]);
const touched = (id) =>
  Boolean(
    data.heroes[id] ||
    data.sidekicks[id] ||
    Object.keys(data.cards).some((key) => key.startsWith(`${id}:`)),
  );

function setType(type, value) {
  if (value === typeDefaults[type]) delete data.types[type];
  else data.types[type] = value;
}

function setHero(name, value) {
  const next = { ...(data.heroes[heroId.value] || {}), [name]: value };
  if (next.aggro === 1) delete next.aggro;
  if (!next.notes) delete next.notes;
  if (Object.keys(next).length) data.heroes[heroId.value] = next;
  else delete data.heroes[heroId.value];
}

function setKid(name, value) {
  const next = { ...kid.value, [name]: value };
  if (
    next.importance === kidDefaults.importance &&
    next.block === kidDefaults.block
  ) {
    delete data.sidekicks[heroId.value];
  } else {
    data.sidekicks[heroId.value] = next;
  }
}

function setCard(card, name, value) {
  const id = cardId(card);
  const next = { ...(data.cards[id] || {}), [name]: value };
  const base = data.types[card.type] ?? typeDefaults[card.type] ?? 5;
  if (next.importance === base) delete next.importance;
  if (!next.hold) delete next.hold;
  if (!next.fodder) delete next.fodder;
  if (Object.keys(next).length) data.cards[id] = next;
  else delete data.cards[id];
}

const json = computed(() => {
  const out = { version: 1 };
  if (Object.keys(data.types).length) out.types = { ...data.types };
  for (const key of ["cards", "sidekicks", "heroes"]) {
    if (Object.keys(data[key]).length) out[key] = { ...data[key] };
  }
  return JSON.stringify(out, null, 2);
});

watch(
  json,
  (value) => {
    try {
      localStorage.setItem(BOT_DATA_KEY, value);
    } catch {
      copied.value = false;
    }
  },
  { immediate: true },
);

function replaceAll(next) {
  data.types = { ...(next.types || {}) };
  data.cards = { ...(next.cards || {}) };
  data.sidekicks = { ...(next.sidekicks || {}) };
  data.heroes = { ...(next.heroes || {}) };
}

function resetAll() {
  replaceAll({});
}

function resetHero() {
  const id = heroId.value;
  delete data.heroes[id];
  delete data.sidekicks[id];
  for (const key of Object.keys(data.cards)) {
    if (key.startsWith(`${id}:`)) delete data.cards[key];
  }
}

function applyImport() {
  try {
    const parsed = JSON.parse(importText.value);
    if (!parsed || typeof parsed !== "object") throw new Error("bad");
    replaceAll(parsed);
    importError.value = false;
    importText.value = "";
  } catch {
    importError.value = true;
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(json.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    copied.value = false;
  }
}

function download() {
  const blob = new Blob([json.value], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "botData.json";
  link.click();
  URL.revokeObjectURL(link.href);
}
</script>

<style scoped>
.bot-editor {
  padding-bottom: 40px;
}

.bot-editor-hint,
.bot-editor-muted {
  color: var(--text-muted);
  font-size: 13px;
}

.bot-editor-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 14px 0;
  padding: 14px;
  border: 1px solid var(--border-medium);
  border-radius: 12px;
}

.bot-editor-heroes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.bot-editor-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.bot-editor-types {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.bot-editor-field {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: var(--text-light);
}

.bot-editor-notes input {
  max-width: 420px;
}

.bot-editor-kid {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bot-editor-kid-img {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 8px;
}

.bot-editor-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bot-editor-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px 80px 80px;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
}

.bot-editor-card {
  min-width: 0;
}

.bot-editor-badge {
  margin: 0 8px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--border-medium);
  font-size: 11px;
  text-transform: uppercase;
}

.bot-editor-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: 12px;
}

.bot-editor-score {
  flex-wrap: nowrap;
}

.bot-editor-check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.bot-editor-json {
  min-height: 140px;
  font-family: monospace;
  font-size: 12px;
}

.bot-editor-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.bot-editor-error {
  color: #ff6b6b;
  font-size: 13px;
}

@media (max-width: 720px) {
  .bot-editor-row {
    grid-template-columns: 1fr;
  }
}
</style>
