<template>
  <div class="matchup-page container">
    <h1 class="page-main-title">{{ t("matchupsTitle") }}</h1>
    <p class="page-subtitle">{{ t("matchupsDesc") }}</p>

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
              <span class="vs-slot-type">{{ matchupTypeTextA }}</span>
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
              <span class="vs-slot-type">{{ matchupTypeTextB }}</span>
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
        <h6 class="matchup-maps-title good">
          {{ t("mapSuitableFor") }} {{ charA.name }}
        </h6>
        <div v-if="goodMaps.length" class="mini-maps-grid">
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
        <p v-else class="no-maps-text">{{ t("matchupNoBetterMaps") }}</p>
      </div>

      <div class="matchup-maps-group">
        <h6 class="matchup-maps-title bad">
          {{ t("mapUnsuitableFor") }} {{ charA.name }}
        </h6>
        <div v-if="badMaps.length" class="mini-maps-grid">
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
        <p v-else class="no-maps-text">{{ t("matchupNoWorseMaps") }}</p>
      </div>
    </div>

    <!-- Попап вибору персонажа -->
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
            autofocus
          />
          <button class="char-picker-close" @click="closePicker">✕</button>
        </div>

        <div class="char-picker-grid">
          <div
            v-for="char in pickerFilteredCharacters"
            :key="char.id"
            class="char-picker-item"
            :title="char.name"
            @click="selectCharacter(char)"
          >
            <img :src="char.image" :alt="char.name" loading="lazy" />
            <div v-if="pickerReferenceChar" class="char-picker-info">
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
              <span class="char-picker-type">{{
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
} = useDraftState();

const charA = ref(null);
const charB = ref(null);

const pickerOpen = ref(false);
const pickerTarget = ref(null); // 'a' | 'b'
const pickerSearch = ref("");

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

// Карти, де перевага у charA (favoredBy для нього і/або disfavoredBy для charB)
const goodMaps = computed(() => {
  if (!charA.value || !charB.value) return [];
  return getBestMapsForMatchup(charA.value.name, charB.value.name);
});

// Карти, де перевага у charB — тобто погані для charA
const badMaps = computed(() => {
  if (!charA.value || !charB.value) return [];
  return getBestMapsForMatchup(charB.value.name, charA.value.name);
});
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
  max-width: 640px;
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
  font-size: 16px;
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
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.char-picker-item {
  cursor: pointer;
  position: relative;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #121824;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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

.char-picker-info {
  position: absolute;
  bottom: 4px;
  left: 4px;
  right: 4px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.char-picker-percent {
  width: 100%;
  padding: 2px 0;
  font-size: 10px;
  font-weight: 900;
  text-align: center;
  border-radius: 5px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
}

.char-picker-type {
  width: 100%;
  padding: 2px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-align: center;
  border-radius: 4px;
  background: rgb(15, 23, 42);
  backdrop-filter: blur(8px);
  color: #cbd5e1;
}

.char-picker-percent.green {
  color: #4ade80;
  border: 1px solid #22c55e;
}
.char-picker-percent.yellow {
  color: #facc15;
  border: 1px solid #eab308;
}
.char-picker-percent.orange {
  color: #fb923c;
  border: 1px solid #f97316;
}
.char-picker-percent.red {
  color: #f87171;
  border: 1px solid #ef4444;
}
.char-picker-percent.unknown {
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.5);
}
</style>
