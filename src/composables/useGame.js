import { reactive, computed } from "vue";
import { gameMaps, getMap } from "../gameMaps.js";
import { getCard, getHero } from "../gameDecks.js";
import { cardEffects } from "../gameEffects.js";
import { useOnline } from "./useOnline.js";

const HAND_LIMIT = 7;
const START_HAND = 5;
const ACTIONS_PER_TURN = 2;
const EXHAUSTION_DAMAGE = 2;

function computeDistances(map, spaceById) {
  const result = new Map();
  for (const start of map.spaces) {
    const distances = new Map([[start.id, 0]]);
    const queue = [start.id];
    while (queue.length) {
      const current = queue.shift();
      for (const next of spaceById.get(current).links) {
        if (!distances.has(next)) {
          distances.set(next, distances.get(current) + 1);
          queue.push(next);
        }
      }
    }
    result.set(start.id, distances);
  }
  return result;
}

const mapCache = new Map();

function mapData(id) {
  const map = getMap(id);
  if (!mapCache.has(map.id)) {
    const spaceById = new Map(map.spaces.map((space) => [space.id, space]));
    mapCache.set(map.id, {
      map,
      spaceById,
      distances: computeDistances(map, spaceById),
    });
  }
  return mapCache.get(map.id);
}

let active = mapData(gameMaps[0].id);

function useMapId(id) {
  active = mapData(id);
}

const game = reactive({
  phase: "setup",
  mapId: gameMaps[0].id,
  players: { p1: null, p2: null },
  turn: "p1",
  actions: 0,
  turnStart: null,
  redRoomIgnored: { p1: false, p2: false },
  viewer: "p1",
  lobby: { p1: null, p2: null },
  prompt: null,
  log: [],
  fx: [],
  notice: null,
  fxSeq: 0,
  combat: null,
  announce: null,
  announces: [],
  winner: null,
});

let flow = null;
let lobbyDecks = { p1: null, p2: null };
const net = useOnline();

const turnFlags = {
  noDraw: { p1: false, p2: false },
  attackBonus: { p1: 0, p2: 0 },
  pinned: { p1: false, p2: false },
};

function resetTurnFlags() {
  turnFlags.noDraw = { p1: false, p2: false };
  turnFlags.attackBonus = { p1: 0, p2: 0 };
  turnFlags.pinned = { p1: false, p2: false };
}

let activeCard = null;

function fx(type, player, extra = {}) {
  game.fxSeq += 1;
  game.fx.push({ id: game.fxSeq, type, player, ...extra });
  if (game.fx.length > 40) game.fx.shift();
}

const other = (player) => (player === "p1" ? "p2" : "p1");
const pl = (player) => game.players[player];
const hero = (player) => getHero(pl(player).heroId);
const spaceOf = (player) => pl(player).space;

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

let currentNote = null;

function log(key, params = {}) {
  game.log.push({ key, params });
  if (game.log.length > 200) game.log.shift();
  if (currentNote && currentNote.open) currentNote.lines.push({ key, params });
}

function beginAnnounce(player, card, phase) {
  game.fxSeq += 1;
  game.announces.push({
    id: game.fxSeq,
    kind: phase,
    player,
    cardId: card.id,
    lines: [],
    picks: [],
    open: true,
  });
  if (game.announces.length > 12) game.announces.shift();
  currentNote = game.announces[game.announces.length - 1];
  game.announce = currentNote;
}

function endAnnounce() {
  if (currentNote) currentNote.open = false;
  currentNote = null;
}

function distance(a, b) {
  return active.distances.get(spaceOf(a)).get(spaceOf(b));
}

function adjacent(a, b) {
  return distance(a, b) === 1;
}

function shared(a, b) {
  const zonesB = active.spaceById.get(spaceOf(b)).zones;
  return active.spaceById
    .get(spaceOf(a))
    .zones.some((zone) => zonesB.includes(zone));
}

function zoneCount(player) {
  return active.spaceById.get(spaceOf(player)).zones.length;
}

function reach(player, steps) {
  if (turnFlags.pinned[player]) return [];
  const start = spaceOf(player);
  const blocked = spaceOf(other(player));
  const seen = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    if (seen.get(current) >= steps) continue;
    for (const next of active.spaceById.get(current).links) {
      if (next === blocked || seen.has(next)) continue;
      seen.set(next, seen.get(current) + 1);
      queue.push(next);
    }
  }
  return [...seen.keys()].filter((id) => id !== start);
}

