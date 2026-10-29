<template>
  <div class="pack-page container">
    <template v-if="!started">
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

      <OnlinePanel />
    </template>

    <div class="pack-topbar">
      <div class="pack-banner" :class="banner.cls">
        {{ banner.text }}
        <span v-if="banner.hero" class="pack-banner-hero">
          · {{ banner.hero }}
        </span>
      </div>
      <button
        v-if="!isGuest"
        class="btn btn-danger btn-sm action-btn"
        :class="{ 'is-confirming': confirmingRestart }"
        @click="onRestart"
      >
        {{ confirmingRestart ? t("packRestartConfirm") : t("packRestart") }}
      </button>
      <button
        v-if="netState.role"
        class="btn btn-sm btn-outline-secondary action-btn"
        @click="leaveRoom"
      >
        {{ t("onlineLeave") }}
      </button>
      <button
        class="btn btn-sm btn-outline-secondary action-btn"
        :title="lang === 'ua' ? 'Повідомити про баг' : 'Report a bug'"
        @click="openFeedback({ section: 'pack-draft' })"
      >
        🐞
      </button>
    </div>

    <template v-if="state.phase === 'heroes'">
      <p v-if="!canAct" class="pack-hint">{{ t("onlineWaitMove") }}</p>
      <div class="row g-3">
        <div
          v-for="hero in heroes"
          :key="hero.id"
          class="col-12 col-sm-6 col-lg-3"
        >
          <PackHeroCard
            :hero="hero"
            :owner="heroOwner(hero.id)"
            :clickable="!heroOwner(hero.id) && canAct"
            @select="pickHero"
          />
        </div>
      </div>
    </template>

    <template v-else-if="state.phase === 'draft'">
      <div class="row g-3">
        <div class="col-12 col-xl-9">
          <div class="pack-stats">
            <div class="pack-stat">
              <span class="pack-stat-label">{{ t("packStatRound") }}</span>
              <span class="pack-stat-value">
                {{ packRound.current }}
                <small>/ {{ packRound.total }}</small>
              </span>
            </div>
            <div class="pack-stat">
              <span class="pack-stat-label">{{ t("packStatPack") }}</span>
              <span class="pack-stat-value">{{ currentPackSize }}</span>
            </div>
            <div class="pack-stat">
              <span class="pack-stat-label">{{ t("packStatKept") }}</span>
              <span class="pack-stat-value">
                {{ state.kept[viewSeat].length }}
                <small>/ {{ state.kept[otherSeat].length }}</small>
              </span>
            </div>
          </div>

          <p v-if="!canAct" class="pack-hint">{{ t("onlineWaitMove") }}</p>
          <p v-else class="pack-hint">
            {{
              needed > 0
                ? t("packMarkHint").replace("{n}", needed)
                : t("packMarkHintLast")
            }}
          </p>

          <div v-if="canAct" class="row g-2 pack-grid">
            <div
              v-for="card in currentPack"
              :key="card.id"
              class="col-4 col-sm-3 col-lg-2"
            >
              <PackCard
                :card="card"
                :mark="markOf(card.id)"
                :dead="isDeadCard(card, state.turn)"
                clickable
                @select="toggleMenu"
              >
                <template #overlay>
                  <div v-if="menuId === card.id" class="pack-menu" @click.stop>
                    <button
                      type="button"
                      class="pack-menu-btn is-keep"
                      @click="chooseMark(card.id, 'keep')"
                    >
                      {{ t("packMarkKeep") }}
                    </button>
                    <button
                      v-if="needed > 0"
                      type="button"
                      class="pack-menu-btn is-discard"
                      @click="chooseMark(card.id, 'discard')"
                    >
                      {{ t("packMarkDiscard") }}
                    </button>
                    <button
                      v-if="markOf(card.id)"
                      type="button"
                      class="pack-menu-btn"
                      @click="chooseMark(card.id, '')"
                    >
                      {{ t("packClearMark") }}
                    </button>
                  </div>
                </template>
              </PackCard>
            </div>
          </div>

          <div v-if="canAct" class="pack-confirm">
            <span class="pack-confirm-info">
              {{ t("packMarkedKeep") }}: {{ marks.keep ? 1 : 0 }}/1 ·
              {{ t("packMarkedDiscard") }}: {{ marks.discard.length }}/{{
                needed
              }}
            </span>
            <button
              v-if="turnReady"
              class="btn btn-success action-btn"
              @click="confirmTurn"
            >
              {{ t("packConfirmTurn") }}
            </button>
          </div>
        </div>

        <div class="col-12 col-xl-3">
          <aside class="pack-side">
            <div class="pack-tabs">
              <button
                v-for="tab in sideTabs"
                :key="tab.id"
                type="button"
                class="pack-tab"
                :class="{ 'is-active': sideTab === tab.id }"
                @click="sideTab = tab.id"
              >
                {{ t(tab.label) }}
                <span v-if="tab.count !== null">({{ tab.count }})</span>
              </button>
            </div>

            <div v-if="sideTab === 'heroes'" class="pack-side-body">
              <div
                v-for="player in players"
                :key="player"
                class="pack-side-hero"
                :class="'is-' + player"
              >
                <div class="pack-side-title">{{ playerTag(player) }}</div>
                <template v-if="playerHeroes[player]">
                  <div class="pack-side-hero-head">
                    <img
                      v-if="playerHeroes[player].image"
                      :src="playerHeroes[player].image"
                      :alt="playerHeroes[player].name"
                    />
                    <div>
                      <div class="pack-side-hero-name">
                        {{ playerHeroes[player].name }}
                      </div>
                      <div class="pack-side-hero-stats">
                        {{ t("packHp") }} {{ playerHeroes[player].hp }} ·
                        {{ t("packMove") }} {{ playerHeroes[player].move }} ·
                        {{
                          t(
                            "packAttack" +
                              playerHeroes[player].attack
                                .charAt(0)
                                .toUpperCase() +
                              playerHeroes[player].attack.slice(1),
                          )
                        }}
                      </div>
                    </div>
                  </div>
                  <p class="pack-side-passive">
                    <b>{{ playerHeroes[player].passive.name }}:</b>
                    {{
                      playerHeroes[player].passive.text[lang] ||
                      playerHeroes[player].passive.text.en
                    }}
                  </p>
                </template>
              </div>
            </div>

            <div v-else-if="sideTab === 'kept'" class="pack-side-body">
              <div v-for="player in players" :key="player">
                <div class="pack-side-title">
                  {{ playerTag(player) }} ({{ keptCards[player].length }})
                </div>
                <p v-if="!keptCards[player].length" class="pack-empty">
                  {{ t("packEmptyList") }}
                </p>
                <div v-else class="row g-1">
                  <div
                    v-for="card in keptCards[player]"
                    :key="card.id"
                    class="col-4 col-xl-6"
                  >
                    <PackCard :card="card" :dead="isDeadCard(card, player)" />
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="pack-side-body">
              <p v-if="!discardedCards.length" class="pack-empty">
                {{ t("packEmptyList") }}
              </p>
              <div v-else class="row g-1">
                <div
                  v-for="card in discardedCards"
                  :key="card.id"
                  class="col-4 col-xl-6"
                >
                  <PackCard :card="card" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </template>

    <template v-else-if="state.phase === 'deck'">
      <p v-if="!canAct" class="pack-hint">{{ t("onlineWaitMove") }}</p>
      <p v-else class="pack-hint">
        {{ t("packDeckHint").replace("{n}", config.deckSize) }}
      </p>
      <div v-if="canAct" class="pack-status">
        <span>
          {{ t("packDeckCount") }}: {{ state.deckSelection.length }} /
          {{ config.deckSize }}
        </span>
      </div>

      <div v-if="canAct" class="row g-2 g-md-3">
        <div
          v-for="card in deckPoolCards"
          :key="card.id"
          class="col-4 col-sm-3 col-lg-2"
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

      <div v-if="canAct" class="pack-actions">
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

      <div class="row g-3">
        <div v-for="player in players" :key="player" class="col-12 col-lg-6">
          <div class="pack-summary" :class="'is-' + player">
            <h3>{{ t(player === "p1" ? "packPlayer1" : "packPlayer2") }}</h3>
            <div class="pack-mini-hero">
              <img
                v-if="playerHeroes[player].image"
                :src="playerHeroes[player].image"
                :alt="playerHeroes[player].name"
              />
              <div class="pack-mini-hero-info">
                <div class="pack-mini-hero-name">
                  {{ playerHeroes[player].name }}
                </div>
                <div class="pack-mini-hero-stats">
                  {{ t("packHp") }} {{ playerHeroes[player].hp }} ·
                  {{ t("packMove") }} {{ playerHeroes[player].move }} ·
                  {{
                    t("packAttack" + capitalize(playerHeroes[player].attack))
                  }}
                </div>
                <details class="pack-mini-hero-passive">
                  <summary>
                    {{ t("packPassive") }}:
                    {{ playerHeroes[player].passive.name }}
                  </summary>
                  <p>
                    {{
                      playerHeroes[player].passive.text[lang] ||
                      playerHeroes[player].passive.text.en
                    }}
                  </p>
                </details>
              </div>
            </div>

            <div v-if="canSave(player)" class="pack-save">
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
            <div class="pack-thumbs">
              <PackCard
                v-for="card in deckCards[player]"
                :key="card.id"
                :card="card"
                :dead="isDeadCard(card, player)"
              />
            </div>

            <details v-if="setAsideCards[player].length" class="pack-details">
              <summary>
                {{ t("packSetAside") }} ({{ setAsideCards[player].length }})
              </summary>
              <div class="pack-thumbs">
                <PackCard
                  v-for="card in setAsideCards[player]"
                  :key="card.id"
                  :card="card"
                />
              </div>
            </details>
          </div>
        </div>
      </div>

      <details class="pack-details">
        <summary>
          {{ t("packDiscardPile") }} ({{ discardedCards.length }})
        </summary>
        <div class="pack-thumbs">
          <div v-for="card in discardedCards" :key="card.id">
            <PackCard :card="card" />
          </div>
        </div>
      </details>

      <div v-if="!isGuest" class="pack-actions">
        <button class="btn btn-primary action-btn" @click="restart">
          {{ t("packNewDraft") }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { usePackDraft } from "../../composables/usePackDraft";
import PackCard from "../PackCard.vue";
import PackHeroCard from "../PackHeroCard.vue";
import OnlinePanel from "../OnlinePanel.vue";
import { useOnline } from "../../composables/useOnline";
import { useSavedDecks } from "../../composables/useSavedDecks";
import { useFeedback } from "../../composables/useFeedback";

const { t, lang } = useDraftState();
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
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
  marks,
  needed,
  turnReady,
  canAct,
  viewSeat,
  packRound,
  pickHero,
  setMark,
  confirmTurn,
  toggleDeckCard,
  confirmDeck,
  restart,
  isDeadCard,
} = usePackDraft();

