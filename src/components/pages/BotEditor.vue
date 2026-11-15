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
      <button
        v-for="item in everyHero"
        :key="item.id"
        class="bot-editor-hero"
        :class="{ active: item.id === heroId, touched: touched(item.id) }"
        :title="item.name"
        @click="heroId = item.id"
      >
        <img :src="assetUrl(item.image)" :alt="item.name" />
        <span>{{ item.name }}</span>
      </button>
    </div>

    <section class="bot-editor-panel">
      <div class="bot-editor-herohead">
        <img :src="assetUrl(hero.image)" :alt="hero.name" />
        <b>{{ t("botEdHero") }}: {{ hero.name }}</b>
      </div>
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
      <b>{{ t("botEdCards") }} ({{ shownCards.length }}/{{ cards.length }})</b>
      <div class="bot-editor-bar">
        <button
          class="btn btn-sm"
          :class="typeFilter ? 'btn-outline-light' : 'btn-info'"
          @click="typeFilter = ''"
        >
          {{ t("botEdAll") }}
        </button>
        <button
          v-for="type in cardTypes"
          :key="type"
          class="btn btn-sm"
          :class="typeFilter === type ? 'btn-info' : 'btn-outline-light'"
          @click="typeFilter = type"
        >
          {{ type }}
        </button>
        <label class="bot-editor-check">
          <input v-model="sortByScore" type="checkbox" />
          {{ t("botEdSort") }}
        </label>
      </div>
      <div class="bot-editor-grid">
        <div
          v-for="card in shownCards"
          :key="card.key"
          class="bot-editor-tile"
          :style="{ '--score': importanceOf(card) / 10 }"
        >
          <div class="bot-editor-pic">
            <PackCard :card="card" />
            <span v-if="card.qty > 1" class="bot-editor-qty">
              ×{{ card.qty }}
            </span>
          </div>
          <div class="bot-editor-meter"><i></i></div>
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
            <input
              type="range"
              min="0"
              max="10"
              :value="cardValue(card, control.key)"
              @input="
                setCardValue(card, control.key, Number($event.target.value))
              "
            />
            <div class="bot-editor-ends">
              <span>{{ t(control.name + "Left") }}</span>
              <span>{{ t(control.name + "Right") }}</span>
            </div>
          </div>
          <div
            class="bot-editor-row bot-editor-uses"
            :class="{ changed: usesChanged(card) }"
          >
            <div class="bot-editor-rowhead">
              <span>{{ usesText.title }}</span>
              <button
                v-if="usesChanged(card)"
                class="bot-editor-undo"
                :title="t('botEdResetOne')"
                @click="resetUses(card)"
              >
                ↺
              </button>
            </div>
            <div class="bot-editor-chips">
              <button
                v-for="context in useContexts"
                :key="context"
                type="button"
                class="bot-editor-chip"
                :class="{ on: usesHas(card, context) }"
                @click="toggleUse(card, context)"
              >
                {{ usesText.names[context] }}
              </button>
            </div>
            <span class="bot-editor-muted">{{ usesText.hint }}</span>
          </div>
          <button
            v-if="cardTouched(card)"
            class="btn btn-sm btn-outline-warning"
            @click="resetCard(card)"
          >
            {{ t("botEdResetCard") }}
          </button>
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
  cardDefaults,
  cardId,
  kidDefaults,
  loadBotData,
  typeDefaults,
  useContexts,
} from "../../botData";
import { BOT_STYLES } from "../../botStyles";
import { botProfiles } from "../../botProfiles";
import {
  buildAllCards,
  buildCustomCards,
  everyHero,
} from "../../packDraftData";
import PackCard from "../PackCard.vue";

const { t, lang } = useDraftState();

const usesTexts = {
  en: {
    title: "Where the bot may play this card",
    hint: "Hard rule. Turn off a place and the bot never uses the card there.",
    names: {
      attack: "Attack",
      defense: "Defense",
      scheme: "Scheme",
      boostAttack: "Boost attack",
      boostDefense: "Boost defense",
      boostManeuver: "Boost maneuver",
    },
  },
  ua: {
    title: "Де бот може грати цю карту",
    hint: "Жорстке правило. Вимкніть місце — і бот ніколи не зіграє карту там.",
    names: {
      attack: "Атака",
      defense: "Захист",
      scheme: "Схема",
      boostAttack: "Буст атаки",
      boostDefense: "Буст захисту",
      boostManeuver: "Буст маневру",
    },
  },
};
const usesText = computed(() => usesTexts[lang.value] || usesTexts.en);

