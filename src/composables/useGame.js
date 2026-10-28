import { reactive } from "vue";
import { tRexPaddock } from "../gameMaps.js";
import { getCard, getHero } from "../gameDecks.js";
import { cardEffects } from "../gameEffects.js";

const HAND_LIMIT = 7;
const START_HAND = 5;
const ACTIONS_PER_TURN = 2;
const EXHAUSTION_DAMAGE = 2;

const map = tRexPaddock;
const spaceById = new Map(map.spaces.map((space) => [space.id, space]));

function computeDistances() {
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

const distances = computeDistances();

export const gameMap = map;

const game = reactive({
  phase: "setup",
  players: { p1: null, p2: null },
  turn: "p1",
  actions: 0,
  turnStart: null,
  redRoomIgnored: { p1: false, p2: false },
  viewer: "p1",
  prompt: null,
  log: [],
  winner: null,
});

let flow = null;

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

function log(key, params = {}) {
  game.log.push({ key, params });
  if (game.log.length > 200) game.log.shift();
}

function distance(a, b) {
  return distances.get(spaceOf(a)).get(spaceOf(b));
}

function adjacent(a, b) {
  return distance(a, b) === 1;
}

function shared(a, b) {
  const zonesB = spaceById.get(spaceOf(b)).zones;
  return spaceById.get(spaceOf(a)).zones.some((zone) => zonesB.includes(zone));
}

function zoneCount(player) {
  return spaceById.get(spaceOf(player)).zones.length;
}

function reach(player, steps) {
  const start = spaceOf(player);
  const blocked = spaceOf(other(player));
  const seen = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    if (seen.get(current) >= steps) continue;
    for (const next of spaceById.get(current).links) {
      if (next === blocked || seen.has(next)) continue;
      seen.set(next, seen.get(current) + 1);
      queue.push(next);
    }
  }
  return [...seen.keys()].filter((id) => id !== start);
}

function zoneSpaces(player) {
  const zones = spaceById.get(spaceOf(player)).zones;
  const blocked = spaceOf(other(player));
  return map.spaces
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
  flow = null;
  log("logWins", { player: winner });
}

function damage(player, amount) {
  if (amount <= 0 || game.phase !== "play") return;
  const target = pl(player);
  target.hp = Math.max(0, target.hp - amount);
  log("logDamage", { player, n: amount });
  if (target.hp === 0) setOver(other(player));
}

function heal(player, amount) {
  const target = pl(player);
  const healed = Math.min(amount, target.maxHp - target.hp);
  target.hp += healed;
  log("logHeal", { player, n: healed });
}

