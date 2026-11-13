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
      <div class="bot-editor-style">
        <span class="bot-editor-label">{{ t("botEdStyle") }}</span>
        <div class="bot-editor-segment">
          <button
            v-for="(style, index) in styles"
            :key="style"
            class="bot-editor-pill"
            :class="{ active: heroValue('style') === style }"
            @click="setHeroValue('style', style)"
          >
            {{ styleNames[index] }}
          </button>
        </div>
        <span class="bot-editor-muted">{{ styleHint }}</span>
      </div>
      <div class="bot-editor-sliders">
        <div
          v-for="control in heroControls"
          :key="control.key"
          class="bot-editor-row"
          :class="{ changed: heroChanged(control.key) }"
          :title="t(control.name + 'Hint')"
        >
          <div class="bot-editor-rowhead">
            <span>{{ t(control.name) }}</span>
            <b>{{ heroValue(control.key) }}</b>
            <button
              v-if="heroChanged(control.key)"
              class="bot-editor-undo"
              :title="t('botEdResetOne')"
              @click="resetHeroValue(control.key)"
            >
              ↺
            </button>
          </div>
          <input
            type="range"
            :min="control.min"
            :max="control.max"
            :step="control.step"
            :value="heroValue(control.key)"
            @input="setHeroValue(control.key, Number($event.target.value))"
          />
          <div class="bot-editor-ends">
            <span>{{ t(control.name + "Left") }}</span>
            <span>{{ t(control.name + "Right") }}</span>
          </div>
          <span class="bot-editor-muted">{{ t(control.name + "Hint") }}</span>
        </div>
      </div>
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
          v-for="control in controlsFor(card)"
          :key="control.key"
          class="bot-editor-row"
          :class="{ changed: cardChanged(card, control.key) }"
          :title="t(control.name + 'Hint')"
        >
          <div class="bot-editor-rowhead">
            <span>{{ t(control.name) }}</span>
            <b>{{ cardValue(card, control.key) }}</b>
            <button
              v-if="cardChanged(card, control.key)"
              class="bot-editor-undo"
              :title="t('botEdResetOne')"
              @click="resetCardValue(card, control.key)"
            >
              ↺
            </button>
          </div>
          <label class="bot-editor-field bot-editor-score">
            <input
              type="range"
              min="0"
              max="10"
              :value="cardValue(card, control.key)"
              @input="
                setCardValue(card, control.key, Number($event.target.value))
              "
            />
          </label>
          <div class="bot-editor-ends">
            <span>{{ t(control.name + "Left") }}</span>
            <span>{{ t(control.name + "Right") }}</span>
          </div>
        </div>
        <button
          v-if="cardTouched(card)"
          class="btn btn-sm btn-outline-warning"
          @click="resetCard(card)"
        >
          {{ t("botEdResetCard") }}
        </button>
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
  cardDefaults,
  cardId,
  kidDefaults,
  loadBotData,
  typeDefaults,
} from "../../botData";
import { buildAllCards, packDraftHeroes } from "../../packDraftData";
import { BOT_STYLES } from "../../botStyles";
import { botProfiles } from "../../botProfiles";

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

const importanceOf = (card) => cardValue(card, "importance");
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

const styles = Object.values(BOT_STYLES);
const styleNames = computed(() => t("botEdStyleNames").split("|"));
const styleHint = computed(() =>
  t(
    "botEdStyle" +
      heroValue("style").charAt(0).toUpperCase() +
      heroValue("style").slice(1),
  ),
);

const heroDefaults = {
  style: BOT_STYLES.NEUTRAL,
  aggro: 1,
  heroFocus: 6,
  kidFear: 0.5,
  boostHand: 3,
  refill: 4,
  fatigue: 1,
};

const heroControls = [
  { key: "aggro", name: "botEdAggro", min: 0.5, max: 2, step: 0.1 },
  { key: "heroFocus", name: "botEdHeroFocus", min: 0, max: 10, step: 1 },
  { key: "kidFear", name: "botEdKidFear", min: 0, max: 2, step: 0.1 },
  { key: "boostHand", name: "botEdBoostHand", min: 1, max: 7, step: 1 },
  { key: "refill", name: "botEdRefill", min: 0, max: 6, step: 1 },
  { key: "fatigue", name: "botEdFatigue", min: 0, max: 2, step: 0.1 },
];

const heroBase = (key) => botProfiles[heroId.value]?.[key] ?? heroDefaults[key];
const heroValue = (key) => heroSettings.value[key] ?? heroBase(key);
const heroChanged = (key) => heroSettings.value[key] !== undefined;

function setHeroValue(key, value) {
  const next = { ...(data.heroes[heroId.value] || {}) };
  if (value === heroBase(key)) delete next[key];
  else next[key] = value;
  commitHero(next);
}

function resetHeroValue(key) {
  const next = { ...(data.heroes[heroId.value] || {}) };
  delete next[key];
  commitHero(next);
}

function setHero(name, value) {
  const next = { ...(data.heroes[heroId.value] || {}), [name]: value };
  if (!next.notes) delete next.notes;
  commitHero(next);
}

function commitHero(next) {
  if (Object.keys(next).length) data.heroes[heroId.value] = next;
  else delete data.heroes[heroId.value];
}

const cardControlList = [
  { key: "importance", name: "botEdCardImportance" },
  { key: "lean", name: "botEdLean", only: "versatile" },
  { key: "timing", name: "botEdTiming" },
  { key: "cancelCare", name: "botEdCancelCare" },
  { key: "who", name: "botEdWho" },
  { key: "boostWill", name: "botEdBoostWill" },
];

const controlsFor = (card) =>
  cardControlList.filter((item) => !item.only || item.only === card.type);

const cardBase = (card, key) =>
  key === "importance"
    ? (data.types[card.type] ?? typeDefaults[card.type] ?? 5)
    : cardDefaults[key];
const cardValue = (card, key) =>
  data.cards[cardId(card)]?.[key] ?? cardBase(card, key);
const cardChanged = (card, key) =>
  data.cards[cardId(card)]?.[key] !== undefined;
const cardTouched = (card) => Boolean(data.cards[cardId(card)]);

function setCardValue(card, key, value) {
  const id = cardId(card);
  const next = { ...(data.cards[id] || {}) };
  if (value === cardBase(card, key)) delete next[key];
  else next[key] = value;
  if (Object.keys(next).length) data.cards[id] = next;
  else delete data.cards[id];
}

function resetCardValue(card, key) {
  const id = cardId(card);
  const next = { ...(data.cards[id] || {}) };
  delete next[key];
  if (Object.keys(next).length) data.cards[id] = next;
  else delete data.cards[id];
}

function resetCard(card) {
  delete data.cards[cardId(card)];
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
.bot-editor-style {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bot-editor-segment {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bot-editor-pill {
  padding: 5px 16px;
  border: 2px solid var(--border-light);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-light);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.bot-editor-pill.active {
  border-color: var(--color-info);
  background: rgba(var(--color-info-rgb), 0.25);
}

.bot-editor-sliders {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px 24px;
}

.bot-editor-row {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 10px;
  border-left: 3px solid transparent;
}

.bot-editor-row.changed {
  border-left-color: #f6c945;
}

.bot-editor-rowhead {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
}

.bot-editor-rowhead b {
  margin-left: auto;
  color: var(--color-info);
}

.bot-editor-undo {
  padding: 0 4px;
  border: 0;
  background: none;
  color: #f6c945;
  font-size: 15px;
  cursor: pointer;
}

.bot-editor-row input[type="range"] {
  width: 100%;
}

.bot-editor-ends {
  display: flex;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 11px;
}
</style>
