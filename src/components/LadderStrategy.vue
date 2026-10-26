<template>
  <div v-if="ladderStrategy" class="ladder-strategy">
    <div class="result-card">
      <h4 class="fw-bold mb-1 engine-title-text engine-title-desktop">
        {{ t("engineTitle") }}
      </h4>
      <p class="engine-sub-desc engine-sub-desktop strategy-desc">
        {{ t("engineDesc") }}
      </p>

      <div class="rec-box strategy-box">
        <div class="strategy-kicker">
          {{ t("ladderStrategyTitle") }} · {{ t("ladderRecommended") }}
        </div>

        <div class="rec-flex-container">
          <div class="rec-images-container">
            <div
              class="rec-hero-card"
              :style="{ borderColor: player.color }"
              :title="recommended.hero.name"
            >
              <img :src="recommended.hero.image" :alt="recommended.hero.name" />
            </div>
          </div>
          <p class="rec-text" v-html="playHtml"></p>
        </div>

        <div class="strategy-numbers">
          <div class="strategy-number">
            <span class="strategy-number-label">{{
              t("ladderAvgChance")
            }}</span>
            <span
              class="strategy-number-value"
              :class="'tone-' + getPercentClass(recommended.best.average)"
            >
              {{ recommended.best.average }}%
            </span>
          </div>
          <div class="strategy-number">
            <span class="strategy-number-label">{{
              t("ladderWorstCase")
            }}</span>
            <span
              class="strategy-number-value"
              :class="'tone-' + getPercentClass(recommended.best.worst)"
            >
              {{ recommended.best.worst }}%
            </span>
          </div>
        </div>

        <div class="strategy-versus">
          <div
            v-for="row in recommended.best.versus"
            :key="row.enemy.id"
            class="strategy-versus-row"
          >
            <span class="strategy-versus-name">vs {{ row.enemy.name }}</span>
            <span class="strategy-versus-detail">
              {{ t("ladderMatchupWord") }} {{ row.matchup }}%
              <template v-if="row.mapDelta">
                · {{ t("ladderMapWord") }} {{ formatDelta(row.mapDelta) }}
              </template>
            </span>
            <span
              class="strategy-versus-chance"
              :class="'tone-' + getPercentClass(row.chance)"
            >
              {{ row.chance }}%
            </span>
          </div>
        </div>

        <div v-if="otherMaps.length" class="strategy-maps">
          <span class="strategy-maps-label">{{ t("ladderOtherMaps") }}:</span>
          <span v-for="item in otherMaps" :key="item.map.id" class="map-chip">
            {{ item.map.name }}
            <b :class="'tone-' + getPercentClass(item.average)">
              {{ item.average }}%
            </b>
          </span>
        </div>
      </div>

      <div v-if="alternatives.length" class="strategy-alts">
        <div
          v-for="option in alternatives"
          :key="option.hero.id"
          class="alt-row"
        >
          <img :src="option.hero.image" :alt="option.hero.name" />
          <div class="alt-info">
            <div class="alt-name">{{ option.hero.name }}</div>
            <div class="alt-detail">
              {{ t("ladderBestMap") }}: {{ option.best.map.name }}
            </div>
          </div>
          <div class="alt-numbers">
            <span :class="'tone-' + getPercentClass(option.best.average)">
              {{ option.best.average }}%
            </span>
            <span class="alt-worst">
              {{ t("ladderWorstCase") }} {{ option.best.worst }}%
            </span>
          </div>
        </div>
      </div>

      <p class="strategy-hint">{{ t("ladderStrategyDesc") }}</p>
    </div>

    <div class="dynamic-bars-container">
      <div
        class="team-bar"
        :style="{
          width: ladderWinrate.player + '%',
          backgroundColor: player.color,
        }"
      >
        {{ t("teamYou") }}: {{ ladderWinrate.player }}%
      </div>
      <div
        class="team-bar"
        :style="{
          width: ladderWinrate.opponent + '%',
          backgroundColor: opponent.color,
        }"
      >
        {{ t("teamOpponent") }}: {{ ladderWinrate.opponent }}%
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";

// Блок "Predictive Analytics Engine" для ladder: загальні шанси команд
// і стратегія — яким героєм грати та на якій мапі.
const { t, player, opponent, ladderStrategy, ladderWinrate, getPercentClass } =
  useDraftState();

const recommended = computed(() => ladderStrategy.value.recommended);
const alternatives = computed(() => ladderStrategy.value.options.slice(1));
const otherMaps = computed(() => recommended.value.topMaps.slice(1));

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);

const playHtml = computed(() => {
  const highlight = (text) =>
    `<span class="rec-highlight">${escapeHtml(text)}</span>`;
  return t("ladderPlayOn")
    .replace("{hero}", () => highlight(recommended.value.hero.name))
    .replace("{map}", () => highlight(recommended.value.best.map.name));
});

function formatDelta(delta) {
  return delta > 0 ? `+${delta}%` : `${delta}%`;
}
</script>

<style scoped>
.ladder-strategy {
  margin-bottom: 16px;
}

.strategy-desc {
  margin-bottom: 12px;
}

.strategy-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.strategy-kicker {
  color: var(--text-dim);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rec-text {
  font-size: 14px;
}

.strategy-numbers {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.strategy-number {
  flex: 1 1 140px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 10px;
}

.strategy-number-label {
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.strategy-number-value {
  font-size: 18px;
  font-weight: 800;
}

.strategy-versus {
  display: flex;
  flex-direction: column;
}

.strategy-versus-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 5px 0;
  font-size: 12.5px;
}

.strategy-versus-row:not(:last-child) {
  border-bottom: 1px solid rgba(var(--color-player-rgb), 0.15);
}

.strategy-versus-name {
  flex: 0 0 auto;
  color: var(--text-light);
  font-weight: 700;
}

.strategy-versus-detail {
  flex: 1 1 auto;
  min-width: 0;
  color: var(--text-dim);
  font-size: 11.5px;
}

.strategy-versus-chance {
  flex: 0 0 auto;
  font-weight: 800;
}

.strategy-maps {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.strategy-maps-label {
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.map-chip {
  padding: 3px 10px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 999px;
  color: var(--text-light);
  font-size: 12px;
  font-weight: 600;
}

.map-chip b {
  margin-left: 4px;
  font-weight: 800;
}

.strategy-alts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.alt-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(var(--bg-slate-rgb), 0.6);
  border: 1px solid var(--border-light);
  border-radius: 12px;
}

.alt-row img {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.alt-info {
  flex: 1 1 auto;
  min-width: 0;
}

.alt-name {
  color: var(--text-light);
  font-size: 13px;
  font-weight: 800;
}

.alt-detail {
  color: var(--text-dim);
  font-size: 11.5px;
}

.alt-numbers {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-weight: 800;
}

.alt-worst {
  color: var(--text-dim);
  font-size: 10.5px;
  font-weight: 600;
}

.strategy-hint {
  margin: 12px 0 0;
  color: var(--text-dim);
  font-size: 11.5px;
  line-height: 1.4;
}

.tone-green {
  color: var(--color-success-light);
}

.tone-yellow {
  color: var(--color-warning);
}

.tone-orange {
  color: var(--color-orange-light);
}

.tone-red {
  color: var(--color-danger);
}
</style>
