import { reactive, computed } from "vue";
import {
  PACK_DRAFT_CONFIG,
  packDraftHeroes,
  buildAllCards,
} from "../packDraftData.js";

const STORAGE_KEY = "unmatched_pack_draft_v1";
const PLAYERS = ["p1", "p2"];

const allCards = buildAllCards();
const cardById = new Map(allCards.map((card) => [card.id, card]));
const heroById = new Map(packDraftHeroes.map((hero) => [hero.id, hero]));

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createState() {
  const ids = shuffle(allCards.map((card) => card.id));
  const { packSize, packCount } = PACK_DRAFT_CONFIG;
  const packsTotal = Math.min(packCount, Math.floor(ids.length / packSize));
  const packsUsed = packsTotal - (packsTotal % 2);
  const packs = [];
  for (let i = 0; i < packsUsed; i++) {
    packs.push(ids.slice(i * packSize, (i + 1) * packSize));
  }

  return {
    phase: "heroes",
    heroes: { p1: null, p2: null },
    packs,
    leftover: ids.slice(packsUsed * packSize),
    pairIndex: 0,
    holding: { p1: 0, p2: 1 },
    turn: "p1",
    stage: "keep",
    discardsLeft: 0,
    pending: null,
    kept: { p1: [], p2: [] },
    discarded: [],
    decks: { p1: [], p2: [] },
    deckPlayer: "p1",
    deckSelection: [],
  };
}

function isValid(saved) {
  if (!saved || typeof saved !== "object" || !Array.isArray(saved.packs)) {
    return false;
  }
  const ids = [
    ...saved.packs.flat(),
    ...(saved.leftover || []),
    ...(saved.discarded || []),
    ...(saved.kept?.p1 || []),
    ...(saved.kept?.p2 || []),
  ];
  return (
    ["heroes", "draft", "deck", "done"].includes(saved.phase) &&
    saved.heroes &&
    saved.kept &&
    saved.decks &&
    ids.length === allCards.length &&
    ids.every((id) => cardById.has(id))
  );
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (isValid(saved)) return saved;
  } catch {
    return createState();
  }
  return createState();
}

const state = reactive(load());

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

function otherPlayer(player) {
  return player === "p1" ? "p2" : "p1";
}

function pairsTotal() {
  return state.packs.length / 2;
}

function startDeckPhase() {
  const { deckSize } = PACK_DRAFT_CONFIG;
  for (const player of PLAYERS) {
    if (state.kept[player].length <= deckSize) {
      state.decks[player] = [...state.kept[player]];
    }
  }
  const next = PLAYERS.find((player) => state.kept[player].length > deckSize);
  state.deckSelection = [];
  if (next) {
    state.deckPlayer = next;
    state.phase = "deck";
  } else {
    state.phase = "done";
  }
}

function advance() {
  state.stage = "keep";
  state.pending = null;
  state.discardsLeft = 0;

  for (let guard = 0; guard < 4; guard++) {
    const a = state.packs[state.holding.p1];
    const b = state.packs[state.holding.p2];

    if (!a.length && !b.length) {
      state.pairIndex += 1;
      if (state.pairIndex >= pairsTotal()) {
        startDeckPhase();
        return;
      }
      state.holding = { p1: state.pairIndex * 2, p2: state.pairIndex * 2 + 1 };
      state.turn = "p1";
      return;
    }

    if (state.packs[state.holding[state.turn]].length) return;
    state.turn = otherPlayer(state.turn);
  }
}

function finishTurn() {
  if (state.turn === "p1") {
    state.turn = "p2";
  } else {
    state.holding = { p1: state.holding.p2, p2: state.holding.p1 };
    state.turn = "p1";
  }
  advance();
}