const { isGuest, online, mySeat, net: netState, leave: leaveRoom } = useOnline();
const { openFeedback } = useFeedback();
const menuId = ref(null);
const sideTab = ref("heroes");
const otherSeat = computed(() => (viewSeat.value === "p1" ? "p2" : "p1"));
const currentPackSize = computed(
  () => (state.packs[state.holding[state.turn]] || []).length,
);
const sideTabs = computed(() => [
  { id: "heroes", label: "packTabHeroes", count: null },
  {
    id: "kept",
    label: "packTabKept",
    count: state.kept.p1.length + state.kept.p2.length,
  },
  { id: "discard", label: "packTabDiscard", count: state.discarded.length },
]);

const markOf = (cardId) =>
  marks.value.keep === cardId
    ? "keep"
    : marks.value.discard.includes(cardId)
      ? "discard"
      : "";

function toggleMenu(cardId) {
  menuId.value = menuId.value === cardId ? null : cardId;
}

function chooseMark(cardId, mode) {
  setMark(cardId, mode);
  menuId.value = null;
}

watch(
  () => [state.turn, state.holding.p1, state.holding.p2, state.phase],
  () => {
    menuId.value = null;
  },
);

const playerTag = (player) =>
  playerLabelText(player) +
  (online.value && mySeat.value === player ? ` · ${t("packYou")}` : "");
