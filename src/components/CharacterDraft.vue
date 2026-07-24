<template>
  <div
    v-if="!current && player.picks.length && opponent.picks.length"
    class="analytics-outer-wrapper mobile-only-analytics"
  >
    <div class="result-card">
      <div
        class="d-flex align-items-center justify-content-between engine-outer-mb"
      >
        <h4 class="fw-bold mb-0 engine-title-text engine-title-mobile">
          {{ t("engineTitle") }}
        </h4>
        <button
          class="info-trigger-btn"
          @click="showInfoPopover = !showInfoPopover"
        >
          [ℹ] {{ t("infoLabel") }}
        </button>
      </div>

      <p class="engine-sub-desc engine-sub-mobile engine-inner-mb">
        {{ t("engineDesc") }}
      </p>

      <div v-if="showInfoPopover" class="custom-info-popover engine-inner-mb">
        💡 {{ t("infoBanner") }}
      </div>

      <div v-if="banRecommendation" class="rec-box">
        <div class="rec-flex-container">
          <div class="rec-images-container">
            <div
              v-for="(img, idx) in banRecommendation.images"
              :key="idx"
              class="rec-hero-card"
              :style="{
                borderColor:
                  banRecommendation.stage === 'opponent'
                    ? '#ef4444'
                    : '#4f7cff',
              }"
            >
              <img :src="img" />
            </div>
          </div>
          <p class="rec-text" v-html="banRecommendation.formattedText"></p>
        </div>
      </div>
    </div>

    <div class="dynamic-bars-container">
      <div
        class="team-bar"
        :style="{
          width: finalWinrate.player + '%',
          backgroundColor: player.color,
        }"
      >
        {{ t("teamYou") }}: {{ finalWinrate.player }}%
      </div>
      <div
        class="team-bar"
        :style="{
          width: finalWinrate.opponent + '%',
          backgroundColor: opponent.color,
        }"
      >
        {{ t("teamOpponent") }}: {{ finalWinrate.opponent }}%
      </div>
    </div>

    <div
      v-if="canProceedToMaps"
      class="proceed-maps-btn-wrap mobile-proceed-wrap"
    >
      <button class="btn-proceed-maps" @click="proceedToMapsEvent">
        {{ t("toMapsLabel") }}
      </button>
    </div>
  </div>

  <!-- Стабильная сетка пула персонажей -->
  <div v-if="current" class="row g-2 g-md-3">
    <div
      v-for="char in filtered"
      :key="char.id"
      class="col-6 col-sm-6 col-md-4"
    >
      <div
        class="character"
        :class="{ 'threat-card': getThreatData(char).isThreat }"
        @click="pick(char)"
      >
        <img :src="char.image" />

        <div class="percent" :class="getPercentClass(getPickPercent(char))">
          {{ getPickPercent(char) }}%
        </div>

        <div v-if="getThreatData(char).isThreat" class="threat-badge">
          ⚠️ {{ t("ghostThreat") || "Загроза" }}
        </div>

        <div class="char-name">
          <div class="char-title">{{ char.name }}</div>

          <div v-if="getThreatData(char).isThreat" class="threat-details mt-2">
            <div
              v-for="target in getThreatData(char).targets"
              :key="target.name"
              class="threat-target-row"
            >
              <span>vs {{ target.name }}</span>
              <strong class="text-danger">{{ target.winrate }}%</strong>
            </div>
          </div>

          <div class="mu-list">
            <template v-for="enemy in opponent.picks" :key="enemy.id">
              <div v-if="getWinrate(char.name, enemy.name) !== null">
                {{ getMatchupText(char, enemy) }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="desktop-only-analytics" v-else>
    <div class="result-card">
      <div
        class="d-flex align-items-center justify-content-between engine-outer-mb"
      >
        <h4 class="fw-bold mb-0 engine-title-text engine-title-desktop">
          {{ t("engineTitle") }}
        </h4>
        <button
          class="info-trigger-btn"
          @click="showInfoPopover = !showInfoPopover"
        >
          [ℹ] {{ t("infoLabel") }}
        </button>
      </div>

      <p class="engine-sub-desc engine-sub-desktop engine-inner-mb">
        {{ t("engineDesc") }}
      </p>

      <div v-if="showInfoPopover" class="custom-info-popover engine-inner-mb">
        💡 {{ t("infoBanner") }}
      </div>

      <div v-if="banRecommendation" class="rec-box">
        <div class="rec-flex-container">
          <div class="rec-images-container">
            <div
              v-for="(img, idx) in banRecommendation.images"
              :key="idx"
              class="rec-hero-card"
              :style="{
                borderColor:
                  banRecommendation.stage === 'opponent'
                    ? '#ef4444'
                    : '#4f7cff',
              }"
            >
              <img :src="img" />
            </div>
          </div>
          <p class="rec-text" v-html="banRecommendation.formattedText"></p>
        </div>
      </div>
    </div>

    <div class="dynamic-bars-container">
      <div
        class="team-bar"
        :style="{
          width: finalWinrate.player + '%',
          backgroundColor: player.color,
        }"
      >
        {{ t("teamYou") }}: {{ finalWinrate.player }}%
      </div>
      <div
        class="team-bar"
        :style="{
          width: finalWinrate.opponent + '%',
          backgroundColor: opponent.color,
        }"
      >
        {{ t("teamOpponent") }}: {{ finalWinrate.opponent }}%
      </div>
    </div>

    <div v-if="canProceedToMaps" class="proceed-maps-btn-wrap">
      <button class="btn-proceed-maps" @click="proceedToMapsEvent">
        {{ t("toMapsLabel") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useDraftState } from "../composables/useDraftState";
import { trackProceedToMaps } from "@/utils/gaAnalytics";

const {
  t,
  player,
  opponent,
  current,
  filtered,
  showInfoPopover,
  banRecommendation,
  finalWinrate,
  canProceedToMaps,
  pick,
  getPercentClass,
  getPickPercent,
  getMatchupText,
  getWinrate,
  proceedToMaps,
} = useDraftState();

function getThreatData(char) {
  const data = { isThreat: false, targets: [] };
  if (!player.picks || !player.picks.length) return data;

  let totalWinrateAgainstUs = 0;
  let count = 0;

  for (const myChar of player.picks) {
    const winrate = getWinrate(char.name, myChar.name);
    if (winrate !== null) {
      totalWinrateAgainstUs += winrate;
      count++;

      if (winrate >= 53) {
        data.targets.push({
          name: myChar.name,
          winrate: winrate,
        });
      }
    }
  }

  data.isThreat = count > 0 && totalWinrateAgainstUs / count >= 53;
  data.targets.sort((a, b) => b.winrate - a.winrate);

  return data;
}

function proceedToMapsEvent() {
  trackProceedToMaps();
  proceedToMaps();
}
</script>

<style scoped>
.engine-outer-mb {
  margin-bottom: 4px;
}
.engine-inner-mb {
  margin-bottom: 12px;
}

.character {
  position: relative;
}

.character.threat-card {
  border: 1px solid rgba(255, 79, 109, 0.6) !important;
  box-shadow: 0 0 10px rgba(255, 79, 109, 0.25);
  background: rgba(255, 79, 109, 0.03);
}

.threat-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(239, 68, 68, 0.9);
  backdrop-filter: blur(4px);
  color: #fff;
  z-index: 2;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.threat-details {
  width: 100%;
  font-size: 0.7rem;
  background: rgba(255, 79, 109, 0.08);
  border-radius: 4px;
  padding: 4px 6px;
  border: 1px solid rgba(255, 79, 109, 0.15);
}

.threat-target-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #f8fafc;
  line-height: 1.3;
}

.threat-target-row:not(:last-child) {
  margin-bottom: 2px;
  border-bottom: 1px dashed rgba(255, 79, 109, 0.15);
  padding-bottom: 2px;
}
</style>