function zoneSpaces(player) {
  const zones = active.spaceById.get(spaceOf(player)).zones;
  const blocked = spaceOf(other(player));
  return active.map.spaces
    .filter(
      (space) =>
        space.id !== blocked &&
        space.id !== spaceOf(player) &&
        space.zones.some((zone) => zones.includes(zone)),
    )
    .map((space) => space.id);
}

function inRange(player) {
  const foe = other(player);
  const data = hero(player);
  if (data.attack === "range") return shared(player, foe);
  const reachDistance = data.id === "ms-marvel" ? 2 : 1;
  return distance(player, foe) <= reachDistance;
}

function setOver(winner) {
  game.phase = "over";
  game.winner = winner;
  game.prompt = null;
  game.combat = null;
  flow = null;
  log("logWins", { player: winner });
}

function damage(player, amount) {
  if (amount <= 0 || game.phase !== "play") return;
  const target = pl(player);
  target.hp = Math.max(0, target.hp - amount);
  log("logDamage", { player, n: amount });
  fx("damage", player, { n: amount, src: activeCard });
  if (target.hp === 0) setOver(other(player));
}

function heal(player, amount) {
  const target = pl(player);
  const healed = Math.min(amount, target.maxHp - target.hp);
  target.hp += healed;
  log("logHeal", { player, n: healed });
  if (healed > 0) fx("heal", player, { n: healed });
}

function draw(player, count) {
  const target = pl(player);
  if (turnFlags.noDraw[player] && count > 0) {
    log("logNoDraw", { player });
    return;
  }
  let drawn = 0;
  for (let i = 0; i < count && game.phase === "play"; i++) {
    if (target.deck.length) {
      target.hand.push(target.deck.shift());
      drawn += 1;
    } else {
      log("logExhaust", { player, n: EXHAUSTION_DAMAGE });
      damage(player, EXHAUSTION_DAMAGE);
    }
  }
  if (drawn) {
    log("logDraw", { player, n: drawn });
    fx("draw", player, { n: drawn });
  }
}

function drawUntil(player, size) {
  const target = pl(player);
  let drawn = 0;
  while (target.hand.length < size && target.deck.length) {
    target.hand.push(target.deck.shift());
    drawn += 1;
  }
  if (drawn) log("logDraw", { player, n: drawn });
}

function discardFromHand(player, cardId) {
  const target = pl(player);
  const index = target.hand.indexOf(cardId);
  if (index === -1) return null;
  target.hand.splice(index, 1);
  target.discard.push(cardId);
  log("logDiscard", {
    player,
    card: getCard(cardId).name,
    cardId,
  });
  fx("discard", player, { cardId });
  return getCard(cardId);
}

function discardRandom(player, count) {
  for (let i = 0; i < count && pl(player).hand.length; i++) {
    const hand = pl(player).hand;
    discardFromHand(player, hand[Math.floor(Math.random() * hand.length)]);
  }
}

function shuffleIntoDeck(player, cardIds) {
  const target = pl(player);
  target.discard = target.discard.filter((id) => !cardIds.includes(id));
  target.deck = shuffle([...target.deck, ...cardIds]);
  log("logShuffle", { player, n: cardIds.length });
}

// Tomoe Gozen, "Attack of Opportunity": коли ворожий герой залишає її зону - 1 шкоди.
function attackOfOpportunity(player, fromSpaceId) {
  const tomoe = other(player);
  if (game.phase !== "play" || !pl(tomoe) || hero(tomoe).id !== "tomoe-gozen") {
    return;
  }
  const tomoeZones = active.spaceById.get(spaceOf(tomoe)).zones;
  const wasInZone = active.spaceById
    .get(fromSpaceId)
    .zones.some((zone) => tomoeZones.includes(zone));
  if (wasInZone && !shared(player, tomoe)) {
    log("logOpportunity", { player });
    activeCard = hero(tomoe).passive.name;
    damage(player, 1);
    activeCard = null;
  }
}

function place(player, spaceId) {
  const from = spaceOf(player);
  pl(player).space = spaceId;
  log("logMove", { player, space: spaceId });
  if (from !== spaceId) attackOfOpportunity(player, from);
}

