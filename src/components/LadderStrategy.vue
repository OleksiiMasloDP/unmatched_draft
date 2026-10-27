<template>
  <div v-if="ladderStrategy" class="ladder-strategy">
    <div class="result-card">
      <div
        class="d-flex align-items-center justify-content-between engine-outer-mb"
      >
        <h4 class="fw-bold mb-0 engine-title-text">
          {{ t("engineTitle") }}
        </h4>
        <button
          type="button"
          class="info-trigger-btn"
          :class="{ 'is-open': showInfo }"
          @click="showInfo = !showInfo"
        >
          {{ t("infoLabel") }}
        </button>
      </div>

      <p class="engine-sub-desc engine-inner-mb">{{ t("engineDesc") }}</p>

      <div v-if="showInfo" class="custom-info-popover engine-inner-mb">
        💡 {{ t("ladderStrategyDesc") }}
      </div>

      <section class="strategy-section is-recommended">
        <div class="strategy-label">{{ t("ladderRecommended") }}</div>

        <div class="strategy-pick">
          <img
            class="strategy-pick-img"
            :src="recommended.hero.image"
            :alt="recommended.hero.name"
          />
          <p class="strategy-pick-text" v-html="playHtml"></p>
        </div>

        <div class="strategy-stats">
          <div
            class="strategy-stat"
            :class="'tone-' + getPercentClass(recommended.best.average)"
          >
            <span class="strategy-stat-label">{{ t("ladderAvgChance") }}</span>
            <span class="strategy-stat-value">
              {{ recommended.best.average }}%
            </span>
          </div>
          <div
            class="strategy-stat"
            :class="'tone-' + getPercentClass(recommended.best.worst)"
          >
            <span class="strategy-stat-label">{{ t("ladderWorstCase") }}</span>
            <span class="strategy-stat-value">
              {{ recommended.best.worst }}%
            </span>
          </div>
        </div>
      </section>

      <section class="strategy-section">
        <div class="strategy-label">{{ t("ladderVsEach") }}</div>
        <div
          v-for="row in recommended.best.versus"
          :key="row.enemy.id"
          class="strategy-row"
        >
          <img :src="row.enemy.image" :alt="row.enemy.name" />
          <div class="strategy-row-info">
            <div class="strategy-row-name">{{ row.enemy.name }}</div>
            <div class="strategy-row-detail">
              {{ t("ladderMatchupWord") }} {{ row.matchup }}%
              <template v-if="row.mapDelta">
                · {{ t("ladderMapWord") }} {{ formatDelta(row.mapDelta) }}
              </template>
            </div>
          </div>
          <span
            class="strategy-pill"
            :class="'tone-' + getPercentClass(row.chance)"
          >
            {{ row.chance }}%
          </span>
        </div>

        <div v-if="otherMaps.length" class="strategy-maps">
          <span class="strategy-maps-label">{{ t("ladderOtherMaps") }}</span>
          <span v-for="item in otherMaps" :key="item.map.id" class="map-chip">
            {{ item.map.name }}
            <b :class="'tone-' + getPercentClass(item.average)">
              {{ item.average }}%
            </b>
          </span>
        </div>
      </section>

      <section v-if="alternatives.length" class="strategy-section">
        <div class="strategy-label">{{ t("ladderOtherHeroes") }}</div>
        <div
          v-for="option in alternatives"
          :key="option.hero.id"
          class="strategy-row"
        >
          <img :src="option.hero.image" :alt="option.hero.name" />
          <div class="strategy-row-info">
            <div class="strategy-row-name">{{ option.hero.name }}</div>
            <div class="strategy-row-detail">
              {{ t("ladderBestMap") }}: {{ option.best.map.name }} ·
              {{ t("ladderWorstCase") }} {{ option.best.worst }}%
            </div>
          </div>
          <span
            class="strategy-pill"
            :class="'tone-' + getPercentClass(option.best.average)"
          >
            {{ option.best.average }}%
          </span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useDraftState } from "../composables/useDraftState";

const { t, player, opponent, ladderStrategy, ladderWinrate, getPercentClass } =
  useDraftState();

const showInfo = ref(false);

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

.engine-outer-mb {
  margin-bottom: 4px;
}

.engine-inner-mb {
  margin-bottom: 8px;
}

.strategy-section {
  margin-top: 12px;
  padding: 12px;
  background: rgba(var(--bg-dark-rgb), 0.6);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  text-align: left;
}

.strategy-section.is-recommended {
  border-color: rgba(var(--color-proceed-rgb), 0.45);
  background: linear-gradient(
    180deg,
    rgba(var(--color-proceed-rgb), 0.08),
    rgba(var(--bg-dark-rgb), 0.6)
  );
}

.strategy-label {
  margin-bottom: 10px;
  color: var(--text-dim);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.is-recommended .strategy-label {
  color: var(--color-proceed);
}

.strategy-pick {
  display: flex;
  align-items: center;
  gap: 12px;
}

.strategy-pick-img {
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid var(--color-player);
}

.strategy-pick-text {
  margin: 0;
  color: var(--text-main);
  font-size: 14px;
}

.strategy-stats {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.strategy-stat {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--stat-color);
  background: rgba(var(--bg-dark-rgb), 0.55);
}

.strategy-stat-label {
  color: var(--text-dim);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.strategy-stat-value {
  color: var(--stat-color);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}

.strategy-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.strategy-row:not(:last-of-type) {
  border-bottom: 1px solid var(--border-light);
}

.strategy-row img {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}

.strategy-row-info {
  flex: 1 1 auto;
  min-width: 0;
}

.strategy-row-name {
  color: var(--text-white);
  font-size: 13px;
  font-weight: 700;
}

.strategy-row-detail {
  color: var(--text-dim);
  font-size: 11.5px;
}

.strategy-pill {
  flex: 0 0 auto;
  min-width: 52px;
  padding: 3px 10px;
  border-radius: 999px;
  text-align: center;
  font-size: 13px;
  font-weight: 800;
  color: var(--stat-color);
  background: rgba(var(--bg-dark-rgb), 0.7);
  border: 1px solid var(--stat-color);
}

.strategy-maps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-light);
}

.strategy-maps-label {
  color: var(--text-dim);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.map-chip {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  color: var(--text-light);
  font-size: 12px;
  font-weight: 600;
}

.map-chip b {
  margin-left: 4px;
  font-weight: 800;
  color: var(--stat-color);
}

.tone-green {
  --stat-color: var(--color-success-light);
}

.tone-yellow {
  --stat-color: var(--color-warning);
}

.tone-orange {
  --stat-color: var(--color-orange-light);
}

.tone-red {
  --stat-color: var(--color-danger);
}
</style>
