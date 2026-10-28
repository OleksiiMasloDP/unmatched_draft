<template>
  <div class="pack-page container">
    <div class="pack-title-row">
      <h1 class="page-main-title">{{ t("packDraftTitle") }}</h1>
      <span class="pack-beta">{{ t("packBeta") }}</span>
    </div>

    <p class="engine-sub-desc engine-sub-desktop pack-intro">
      {{ t("packIntro") }}
    </p>

    <div class="pack-note">{{ t("packBetaNote") }}</div>

    <details class="pack-rules">
      <summary>{{ t("packRulesTitle") }}</summary>
      <ol>
        <li v-for="n in 5" :key="n">{{ t("packRule" + n) }}</li>
      </ol>
    </details>

    <div class="pack-toolbar">
      <button
        class="btn btn-danger btn-sm action-btn"
        :class="{ 'is-confirming': confirmingRestart }"
        @click="onRestart"
      >
        {{ confirmingRestart ? t("packRestartConfirm") : t("packRestart") }}
      </button>
    </div>

    <template v-if="state.phase === 'heroes'">
      <div class="pack-banner" :class="'is-' + pickerPlayer">
        {{ replacePlayer("packPickHero", pickerPlayer) }}
      </div>
      <div class="row g-3">
        <div
          v-for="hero in heroes"
          :key="hero.id"
          class="col-12 col-sm-6 col-lg-3"
        >
          <PackHeroCard
            :hero="hero"
            :owner="heroOwner(hero.id)"
            :clickable="!heroOwner(hero.id)"
            @select="pickHero"
          />
        </div>
      </div>
    </template>

    <template v-else-if="state.phase === 'draft'">
      <div class="pack-banner" :class="'is-' + state.turn">
        {{ replacePlayer("packTurnOf", state.turn) }}
        <span v-if="playerHeroes[state.turn]" class="pack-banner-hero">
          · {{ playerHeroes[state.turn].name }}
        </span>
      </div>

      <div class="pack-status">
        <span>
          {{
            t("packRoundOf")
              .replace("{n}", packRound.current)
              .replace("{total}", packRound.total)
          }}
        </span>
        <span>{{ t("packCardsLeft").replace("{n}", currentPack.length) }}</span>
        <span>
          {{ t("packKept") }}: {{ state.kept.p1.length }} /
          {{ state.kept.p2.length }}
        </span>
      </div>

      <p class="pack-hint">
        {{ t(state.stage === "keep" ? "packKeepHint" : "packDiscardHint") }}
      </p>

      <div class="row g-2 g-md-3">
        <div
          v-for="card in currentPack"
          :key="card.id"
          class="col-6 col-md-4 col-lg-3"
        >
          <PackCard
            :card="card"
            :selected="state.pending === card.id"
            :dead="isDeadCard(card, state.turn)"
            clickable
            @select="selectCard"
          />
        </div>
      </div>

      <div class="pack-actions">
        <button
          class="btn action-btn"
          :class="state.stage === 'keep' ? 'btn-success' : 'btn-danger'"
          :disabled="!state.pending"
          @click="confirmCard"
        >
          {{ t(state.stage === "keep" ? "packKeepBtn" : "packDiscardBtn") }}
        </button>
      </div>

      <details class="pack-details">
        <summary>
          {{ t("packYourKept") }} ({{ keptCards[state.turn].length }})
        </summary>
        <p v-if="!keptCards[state.turn].length" class="pack-empty">
          {{ t("packEmptyList") }}
        </p>
        <div v-else class="row g-2">
          <div
            v-for="card in keptCards[state.turn]"
            :key="card.id"
            class="col-6 col-md-4 col-lg-3"
          >
            <PackCard :card="card" :dead="isDeadCard(card, state.turn)" />
          </div>
        </div>
      </details>

      <details class="pack-details">
        <summary>
          {{ t("packDiscardPile") }} ({{ discardedCards.length }})
        </summary>
        <p v-if="!discardedCards.length" class="pack-empty">
          {{ t("packEmptyList") }}
        </p>
        <div v-else class="row g-2">
          <div
            v-for="card in discardedCards"
            :key="card.id"
            class="col-6 col-md-4 col-lg-3"
          >
            <PackCard :card="card" />
          </div>
        </div>
      </details>
    </template>

    <template v-else-if="state.phase === 'deck'">
      <div class="pack-banner" :class="'is-' + state.deckPlayer">
        {{ replacePlayer("packDeckTitle", state.deckPlayer) }}
      </div>
      <p class="pack-hint">
        {{ t("packDeckHint").replace("{n}", config.deckSize) }}
      </p>
      <div class="pack-status">
        <span>
          {{ t("packDeckCount") }}: {{ state.deckSelection.length }} /
          {{ config.deckSize }}
        </span>
      </div>

      <div class="row g-2 g-md-3">
        <div
          v-for="card in deckPoolCards"
          :key="card.id"
          class="col-6 col-md-4 col-lg-3"
        >
          <PackCard
            :card="card"
            :selected="state.deckSelection.includes(card.id)"
            :dead="isDeadCard(card, state.deckPlayer)"
            clickable
            @select="toggleDeckCard"
          />
        </div>
      </div>

      <div class="pack-actions">
        <button
          class="btn btn-success action-btn"
          :disabled="state.deckSelection.length !== config.deckSize"
          @click="confirmDeck"
        >
          {{ t("packDeckConfirm") }}
        </button>
      </div>
    </template>

    <template v-else>
      <div class="pack-banner is-done">{{ t("packDoneTitle") }}</div>

      <div class="row g-3">
        <div v-for="player in players" :key="player" class="col-12 col-lg-6">
          <div class="pack-summary" :class="'is-' + player">
            <h3>{{ t(player === "p1" ? "packPlayer1" : "packPlayer2") }}</h3>
            <PackHeroCard :hero="playerHeroes[player]" />

            <div class="pack-save">
              <template v-if="savedFlags[player]">
                <span class="pack-saved">{{ t("packDeckSaved") }}</span>
                <router-link
                  :to="{ name: 'game' }"
                  class="btn btn-primary btn-sm action-btn"
                >
                  {{ t("packPlayDeck") }}
                </router-link>
              </template>
              <template v-else>
                <input
                  v-model="deckNames[player]"
                  class="form-control form-control-sm search-field"
                  :placeholder="t('packDeckName')"
                />
                <button
                  class="btn btn-success btn-sm action-btn"
                  @click="onSaveDeck(player)"
                >
                  {{ t("packSaveDeck") }}
                </button>
              </template>
            </div>

            <div class="pack-summary-title">
              {{ t("packDeckSize").replace("{n}", deckCards[player].length) }}
            </div>
            <div class="row g-2">
              <div
                v-for="card in deckCards[player]"
                :key="card.id"
                class="col-6 col-md-4"
              >
                <PackCard :card="card" :dead="isDeadCard(card, player)" />
              </div>
            </div>

            <details v-if="setAsideCards[player].length" class="pack-details">
              <summary>
                {{ t("packSetAside") }} ({{ setAsideCards[player].length }})
              </summary>
              <div class="row g-2">
                <div
                  v-for="card in setAsideCards[player]"
                  :key="card.id"
                  class="col-6 col-md-4"
                >
                  <PackCard :card="card" />
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>

      <details class="pack-details">
        <summary>
          {{ t("packDiscardPile") }} ({{ discardedCards.length }})
        </summary>
        <div class="row g-2">
          <div
            v-for="card in discardedCards"
            :key="card.id"
            class="col-6 col-md-4 col-lg-3"
          >
            <PackCard :card="card" />
          </div>
        </div>
      </details>

      <div class="pack-actions">
        <button class="btn btn-primary action-btn" @click="restart">
          {{ t("packNewDraft") }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { usePackDraft } from "../../composables/usePackDraft";
import PackCard from "../PackCard.vue";
import PackHeroCard from "../PackHeroCard.vue";
import { useSavedDecks } from "../../composables/useSavedDecks";

const { t } = useDraftState();
const {
  state,
  config,
  heroes,
  currentPack,
  keptCards,
  discardedCards,
  deckCards,
  setAsideCards,
  deckPoolCards,
  pickerPlayer,
  playerHeroes,
  packRound,
  pickHero,
  selectCard,
  confirmCard,
  toggleDeckCard,
  confirmDeck,
  restart,
  isDeadCard,
} = usePackDraft();

const { saveDeck } = useSavedDecks();
const players = ["p1", "p2"];
const deckNames = reactive({ p1: "", p2: "" });
const savedFlags = reactive({ p1: false, p2: false });

watch(
  () => state.phase,
  (phase) => {
    if (phase !== "done") {
      savedFlags.p1 = false;
      savedFlags.p2 = false;
      deckNames.p1 = "";
      deckNames.p2 = "";
    }
  },
);

function onSaveDeck(player) {
  const hero = playerHeroes.value[player];
  saveDeck({
    name:
      deckNames[player] ||
      `${hero.name} · ${t(player === "p1" ? "packPlayer1" : "packPlayer2")}`,
    heroId: hero.id,
    cardIds: state.decks[player],
  });
  savedFlags[player] = true;
}
const confirmingRestart = ref(false);
let confirmTimer = null;

const heroOwner = (heroId) =>
  players.find((player) => state.heroes[player] === heroId) || "";

const replacePlayer = (key, player) =>
  t(key).replace(
    "{player}",
    t(player === "p1" ? "packPlayer1" : "packPlayer2"),
  );

function onRestart() {
  if (!confirmingRestart.value) {
    confirmingRestart.value = true;
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => (confirmingRestart.value = false), 3000);
    return;
  }
  clearTimeout(confirmTimer);
  confirmingRestart.value = false;
  restart();
}
</script>