function swapPlaces() {
  const a = pl("p1").space;
  pl("p1").space = pl("p2").space;
  pl("p2").space = a;
  log("logSwap");
}

function adjacentSpaces(player) {
  const blocked = spaceOf(other(player));
  return active.spaceById
    .get(spaceOf(other(player)))
    .links.filter((id) => id !== blocked);
}

function spendAction() {
  game.actions = Math.max(0, game.actions - 1);
}

function gainAction(count) {
  game.actions += count;
  log("logAction", { n: count });
}

const askConfirm = (player, title) => ({ kind: "confirm", player, title });
const askSpace = (player, title, options) => ({
  kind: "space",
  player,
  title,
  options,
  boostOptions: [],
});
const askCards = (player, title, options, { min = 1, max = 1, skip } = {}) => ({
  kind: "cards",
  player,
  title,
  options,
  min,
  max,
  skip: skip || "gameSkip",
});
const askChoice = (player, title, choices) => ({
  kind: "choice",
  player,
  title,
  choices,
});

const api = {
  hero,
  log,
  draw,
  drawUntil,
  damage,
  heal,
  place,
  reach,
  zoneSpaces,
  shared,
  adjacent,
  distance,
  zoneCount,
  discardFromHand,
  discardRandom,
  shuffleIntoDeck,
  spendAction,
  gainAction,
  askConfirm,
  askSpace,
  askCards,
  askChoice,
  swapPlaces,
  adjacentSpaces,
  blockDraw: (player) => {
    turnFlags.noDraw[player] = true;
  },
  addAttackBonus: (player, n) => {
    turnFlags.attackBonus[player] += n;
  },
  pin: (player) => {
    turnFlags.pinned[player] = true;
  },
  endTurnNow: () => {
    game.actions = 0;
  },
  handSize: (player) => pl(player).hand.length,
  handOf: (player) => [...pl(player).hand],
  discardOf: (player) => [...pl(player).discard],
  actionsLeft: () => game.actions,
  movedThisTurn: (player) => spaceOf(player) !== game.turnStart,
  redRoomOn: (player) => !game.redRoomIgnored[player],
  ignoreRedRoom: (player) => {
    game.redRoomIgnored[player] = true;
  },
};

const isScheme = (card) => card.value === null;
const canAttackWith = (card) => !isScheme(card) && card.type !== "defense";
const attackPlayable = (player, card) =>
  canAttackWith(card) &&
  (cardEffects[card.key]?.canAttack?.(context(player, card)) ?? true);
const canDefendWith = (card) => !isScheme(card) && card.type !== "attack";

function context(player, card, combat = null) {
  return { g: api, me: player, foe: other(player), card, combat };
}

function* runEffect(player, card, phase, combat) {
  const effect = cardEffects[card.key];
  if (!effect) {
    if (phase === (combat ? "after" : "scheme")) {
      beginAnnounce(player, card, phase);
      log("logNoAuto", { card: card.name });
      endAnnounce();
    }
    return;
  }
  const handler = effect[phase];
  if (!handler) return;
  beginAnnounce(player, card, phase);
  activeCard = card.name;
  yield* handler(context(player, card, combat));
  activeCard = null;
  endAnnounce();
}

function* startTurn() {
  const me = game.turn;
  resetTurnFlags();
  game.actions = ACTIONS_PER_TURN;
  game.turnStart = spaceOf(me);
  game.redRoomIgnored[me] = false;
  log("logTurn", { player: me });
  if (hero(me).id === "ms-marvel") {
    const options = reach(me, 1);
    if (options.length) {
      const space = yield askSpace(me, "promptStretchy", options);
      if (space) place(me, space);
    }
  }
}

function* endTurn() {
  const me = game.turn;
  const excess = pl(me).hand.length - HAND_LIMIT;
  if (excess > 0) {
    const ids = yield askCards(me, "promptDiscardDown", [...pl(me).hand], {
      min: excess,
      max: excess,
    });
    for (const id of ids) discardFromHand(me, id);
  }
  game.redRoomIgnored[me] = false;
  game.turn = other(me);
  yield* startTurn();
}

