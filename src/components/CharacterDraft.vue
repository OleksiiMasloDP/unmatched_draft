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
      <button class="btn-proceed-maps" @click="proceedToMaps">
        {{ t("toMapsLabel") }}
      </button>
    </div>
  </div>

  <div v-if="current" class="row g-2 g-md-3">
    <div v-for="char in filtered" :key="char.id" class="col-6 col-sm-4">
      <div class="character" @click="pickCharacter(char)">
        <img :src="char.image" />
        <div class="percent" :class="getPercentClass(getPickPercent(char))">
          {{ getPickPercent(char) }}%
        </div>
        <div class="char-name">
          <div class="char-title">{{ char.name }}</div>
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

  <div v-else class="desktop-only-analytics">
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
      <button class="btn-proceed-maps" @click="proceedToMaps">
        {{ t("toMapsLabel") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useDraftState } from "../composables/useDraftState";

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

function pickCharacter(char) {
  pick(char);

  const isBanPhase = current.value.type === "ban";
  const activePlayer = current.value.player;

  if (typeof window.gtag === "function") {
    if (isBanPhase) {
      window.gtag("event", "hero_banned", {
        character_name: char.name,
        banned_by: activePlayer,
      });
    } else {
      window.gtag("event", "hero_picked_total", { character_name: char.name });

      if (activePlayer === "player") {
        window.gtag("event", "hero_picked_user", { character_name: char.name });
      } else if (activePlayer === "opponent") {
        window.gtag("event", "hero_picked_opponent", {
          character_name: char.name,
        });
      }
    }
  }
}
</script>

<style scoped>
.engine-outer-mb {
  margin-bottom: 4px;
}
.engine-inner-mb {
  margin-bottom: 12px;
}
</style>
