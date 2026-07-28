<template>
  <div class="guide-page container">
    <h1 class="page-main-title">{{ t("guideTitle") }}</h1>
    <p class="page-subtitle">{{ t("guideDesc") }}</p>

    <div class="guide-picker-row">
      <CharacterSlot
        clearable
        :character="selectedChar"
        :label="t('guidePickCharacter')"
        @pick="openMainPicker"
        @clear="selectedChar = null"
      />
    </div>

    <div v-if="selectedChar" class="guide-body">
      <div class="guide-tabs">
        <button
          class="guide-tab"
          :class="{ active: activeTab === 'general' }"
          @click="activeTab = 'general'"
        >
          {{ t("guideTabGeneral") }}
        </button>
        <button
          class="guide-tab"
          :class="{ active: activeTab === 'matchups' }"
          @click="activeTab = 'matchups'"
        >
          {{ t("guideTabMatchups") }}
        </button>
      </div>

      <p v-if="guideLoading" class="guide-loading-text">
        {{ t("guideLoading") }}
      </p>

      <template v-else>
        <div v-if="activeTab === 'general'" class="guide-tab-content">
          <div class="guide-quick-stats" v-if="localeData">
            <div class="quick-stat-card">
              <span class="q-label">{{ t("statStyle") || "Стиль" }}</span>
              <span class="q-value style-val">{{ localeData.style }}</span>
            </div>
            <div class="quick-stat-card complexity-card">
              <span class="q-label">{{ t("guideComplexity") }}</span>
              <div class="complexity-wrapper">
                <span class="complexity-number">{{
                  selectedGuide.complexity || 0
                }}</span>
                <div class="guide-stars">
                  <div v-for="n in 5" :key="'star-' + n" class="star-container">
                    <div
                      class="star-filled"
                      :style="{
                        width: getStarFillWidth(n, selectedGuide.complexity),
                      }"
                    >
                      ★
                    </div>
                    <div class="star-empty">★</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="guide-features-weaknesses-grid">
            <div>
              <div class="guide-block-title playstyle">
                {{ t("guideFeatures") || "Сильні сторони" }}
              </div>
              <div v-if="localeData.features?.length" class="guide-content-box">
                <div
                  v-for="(item, i) in localeData.features"
                  :key="i"
                  class="tip-paragraph"
                >
                  <span class="tip-bullet feature-bullet">•</span>
                  <p>{{ item }}</p>
                </div>
              </div>
              <p v-else class="no-maps-text">{{ t("guideNoContentYet") }}</p>
            </div>

            <div>
              <div class="guide-block-title weaknesses">
                {{ t("guideWeaknesses") }}
              </div>
              <div
                v-if="localeData.weaknesses?.length"
                class="guide-content-box"
              >
                <div
                  v-for="(item, i) in localeData.weaknesses"
                  :key="i"
                  class="tip-paragraph"
                >
                  <span class="tip-bullet weakness-bullet">•</span>
                  <p>{{ item }}</p>
                </div>
              </div>
              <p v-else class="no-maps-text">{{ t("guideNoContentYet") }}</p>
            </div>
          </div>

          <div class="guide-block-title primary-accent">
            {{ t("guideGeneralTips") }}
          </div>
          <div v-if="localeData.generalTips?.length" class="guide-content-box">
            <div
              v-for="(p, i) in localeData.generalTips"
              :key="i"
              class="tip-paragraph"
            >
              <span class="tip-bullet">•</span>
              <p>{{ p }}</p>
            </div>
          </div>
          <p v-else class="no-maps-text">{{ t("guideNoContentYet") }}</p>

          <div class="guide-block-title primary-accent">
            {{ t("guideKeyCards") }}
          </div>
          <div
            v-if="selectedGuide.keyCards?.length"
            class="guide-pure-cards-grid"
          >
            <div
              v-for="(card, i) in selectedGuide.keyCards"
              :key="i"
              class="pure-card-item"
            >
              <img
                :src="`images/cards/${selectedChar.name}/${card.image || 'default.jpg'}`"
                :alt="card.image"
                loading="lazy"
                @error="handleCardImgError"
              />
            </div>
          </div>
          <p v-else class="no-maps-text">{{ t("guideNoContentYet") }}</p>
        </div>

        <div v-if="activeTab === 'matchups'" class="guide-tab-content">
          <div class="guide-opponent-grid scroll">
            <div
              v-for="opp in opponentsList"
              :key="opp.id"
              class="char-picker-item"
              :title="opp.name"
              @click="openMatchupPopup(opp)"
            >
              <img :src="opp.image" :alt="opp.name" loading="lazy" />
            </div>

            <p v-if="!opponentsList.length" class="no-maps-text">
              {{ t("matchupNoCharactersFound") || "Немає доступних матчапів" }}
            </p>
          </div>
        </div>
      </template>
    </div>

    <CharPickerModal
      v-if="mainPickerOpen"
      :characters-list="filteredMainCharactersPool"
      @close="mainPickerOpen = false"
      @select="selectMainCharacter"
    />

    <!-- Плавна поява оверлея + масштабування модалки -->
    <Transition name="modal-fade">
      <div
        v-if="matchupPopupOpponent"
        class="matchup-modal-overlay"
        @click.self="matchupPopupOpponent = null"
      >
        <div class="matchup-modal">
          <button
            class="matchup-modal-close"
            @click="matchupPopupOpponent = null"
          >
            ✕
          </button>

          <div class="matchup-modal-image">
            <img
              :src="matchupPopupOpponent.image"
              :alt="matchupPopupOpponent.name"
            />
            <div class="matchup-modal-image-label">
              {{ matchupPopupOpponent.name }}
            </div>
          </div>

          <div class="matchup-modal-content">
            <div class="matchup-winrate-section" v-if="matchupWinrate">
              <span class="winrate-label">Winrate</span>
              <span class="winrate-value">{{ matchupWinrate }}%</span>
            </div>

            <div v-for="(p, i) in matchupTips" :key="i" class="tip-paragraph">
              <span class="tip-bullet">•</span>
              <p>{{ p }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import CharacterSlot from "../CharacterSlot.vue";
import CharPickerModal from "../CharPickerModal.vue";

const { t, getAllCharacters, getWinrate, lang } = useDraftState();

const EMPTY_GUIDE = {
  complexity: 0,
  keyCards: [],
  style: { en: "", ua: "" },
  features: { en: [], ua: [] },
  weaknesses: { en: [], ua: [] },
  generalTips: { en: [], ua: [] },
  matchups: {},
};

// Список персонажів, у яких взагалі є гайд (легкий індекс-файл,
// без самого контенту — щоб не тягнути все одразу)
const guideIndex = ref([]);

// Кеш уже завантажених гайдів: { [characterName]: guideObject }
const guideCache = ref({});
const guideLoading = ref(false);

const selectedChar = ref(null);
const activeTab = ref("general");
const mainPickerOpen = ref(false);
const matchupPopupOpponent = ref(null);

onMounted(async () => {
  try {
    const res = await fetch("guides/index.json");
    guideIndex.value = await res.json();
  } catch (e) {
    guideIndex.value = [];
  }
});

async function loadGuide(characterName) {
  if (guideCache.value[characterName]) return;

  guideLoading.value = true;
  try {
    const res = await fetch(`guides/${encodeURIComponent(characterName)}.json`);
    guideCache.value[characterName] = await res.json();
  } catch (e) {
    guideCache.value[characterName] = EMPTY_GUIDE;
  } finally {
    guideLoading.value = false;
  }
}

const selectedGuide = computed(() => {
  if (!selectedChar.value) return EMPTY_GUIDE;
  return guideCache.value[selectedChar.value.name] || EMPTY_GUIDE;
});

const localeData = computed(() => {
  const currentLang = lang?.value === "ua" ? "ua" : "en";
  const g = selectedGuide.value;
  return {
    style: g.style?.[currentLang] || "",
    features: g.features?.[currentLang] || [],
    weaknesses: g.weaknesses?.[currentLang] || [],
    generalTips: g.generalTips?.[currentLang] || [],
  };
});

const matchupTips = computed(() => {
  if (!selectedChar.value || !matchupPopupOpponent.value) return [];
  const currentLang = lang?.value === "ua" ? "ua" : "en";
  return (
    selectedGuide.value.matchups?.[matchupPopupOpponent.value.name]?.tips?.[
      currentLang
    ] || []
  );
});

// Winrate беремо напряму з тієї ж бази, яку вже звіряли (characters.json), щоб не було
// другого джерела правди для того самого числа
const matchupWinrate = computed(() => {
  if (!selectedChar.value || !matchupPopupOpponent.value) return null;
  return getWinrate(selectedChar.value.name, matchupPopupOpponent.value.name);
});

const filteredMainCharactersPool = computed(() => {
  return getAllCharacters().filter((c) => guideIndex.value.includes(c.name));
});

const opponentsList = computed(() => {
  if (!selectedChar.value) return [];
  const g = selectedGuide.value;

  return getAllCharacters().filter((c) => {
    if (c.id === selectedChar.value.id) return false;
    return !!g.matchups?.[c.name];
  });
});

function getStarFillWidth(starIndex, complexityValue) {
  const diff = complexityValue - (starIndex - 1);
  if (diff >= 1) return "100%";
  if (diff > 0) return diff * 100 + "%";
  return "0%";
}

function handleCardImgError(e) {
  e.target.src = "images/card-placeholder.jpg";
}

function openMainPicker() {
  mainPickerOpen.value = true;
}

function selectMainCharacter(char) {
  selectedChar.value = char;
  activeTab.value = "general";
  mainPickerOpen.value = false;
  loadGuide(char.name);
}

function openMatchupPopup(opp) {
  matchupPopupOpponent.value = opp;
}
</script>

<style scoped>
.guide-page {
  padding: 2rem 1rem;
}
.page-main-title {
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--text-white);
  text-transform: uppercase;
  letter-spacing: -0.5px;
}
.page-subtitle {
  color: var(--text-dim);
  font-size: 17px;
  margin-bottom: 2rem;
}
.guide-picker-row {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0 2.5rem;
}
.guide-body {
  max-width: 1000px;
  margin: 0 auto;
}