function* maneuver(me) {
  spendAction();
  log("logManeuver", { player: me });
  draw(me, 1);
  if (game.phase !== "play") return true;

  let steps = hero(me).move;
  let boosted = false;
  for (;;) {
    const options = reach(me, steps);
    if (!options.length) break;
    const prompt = askSpace(me, "promptMoveSpace", options);
    prompt.boostOptions = !boosted ? [...pl(me).hand] : [];
    prompt.undo = !boosted;
    const answer = yield prompt;
    if (answer && typeof answer === "object") {
      steps += discardFromHand(me, answer.boost).boost;
      boosted = true;
      continue;
    }
    if (answer) place(me, answer);
    break;
  }
  return true;
}

function* scheme(me) {
  const options = pl(me).hand.filter((id) => isScheme(getCard(id)));
  if (!options.length) return false;
  const ids = yield askCards(me, "promptSchemeCard", options, {
    min: 0,
    max: 1,
    skip: "gameCancel",
  });
  if (!ids.length) return false;

  spendAction();
  const card = getCard(ids[0]);
  pl(me).hand.splice(pl(me).hand.indexOf(card.id), 1);
  log("logScheme", { player: me, card: card.name });
  yield* runEffect(me, card, "scheme", null);
  pl(me).discard.push(card.id);
  return true;
}

function* attack(me) {
  const foe = other(me);
  if (!inRange(me)) return false;

  const options = pl(me).hand.filter((id) => attackPlayable(me, getCard(id)));
  if (!options.length) return false;
  const attackIds = yield askCards(me, "promptAttackCard", options, {
    min: 0,
    max: 1,
    skip: "gameCancel",
  });
  if (!attackIds.length) return false;

  spendAction();
  const attackCard = getCard(attackIds[0]);
  pl(me).hand.splice(pl(me).hand.indexOf(attackCard.id), 1);
  log("logAttack", { player: me });

  // Публічний стан бою: його бачать обидва гравці (попап бою).
  const faceUp = Boolean(cardEffects[attackCard.key]?.faceUp);
  game.combat = {
    attacker: me,
    defender: foe,
    stage: "defense",
    defense: "pending",
    cardIds: { [me]: attackCard.id, [foe]: null },
    revealed: { p1: null, p2: null, [me]: faceUp ? attackCard.id : null },
    announcedValue: hero(foe).id === "spider-man" ? attackCard.value : null,
    boost: { p1: false, p2: false },
  };

  let defenseCard = null;
  const defenseOptions = pl(foe).hand.filter((id) =>
    canDefendWith(getCard(id)),
  );
  if (defenseOptions.length) {
    const defensePrompt = askCards(foe, "promptDefenseCard", defenseOptions, {
      min: 0,
      max: 1,
      skip: "gameNoDefense",
    });
    if (hero(foe).id === "spider-man") {
      defensePrompt.hint = { key: "promptSpideySense", n: attackCard.value };
    }
    const defenseIds = yield defensePrompt;
    if (defenseIds.length) {
      defenseCard = getCard(defenseIds[0]);
      pl(foe).hand.splice(pl(foe).hand.indexOf(defenseCard.id), 1);
    }
  }
  game.combat.defense = defenseCard ? "card" : "none";
  game.combat.cardIds[foe] = defenseCard ? defenseCard.id : null;
  game.combat.stage = "immediate";

  const combat = {
    attacker: me,
    defender: foe,
    cards: { [me]: attackCard, [foe]: defenseCard },
    canceled: { p1: false, p2: false },
    taken: { p1: 0, p2: 0 },
    won: { p1: false, p2: false },
    values: { p1: 0, p2: 0 },
    returnToHand: { p1: false, p2: false },
  };

  // Порядок розіграшу: спочатку ефекти захисника, потім атакуючого
  // (для кожної стадії: Одразу -> Під час бою -> Після бою).
  const players = [foe, me];
  for (const player of players) {
    const card = combat.cards[player];
    if (card && !combat.canceled[player]) {
      yield* runEffect(player, card, "immediate", combat);
    }
  }

  game.combat.stage = "boost";
  const boosts = { p1: 0, p2: 0 };
  const boostCardIds = { p1: null, p2: null };
  const baseValues = { p1: 0, p2: 0 };
  for (const player of players) {
    const card = combat.cards[player];
    const effect = card && cardEffects[card.key];
    if (
      card &&
      !combat.canceled[player] &&
      effect?.canBoost?.(context(player, card, combat)) &&
      pl(player).hand.length
    ) {
      const ids = yield askCards(player, "promptBoost", [...pl(player).hand], {
        min: 0,
        max: 1,
        skip: "gameSkipBoost",
      });
      if (ids.length) {
        const boostCard = discardFromHand(player, ids[0]);
        boosts[player] = boostCard.boost;
        boostCardIds[player] = boostCard.id;
        game.combat.boost[player] = true;
      }
    }
  }

  for (const player of players) {
    const card = combat.cards[player];
    if (!card) continue;
    let value = card.value;
    const effect = cardEffects[card.key];
    if (effect?.value && !combat.canceled[player]) {
      value = effect.value(context(player, card, combat), value);
    }
    baseValues[player] = value;
    combat.values[player] = value + boosts[player];
  }
  combat.values[me] += turnFlags.attackBonus[me];

  const raw = Math.max(0, combat.values[me] - combat.values[foe]);
  let dealt = raw;
  const capEffect = defenseCard && cardEffects[defenseCard.key]?.damageCap;
  if (capEffect && !combat.canceled[foe]) {
    dealt = Math.min(dealt, capEffect(context(foe, defenseCard, combat)));
  }
  combat.taken[foe] = dealt;
  combat.won[me] = raw > 0;
  combat.won[foe] = combat.values[foe] > combat.values[me];
  log("logCombat", {
    attacker: me,
    a: combat.values[me],
    defender: foe,
    d: combat.values[foe],
  });

  game.combat.stage = "reveal";
  yield {
    kind: "info",
    player: null,
    title: "gameReveal",
    combat: {
      attacker: me,
      defender: foe,
      cardIds: {
        [me]: attackCard.id,
        [foe]: defenseCard ? defenseCard.id : null,
      },
      values: { ...combat.values },
      boosts: { ...boosts },
      boostCardIds: { ...boostCardIds },
      base: { ...baseValues },
      bonus: turnFlags.attackBonus[me],
      dealt,
    },
  };

  if (dealt > 0) damage(foe, dealt);
  else log("logNoDamage");

  if (game.combat) game.combat.stage = "after";
  for (const player of players) {
    const card = combat.cards[player];
    if (card && !combat.canceled[player] && game.phase === "play") {
      yield* runEffect(player, card, "after", combat);
    }
  }

  const finish = (player, card) => {
    if (!card) return;
    if (combat.returnToHand[player]) pl(player).hand.push(card.id);
    else pl(player).discard.push(card.id);
  };
  finish(me, attackCard);
  finish(foe, defenseCard);
  game.combat = null;
  return true;
}

