<template>
  <div class="matchup-page container">
    <h1 class="page-main-title">{{ t("matchupsTitle") }}</h1>
    <p class="page-subtitle">{{ t("matchupsDesc") }}</p>

    <div class="generator-panel">
      <div class="generator-actions">
        <button class="btn-generate" @click="generateBalancedMatchup">
          🎲 {{ t("matchupGenerateBtn") }}
        </button>
        <button class="btn-collection-toggle" @click="collectionToggle">
          {{
            showCollectionOptions
              ? t("matchupHideCollection")
              : t("matchupUseCollection")
          }}
        </button>
      </div>

      <p v-if="generatorNote" class="generator-note">{{ generatorNote }}</p>

      <div v-if="showCollectionOptions" class="collection-panel">
        <div class="collection-checkbox-row">
          <label class="collection-checkbox-label">
            <input type="checkbox" v-model="useMyCollection" />
            {{ t("matchupUseOnlyOwned") }}
          </label>
          <button class="btn-reset-filter" @click="resetCollectionFilter">
            {{ t("matchupResetFilter") }}
          </button>
        </div>
        <p class="collection-hint">{{ t("matchupCollectionHint") }}</p>

        <div class="collection-block">
          <div class="collection-block-title">
            {{ t("matchupOwnedSets") }}
          </div>
          <div class="collection-sets-list">
            <label
              v-for="setName in allMapSets"
              :key="setName"
              class="collection-set-item"
            >
              <input
                type="checkbox"
                :checked="ownedMapSets.includes(setName)"
                @change="toggleOwnedMapSet(setName)"
              />
              {{ setName }}
            </label>
          </div>
        </div>

        <div class="collection-block">
          <div class="collection-block-title">
            {{ t("matchupOwnedCharacters") }}
          </div>
          <div class="collection-chars-grid scroll">
            <div
              v-for="char in getAllCharacters()"
              :key="char.id"
              class="collection-char-item"
              :class="{ 'is-owned': ownedCharIds.includes(char.id) }"
              :title="char.name"
              @click="toggleOwnedChar(char.id)"
            >
              <img :src="char.image" :alt="char.name" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="vs-picker">
      <div class="vs-col">
        <div
          class="team-title-banner"
          :style="{ backgroundColor: player.color }"
        >
          {{ t("teamYou") }}
        </div>
        <div
          class="vs-slot"
          :class="{ 'is-filled': charA }"
          @click="openPicker('a')"
        >
          <template v-if="charA">
            <button class="vs-slot-clear" @click.stop="clearSlot('a')">
              ✕
            </button>
            <img :src="charA.image" class="vs-slot-img" />
            <div class="vs-slot-name">{{ charA.name }}</div>
            <div v-if="charB" class="vs-slot-badge">
              <span
                class="vs-slot-percent"
                :class="
                  winrateA === null ? 'unknown' : getPercentClass(winrateA)
                "
              >
                {{ winrateA === null ? "?" : winrateA + "%" }}
              </span>
              <span class="vs-slot-type" v-if="winrateA !== null">{{
                matchupTypeTextA
              }}</span>
            </div>
          </template>
          <template v-else>
            <div class="vs-slot-plus">+</div>
          </template>
        </div>
      </div>

      <div class="vs-divider">VS</div>

      <div class="vs-col">
        <div
          class="team-title-banner"
          :style="{ backgroundColor: opponent.color }"
        >
          {{ t("teamOpponent") }}
        </div>
        <div
          class="vs-slot"
          :class="{ 'is-filled': charB }"
          @click="openPicker('b')"
        >
          <template v-if="charB">
            <button class="vs-slot-clear" @click.stop="clearSlot('b')">
              ✕
            </button>
            <img :src="charB.image" class="vs-slot-img" />
            <div class="vs-slot-name">{{ charB.name }}</div>
            <div v-if="charA" class="vs-slot-badge">
              <span
                class="vs-slot-percent"
                :class="
                  winrateB === null ? 'unknown' : getPercentClass(winrateB)
                "
              >
                {{ winrateB === null ? "?" : winrateB + "%" }}
              </span>
              <span class="vs-slot-type" v-if="winrateB !== null">{{
                matchupTypeTextB
              }}</span>
            </div>
          </template>
          <template v-else>
            <div class="vs-slot-plus">+</div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="charA && charB" class="matchup-maps-section">
      <div class="matchup-maps-group">
        <h6 class="matchup-maps-title balanced">
          {{ t("matchupBalancedMaps") }}
        </h6>
        <div v-if="balancedMaps.length" class="mini-maps-grid">
          <MapCard
            v-for="map in balancedMaps"
            :key="map.id"
            :map="map"
            :categories="['good', 'neutral', 'bad']"
            :heroes-filter="[charA.name, charB.name]"
            :is-preview="true"
            compact
          />
        </div>
        <p v-else class="no-maps-text">{{ t("matchupNoBalancedMaps") }}</p>
      </div>

      <div v-if="goodMaps.length" class="matchup-maps-group">
        <h6 class="matchup-maps-title good">
          {{ t("mapSuitableFor") }} {{ charA.name }}
        </h6>
        <div class="mini-maps-grid">
          <MapCard
            v-for="map in goodMaps"
            :key="map.id"
            :map="map"
            :categories="['good', 'bad']"
            :heroes-filter="[charA.name, charB.name]"
            :is-preview="true"
            compact
          />
        </div>
      </div>

      <div v-if="badMaps.length" class="matchup-maps-group">
        <h6 class="matchup-maps-title bad">
          {{ t("mapUnsuitableFor") }} {{ charA.name }}
        </h6>
        <div class="mini-maps-grid">
          <MapCard
            v-for="map in badMaps"
            :key="map.id"
            :map="map"
            :categories="['good', 'bad']"
            :heroes-filter="[charA.name, charB.name]"
            :is-preview="true"
            compact
          />
        </div>
      </div>
    </div>

    <div
      v-if="pickerOpen"
      class="char-picker-overlay"
      @click.self="closePicker"
    >
      <div class="char-picker-modal">
        <div class="char-picker-header">
          <input
            v-model="pickerSearch"
            type="text"
            class="form-control form-control-sm search-field"
            :placeholder="t('searchPlaceholder')"
          />
          <button class="char-picker-close" @click="closePicker">✕</button>
        </div>

        <div class="char-picker-grid scroll">
          <div
            v-for="char in pickerFilteredCharacters"
            :key="char.id"
            class="char-picker-item"
            :title="char.name"
            @click="selectCharacter(char)"
          >
            <img :src="char.image" :alt="char.name" loading="lazy" />
            <div v-if="pickerReferenceChar" class="char-picker-name">
              <span class="char-picker-versus">vs {{ char.name }}:</span>
              <span
                class="char-picker-percent"
                :class="
                  char.refWinrate === null
                    ? 'unknown'
                    : getPercentClass(char.refWinrate)
                "
              >
                {{ char.refWinrate === null ? "?" : char.refWinrate + "%" }}
              </span>
              <span class="char-picker-type" v-if="char.refWinrate !== null">{{
                t(`matchups.${getMatchupTypeByWinrate(char.refWinrate)}`)
              }}</span>
            </div>
          </div>

          <p v-if="!pickerFilteredCharacters.length" class="no-maps-text">
            {{ t("matchupNoCharactersFound") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useDraftState } from "../composables/useDraftState.js";
import Disclaimer from "./Disclaimer.vue";
import MapCard from "./MapCard.vue";

const {
  t,
  getAllCharacters,
  getWinrate,
  getPercentClass,
  getMatchupTypeByWinrate,
  getBestMapsForMatchup,
  player,
  opponent,
  maps,
} = useDraftState();

const charA = ref(null);
const charB = ref(null);

const pickerOpen = ref(false);
const pickerTarget = ref(null);
const pickerSearch = ref("");

const showCollectionOptions = ref(false);
const useMyCollection = ref(false);
const ownedCharIds = ref([]);
const ownedMapSets = ref([]);
const generatorNote = ref("");

const allMapSets = computed(() => {
  const sets = new Set();
  (maps.value || []).forEach((m) => {
    if (m.set) sets.add(m.set);
  });
  return [...sets].sort();
});

function toggleOwnedChar(id) {
  useMyCollection.value = true;
  const idx = ownedCharIds.value.indexOf(id);
  if (idx === -1) ownedCharIds.value.push(id);
  else ownedCharIds.value.splice(idx, 1);
}

// Ставимо/знімаємо галочку набору карт — і разом з нею вибираємо/знімаємо
// всіх персонажів цього ж сету (char.set === setName)
function toggleOwnedMapSet(setName) {
  useMyCollection.value = true;
  const idx = ownedMapSets.value.indexOf(setName);
  const charsInSet = getAllCharacters().filter((c) => c.set === setName);

  if (idx === -1) {
    ownedMapSets.value.push(setName);
    charsInSet.forEach((c) => {
      if (!ownedCharIds.value.includes(c.id)) {
        ownedCharIds.value.push(c.id);
      }
    });
  } else {
    ownedMapSets.value.splice(idx, 1);
    const idsInSet = charsInSet.map((c) => c.id);
    ownedCharIds.value = ownedCharIds.value.filter(
      (id) => !idsInSet.includes(id),
    );
  }
}

function scoreOnMapFor(map, name) {
  const favoredBy = map.favoredBy || [];
  const disfavoredBy = map.disfavoredBy || [];
  if (favoredBy.includes(name)) return 1;
  if (disfavoredBy.includes(name)) return -1;
  return 0;
}

// Мапи, рівні для обох: обом підходить (найкраще), обом нейтрально
// (середнє), обом не підходить (гірше). Змішані варіанти (один за, інший
// проти) — це вже не рівний матчап на карті, тому вони не пропонуються.
function pickBalancedMaps(nameA, nameB, pool) {
  const good = [];
  const neutral = [];
  const bad = [];

  for (const map of pool) {
    const sa = scoreOnMapFor(map, nameA);
    const sb = scoreOnMapFor(map, nameB);
    if (sa === 1 && sb === 1) good.push(map);
    else if (sa === 0 && sb === 0) neutral.push(map);
    else if (sa === -1 && sb === -1) bad.push(map);
  }

  if (good.length) return good;
  if (neutral.length) return neutral;
  return bad;
}

function generateBalancedMatchup() {
  generatorNote.value = "";
  const allChars = getAllCharacters();

  const pairs = [];

  if (useMyCollection.value && ownedCharIds.value.length === 1) {
    // Обраний лише один персонаж — шукаємо йому рівного суперника
    // серед усього ростеру, а не тільки серед "своїх"
    const fixedChar = allChars.find((c) => c.id === ownedCharIds.value[0]);
    if (fixedChar) {
      for (const b of allChars) {
        if (b.id === fixedChar.id) continue;
        const wr = getWinrate(fixedChar.name, b.name);
        if (wr !== null) {
          pairs.push({ a: fixedChar, b, diff: Math.abs(wr - 50) });
        }
      }
    }
  } else {
    let charPool = allChars;
    if (useMyCollection.value && ownedCharIds.value.length >= 2) {
      charPool = allChars.filter((c) => ownedCharIds.value.includes(c.id));
    }

    for (let i = 0; i < charPool.length; i++) {
      for (let j = i + 1; j < charPool.length; j++) {
        const a = charPool[i];
        const b = charPool[j];
        const wr = getWinrate(a.name, b.name);
        if (wr !== null) {
          pairs.push({ a, b, diff: Math.abs(wr - 50) });
        }
      }
    }
  }

  if (!pairs.length) {
    generatorNote.value = t("matchupGenNoData");
    return;
  }

  // Шукаємо максимально рівну пару, поступово розширюючи "коридор",
  // якщо у вузькому діапазоні нічого не знайшлось
  const bands = [3, 5, 8, 12, 20, 100];
  let candidates = [];
  for (const band of bands) {
    candidates = pairs.filter((p) => p.diff <= band);
    if (candidates.length) break;
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  charA.value = chosen.a;
  charB.value = chosen.b;

  if (!balancedMaps.value.length) {
    generatorNote.value = t("matchupGenNoMap");
  }
}

function openPicker(target) {
  pickerTarget.value = target;
  pickerSearch.value = "";
  pickerOpen.value = true;
}

function closePicker() {
  pickerOpen.value = false;
}

function clearSlot(target) {
  if (target === "a") charA.value = null;
  else charB.value = null;
}

function selectCharacter(char) {
  if (pickerTarget.value === "a") charA.value = char;
  else charB.value = char;
  closePicker();
}

// Персонаж, вже обраний у протилежному слоті — відносно нього
// показуємо статистику і сортуємо список у попапі
const pickerReferenceChar = computed(() => {
  if (pickerTarget.value === "a") return charB.value;
  if (pickerTarget.value === "b") return charA.value;
  return null;
});

const pickerFilteredCharacters = computed(() => {
  const excludeId =
    pickerTarget.value === "a" ? charB.value?.id : charA.value?.id;
  const query = pickerSearch.value.toLowerCase().trim();
  const reference = pickerReferenceChar.value;

  let list = getAllCharacters().filter((c) => {
    if (c.id === excludeId) return false;
    if (query && !c.name.toLowerCase().includes(query)) return false;
    return true;
  });

  if (reference) {
    list = list.map((c) => ({
      ...c,
      refWinrate: getWinrate(reference.name, c.name),
    }));

    list.sort((a, b) => {
      if (a.refWinrate === null && b.refWinrate === null) return 0;
      if (a.refWinrate === null) return 1;
      if (b.refWinrate === null) return -1;
      return b.refWinrate - a.refWinrate;
    });
  }

  return list;
});

const winrateA = computed(() => {
  if (!charA.value || !charB.value) return null;
  return getWinrate(charA.value.name, charB.value.name);
});

const winrateB = computed(() => {
  if (!charA.value || !charB.value) return null;
  return getWinrate(charB.value.name, charA.value.name);
});

const matchupTypeTextA = computed(() =>
  t(`matchups.${getMatchupTypeByWinrate(winrateA.value)}`),
);
const matchupTypeTextB = computed(() =>
  t(`matchups.${getMatchupTypeByWinrate(winrateB.value)}`),
);

// Мапи, рівні для обох обраних персонажів (з урахуванням обраних наборів,
// якщо увімкнено "лише мої набори")
const balancedMaps = computed(() => {
  if (!charA.value || !charB.value) return [];
  let mapPool = maps.value || [];
  if (useMyCollection.value && ownedMapSets.value.length) {
    mapPool = mapPool.filter((m) => ownedMapSets.value.includes(m.set));
  }
  return pickBalancedMaps(charA.value.name, charB.value.name, mapPool);
});

// Карти, де перевага у charA (favoredBy для нього і/або disfavoredBy для charB)
const goodMaps = computed(() => {
  if (!charA.value || !charB.value) return [];
  let result = getBestMapsForMatchup(charA.value.name, charB.value.name);
  if (useMyCollection.value && ownedMapSets.value.length) {
    result = result.filter((m) => ownedMapSets.value.includes(m.set));
  }
  return result;
});

// Карти, де перевага у charB — тобто погані для charA
const badMaps = computed(() => {
  if (!charA.value || !charB.value) return [];
  let result = getBestMapsForMatchup(charB.value.name, charA.value.name);
  if (useMyCollection.value && ownedMapSets.value.length) {
    result = result.filter((m) => ownedMapSets.value.includes(m.set));
  }
  return result;
});

function collectionToggle() {
  showCollectionOptions.value = !showCollectionOptions.value;
  useMyCollection.value = showCollectionOptions.value;
}

function resetCollectionFilter() {
  ownedCharIds.value = [];
  ownedMapSets.value = [];
  useMyCollection.value = true;
}
</script>

<style scoped>
.matchup-page {
  padding: 2rem 1rem;
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

.page-subtitle {
  color: #cbd5e1;
  opacity: 0.8;
  font-size: 14px;
  margin-bottom: 2rem;
}

.vs-picker {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: clamp(16px, 5vw, 48px);
  margin: 2.5rem 0;
}

.vs-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.vs-col-heading {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.5);
}

.vs-slot {
  cursor: pointer;
  width: clamp(140px, 30vw, 220px);
  height: clamp(140px, 30vw, 220px);
  border-radius: 20px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.vs-slot:hover {
  border-color: rgba(79, 124, 255, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 124, 255, 0.2);
}

.vs-slot.is-filled {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #121824;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.vs-slot.is-filled:hover {
  border-color: rgba(59, 255, 0, 0.75);
  box-shadow: 0 8px 20px rgba(255, 255, 255, 0.15);
}

.vs-slot-plus {
  font-size: 2.5rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1;
}

.vs-slot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
}

.vs-slot-name {
  position: relative;
  z-index: 2;
  width: 100%;
  background: linear-gradient(to top, rgba(7, 10, 18, 0.95) 60%, transparent);
  color: white;
  font-weight: 800;
  font-size: 13px;
  text-align: center;
  padding: 14px 8px 10px;
  margin-top: auto;
}

.vs-slot-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.vs-slot-percent {
  padding: 3px 8px;
  font-weight: 900;
  font-size: 12px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
}

.vs-slot-type {
  padding: 2px 7px;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: 5px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(12px);
  color: #cbd5e1;
}

.vs-slot-percent.green {
  color: #4ade80;
  border: 1px solid #22c55e;
}
.vs-slot-percent.yellow {
  color: #facc15;
  border: 1px solid #eab308;
}
.vs-slot-percent.orange {
  color: #fb923c;
  border: 1px solid #f97316;
}
.vs-slot-percent.red {
  color: #f87171;
  border: 1px solid #ef4444;
}
.vs-slot-percent.unknown {
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.5);
}

.vs-slot-clear {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(15, 23, 42, 0.85);
  color: #f1f5f9;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.vs-slot-clear:hover {
  background: #ef4444;
}

.vs-divider {
  align-self: center;
  margin-top: 40px;
  font-weight: 900;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  letter-spacing: 2px;
  background: linear-gradient(135deg, #4f7cff, #ff4f6d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  flex-shrink: 0;
}

.matchup-maps-section {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 6rem;
}

.matchup-maps-title {
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid;
}

.matchup-maps-title.good {
  color: #4ade80;
  border-color: #22c55e;
}

.matchup-maps-title.bad {
  color: #f87171;
  border-color: #ef4444;
}

.matchup-maps-title.balanced {
  color: #38bdf8;
  border-color: #0ea5e9;
}

.generator-panel {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.generator-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.btn-generate {
  padding: 10px 20px;
  border-radius: 999px;
  border: none;
  font-weight: 800;
  font-size: 14px;
  color: white;
  cursor: pointer;
  background: rgb(79, 124, 255);
  box-shadow: 0 6px 18px rgba(79, 124, 255, 0.35);
  transition: all 0.2s ease;
}

.btn-generate:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(79, 124, 255, 0.5);
}

.btn-collection-toggle {
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-weight: 700;
  font-size: 13px;
  color: #cbd5e1;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;
}

.btn-collection-toggle:hover {
  border-color: rgba(79, 124, 255, 0.6);
  color: white;
}

.generator-note {
  margin: 12px 0 0;
  color: #facc15;
  font-size: 13px;
  font-style: italic;
}

.collection-panel {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.collection-checkbox-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.collection-checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  cursor: pointer;
}

.btn-reset-filter {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.08);
  color: #f87171;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-reset-filter:hover {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.7);
}

.collection-hint {
  margin: -6px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}

.collection-checkbox-row input[type="checkbox"],
.collection-set-item input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin: 0;
  border-radius: 5px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  background: rgba(15, 23, 42, 0.6);
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
}