.guide-quick-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 2.5rem;
}
.quick-stat-card {
  background: rgba(var(--bg-slate-rgb), 0.4);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  padding: 18px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.q-label {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 6px;
}
.q-value {
  font-size: 19px;
  font-weight: 700;
  color: var(--text-main);
}
.style-val {
  color: var(--color-info);
}

.complexity-card {
  grid-column: span 1;
}
.complexity-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}
.complexity-number {
  font-size: 20px;
  font-weight: 900;
  color: var(--color-warning);
}
.guide-stars {
  display: flex;
  gap: 3px;
}
.star-container {
  position: relative;
  display: inline-block;
  font-size: 18px;
  line-height: 1;
}
.star-empty {
  color: rgba(255, 255, 255, 0.15);
}
.star-filled {
  color: var(--color-warning);
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  white-space: nowrap;
  transition: width 0.3s ease;
}

.guide-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 2.5rem;
}
.guide-tab {
  padding: 14px 28px;
  border: none;
  background: none;
  color: var(--text-dim);
  font-weight: 800;
  cursor: pointer;
  text-transform: uppercase;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}
.guide-tab:hover {
  color: var(--text-light);
}
.guide-tab.active {
  color: var(--color-player);
  border-bottom-color: var(--color-player);
}

.guide-block-title {
  font-size: 16px;
  font-weight: 800;
  text-transform: uppercase;
  margin: 2rem 0 1.2rem;
  padding-left: 14px;
  border-left: 4px solid var(--color-player);
  color: var(--text-light);
  letter-spacing: 0.5px;
}
.guide-block-title.playstyle {
  border-color: var(--color-proceed);
}
.guide-block-title.weaknesses {
  border-color: var(--color-danger);
}
.guide-block-title.primary-accent {
  border-color: var(--color-player);
}

