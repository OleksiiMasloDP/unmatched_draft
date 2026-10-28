<template>
  <div class="game-page container">
    <template v-if="game.phase === 'setup'">
      <div class="game-title-row">
        <h1 class="page-main-title">{{ t("gameTitle") }}</h1>
        <span class="game-beta">{{ t("packBeta") }}</span>
      </div>

      <div class="game-note">{{ t("gameTestNote") }}</div>
    </template>

    <OnlinePanel
      v-if="game.phase === 'setup' || netState.status === 'closed'"
    />

    <template v-if="game.phase === 'setup'">
      <div class="game-setup">
        <h2 class="game-subtitle">{{ t("gameMapLabel") }}</h2>
        <div class="map-tiles">
          <button
            v-for="item in maps"
            :key="item.id"
            type="button"
            class="map-tile"
            :class="{ 'is-selected': game.mapId === item.id }"
            :disabled="isGuest"
            @click="setMap(item.id)"
          >
            <img :src="item.image" :alt="item.name" />
            <span>{{ item.name }}</span>
          </button>
        </div>

        <div
          v-for="player in setupPlayers"
          :key="player"
          class="game-setup-row"
        >
          <h2 class="game-subtitle">
            {{ playerLabel(player) }} · {{ t("gameDeckLabel") }}
          </h2>
          <div class="deck-tiles">
            <div
              v-for="deck in allDecks"
              :key="deck.id"
              class="deck-tile"
              :class="{ 'is-selected': selected[player] === deck.id }"
              role="button"
              tabindex="0"
              :data-deck="deck.id"
              @click="selected[player] = deck.id"
              @keyup.enter="selected[player] = deck.id"
            >
              <img
                v-if="getHero(deck.heroId).image"
                :src="getHero(deck.heroId).image"
                :alt="getHero(deck.heroId).name"
              />
              <div class="deck-tile-info">
                <div class="deck-name">
                  {{ deck.name }}
                  <span v-if="deck.isTest" class="deck-test">
                    {{ t("gameTestDeck") }}
                  </span>
                </div>
                <div class="deck-meta">{{ deckMeta(deck) }}</div>
              </div>
              <button
                v-if="!deck.isTest"
                type="button"
                class="btn btn-danger btn-sm deck-delete"
                :class="{ 'is-confirming': pendingDeleteId === deck.id }"
                @click.stop="onDelete(deck.id)"
              >
                {{
                  pendingDeleteId === deck.id ? t("formatsDeleteConfirm") : "×"
                }}
              </button>
            </div>
          </div>
        </div>

        <p v-if="!savedDecks.length" class="game-empty">
          {{ t("gameNoSaved") }}
          <router-link :to="{ name: 'pack-draft' }">
            {{ t("packDraftTitle") }}
          </router-link>
        </p>

        <template v-if="online">
          <button
            class="btn btn-primary btn-sm action-btn"
            @click="onChooseDeck"
          >
            {{
              game.lobby[mySeat]
                ? t("onlineChangeDeck")
                : t("onlineConfirmDeck")
            }}
          </button>
          <div v-for="player in players" :key="player" class="game-lobby-line">
            {{ playerLabel(player) }}:
            {{
              game.lobby[player]
                ? `${t("onlineDeckReady")} · ${game.lobby[player].name} (${getHero(game.lobby[player].heroId).name})`
                : t("onlineNotReady")
            }}
          </div>
          <button
            v-if="isHost"
            class="btn btn-success btn-sm action-btn"
            :disabled="!game.lobby.p1 || !game.lobby.p2"
            @click="startOnlineGame"
          >
            {{ t("gameStart") }}
          </button>
          <p v-else class="game-prompt-line">{{ t("onlineWaitHost") }}</p>
        </template>
        <button
          v-else
          class="btn btn-success btn-sm action-btn game-start"
          @click="onStart"
        >
          {{ t("gameStart") }}
        </button>
      </div>
    </template>

    <template v-else>
      <div
        class="game-banner"
        :class="game.phase === 'over' ? 'is-done' : 'is-' + game.turn"
      >
        <template v-if="game.phase === 'over'">
          {{ replacePlayer("gameWinner", game.winner) }}
        </template>
        <template v-else>
          {{ replacePlayer("gameTurnOf", game.turn) }} ·
          {{ t("gameActionsLeft").replace("{n}", game.actions) }}
        </template>
      </div>

      <p v-if="waitingOpponent" class="game-prompt-line">
        {{ t("onlineWaitMove") }}
      </p>

      <p v-if="spacePrompt" class="game-prompt-line">
        {{ promptTitle(spacePrompt) }}
        <button
          v-if="spacePrompt.boostOptions && spacePrompt.boostOptions.length"
          class="btn btn-sm btn-warning game-boost"
          @click="boostOpen = true"
        >
          {{ t("gameBoost") }}
        </button>
        <button class="btn btn-sm game-skip" @click="answerPrompt(null)">
          {{ t("gameSkip") }}
        </button>
      </p>

      <div class="row g-3">
        <div class="col-12 col-lg-8">
          <GameBoard
            :map="map"
            :players="game.players"
            :options="spacePrompt ? spacePrompt.options : []"
            @select="answerPrompt"
          />

          <div class="game-actions">
            <button
              class="btn btn-success btn-sm action-btn"
              :disabled="!available.maneuver"
              @click="doManeuver"
            >
              {{ t("gameManeuver") }}
            </button>
            <button
              class="btn btn-warning btn-sm action-btn"
              :disabled="!available.scheme"
              @click="doScheme"
            >
              {{ t("gameScheme") }}
            </button>
            <button
              class="btn btn-danger btn-sm action-btn"
              :disabled="!available.attack"
              @click="doAttack"
            >
              {{ t("gameAttack") }}
            </button>
          </div>
        </div>

        <div class="col-12 col-lg-4">
          <div
            v-for="player in players"
            :key="player"
            class="game-player"
            :class="'is-' + player"
          >
            <div class="game-player-head">
              <span class="game-player-name">{{ playerLabel(player) }}</span>
              <span class="game-player-hero">
                {{ heroOf(player).name }}
              </span>
            </div>
            <div class="game-hp">
              <div
                class="game-hp-fill"
                :style="{
                  width:
                    (game.players[player].hp / game.players[player].maxHp) *
                      100 +
                    '%',
                }"
              ></div>
            </div>
            <div class="game-player-stats">
              <span>
                {{ t("gameHp") }} {{ game.players[player].hp }}/{{
                  game.players[player].maxHp
                }}
              </span>
              <span>
                {{ t("gameHand") }} {{ game.players[player].hand.length }}
              </span>
              <span>
                {{ t("gameDeck") }} {{ game.players[player].deck.length }}
              </span>
              <span>
                {{ t("gameDiscard") }} {{ game.players[player].discard.length }}
              </span>
            </div>
            <div class="game-player-passive">
              {{ heroOf(player).passive.name }}:
              {{
                heroOf(player).passive.text[lang] ||
                heroOf(player).passive.text.en
              }}
            </div>
          </div>

          <div class="game-log">
            <div class="game-log-title">{{ t("gameLog") }}</div>
            <div
              v-for="(entry, index) in recentLog"
              :key="index"
              class="game-log-line"
            >
              {{ formatLog(entry) }}
            </div>
          </div>
        </div>
      </div>

      <h2 class="game-subtitle">
        {{ t("gameYourHand") }} · {{ playerLabel(viewer) }}
      </h2>
      <div class="row g-2 g-md-3">
        <div
          v-for="card in handCards"
          :key="card.id"
          class="col-4 col-md-3 col-lg-2"
        >
          <PackCard :card="card" />
        </div>
      </div>

      <div class="game-actions">
        <button
          v-if="!isGuest"
          class="btn btn-danger btn-sm action-btn"
          @click="onNewGame"
        >
          {{ t("gameNewGame") }}
        </button>
        <button
          v-if="netState.role"
          class="btn btn-sm action-btn game-leave"
          @click="leaveRoom"
        >
          {{ t("onlineLeave") }}
        </button>
      </div>

      <div v-if="boostOpen && spacePrompt && !needsPass" class="game-modal">
        <div class="game-modal-box">
          <h3 class="game-modal-title">{{ promptTitle(boostPrompt) }}</h3>
          <div class="row g-2">
            <div
              v-for="card in boostCards"
              :key="card.id"
              class="col-6 col-md-3"
            >
              <PackCard :card="card" clickable @select="onBoost" />
            </div>
          </div>
          <div class="game-modal-actions">
            <button class="btn btn-sm action-btn" @click="boostOpen = false">
              {{ t("gameCancel") }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="blockingPrompt && !needsPass" class="game-modal">
        <div class="game-modal-box">
          <h3 class="game-modal-title">{{ promptTitle(blockingPrompt) }}</h3>

          <template v-if="blockingPrompt.kind === 'cards'">
            <div class="row g-2">
              <div
                v-for="card in promptCards"
                :key="card.id"
                class="col-6 col-md-3"
              >
                <PackCard
                  :card="card"
                  :selected="selection.includes(card.id)"
                  clickable
                  @select="toggleSelection"
                />
              </div>
            </div>
            <div class="game-modal-actions">
              <button
                class="btn btn-success btn-sm action-btn"
                :disabled="selection.length < blockingPrompt.min"
                @click="confirmCards"
              >
                {{
                  selection.length ? t("gameConfirm") : t(blockingPrompt.skip)
                }}
                <template v-if="blockingPrompt.max > 1">
                  ({{ selection.length }}/{{ blockingPrompt.max }})
                </template>
              </button>
            </div>
          </template>

          <div
            v-else-if="blockingPrompt.kind === 'confirm'"
            class="game-modal-actions"
          >
            <button
              class="btn btn-success btn-sm action-btn"
              @click="answerPrompt(true)"
            >
              {{ t("gameYes") }}
            </button>
            <button
              class="btn btn-danger btn-sm action-btn"
              @click="answerPrompt(false)"
            >
              {{ t("gameNo") }}
            </button>
          </div>

          <div
            v-else-if="blockingPrompt.kind === 'choice'"
            class="game-modal-actions"
          >
            <button
              v-for="choice in blockingPrompt.choices"
              :key="choice.value"
              class="btn btn-primary btn-sm action-btn"
              @click="answerPrompt(choice.value)"
            >
              {{ t(choice.label) }}
            </button>
          </div>

          <template v-else-if="blockingPrompt.kind === 'info'">
            <div class="row g-3">
              <div
                v-for="side in ['attacker', 'defender']"
                :key="side"
                class="col-6"
              >
                <div class="reveal-label">
                  {{ t(side === "attacker" ? "gameAttacker" : "gameDefender") }}
                  · {{ playerLabel(blockingPrompt.combat[side]) }}
                </div>
                <PackCard v-if="revealCard(side)" :card="revealCard(side)" />
                <div v-else class="reveal-empty">{{ t("gameNoCard") }}</div>
                <div class="reveal-value">
                  {{ t("gameValue") }}:
                  {{
                    blockingPrompt.combat.values[blockingPrompt.combat[side]]
                  }}
                </div>
              </div>
            </div>
            <p class="reveal-result">
              {{
                blockingPrompt.combat.dealt
                  ? t("gameDamageDealt").replace(
                      "{n}",
                      blockingPrompt.combat.dealt,
                    )
                  : t("logNoDamage")
              }}
            </p>
            <div class="game-modal-actions">
              <button
                class="btn btn-success btn-sm action-btn"
                @click="answerPrompt()"
              >
                {{ t("gameConfirm") }}
              </button>
            </div>
          </template>
        </div>
      </div>

      <div v-if="needsPass" class="game-pass">
        <div class="game-pass-box">
          <h3>{{ replacePlayer("gamePassTitle", passTarget) }}</h3>
          <button
            class="btn btn-success btn-sm action-btn"
            @click="game.viewer = passTarget"
          >
            {{ replacePlayer("gamePassBtn", passTarget) }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { useGame } from "../../composables/useGame";
import { useSavedDecks } from "../../composables/useSavedDecks";
import { getCard, getHero, testDecks } from "../../gameDecks";
import GameBoard from "../GameBoard.vue";
import PackCard from "../PackCard.vue";
import OnlinePanel from "../OnlinePanel.vue";
import { useOnline } from "../../composables/useOnline";

const { t, lang } = useDraftState();
const {
  game,
  map,
  maps,
  setMap,
  startGame,
  startOnlineGame,
  chooseDeck,
  resetGame,
  answerPrompt,
  doManeuver,
  doScheme,
  doAttack,
  availableActions,
  heroOf,
} = useGame();
const { savedDecks, deleteDeck } = useSavedDecks();
const {
  net: netState,
  online,
  mySeat,
  isHost,
  isGuest,
  leave: leaveRoom,
} = useOnline();
const boostOpen = ref(false);

const players = ["p1", "p2"];
const allDecks = computed(() => [...testDecks, ...savedDecks.value]);
const selected = ref({ p1: testDecks[0].id, p2: testDecks[1].id });
const selection = ref([]);
const pendingDeleteId = ref(null);
let deleteTimer = null;

const available = computed(() => availableActions());

const playerLabel = (player) =>
  t(player === "p1" ? "packPlayer1" : "packPlayer2");

const replacePlayer = (key, player) =>
  t(key).replace("{player}", playerLabel(player));

const deckMeta = (deck) =>
  t("gameDeckMeta")
    .replace("{hero}", getHero(deck.heroId).name)
    .replace("{n}", deck.cardIds.length);

const setupPlayers = computed(() => (online.value ? [mySeat.value] : players));

const mine = (prompt) =>
  !online.value || prompt.player === null || prompt.player === mySeat.value;

const spacePrompt = computed(() =>
  game.prompt?.kind === "space" && mine(game.prompt) ? game.prompt : null,
);

const blockingPrompt = computed(() =>
  game.prompt && game.prompt.kind !== "space" && mine(game.prompt)
    ? game.prompt
    : null,
);

const waitingOpponent = computed(() => {
  if (!online.value || game.phase !== "play") return false;
  const owner = game.prompt ? game.prompt.player : game.turn;
  return owner !== null && owner !== mySeat.value;
});

const passTarget = computed(() => game.prompt?.player ?? game.turn);

const needsPass = computed(() => {
  if (online.value || game.phase !== "play") return false;
  const owner = game.prompt ? game.prompt.player : game.turn;
  return owner !== null && owner !== game.viewer;
});

const viewer = computed(() => (online.value ? mySeat.value : game.viewer));

const handCards = computed(() =>
  game.players[viewer.value]
    ? game.players[viewer.value].hand.map(getCard).filter(Boolean)
    : [],
);

const promptCards = computed(() =>
  blockingPrompt.value?.kind === "cards"
    ? blockingPrompt.value.options.map(getCard)
    : [],
);

const recentLog = computed(() => [...game.log].slice(-30).reverse());

watch(
  () => game.prompt,
  () => {
    selection.value = [];
    boostOpen.value = false;
  },
);

function promptTitle(prompt) {
  const title = t(prompt.title);
  return prompt.player ? `${playerLabel(prompt.player)}: ${title}` : title;
}

const boostPrompt = { title: "promptBoostMove", player: null };

const boostCards = computed(() =>
  spacePrompt.value?.boostOptions
    ? spacePrompt.value.boostOptions.map(getCard).filter(Boolean)
    : [],
);

function onBoost(cardId) {
  boostOpen.value = false;
  answerPrompt({ boost: cardId });
}

function toggleSelection(cardId) {
  const prompt = blockingPrompt.value;
  if (!prompt) return;
  const index = selection.value.indexOf(cardId);
  if (index !== -1) {
    selection.value.splice(index, 1);
  } else if (prompt.max === 1) {
    selection.value = [cardId];
  } else if (selection.value.length < prompt.max) {
    selection.value.push(cardId);
  }
}

function confirmCards() {
  answerPrompt([...selection.value]);
}

function revealCard(side) {
  const combat = blockingPrompt.value.combat;
  const id = combat.cardIds[combat[side]];
  return id ? getCard(id) : null;
}

function formatLog(entry) {
  let text = t(entry.key);
  for (const [name, value] of Object.entries(entry.params)) {
    let shown = value;
    if (["player", "attacker", "defender"].includes(name)) {
      shown = playerLabel(value);
    }
    text = text.replace(`{${name}}`, shown);
  }
  return text;
}

function onStart() {
  const find = (id) => allDecks.value.find((deck) => deck.id === id);
  startGame(find(selected.value.p1), find(selected.value.p2));
}

function onChooseDeck() {
  const deck = allDecks.value.find(
    (item) => item.id === selected.value[mySeat.value],
  );
  if (deck) chooseDeck(deck);
}

function onNewGame() {
  resetGame();
}

function onDelete(id) {
  if (pendingDeleteId.value !== id) {
    pendingDeleteId.value = id;
    clearTimeout(deleteTimer);
    deleteTimer = setTimeout(() => (pendingDeleteId.value = null), 3000);
    return;
  }
  clearTimeout(deleteTimer);
  pendingDeleteId.value = null;
  deleteDeck(id);
  for (const player of players) {
    if (selected.value[player] === id) {
      selected.value[player] = testDecks[0].id;
    }
  }
}
</script>

<style scoped>
.game-page {
  padding: 2rem 1rem;
}

.game-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.game-beta {
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

.game-note {
  margin: 8px 0 16px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(var(--color-info-rgb), 0.4);
  background: rgba(var(--bg-slate-rgb), 0.8);
  color: var(--text-muted);
  font-size: 12.5px;
}

.game-subtitle {
  margin: 20px 0 12px;
  color: var(--text-white);
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.game-setup {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
}

.game-setup-map {
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.game-setup-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.game-setup-row label {
  color: var(--text-light);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.game-setup .action-btn {
  flex: 0 0 auto;
  align-self: flex-start;
}

.game-empty {
  color: var(--text-dim);
  font-size: 13px;
  font-style: italic;
}

.deck-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.deck-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 16px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
}

.deck-name {
  color: var(--text-white);
  font-size: 15px;
  font-weight: 800;
}

.deck-meta {
  color: var(--text-dim);
  font-size: 12px;
}

.game-banner {
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

.game-banner.is-p1 {
  background: var(--color-player);
}

.game-banner.is-p2 {
  background: var(--color-opponent);
}

.game-banner.is-done {
  background: var(--color-proceed);
}

.map-tiles,
.deck-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.map-tile {
  width: 180px;
  padding: 6px;
  border-radius: 10px;
  border: 2px solid var(--border-light);
  background: rgba(var(--bg-slate-rgb), 0.8);
  color: var(--text-light);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.map-tile img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  margin-bottom: 4px;
  border-radius: 6px;
  object-fit: cover;
}

.map-tile.is-selected,
.deck-tile.is-selected {
  border-color: var(--color-proceed);
  background: rgba(var(--color-proceed-rgb), 0.12);
}

.map-tile:disabled {
  cursor: default;
}

.deck-tile {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 260px;
  padding: 8px 40px 8px 8px;
  border-radius: 10px;
  border: 2px solid var(--border-light);
  background: rgba(var(--bg-slate-rgb), 0.8);
  cursor: pointer;
}

.deck-tile img {
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
  object-position: top;
}

.deck-tile-info {
  min-width: 0;
}

.deck-test {
  margin-left: 4px;
  color: var(--color-info);
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.deck-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 0 8px;
  line-height: 1.4;
}

.game-start {
  margin-top: 16px;
}

.game-lobby-line {
  color: var(--text-muted);
  font-size: 13px;
}

.game-prompt-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(var(--color-proceed-rgb), 0.5);
  background: rgba(var(--bg-slate-rgb), 0.8);
  color: var(--text-white);
  font-size: 14px;
  font-weight: 700;
}

.game-skip {
  margin-left: auto;
  background: var(--bg-slate-hover);
  border: 1px solid var(--border-medium);
  color: var(--text-light);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.game-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 14px 0;
}

.game-player {
  margin-bottom: 12px;
  padding: 12px 14px;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 12px;
}

.game-player.is-p1 {
  border-color: rgba(var(--color-player-rgb), 0.7);
}

.game-player.is-p2 {
  border-color: rgba(var(--color-opponent-rgb), 0.7);
}

.game-player-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.game-player-name {
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.game-player-hero {
  color: var(--text-white);
  font-size: 14px;
  font-weight: 800;
}

.game-hp {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(var(--bg-dark-rgb), 0.9);
}

.game-hp-fill {
  height: 100%;
  background: var(--color-success);
  transition: width 0.3s ease;
}

.game-player-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 8px;
  color: var(--text-light);
  font-size: 12px;
  font-weight: 700;
}

.game-player-passive {
  margin-top: 8px;
  color: var(--text-dim);
  font-size: 11.5px;
  line-height: 1.4;
}

.game-log {
  max-height: 260px;
  overflow-y: auto;
  padding: 12px 14px;
  background: rgba(var(--bg-dark-rgb), 0.6);
  border: 1px solid var(--border-light);
  border-radius: 12px;
}

.game-log-title {
  margin-bottom: 6px;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.game-log-line {
  padding: 2px 0;
  color: var(--text-muted);
  font-size: 12px;
}

.game-modal,
.game-pass {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 24px 12px;
  background: rgba(var(--bg-dark-rgb), 0.9);
}

.game-pass {
  z-index: 2100;
  align-items: center;
  background: var(--bg-dark);
}

.game-modal-box,
.game-pass-box {
  width: 100%;
  max-width: 760px;
  padding: 18px;
  background: var(--bg-slate);
  border: 1px solid var(--border-medium);
  border-radius: 16px;
}

.game-pass-box {
  max-width: 420px;
  text-align: center;
}

.game-pass-box h3 {
  margin: 0 0 16px;
  color: var(--text-white);
  font-size: 18px;
  font-weight: 800;
}

.game-modal-title {
  margin: 0 0 14px;
  color: var(--text-white);
  font-size: 16px;
  font-weight: 800;
}

.game-modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.reveal-label {
  margin-bottom: 8px;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.reveal-empty {
  padding: 24px 12px;
  border: 1px dashed var(--border-medium);
  border-radius: 12px;
  color: var(--text-dim);
  text-align: center;
}

.reveal-value {
  margin-top: 8px;
  color: var(--text-white);
  font-size: 16px;
  font-weight: 800;
}

.reveal-result {
  margin: 14px 0 0;
  color: var(--color-warning);
  font-size: 14px;
  font-weight: 800;
}
</style>