const { saveDeck } = useSavedDecks();
const canSave = (player) => !online.value || mySeat.value === player;
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
// Вступ (заголовок, правила, режим гри) показуємо лише до початку драфту.
const started = computed(
  () => state.phase !== "heroes" || Boolean(state.heroes.p1),
);

// Одна рядкова плашка: чий зараз хід / що робити.
const banner = computed(() => {
  if (state.phase === "heroes") {
    return {
      cls: "is-" + pickerPlayer.value,
      text: replacePlayer("packPickHero", pickerPlayer.value),
      hero: "",
    };
  }
  if (state.phase === "draft") {
    return {
      cls: "is-" + state.turn,
      text: replacePlayer("packTurnOf", state.turn),
      hero: playerHeroes.value[state.turn]?.name || "",
    };
  }
  if (state.phase === "deck") {
    return {
      cls: "is-" + state.deckPlayer,
      text: replacePlayer("packDeckTitle", state.deckPlayer),
      hero: "",
    };
  }
  return { cls: "is-done", text: t("packDoneTitle"), hero: "" };
});

const confirmingRestart = ref(false);
let confirmTimer = null;

const heroOwner = (heroId) =>
  players.find((player) => state.heroes[player] === heroId) || "";

const playerLabelText = (player) =>
  t(player === "p1" ? "packPlayer1" : "packPlayer2");

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