.collection-checkbox-row input[type="checkbox"]:hover,
.collection-set-item input[type="checkbox"]:hover {
  border-color: rgba(79, 124, 255, 0.7);
}

.collection-checkbox-row input[type="checkbox"]:checked,
.collection-set-item input[type="checkbox"]:checked {
  background: #4f7cff;
  border-color: transparent;
}

.collection-checkbox-row input[type="checkbox"]:checked::after,
.collection-set-item input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.collection-block-title {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 10px;
}

.collection-chars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
}

.collection-char-item {
  cursor: pointer;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  opacity: 0.4;
  transition: all 0.2s ease;
}

.collection-char-item.is-owned {
  opacity: 1;
  border-color: #4ade80;
  box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.3);
}

.collection-char-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.collection-sets-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
}

.collection-set-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #cbd5e1;
  cursor: pointer;
}

.mini-maps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.no-maps-text {
  color: #94a3b8;
  font-size: 13px;
  font-style: italic;
}

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
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(79, 124, 255, 0.6) rgba(15, 23, 42, 0.4);
}

.char-picker-item {
  cursor: pointer;
  border-radius: 12px;
  height: 110px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: #121824;
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
}

.char-picker-item:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 255, 0, 0.75);
  box-shadow: 0 6px 16px rgba(255, 255, 255, 0.12);
}

.char-picker-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.char-picker-name {
  position: relative;
  width: 100%;
  background: linear-gradient(
    to top,
    rgba(7, 10, 18, 0.99) 85%,
    rgba(11, 15, 25, 0.9)
  );
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: white;
  padding: 6px 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-grow: 1;
}

.char-picker-versus {
  font-size: 8px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.char-picker-percent {
  font-size: 12px;
  font-weight: 900;
}

.char-picker-type {
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #cbd5e1;
}

.char-picker-percent.green {
  color: #4ade80;
}
.char-picker-percent.yellow {
  color: #facc15;
}
.char-picker-percent.orange {
  color: #fb923c;
}
.char-picker-percent.red {
  color: #f87171;
}
.char-picker-percent.unknown {
  color: #94a3b8;
}
</style>