// Запам'ятовуємо вибір гравців під час схеми, щоб суперник бачив, що саме обрали.
function recordPick(prompt, answer) {
  const note = currentNote;
  if (!note || !note.open || !prompt) return;
  if (prompt.kind === "choice") {
    const choice = prompt.choices.find((item) => item.value === answer);
    if (choice) note.picks.push({ key: choice.label });
  } else if (prompt.kind === "confirm" && typeof answer === "boolean") {
    note.picks.push({ key: prompt.title, yes: answer });
  }
}

function advance(answer) {
  recordPick(game.prompt, answer);
  game.prompt = null;
  while (flow) {
    if (game.phase !== "play") {
      flow = null;
      return;
    }
    const step = flow.next(answer);
    answer = undefined;
    if (step.done) {
      flow = null;
      if (game.phase === "play" && game.actions <= 0) run(endTurn());
      return;
    }
    game.prompt = step.value;
    return;
  }
}

function run(generator) {
  flow = generator;
  advance(undefined);
}

const canAct = () =>
  game.phase === "play" && !game.prompt && !flow && game.actions > 0;

function startGame(deckA, deckB) {
  game.notice = null;
  if (deckA.heroId === deckB.heroId) return;
  const setup = (deck, player) => {
    const data = getHero(deck.heroId);
    const shuffled = shuffle(deck.cardIds);
    return {
      heroId: deck.heroId,
      deckName: deck.name,
      hp: data.hp,
      maxHp: data.hp,
      space: active.map.starts[player],
      deck: shuffled.slice(START_HAND),
      hand: shuffled.slice(0, START_HAND),
      discard: [],
    };
  };

  useMapId(game.mapId);
  game.players.p1 = setup(deckA, "p1");
  game.players.p2 = setup(deckB, "p2");
  game.turn = "p1";
  game.viewer = "p1";
  game.winner = null;
  game.log = [];
  game.combat = null;
  game.announce = null;
  game.announces = [];
  currentNote = null;
  undoPoint = null;
  game.redRoomIgnored = { p1: false, p2: false };
  game.phase = "play";
  log("logStart");
  run(startTurn());
  syncOut();
}