.guide-features-weaknesses-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1rem;
}

.guide-content-box {
  background: rgba(var(--bg-dark-rgb), 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tip-paragraph {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 16.5px;
  line-height: 1.7;
  color: var(--text-main);
}
.guide-content-box p {
  margin-top: 3px;
}
.tip-bullet {
  color: var(--color-player);
  font-weight: bold;
  font-size: 18px;
}
.feature-bullet {
  color: var(--color-proceed);
}
.weakness-bullet {
  color: var(--color-danger);
}

.guide-pure-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 1.2rem;
}
.pure-card-item {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-light);
  background: var(--bg-main);
  transition:
    transform 0.2s,
    border-color 0.2s;
  display: flex;
}
.pure-card-item:hover {
  transform: translateY(-4px);
  border-color: rgba(var(--color-player-rgb), 0.4);
}
.pure-card-item img {
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: brightness(0.8);
  transition: filter 0.2s ease;
}

.guide-opponent-grid {
  margin-top: 1.25rem;
  padding: 12px 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px;
  max-height: 600px;
  overflow-y: auto;
}
.char-picker-item {
  cursor: pointer;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--border-light);
  height: 150px;
  transition: all 0.2s ease;
}
.char-picker-item:hover {
  border-color: var(--color-player);
  transform: scale(1.03);
}
.char-picker-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.no-maps-text {
  color: var(--text-dim);
  font-size: 15px;
  font-style: italic;
}