export function usePackDraft() {
  const config = PACK_DRAFT_CONFIG;

  const currentPack = computed(() =>
    state.phase === "draft"
      ? state.packs[state.holding[state.turn]].map((id) => cardById.get(id))
      : [],
  );

  const keptCards = computed(() => ({
    p1: state.kept.p1.map((id) => cardById.get(id)),
    p2: state.kept.p2.map((id) => cardById.get(id)),
  }));

  const discardedCards = computed(() =>
    state.discarded.map((id) => cardById.get(id)),
  );

  const leftoverCards = computed(() =>
    state.leftover.map((id) => cardById.get(id)),
  );

  const deckCards = computed(() => ({
    p1: state.decks.p1.map((id) => cardById.get(id)),
    p2: state.decks.p2.map((id) => cardById.get(id)),
  }));

  const setAsideCards = computed(() => {
    const result = {};
    for (const player of PLAYERS) {
      const deck = new Set(state.decks[player]);
      result[player] = state.kept[player]
        .filter((id) => !deck.has(id))
        .map((id) => cardById.get(id));
    }
    return result;
  });

  const deckPoolCards = computed(() =>
    state.phase === "deck"
      ? state.kept[state.deckPlayer].map((id) => cardById.get(id))
      : [],
  );

  const pickerPlayer = computed(() => (state.heroes.p1 ? "p2" : "p1"));

  const availableHeroes = computed(() => {
    const taken = Object.values(state.heroes);
    return packDraftHeroes.filter((hero) => !taken.includes(hero.id));
  });

  const playerHeroes = computed(() => ({
    p1: heroById.get(state.heroes.p1) || null,
    p2: heroById.get(state.heroes.p2) || null,
  }));

  const packRound = computed(() => ({
    current: Math.min(state.pairIndex + 1, pairsTotal()),
    total: pairsTotal(),
  }));

  const pendingCard = computed(() =>
    state.pending ? cardById.get(state.pending) : null,
  );

  function pickHero(heroId) {
    if (state.phase !== "heroes") return;
    if (!availableHeroes.value.some((hero) => hero.id === heroId)) return;
    state.heroes[pickerPlayer.value] = heroId;
    if (state.heroes.p1 && state.heroes.p2) {
      state.phase = "draft";
      advance();
    }
    save();
  }

  function selectCard(cardId) {
    if (state.phase !== "draft") return;
    state.pending = state.pending === cardId ? null : cardId;
  }

  function confirmCard() {
    if (state.phase !== "draft" || !state.pending) return;
    const pack = state.packs[state.holding[state.turn]];
    const index = pack.indexOf(state.pending);
    if (index === -1) return;
    pack.splice(index, 1);

    if (state.stage === "keep") {
      state.kept[state.turn].push(state.pending);
      state.discardsLeft = Math.min(config.discardPerTurn, pack.length);
      state.pending = null;
      if (state.discardsLeft > 0) {
        state.stage = "discard";
        save();
        return;
      }
      finishTurn();
      save();
      return;
    }

    state.discarded.push(state.pending);
    state.discardsLeft -= 1;
    state.pending = null;
    if (state.discardsLeft <= 0) finishTurn();
    save();
  }

  function toggleDeckCard(cardId) {
    if (state.phase !== "deck") return;
    const index = state.deckSelection.indexOf(cardId);
    if (index !== -1) {
      state.deckSelection.splice(index, 1);
    } else if (state.deckSelection.length < config.deckSize) {
      state.deckSelection.push(cardId);
    }
    save();
  }

  function confirmDeck() {
    if (state.phase !== "deck") return;
    if (state.deckSelection.length !== config.deckSize) return;
    state.decks[state.deckPlayer] = [...state.deckSelection];
    startDeckPhase();
    save();
  }

  function restart() {
    Object.assign(state, createState());
    save();
  }

  function isDeadCard(card, player) {
    if (card.kind !== "sidekick") return false;
    const sidekick = playerHeroes.value[player]?.sidekick;
    return !sidekick || sidekick.name !== card.sidekick;
  }

  return {
    state,
    config,
    heroes: packDraftHeroes,
    currentPack,
    keptCards,
    discardedCards,
    leftoverCards,
    deckCards,
    setAsideCards,
    deckPoolCards,
    pickerPlayer,
    availableHeroes,
    playerHeroes,
    packRound,
    pendingCard,
    pickHero,
    selectCard,
    confirmCard,
    toggleDeckCard,
    confirmDeck,
    restart,
    isDeadCard,
  };
}