function resetGame(clearNotice = true) {
  flow = null;
  if (clearNotice) game.notice = null;
  lobbyDecks = { p1: null, p2: null };
  game.lobby = { p1: null, p2: null };
  game.phase = "setup";
  game.players = { p1: null, p2: null };
  game.prompt = null;
  game.winner = null;
  game.log = [];
  game.combat = null;
  game.announce = null;
  game.announces = [];
  currentNote = null;
  undoPoint = null;
  syncOut();
}

function viewFor(seat) {
  const foe = other(seat);
  const copy = JSON.parse(JSON.stringify(game));
  for (const player of ["p1", "p2"]) {
    if (copy.players[player]) {
      copy.players[player].deck = copy.players[player].deck.map(() => "?");
    }
  }
  if (copy.players[foe]) {
    copy.players[foe].hand = copy.players[foe].hand.map(() => "?");
  }
  if (copy.combat) copy.combat.cardIds[foe] = null;
  if (copy.prompt && copy.prompt.player === foe) {
    copy.prompt = {
      kind: copy.prompt.kind,
      player: foe,
      title: copy.prompt.title,
      skip: copy.prompt.skip,
      options: [],
      boostOptions: [],
      choices: copy.prompt.choices || [],
      min: 0,
      max: 0,
    };
  }
  return copy;
}

function syncOut() {
  if (net.isHost.value) net.send("game:view", viewFor("p2"));
}

function validAnswer(prompt, answer) {
  if (prompt.kind === "space") {
    if (answer && typeof answer === "object") {
      return prompt.boostOptions.includes(answer.boost);
    }
    return answer === null || prompt.options.includes(answer);
  }
  if (prompt.kind === "cards") {
    return (
      Array.isArray(answer) &&
      answer.length >= prompt.min &&
      answer.length <= prompt.max &&
      new Set(answer).size === answer.length &&
      answer.every((id) => prompt.options.includes(id))
    );
  }
  if (prompt.kind === "confirm") return typeof answer === "boolean";
  if (prompt.kind === "choice") {
    return prompt.choices.some((choice) => choice.value === answer);
  }
  return true;
}

function seatFor() {
  return net.isHost.value ? "p1" : null;
}

function blocked() {
  return net.online.value && net.mySeat.value !== game.turn;
}

function applyAnswer(answer, seat) {
  const prompt = game.prompt;
  if (!prompt || game.phase !== "play") return;
  if (prompt.player && seat && seat !== prompt.player) return;
  if (!validAnswer(prompt, answer)) return;
  advance(answer);
  syncOut();
}

function applySurrender(player) {
  if (game.phase !== "play" || !player) return;
  resetGame(false);
  game.notice = { id: game.fxSeq + 1, key: "logSurrender", player };
  game.fxSeq += 1;
  syncOut();
}

function surrender(player) {
  if (net.isGuest.value) send({ type: "surrender" });
  else applySurrender(net.isHost.value ? "p1" : player);
}

// Скасування дії: лише поки гравець ще не обрав нічого незворотного
// (наприклад, натиснув "Маневр", але ще не обрав клітинку і не робив буст).
let undoPoint = null;

function takeSnapshot() {
  undoPoint = JSON.stringify({
    players: game.players,
    actions: game.actions,
    turnStart: game.turnStart,
    redRoomIgnored: game.redRoomIgnored,
    logLength: game.log.length,
    flags: turnFlags,
  });
}

function undoAction(seat) {
  if (!undoPoint || !game.prompt?.undo || game.phase !== "play") return;
  if (seat && seat !== game.turn) return;
  const snap = JSON.parse(undoPoint);
  game.players = snap.players;
  game.actions = snap.actions;
  game.turnStart = snap.turnStart;
  game.redRoomIgnored = snap.redRoomIgnored;
  game.log.length = snap.logLength;
  turnFlags.noDraw = snap.flags.noDraw;
  turnFlags.attackBonus = snap.flags.attackBonus;
  turnFlags.pinned = snap.flags.pinned;
  flow = null;
  game.prompt = null;
  undoPoint = null;
}