function draw(player, count) {
  const target = pl(player);
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
  if (drawn) log("logDraw", { player, n: drawn });
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
  log("logDiscard", { player, card: getCard(cardId).name });
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

function place(player, spaceId) {
  pl(player).space = spaceId;
  log("logMove", { player, space: spaceId });
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

function context(player, card, combat = null) {
  return { g: api, me: player, foe: other(player), card, combat };
}

function* runEffect(player, card, phase, combat) {
  const effect = cardEffects[card.key];
  if (!effect) {
    if (phase === (combat ? "after" : "scheme")) {
      log("logNoAuto", { card: card.name });
    }
    return;
  }
  const handler = effect[phase];
  if (!handler) return;
  yield* handler(context(player, card, combat));
}

function* startTurn() {
  const me = game.turn;
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
  const target = pl(me);
  if (target.hand.length) {
    const ids = yield askCards(me, "promptBoostMove", [...target.hand], {
      min: 0,
      max: 1,
      skip: "gameSkipBoost",
    });
    if (ids.length) {
      const card = discardFromHand(me, ids[0]);
      steps += card.boost;
    }
  }

  const options = reach(me, steps);
  if (options.length) {
    const space = yield askSpace(me, "promptMoveSpace", options);
    if (space) place(me, space);
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

  const options = pl(me).hand.filter((id) => !isScheme(getCard(id)));
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

  let defenseCard = null;
  const defenseOptions = pl(foe).hand.filter((id) => !isScheme(getCard(id)));
  if (defenseOptions.length) {
    const defenseIds = yield askCards(
      foe,
      "promptDefenseCard",
      defenseOptions,
      {
        min: 0,
        max: 1,
        skip: "gameNoDefense",
      },
    );
    if (defenseIds.length) {
      defenseCard = getCard(defenseIds[0]);
      pl(foe).hand.splice(pl(foe).hand.indexOf(defenseCard.id), 1);
    }
  }

  const combat = {
    attacker: me,
    defender: foe,
    cards: { [me]: attackCard, [foe]: defenseCard },
    canceled: { p1: false, p2: false },
    taken: { p1: 0, p2: 0 },
    won: { p1: false, p2: false },
    values: { p1: 0, p2: 0 },
  };

  const players = [me, foe];
  for (const player of players) {
    const card = combat.cards[player];
    if (card && !combat.canceled[player]) {
      yield* runEffect(player, card, "immediate", combat);
    }
  }

  const boosts = { p1: 0, p2: 0 };
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
        boosts[player] = discardFromHand(player, ids[0]).boost;
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
    combat.values[player] = value + boosts[player];
  }

  const dealt = Math.max(0, combat.values[me] - combat.values[foe]);
  combat.taken[foe] = dealt;
  combat.won[me] = dealt > 0;
  combat.won[foe] = combat.values[foe] > combat.values[me];
  log("logCombat", {
    attacker: me,
    a: combat.values[me],
    defender: foe,
    d: combat.values[foe],
  });

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
      dealt,
    },
  };

  if (dealt > 0) damage(foe, dealt);
  else log("logNoDamage");

  for (const player of players) {
    const card = combat.cards[player];
    if (card && !combat.canceled[player] && game.phase === "play") {
      yield* runEffect(player, card, "after", combat);
    }
  }

  pl(me).discard.push(attackCard.id);
  if (defenseCard) pl(foe).discard.push(defenseCard.id);
  return true;
}

function advance(answer) {
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
  const setup = (deck, player) => {
    const data = getHero(deck.heroId);
    const shuffled = shuffle(deck.cardIds);
    return {
      heroId: deck.heroId,
      deckName: deck.name,
      hp: data.hp,
      maxHp: data.hp,
      space: map.starts[player],
      deck: shuffled.slice(START_HAND),
      hand: shuffled.slice(0, START_HAND),
      discard: [],
    };
  };

  game.players.p1 = setup(deckA, "p1");
  game.players.p2 = setup(deckB, "p2");
  game.turn = "p1";
  game.viewer = "p1";
  game.winner = null;
  game.log = [];
  game.redRoomIgnored = { p1: false, p2: false };
  game.phase = "play";
  log("logStart");
  run(startTurn());
}

function resetGame() {
  flow = null;
  game.phase = "setup";
  game.players = { p1: null, p2: null };
  game.prompt = null;
  game.winner = null;
  game.log = [];
}

function answerPrompt(answer) {
  if (!game.prompt || game.phase !== "play") return;
  advance(answer);
}

function doManeuver() {
  if (canAct()) run(maneuver(game.turn));
}

function doScheme() {
  if (canAct()) run(scheme(game.turn));
}

function doAttack() {
  if (canAct() && inRange(game.turn)) run(attack(game.turn));
}

function doEndTurn() {
  if (game.phase === "play" && !game.prompt && !flow) run(endTurn());
}

function availableActions() {
  if (game.phase !== "play") {
    return { maneuver: false, scheme: false, attack: false, end: false };
  }
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
      hand.some((card) => !isScheme(card)),
    end: idle,
  };
}

export function useGame() {
  return {
    game,
    map,
    startGame,
    resetGame,
    answerPrompt,
    doManeuver,
    doScheme,
    doAttack,
    doEndTurn,
    availableActions,
    heroOf: (player) => (pl(player) ? hero(player) : null),
    other,
  };
}