.pack-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.pack-topbar .pack-banner {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  padding: 9px 14px;
  font-size: 13px;
  letter-spacing: 1.5px;
}

.pack-topbar .action-btn {
  flex: 0 0 auto;
  white-space: nowrap;
}

@media (max-width: 575px) {
  .pack-topbar {
    flex-wrap: wrap;
  }

  .pack-topbar .pack-banner {
    flex-basis: 100%;
  }
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

.pack-mini-hero {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}

.pack-mini-hero img {
  flex: 0 0 auto;
  width: 64px;
  height: 64px;
  object-fit: cover;
  object-position: top;
  border-radius: 50%;
  border: 2px solid var(--border-medium);
}

.pack-mini-hero-name {
  color: var(--text-white);
  font-size: 16px;
  font-weight: 800;
}

.pack-mini-hero-stats {
  color: var(--text-dim);
  font-size: 12px;
}

.pack-mini-hero-passive {
  margin-top: 4px;
  color: var(--text-light);
  font-size: 12px;
}

.pack-mini-hero-passive p {
  margin: 4px 0 0;
}

.pack-thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 6px;
}

.pack-summary-title {
  margin: 14px 0 10px;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.pack-grid :deep(.pack-card.is-image:hover:not(:has(.pack-menu))) {
  z-index: 6;
  transform: scale(1.5);
}

.pack-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.pack-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  border-radius: 12px;
  border: 1px solid var(--border-light);
  background: rgba(var(--bg-slate-rgb), 0.8);
}

.pack-stat-label {
  color: var(--text-dim);
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 1px;
  text-align: center;
  text-transform: uppercase;
}

.pack-stat-value {
  color: var(--text-white);
  font-size: 24px;
  font-weight: 900;
  line-height: 1.2;
}

.pack-stat-value small {
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 700;
}

.pack-menu {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 10%;
  background: rgba(var(--bg-dark-rgb), 0.78);
}

.pack-menu-btn {
  padding: 8px 4px;
  border-radius: 10px;
  border: 2px solid var(--border-medium);
  background: rgba(var(--bg-slate-rgb), 0.95);
  color: var(--text-white);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.pack-menu-btn.is-keep {
  border-color: var(--color-success-light);
  color: var(--color-success-light);
}

.pack-menu-btn.is-discard {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.pack-confirm {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-medium);
  background: rgba(var(--bg-dark-rgb), 0.95);
}

.pack-confirm-info {
  flex: 1 1 auto;
  color: var(--text-light);
  font-size: 13px;
  font-weight: 700;
}

.pack-side {
  position: sticky;
  top: 12px;
  border-radius: 12px;
  border: 1px solid var(--border-medium);
  background: rgba(var(--bg-slate-rgb), 0.8);
  overflow: hidden;
}

.pack-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-light);
}

.pack-tab {
  flex: 1 1 0;
  padding: 10px 4px;
  border: 0;
  background: transparent;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.pack-tab.is-active {
  background: rgba(var(--color-proceed-rgb), 0.15);
  color: var(--color-proceed);
  box-shadow: inset 0 -2px 0 var(--color-proceed);
}

.pack-side-body {
  max-height: 70vh;
  overflow-y: auto;
  padding: 10px;
}

.pack-side-title {
  margin: 6px 0;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.pack-side-hero {
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
}

.pack-side-hero.is-p1 {
  border-color: rgba(var(--color-player-rgb), 0.6);
}

.pack-side-hero.is-p2 {
  border-color: rgba(var(--color-opponent-rgb), 0.6);
}

.pack-side-hero-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pack-side-hero-head img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
}

.pack-side-hero-name {
  color: var(--text-white);
  font-size: 15px;
  font-weight: 800;
}

.pack-side-hero-stats {
  color: var(--text-dim);
  font-size: 11.5px;
  font-weight: 700;
}

.pack-side-passive {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.4;
}
</style>
