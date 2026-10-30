import { reactive, computed, ref } from "vue";
import { useOnline } from "./useOnline.js";
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
    picks: { p1: null, p2: null },
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
    if (isValid(saved)) {
      // Старий формат (ходи по черзі) без picks - починаємо драфт заново.
      if (!saved.picks) {
        if (saved.phase === "draft") return createState();
        saved.picks = { p1: null, p2: null };
      }
      return saved;
    }
  } catch {
    return createState();
  }
  return createState();
}

const state = reactive(load());
const marks = ref({ keep: null, discard: [] });
// Локальна гра: кому передати пристрій (ховаємо пак, поки гравець не підтвердить).
const passFor = ref(null);
const net = useOnline();

// Що бачить гравець онлайн: лише свій пак і лише свої обрані карти.
// Скид спільний, тому видимий усім. Суперник бачить лише, чи підтвердили вибір.
function viewFor(seat) {
  const foe = otherPlayer(seat);
  const reveal = state.phase === "draft" ? state.holding[seat] : -1;
  const done = state.phase === "done";
  const view = JSON.parse(JSON.stringify(state));
  view.packs = state.packs.map((pack, index) =>
    index === reveal ? [...pack] : pack.map(() => "?"),
  );
  view.leftover = done
    ? [...state.leftover]
    : state.leftover.map(() => "?");
  if (view.picks[foe]) {
    view.picks[foe] = { keep: "?", discard: view.picks[foe].discard.map(() => "?") };
  }
  if (!done) {
    view.kept[foe] = state.kept[foe].map(() => "?");
    view.decks[foe] = state.decks[foe].map(() => "?");
    if (state.deckPlayer !== seat) view.deckSelection = [];
  }
  return view;
}

function save() {
  if (net.isGuest.value) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
  if (net.isHost.value) net.send("draft:view", viewFor("p2"));
}

function actor() {
  if (state.phase === "heroes") return state.heroes.p1 ? "p2" : "p1";
  if (state.phase === "draft") return null;
  if (state.phase === "deck") return state.deckPlayer;
  return null;
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
  marks.value = { keep: null, discard: [] };
  state.picks = { p1: null, p2: null };

  for (let guard = 0; guard < 4; guard++) {
    const a = state.packs[state.holding.p1] || [];
    const b = state.packs[state.holding.p2] || [];
    if (!a.length && !b.length) {
      state.pairIndex += 1;
      if (state.pairIndex >= pairsTotal()) {
        startDeckPhase();
        return;
      }
      state.holding = { p1: state.pairIndex * 2, p2: state.pairIndex * 2 + 1 };
      continue;
    }
    return;
  }
}

function applyHero(heroId, seat) {
  if (state.phase !== "heroes" || (seat && seat !== actor())) return;
  const taken = Object.values(state.heroes);
  if (
    !packDraftHeroes.some(
      (hero) => hero.id === heroId && !taken.includes(hero.id),
    )
  )
    return;
  state.heroes[actor()] = heroId;
  if (state.heroes.p1 && state.heroes.p2) {
    state.phase = "draft";
    advance();
  }
  save();
}

function discardNeededFor(player) {
  if (state.phase !== "draft" || !player) return 0;
  const pack = state.packs[state.holding[player]] || [];
  return Math.max(
    0,
    Math.min(PACK_DRAFT_CONFIG.discardPerTurn, pack.length - 1),
  );
}

// У локальній грі за одним екраном гравці вибирають по черзі (з передачею пристрою).
function localActor() {
  if (state.phase !== "draft") return null;
  if (!state.picks.p1) return "p1";
  if (!state.picks.p2) return "p2";
  return null;
}

// Обидва гравці вже підтвердили вибір: розігруємо раунд одночасно.
function resolveRound() {
  for (const player of PLAYERS) {
    const pick = state.picks[player];
    const pack = state.packs[state.holding[player]];
    for (const id of [pick.keep, ...pick.discard]) {
      if (id && pack.includes(id)) pack.splice(pack.indexOf(id), 1);
    }
    if (pick.keep) state.kept[player].push(pick.keep);
    state.discarded.push(...pick.discard);
  }
  marks.value = { keep: null, discard: [] };
  state.holding = { p1: state.holding.p2, p2: state.holding.p1 };
  advance();
  skipEmptyPacks();
}

// Страховка: якщо в одного гравця пак порожній, а в іншого ні - пропускаємо його.
function skipEmptyPacks() {
  if (state.phase !== "draft") return;
  for (const player of PLAYERS) {
    const pack = state.packs[state.holding[player]] || [];
    if (!pack.length && !state.picks[player]) {
      state.picks[player] = { keep: null, discard: [] };
    }
  }
  if (state.picks.p1 && state.picks.p2) resolveRound();
}

function applyTurn(keepId, discardIds, seat) {
  if (state.phase !== "draft") return;
  const player = seat || localActor();
  if (!player || state.picks[player]) return;
  const pack = state.packs[state.holding[player]];
  const ids = Array.isArray(discardIds) ? discardIds : [];
  if (
    !pack.includes(keepId) ||
    ids.length !== discardNeededFor(player) ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => id === keepId || !pack.includes(id))
  ) {
    return;
  }
  state.picks[player] = { keep: keepId, discard: [...ids] };
  marks.value = { keep: null, discard: [] };
  if (!net.online.value) {
    // Локальна гра: передаємо пристрій наступному гравцю.
    passFor.value = player === "p1" ? "p2" : "p1";
  }
  if (state.picks.p1 && state.picks.p2) resolveRound();
  save();
}