.guide-loading-text {
  color: var(--text-dim);
  font-size: 15px;
  font-style: italic;
  padding: 2rem 0;
  text-align: center;
}

/* ==========================================================================
   МАТЧАП ПОПАП — центрована модалка: зліва картинка впритул до країв,
   справа — контент з відступами
   ========================================================================== */
.matchup-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.6);
  backdrop-filter: blur(8px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.matchup-modal {
  width: 100%;
  max-width: 760px;
  max-height: 85vh;
  background: var(--bg-dark);
  border: 1px solid var(--border-medium);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  overflow: hidden;
  position: relative;
}

.matchup-modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 5;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(2, 6, 23, 0.6);
  backdrop-filter: blur(6px);
  color: var(--text-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background 0.2s ease;
}
.matchup-modal-close:hover {
  background: rgba(239, 68, 68, 0.8);
}

.matchup-modal-image {
  position: relative;
  width: 38%;
  flex-shrink: 0;
  overflow: hidden;
}

.matchup-modal-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.matchup-modal-image-label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 32px 16px 16px;
  background: linear-gradient(to top, rgba(2, 6, 23, 0.95) 45%, transparent);
  color: var(--text-white);
  font-weight: 800;
  font-size: 16px;
  text-align: center;
}

.matchup-modal-content {
  flex: 1;
  min-width: 0;
  padding: 1.75rem;
  padding-top: 4rem;
  overflow-y: auto;
}

.matchup-winrate-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(var(--color-player-rgb), 0.08);
  border: 1px solid rgba(var(--color-player-rgb), 0.15);
  border-radius: 18px;
  padding: 14px;
  margin-bottom: 1.5rem;
}
.winrate-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--color-info);
  letter-spacing: 0.5px;
}
.winrate-value {
  font-size: 26px;
  font-weight: 900;
  color: var(--text-white);
  margin-top: 2px;
}

/* ==========================================================================
   АНІМАЦІЯ (VUE TRANSITION) — плавна поява/зникнення з невеликим масштабуванням
   ========================================================================== */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-active .matchup-modal,
.modal-fade-leave-active .matchup-modal {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .matchup-modal,
.modal-fade-leave-to .matchup-modal {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .guide-features-weaknesses-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .guide-quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .guide-pure-cards-grid {
    grid-template-columns: 1fr;
  }
  .matchup-modal {
    flex-direction: column;
    max-height: 90vh;
  }
  .matchup-modal-image {
    width: 100%;
    height: 200px;
  }
  .page-main-title {
    font-size: 2.2rem;
  }
}
</style>