function applyAction(type, seat) {
  if (game.phase !== "play" || (seat && seat !== game.turn)) return;
  if (type === "undo") undoAction(seat);
  else if (type === "maneuver" && canAct()) {
    takeSnapshot();
    run(maneuver(game.turn));
  } else if (type === "scheme" && canAct()) run(scheme(game.turn));
  else if (type === "attack" && canAct() && inRange(game.turn)) {
    run(attack(game.turn));
  }
  syncOut();
}

function send(command) {
  net.send("game:cmd", command);
}

function answerPrompt(answer) {
  if (net.isGuest.value) {
    send({ type: "answer", answer: answer === undefined ? null : answer });
    return;
  }
  applyAnswer(answer, seatFor());
}

function doAction(type) {
  if (net.isGuest.value) send({ type });
  else applyAction(type, seatFor());
}

const doManeuver = () => doAction("maneuver");
const doScheme = () => doAction("scheme");
const doAttack = () => doAction("attack");
const doUndo = () => doAction("undo");

function validDeck(deck) {
  return (
    deck &&
    typeof deck.name === "string" &&
    getHero(deck.heroId) &&
    Array.isArray(deck.cardIds) &&
    deck.cardIds.length >= START_HAND &&
    deck.cardIds.length <= 100 &&
    deck.cardIds.every((id) => typeof id === "string" && getCard(id))
  );
}

function setLobbyDeck(player, deck) {
  if (game.phase !== "setup" || !validDeck(deck)) return;
  if (game.lobby[other(player)]?.heroId === deck.heroId) return;
  lobbyDecks[player] = {
    name: deck.name,
    heroId: deck.heroId,
    cardIds: [...deck.cardIds],
  };
  game.lobby[player] = { name: deck.name, heroId: deck.heroId };
  syncOut();
}

function chooseDeck(deck) {
  if (net.isGuest.value) {
    send({
      type: "deck",
      deck: { name: deck.name, heroId: deck.heroId, cardIds: deck.cardIds },
    });
    return;
  }
  setLobbyDeck("p1", deck);
}

function setMap(id) {
  if (game.phase !== "setup" || net.isGuest.value) return;
  if (!gameMaps.some((item) => item.id === id)) return;
  game.mapId = id;
  useMapId(id);
  syncOut();
}

function startOnlineGame() {
  game.notice = null;
  if (!net.isHost.value || game.phase !== "setup") return;
  if (!lobbyDecks.p1 || !lobbyDecks.p2) return;
  if (lobbyDecks.p1.heroId === lobbyDecks.p2.heroId) return;
  startGame(lobbyDecks.p1, lobbyDecks.p2);
}

function availableActions() {
  const none = { maneuver: false, scheme: false, attack: false };
  if (game.phase !== "play" || blocked()) return none;
  const me = game.turn;
  const idle = !game.prompt && !flow;
  const hand = pl(me).hand.map(getCard);
  return {
    maneuver: idle && game.actions > 0,
    scheme: idle && game.actions > 0 && hand.some(isScheme),
    attack:
      idle &&
      game.actions > 0 &&
      inRange(me) &&
      hand.some((card) => attackPlayable(me, card)),
  };
}

net.on("game:view", (view) => {
  if (!net.isGuest.value) return;
  Object.assign(game, view);
  useMapId(view.mapId);
});

net.on("game:cmd", (message) => {
  if (!net.isHost.value || !message) return;
  if (message.type === "answer") applyAnswer(message.answer, "p2");
  else if (message.type === "deck") setLobbyDeck("p2", message.deck);
  else if (message.type === "surrender") applySurrender("p2");
  else applyAction(message.type, "p2");
});

net.on("game:sync", () => syncOut());

net.onEvent("connected", ({ role }) => {
  if (role === "host") resetGame();
  else net.send("game:sync");
});

net.onEvent("closed", ({ role }) => {
  if (role === "guest") resetGame();
});

if (net.isGuest.value) net.send("game:sync");

export function useGame() {
  return {
    game,
    map: computed(() => getMap(game.mapId)),
    maps: gameMaps,
    setMap,
    startGame,
    startOnlineGame,
    chooseDeck,
    resetGame,
    answerPrompt,
    doManeuver,
    doScheme,
    doAttack,
    doUndo,
    surrender,
    availableActions,
    heroOf: (player) => (pl(player) ? hero(player) : null),
    other,
  };
}