<style scoped>
.pack-page {
  padding: 2rem 1rem;
}

.pack-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.pack-beta {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(var(--color-info-rgb), 0.15);
  border: 1px solid rgba(var(--color-info-rgb), 0.5);
  color: var(--color-info);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.pack-intro {
  margin-bottom: 12px;
}

.pack-note {
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(var(--color-info-rgb), 0.4);
  background: rgba(var(--bg-slate-rgb), 0.8);
  color: var(--text-muted);
  font-size: 12.5px;
}

.pack-rules,
.pack-details {
  margin-bottom: 14px;
  padding: 10px 14px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 13px;
}

.pack-rules summary,
.pack-details summary {
  color: var(--text-white);
  font-weight: 700;
  cursor: pointer;
}

.pack-rules ol {
  margin: 10px 0 0;
  padding-left: 20px;
}

.pack-rules li {
  margin-bottom: 6px;
}

.pack-details > :not(summary) {
  margin-top: 12px;
}

.pack-toolbar {
  display: flex;
  margin-bottom: 16px;
}

.pack-toolbar .action-btn {
  flex: 0 0 auto;
}

.pack-banner {
  margin-bottom: 14px;
  padding: 14px;
  border-radius: 14px;
  color: var(--text-white);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 2px;
  text-align: center;
  text-transform: uppercase;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  box-shadow: inset 0 0 20px var(--border-strong);
}

.pack-banner.is-p1 {
  background: var(--color-player);
}

.pack-banner.is-p2 {
  background: var(--color-opponent);
}

.pack-banner.is-done {
  background: var(--color-proceed);
}

.pack-banner-hero {
  letter-spacing: 1px;
}

.pack-status {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-bottom: 8px;
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.pack-hint {
  margin: 0 0 12px;
  color: var(--text-light);
  font-size: 14px;
  font-weight: 600;
}

.pack-actions {
  display: flex;
  margin: 16px 0;
}

.pack-actions .action-btn {
  flex: 1 1 auto;
}

.pack-empty {
  margin-bottom: 0;
  font-style: italic;
}

.pack-summary {
  padding: 14px;
  background: rgba(var(--bg-dark-rgb), 0.6);
  border: 1px solid var(--border-light);
  border-radius: 14px;
}

.pack-summary.is-p1 {
  border-color: rgba(var(--color-player-rgb), 0.6);
}

.pack-summary.is-p2 {
  border-color: rgba(var(--color-opponent-rgb), 0.6);
}

.pack-summary h3 {
  margin: 0 0 12px;
  color: var(--text-white);
  font-size: 15px;
  font-weight: 800;
  text-transform: uppercase;
}

.pack-save {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.pack-save .search-field {
  flex: 1 1 160px;
}

.pack-save .action-btn {
  flex: 0 0 auto;
}

.pack-saved {
  color: var(--color-success-light);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.pack-summary-title {
  margin: 14px 0 10px;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}
</style>