const types = Object.keys(typeDefaults);
const data = reactive(loadBotData());
const heroId = ref(everyHero[0].id);
const copied = ref(false);
const importText = ref("");
const importError = ref(false);

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
const hero = computed(() => everyHero.find((h) => h.id === heroId.value));
const heroSettings = computed(() => data.heroes[heroId.value] || {});
const kid = computed(() => ({
  ...kidDefaults,
  ...(data.sidekicks[heroId.value] || {}),
}));

const allCards = [...buildAllCards(), ...buildCustomCards()];
const cards = computed(() => {
  const seen = new Map();
  for (const card of allCards) {
    if (card.heroId !== heroId.value) continue;
    if (seen.has(card.key)) seen.get(card.key).qty += 1;
    else seen.set(card.key, { ...card, qty: 1 });
  }
  return [...seen.values()];
});

const typeFilter = ref("");
const sortByScore = ref(false);
const cardTypes = computed(() => [
  ...new Set(cards.value.map((card) => card.type).filter(Boolean)),
]);
const shownCards = computed(() => {
  const list = cards.value.filter(
    (card) => !typeFilter.value || card.type === typeFilter.value,
  );
  return sortByScore.value
    ? [...list].sort((a, b) => importanceOf(b) - importanceOf(a))
    : list;
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

const usesOf = (card) => data.cards[cardId(card)]?.uses;
const usesHas = (card, context) => {
  const uses = usesOf(card);
  return !uses || uses.includes(context);
};
const usesChanged = (card) => Array.isArray(usesOf(card));

function commitUses(card, uses) {
  const id = cardId(card);
  const next = { ...(data.cards[id] || {}) };
  if (uses.length === useContexts.length) delete next.uses;
  else next.uses = uses;
  if (Object.keys(next).length) data.cards[id] = next;
  else delete data.cards[id];
}

function toggleUse(card, context) {
  const now = usesOf(card) || useContexts;
  commitUses(
    card,
    useContexts.filter((item) =>
      item === context ? !now.includes(item) : now.includes(item),
    ),
  );
}

function resetUses(card) {
  commitUses(card, useContexts);
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
  if (data.lessons.length) out.lessons = [...data.lessons];
  return JSON.stringify(out, null, 2);
});

watch(heroId, () => (typeFilter.value = ""));

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
  data.lessons = [...(next.lessons || [])];
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
  gap: 10px;
}

.bot-editor-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 84px;
  padding: 6px;
  border: 2px solid var(--border-light);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-light);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s,
    border-color 0.15s;
}

.bot-editor-hero img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  object-position: top;
  border-radius: 50%;
}

.bot-editor-hero:hover {
  transform: translateY(-2px);
}

.bot-editor-hero.active {
  border-color: var(--color-info);
  background: rgba(var(--color-info-rgb), 0.15);
}

.bot-editor-hero.touched::after {
  content: "✎";
  position: absolute;
  top: 2px;
  right: 6px;
  color: #f6c945;
}

.bot-editor-herohead {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bot-editor-herohead img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  object-position: top;
  border-radius: 12px;
}

.bot-editor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}

.bot-editor-tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.bot-editor-pic {
  position: relative;
}

.bot-editor-qty {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.bot-editor-meter {
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.bot-editor-meter i {
  display: block;
  height: 100%;
  width: calc(var(--score) * 100%);
  background: hsl(calc(var(--score) * 120), 75%, 50%);
  transition: width 0.15s;
}

.bot-editor-tilebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bot-editor-tilebar input[type="range"] {
  flex: 1;
  min-width: 0;
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

.bot-editor-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 4px 0;
}

.bot-editor-chip {
  padding: 3px 10px;
  font-size: 0.78rem;
  color: #8a94a7;
  cursor: pointer;
  background: transparent;
  border: 1px solid #3a4560;
  border-radius: 999px;
}

.bot-editor-chip.on {
  color: #fff;
  background: rgba(79, 124, 255, 0.35);
  border-color: #4f7cff;
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