function applyToggle(cardId, seat) {
  if (state.phase !== "deck" || (seat && seat !== state.deckPlayer)) return;
  const index = state.deckSelection.indexOf(cardId);
  if (index !== -1) {
    state.deckSelection.splice(index, 1);
  } else if (
    state.kept[state.deckPlayer].includes(cardId) &&
    state.deckSelection.length < PACK_DRAFT_CONFIG.deckSize
  ) {
    state.deckSelection.push(cardId);
  }
  save();
}

function applyDeck(seat) {
  if (state.phase !== "deck" || (seat && seat !== state.deckPlayer)) return;
  if (state.deckSelection.length !== PACK_DRAFT_CONFIG.deckSize) return;
  state.decks[state.deckPlayer] = [...state.deckSelection];
  startDeckPhase();
  save();
}

function applyView(view) {
  Object.assign(state, view);
  const pack = state.packs[state.holding[net.mySeat.value || "p1"]] || [];
  const { keep, discard } = marks.value;
  if (
    (keep && !pack.includes(keep)) ||
    discard.some((id) => !pack.includes(id))
  ) {
    marks.value = { keep: null, discard: [] };
  }
}

net.on("draft:view", (view) => {
  if (net.isGuest.value) applyView(view);
});

net.on("draft:cmd", (message) => {
  if (!net.isHost.value || !message) return;
  if (message.type === "hero") applyHero(message.id, "p2");
  else if (message.type === "turn")
    applyTurn(message.keep, message.discard, "p2");
  else if (message.type === "toggle") applyToggle(message.id, "p2");
  else if (message.type === "deck") applyDeck("p2");
});

net.on("draft:sync", () => {
  if (net.isHost.value) net.send("draft:view", viewFor("p2"));
});

net.onEvent("connected", ({ role }) => {
  if (role === "host") {
    Object.assign(state, createState());
    marks.value = { keep: null, discard: [] };
    save();
  } else {
    net.send("draft:sync");
  }
});

net.onEvent("closed", ({ role }) => {
  if (role === "guest") {
    Object.assign(state, load());
    marks.value = { keep: null, discard: [] };
  }
});

if (net.isGuest.value) net.send("draft:sync");

export function usePackDraft() {
  const config = PACK_DRAFT_CONFIG;

  // Чий екран: онлайн - своє місце, локально - гравець, який зараз вибирає.
  const viewSeat = computed(() => {
    if (net.online.value && net.mySeat.value) return net.mySeat.value;
    if (state.phase === "deck") return state.deckPlayer;
    return passFor.value || localActor() || "p1";
  });

  const currentPack = computed(() =>
    state.phase === "draft"
      ? (state.packs[state.holding[viewSeat.value]] || [])
          .map((id) => cardById.get(id))
          .filter(Boolean)
      : [],
  );

  const keptCards = computed(() => ({
    p1: state.kept.p1.map((id) => cardById.get(id)).filter(Boolean),
    p2: state.kept.p2.map((id) => cardById.get(id)).filter(Boolean),
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

  const needed = computed(() => discardNeededFor(viewSeat.value));
  const turnReady = computed(
    () =>
      Boolean(marks.value.keep) && marks.value.discard.length === needed.value,
  );

  const mySeat = computed(() => net.mySeat.value);
  const canAct = computed(() => {
    if (state.phase === "draft") {
      const seat = net.online.value ? net.mySeat.value : localActor();
      return Boolean(seat) && !state.picks[seat] && !passFor.value;
    }
    return !net.online.value || net.mySeat.value === actor();
  });

  // Я вже підтвердив вибір і чекаю на суперника (онлайн).
  const waitingOpponent = computed(
    () =>
      state.phase === "draft" &&
      net.online.value &&
      Boolean(state.picks[net.mySeat.value]) &&
      !state.picks[net.mySeat.value === "p1" ? "p2" : "p1"],
  );

  function ackPass() {
    passFor.value = null;
  }

  function command(type, payload) {
    if (net.isGuest.value) {
      net.send("draft:cmd", { type, ...payload });
      return;
    }
    const seat = net.isHost.value ? "p1" : null;
    if (type === "hero") applyHero(payload.id, seat);
    else if (type === "turn") applyTurn(payload.keep, payload.discard, seat);
    else if (type === "toggle") applyToggle(payload.id, seat);
    else if (type === "deck") applyDeck(seat);
  }

  function pickHero(heroId) {
    if (canAct.value) command("hero", { id: heroId });
  }

  function setMark(cardId, mode) {
    if (state.phase !== "draft" || !canAct.value) return;
    const next = {
      keep: marks.value.keep === cardId ? null : marks.value.keep,
      discard: marks.value.discard.filter((id) => id !== cardId),
    };
    if (mode === "keep") next.keep = cardId;
    if (mode === "discard") {
      next.discard.push(cardId);
      while (next.discard.length > needed.value) next.discard.shift();
    }
    marks.value = next;
  }

  function confirmTurn() {
    if (!turnReady.value || !canAct.value) return;
    const { keep, discard } = marks.value;
    marks.value = { keep: null, discard: [] };
    command("turn", { keep, discard: [...discard] });
  }

  function toggleDeckCard(cardId) {
    if (canAct.value) command("toggle", { id: cardId });
  }

  function confirmDeck() {
    if (canAct.value) command("deck", {});
  }

  function restart() {
    if (net.isGuest.value) return;
    Object.assign(state, createState());
    passFor.value = null;
    marks.value = { keep: null, discard: [] };
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
    marks,
    needed,
    turnReady,
    mySeat,
    canAct,
    waitingOpponent,
    passFor,
    ackPass,
    viewSeat,
    pickHero,
    setMark,
    confirmTurn,
    toggleDeckCard,
    confirmDeck,
    restart,
    isDeadCard,
  };
}
