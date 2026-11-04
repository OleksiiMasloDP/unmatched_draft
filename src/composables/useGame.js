import { reactive, computed } from "vue";
import { gameMaps, getMap } from "../gameMaps.js";
import { getCard, getHero } from "../gameDecks.js";
import { cardEffects } from "../gameEffects.js";
import { TOKENS, tokenIds } from "../gameTokens.js";
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
  mulligan: null,
  toss: null,
  tokens: [],
  startPick: null,
});

let flow = null;
let lobbyDecks = { p1: null, p2: null };
let mulliganChoices = { p1: null, p2: null };
const net = useOnline();

const turnFlags = {
  noDraw: { p1: false, p2: false },
  attackBonus: { p1: 0, p2: 0 },
  pinned: { p1: false, p2: false },
  anyRange: { p1: false, p2: false },
};

function resetTurnFlags() {
  turnFlags.noDraw = { p1: false, p2: false };
  turnFlags.attackBonus = { p1: 0, p2: 0 };
  turnFlags.pinned = { p1: false, p2: false };
  turnFlags.anyRange = { p1: false, p2: false };
}

let activeCard = null;

const cur = { p1: "hero", p2: "hero" };

function resetFighters() {
  cur.p1 = "hero";
  cur.p2 = "hero";
}

function fx(type, player, extra = {}) {
  game.fxSeq += 1;
  game.fx.push({ id: game.fxSeq, type, player, ...extra });
  if (game.fx.length > 40) game.fx.shift();
}

const other = (player) => (player === "p1" ? "p2" : "p1");
const pl = (player) => game.players[player];
const hero = (player) => getHero(pl(player).heroId);
const kidOf = (player, fighter) =>
  fighter === "hero"
    ? null
    : pl(player).sidekicks.find((kid) => kid.id === fighter) || null;
const fighterSpace = (player, fighter) =>
  fighter === "hero" ? pl(player).space : kidOf(player, fighter).space;
const spaceOf = (player) =>
  cur[player] !== "hero" && kidOf(player, cur[player])
    ? kidOf(player, cur[player]).space
    : pl(player).space;
const fightersOf = (player) => [
  "hero",
  ...pl(player)
    .sidekicks.filter((kid) => !kid.down)
    .map((kid) => kid.id),
];
const occupiedBy = (player) =>
  fightersOf(player).map((fighter) => fighterSpace(player, fighter));
const occupied = () => [...occupiedBy("p1"), ...occupiedBy("p2")];
const tokenAt = (spaceId, kind) => {
  return game.tokens.find(
    (token) => token.space === spaceId && (!kind || token.kind === kind),
  );
};

const removeToken = (token) => {
  game.tokens = game.tokens.filter((item) => item !== token);
};

const tokenFighters = (player, kind) => {
  return fightersOf(player).filter((fighter) =>
    tokenAt(fighterSpace(player, fighter), kind),
  );
};

const fighterName = (player, fighter) =>
  fighter === "hero" ? hero(player).name : kidOf(player, fighter).name;

function withFighter(player, fighter, fn) {
  const before = cur[player];
  cur[player] = fighter;
  try {
    return fn();
  } finally {
    cur[player] = before;
  }
}

const allowedFor = (card, fighter) =>
  card.kind === "sidekick"
    ? fighter !== "hero"
    : card.kind === "any"
      ? true
      : fighter === "hero";

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

function stepsFrom(id) {
  const space = active.spaceById.get(id);
  return [...space.links, ...space.secret];
}

function reach(player, steps, through = false) {
  if (turnFlags.pinned[player]) return [];
  const start = spaceOf(player);
  const foes = through ? [] : occupiedBy(other(player));
  const busy = occupied();
  const seen = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    if (seen.get(current) >= steps) continue;
    for (const next of stepsFrom(current)) {
      if (foes.includes(next) || seen.has(next)) continue;
      seen.set(next, seen.get(current) + 1);
      queue.push(next);
    }
  }
  return [...seen.keys()].filter((id) => !busy.includes(id));
}

function zoneSpaces(player) {
  const zones = active.spaceById.get(spaceOf(player)).zones;
  const busy = occupied();
  return active.map.spaces
    .filter(
      (space) =>
        !busy.includes(space.id) &&
        space.zones.some((zone) => zones.includes(zone)),
    )
    .map((space) => space.id);
}

function inRange(player, mine = "hero", theirs = "hero") {
  if (turnFlags.anyRange[player]) return true;
  const foe = other(player);
  return withFighter(player, mine, () =>
    withFighter(foe, theirs, () => {
      const kid = kidOf(player, mine);
      const data = {
        ...hero(player),
        attack: kid ? kid.attack : hero(player).attack,
      };
      const reachDistance = data.id === "ms-marvel" && mine === "hero" ? 2 : 1;
      if (data.attack === "range") {
        return shared(player, foe) || distance(player, foe) <= reachDistance;
      }
      return distance(player, foe) <= reachDistance;
    }),
  );
}

function attackPairs(player) {
  const pairs = [];
  for (const mine of fightersOf(player)) {
    for (const theirs of fightersOf(other(player))) {
      if (inRange(player, mine, theirs)) pairs.push({ mine, theirs });
    }
  }
  return pairs;
}

function setOver(winner) {
  game.phase = "over";
  game.winner = winner;
  game.prompt = null;
  game.combat = null;
  flow = null;
  log("logWins", { player: winner });
}

const defeatDeferred = (player, fighter) =>
  Boolean(
    game.combat?.rescue?.[player] && game.combat.fighters[player] === fighter,
  );

function finalizeDefeat(player, fighter) {
  if (fighter === "hero") {
    setOver(other(player));
    return;
  }
  const kid = kidOf(player, fighter);
  if (!kid) return;
  kid.down = true;
  log("logSidekickDown", { who: kid.name });
}

function damage(player, amount, fighter = cur[player]) {
  if (amount <= 0 || game.phase !== "play") return;
  if (fighter !== "hero") {
    const kid = kidOf(player, fighter);
    if (!kid || kid.down) return;
    kid.hp = Math.max(0, kid.hp - amount);
    log("logDamageSk", { who: kid.name, n: amount });
    fx("damage", player, { n: amount, src: activeCard, fighter });
    if (kid.hp === 0 && defeatDeferred(player, fighter)) {
      game.combat.pending[player] = true;
      return;
    }
    if (kid.hp === 0) {
      kid.down = true;
      log("logSidekickDown", { who: kid.name });
      if (!game.combat) {
        pl(player).sidekicks = pl(player).sidekicks.filter((k) => !k.down);
      }
    }
    return;
  }
  const target = pl(player);
  target.hp = Math.max(0, target.hp - amount);
  log("logDamage", { player, n: amount });
  fx("damage", player, { n: amount, src: activeCard, fighter: "hero" });
  if (target.hp === 0 && defeatDeferred(player, "hero")) {
    game.combat.pending[player] = true;
    return;
  }
  if (target.hp === 0) setOver(other(player));
}

function heal(player, amount, fighter = cur[player]) {
  if (fighter !== "hero") {
    const kid = kidOf(player, fighter);
    if (!kid) return;
    const healed = Math.min(amount, kid.maxHp - kid.hp);
    kid.hp += healed;
    log("logHealSk", { who: kid.name, n: healed });
    if (healed > 0) fx("heal", player, { n: healed, fighter });
    return;
  }
  const target = pl(player);
  const healed = Math.min(amount, target.maxHp - target.hp);
  target.hp += healed;
  log("logHeal", { player, n: healed });
  if (healed > 0) fx("heal", player, { n: healed, fighter: "hero" });
}

function healFriendly(player, amount) {
  const base = cur[player];
  const baseSpace = spaceOf(player);
  heal(player, amount, base);
  for (const fighter of fightersOf(player)) {
    if (fighter === base) continue;
    const link = active.spaceById.get(baseSpace).links;
    if (link.includes(fighterSpace(player, fighter))) {
      heal(player, amount, fighter);
    }
  }
}

function sidekickAdjacent(player) {
  const links = active.spaceById.get(pl(player).space).links;
  return pl(player).sidekicks.some(
    (kid) => !kid.down && links.includes(kid.space),
  );
}

function adjacentToFoe(player) {
  const links = active.spaceById.get(spaceOf(player)).links;
  return occupiedBy(other(player)).some((id) => links.includes(id));
}

function foeFightersInZone(player) {
  const zones = active.spaceById.get(spaceOf(player)).zones;
  const foe = other(player);
  return fightersOf(foe).filter((fighter) =>
    active.spaceById
      .get(fighterSpace(foe, fighter))
      .zones.some((zone) => zones.includes(zone)),
  );
}

function adjacentFightersOf(player) {
  const links = active.spaceById.get(spaceOf(player)).links;
  const found = [];
  for (const owner of ["p1", "p2"]) {
    for (const fighter of fightersOf(owner)) {
      if (owner === player && fighter === cur[player]) continue;
      if (links.includes(fighterSpace(owner, fighter))) {
        found.push({ owner, fighter });
      }
    }
  }
  return found;
}

function otherFriendAdjacentToFoe(player) {
  const foeLinks = active.spaceById.get(spaceOf(other(player))).links;
  return fightersOf(player).some(
    (fighter) =>
      fighter !== cur[player] &&
      foeLinks.includes(fighterSpace(player, fighter)),
  );
}

function summonSpaces(player, zoneOnly) {
  const kidData = hero(player).sidekick;
  if (!kidData || !kidData.summon) return [];
  if (pl(player).sidekicks.filter((kid) => !kid.down).length >= kidData.count) {
    return [];
  }
  const busy = occupied();
  const zones = active.spaceById.get(pl(player).space).zones;
  return active.map.spaces
    .filter(
      (space) =>
        !busy.includes(space.id) &&
        (!zoneOnly || space.zones.some((zone) => zones.includes(zone))),
    )
    .map((space) => space.id);
}

function summon(player, spaceId) {
  const kidData = hero(player).sidekick;
  const used = new Set(pl(player).sidekicks.map((kid) => kid.id));
  let n = 1;
  while (used.has("sk" + n)) n += 1;
  pl(player).sidekicks.push({
    id: "sk" + n,
    name: kidData.name,
    hp: kidData.hp,
    maxHp: kidData.hp,
    attack: kidData.attack,
    space: spaceId,
    down: false,
  });
  log("logSummon", { who: kidData.name, space: spaceId });
}

function* chooseMover(player, remaining, canMove) {
  const able = remaining.filter((fighter) => {
    if (!fightersOf(player).includes(fighter)) return false;
    cur[player] = fighter;
    return canMove();
  });
  if (!able.length) return null;
  if (able.length === 1) return able[0];
  const picked = yield* pickFighter(player, "promptMoveWith", able);
  return picked || able[0];
}

function* moveAll(player, steps, through) {
  const remaining = [...fightersOf(player)];
  while (game.phase === "play") {
    const fighter = yield* chooseMover(
      player,
      remaining,
      () => stepOptions(player, through, steps).size > 0,
    );
    if (!fighter) break;
    remaining.splice(remaining.indexOf(fighter), 1);
    cur[player] = fighter;
    yield* walk(
      player,
      player,
      steps,
      fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
      { through, fighter },
    );
  }
  cur[player] = "hero";
}

function payCoin(player) {
  if (pl(player).coins > 0) {
    pl(player).coins -= 1;
    game.treasury += 1;
    log("logPayCoin", { player });
  }
}

function stealCoin(player) {
  if (game.treasury > 0) {
    game.treasury -= 1;
    pl(player).coins += 1;
    log("logStealCoin", { player });
  }
}

function* ransom(owner, cost, combat) {
  if (hero(owner).id !== "blackbeard" || game.treasury < cost) return false;
  const payer = other(owner);
  const ok = yield askConfirm(
    payer,
    cost === 2 ? "promptRansom2" : "promptRansom1",
  );
  if (!ok) return false;
  game.treasury -= cost;
  pl(owner).coins += cost;
  if (combat) combat.ransomPaid[owner] += cost;
  log("logRansom", { player: payer, n: cost });
  return true;
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
      damage(player, EXHAUSTION_DAMAGE, "hero");
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
  const discarded = getCard(cardId);
  if (
    discarded.key === "and-the-beautiful-bess" &&
    currentNote?.open &&
    currentNote.player !== player
  ) {
    draw(player, 1);
  }
  return discarded;
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
  for (const id of cardIds) {
    log("logShuffleCard", { player, card: getCard(id).name, cardId: id });
  }
}

// Tomoe Gozen, "Attack of Opportunity": коли ворожий герой залишає її зону - 1 шкоди.
function attackOfOpportunity(player, fromSpaceId) {
  const tomoe = other(player);
  if (
    game.phase !== "play" ||
    !pl(tomoe) ||
    hero(tomoe).id !== "tomoe-gozen" ||
    cur[player] !== "hero"
  ) {
    return;
  }
  const tomoeZones = active.spaceById.get(spaceOf(tomoe)).zones;
  const wasInZone = active.spaceById
    .get(fromSpaceId)
    .zones.some((zone) => tomoeZones.includes(zone));
  if (wasInZone && !shared(player, tomoe)) {
    log("logOpportunity", { player });
    activeCard = hero(tomoe).passive.name;
    damage(player, 1, "hero");
    activeCard = null;
  }
}

function setSpace(player, fighter, spaceId) {
  if (fighter === "hero") pl(player).space = spaceId;
  else kidOf(player, fighter).space = spaceId;
}

function place(player, spaceId) {
  const from = spaceOf(player);
  setSpace(player, cur[player], spaceId);
  if (cur[player] !== "hero") {
    log("logMoveSk", { who: kidOf(player, cur[player]).name, space: spaceId });
  } else {
    log("logMove", { player, space: spaceId });
  }
  if (from !== spaceId) attackOfOpportunity(player, from);
}

function swapPlaces() {
  const a = spaceOf("p1");
  setSpace("p1", cur.p1, spaceOf("p2"));
  setSpace("p2", cur.p2, a);
  log("logSwap");
}

function adjacentSpaces(player) {
  const blocked = occupiedBy(other(player));
  return active.spaceById
    .get(spaceOf(other(player)))
    .links.filter((id) => !blocked.includes(id));
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

// Рух по клітинках. Кожен крок - окремий вибір: клітинки, на які можна стати
// наступним кроком (через зайняті клітинки можна проходити, але не зупинятись;
// вартість стрибка - кількість пройдених клітинок). Кожен крок викликає place(),
// тому "Attack of Opportunity" спрацьовує щоразу, коли ворог виходить із зони.
function stepOptions(player, through = false, left = 1) {
  const hops = new Map();
  if (turnFlags.pinned[player]) return hops;
  const start = spaceOf(player);
  const foes = through ? [] : occupiedBy(other(player));
  const busy = occupied();
  const seen = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const current = queue.shift();
    const depth = seen.get(current);
    if (depth >= left) continue;
    for (const next of stepsFrom(current)) {
      if (foes.includes(next) || seen.has(next)) continue;
      seen.set(next, depth + 1);
      if (busy.includes(next)) queue.push(next);
      else hops.set(next, depth + 1);
    }
  }
  return hops;
}

// chooser обирає клітинки, player (його поточний боєць) рухається.
function* walk(
  chooser,
  player,
  steps,
  title,
  { through = false, fighter } = {},
) {
  let left = steps;
  while (left > 0 && game.phase === "play") {
    const hops = stepOptions(player, through, left);
    if (!hops.size) break;
    const prompt = askSpace(chooser, title, [...hops.keys()]);
    prompt.left = left;
    if (fighter) prompt.fighter = fighter;
    const space = yield prompt;
    if (!space) break;
    place(player, space);
    left -= hops.get(space);
  }
}

const suitOf = (player) =>
  hero(player).id === "black-panther" ? pl(player).suit || [] : [];

const boostPool = (player) => [...pl(player).hand, ...suitOf(player)];

function spendBoostCard(player, cardId) {
  const suit = pl(player).suit || [];
  const index = suit.indexOf(cardId);
  if (index !== -1 && !pl(player).hand.includes(cardId)) {
    suit.splice(index, 1);
    pl(player).discard.push(cardId);
    log("logDiscard", { player, card: getCard(cardId).name, cardId });
    fx("discard", player, { cardId });
    return getCard(cardId);
  }
  return discardFromHand(player, cardId);
}

function afterBoost(player) {
  if (hero(player).id === "black-panther") draw(player, 1);
}

function* boostedWith(player, card, combat = null) {
  const effect = cardEffects[card.key];
  if (!effect?.boosted || game.phase !== "play") return;
  const outer = currentNote;
  beginAnnounce(player, card, "boosted");
  const savedCard = activeCard;
  activeCard = card.name;
  yield* effect.boosted(context(player, card, combat));
  activeCard = savedCard;
  endAnnounce();
  currentNote = outer;
  game.announce = outer;
}

function* offerBoost(player, combat) {
  const card = combat.cards[player];
  if (!card || game.phase !== "play" || !boostPool(player).length) return;
  const ids = yield askCards(player, "promptBoost", boostPool(player), {
    min: 0,
    max: 1,
    skip: "gameSkipBoost",
  });
  if (!ids.length) return;
  const boostCard = spendBoostCard(player, ids[0]);
  combat.boosts[player] += boostCard.boost;
  combat.boostCardIds[player] = boostCard.id;
  combat.boostLists[player].push(boostCard.id);
  game.combat.boost[player] = true;
  afterBoost(player);
  yield* boostedWith(player, boostCard, combat);
}

const anySpaces = () =>
  active.map.spaces
    .map((space) => space.id)
    .filter((id) => !occupied().includes(id));

// Завдати шкоди будь-якому бійцю на мапі (обирає player).
function* damageAny(player, amount) {
  const targets = [];
  for (const owner of ["p1", "p2"]) {
    for (const fighter of fightersOf(owner)) {
      if (fighter !== "hero" && kidOf(owner, fighter)?.down) continue;
      targets.push({ owner, fighter, space: fighterSpace(owner, fighter) });
    }
  }
  if (!targets.length) return;
  const space = yield askSpace(
    player,
    "promptDamageAny",
    targets.map((target) => target.space),
  );
  const target = targets.find((item) => item.space === space);
  if (target) damage(target.owner, amount, target.fighter);
}

// Houdini і Bess міняються місцями; той, хто лишився, тепер б'ється замість першого.
function swapWithSidekick(player, combat) {
  const kid = pl(player).sidekicks.find((item) => !item.down);
  if (!kid) return false;
  const heroSpace = pl(player).space;
  pl(player).space = kid.space;
  kid.space = heroSpace;
  const next = cur[player] === "hero" ? kid.id : "hero";
  cur[player] = next;
  combat.fighters[player] = next;
  game.combat.fighters[player] = next;
  log("logSmokeSwap", { player });
  return true;
}

// Sleight of Hand: повернути зіграну карту в руку й зіграти іншу.
function* swapPlayedCard(player, combat) {
  const old = combat.cards[player];
  if (!old || game.phase !== "play") return;
  const attacking = combat.attacker === player;
  const fighter = combat.fighters[player];
  const options = pl(player).hand.filter((id) => {
    const card = getCard(id);
    return attacking
      ? attackPlayable(player, card, fighter)
      : canDefendWith(card) && allowedFor(card, fighter);
  });
  if (!options.length) return;
  const ok = yield askConfirm(player, "promptSleightReturn");
  if (!ok) return;
  const outer = currentNote;
  const ids = yield askCards(
    player,
    attacking ? "promptAttackCard" : "promptDefenseCard",
    options,
    { min: 1, max: 1 },
  );
  if (!ids.length) return;
  const card = getCard(ids[0]);
  pl(player).hand.splice(pl(player).hand.indexOf(card.id), 1);
  pl(player).hand.push(old.id);
  combat.cards[player] = card;
  combat.canceled[player] = false;
  game.combat.cardIds[player] = card.id;
  game.combat.covers[player] = card.heroId;
  game.combat.shown[player] = card.id;
  log("logSleightReturn", {
    player,
    card: old.name,
    cardId: old.id,
    next: card.name,
    nextId: card.id,
  });
  yield* runEffect(player, card, "immediate", combat);
  currentNote = outer;
  game.announce = outer;
}

function returnFromDiscard(player, cardId) {
  const target = pl(player);
  const index = target.discard.lastIndexOf(cardId);
  if (index === -1) return false;
  target.discard.splice(index, 1);
  target.hand.push(cardId);
  log("logReturnCard", { player, card: getCard(cardId).name, cardId });
  return true;
}

function rescueFighter(player, hp) {
  const pending = game.combat?.pending;
  if (!pending?.[player]) return false;
  const fighter = game.combat.fighters[player];
  if (fighter === "hero") {
    pl(player).hp = Math.min(hp, pl(player).maxHp);
  } else {
    const kid = kidOf(player, fighter);
    kid.hp = Math.min(hp, kid.maxHp);
    kid.down = false;
  }
  pending[player] = false;
  log("logRescue", { player, n: hp });
  return true;
}

function* moveOne(player, steps) {
  const saved = cur[player];
  const fighter = yield* chooseMover(
    player,
    [...fightersOf(player)],
    () => stepOptions(player, false, steps).size > 0,
  );
  if (fighter) {
    cur[player] = fighter;
    yield* walk(
      player,
      player,
      steps,
      fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
      { fighter },
    );
  }
  cur[player] = saved;
}

function storeInSuit(player, from, count) {
  const target = pl(player);
  if (!target.suit) target.suit = [];
  for (let i = 0; i < count && pl(from).deck.length; i++) {
    const id = pl(from).deck.shift();
    target.suit.push(id);
    log("logSuitStore", { player, card: getCard(id).name, cardId: id });
  }
}

function sameZone(player, fighterA, fighterB) {
  const a = active.spaceById.get(fighterSpace(player, fighterA)).zones;
  const b = active.spaceById.get(fighterSpace(player, fighterB)).zones;
  return a.some((zone) => b.includes(zone));
}

const api = {
  storeInSuit,
  sameZone,
  hero,
  log,
  draw,
  drawUntil,
  damage,
  heal,
  healFriendly,
  sidekickAdjacent,
  adjacentToFoe,
  adjacentSidekicks: (player) =>
    pl(player)
      .sidekicks.filter(
        (kid) =>
          !kid.down &&
          active.spaceById.get(pl(player).space).links.includes(kid.space),
      )
      .map((kid) => kid.id),
  foeFightersInZone,
  adjacentFightersOf,
  otherFriendAdjacentToFoe,
  summonSpaces,
  summon,
  moveAll,
  ransom,
  stealCoin,
  payCoin,
  fighterName,
  startSpaces: () => Object.values(active.map.starts),
  occupiedSpaces: () => occupied(),
  spaceOf,
  fighterSpace,
  cardBoost: (id) => getCard(id).boost,
  putOnDeckTop: (player, id) => {
    const target = pl(player);
    target.hand.splice(target.hand.indexOf(id), 1);
    target.deck.unshift(id);
    log("logRevealTop", { player, card: getCard(id).name, cardId: id });
  },
  shuffleHandIntoDeck: (player) => {
    const target = pl(player);
    const n = target.hand.length;
    target.deck = shuffle([...target.deck, ...target.hand]);
    target.hand = [];
    log("logShuffleHand", { player, n });
  },
  fighterOf: (player) => cur[player],
  shuffleDeck: (player) => {
    pl(player).deck = shuffle(pl(player).deck);
    log("logShuffleDeck", { player });
  },
  mistsReplace,
  place,
  reach,
  walk,
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
  anySpaces,
  boostedWith,
  offerBoost,
  damageAny,
  swapWithSidekick,
  swapPlayedCard,
  returnFromDiscard,
  rescueFighter,
  moveOne,
  cardKey: (id) => getCard(id).key,
  isTurnOf: (player) => game.turn === player,
  fighterNow: (player) => cur[player],
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
const attackPlayable = (player, card, fighter = cur[player]) =>
  canAttackWith(card) &&
  allowedFor(card, fighter) &&
  withFighter(
    player,
    fighter,
    () => cardEffects[card.key]?.canAttack?.(context(player, card)) ?? true,
  );
const canDefendWith = (card) => !isScheme(card) && card.type !== "attack";

const attackCardsFor = (player, fighter) =>
  pl(player).hand.filter((id) => attackPlayable(player, getCard(id), fighter));

function attackChoices(player) {
  return attackPairs(player).filter(
    ({ mine }) => attackCardsFor(player, mine).length,
  );
}

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

function* mistsReplace(me, combat) {
  const foe = other(me);
  const outer = currentNote;
  if (!pl(foe).deck.length) {
    log("logMistsNoDeck", { player: foe });
    return;
  }
  const attackerRole = combat.attacker === foe;
  const fighter = combat.fighters[foe];
  const revealed = [];
  let found = null;
  while (pl(foe).deck.length) {
    const id = pl(foe).deck.shift();
    const card = getCard(id);
    log("logMistsReveal", { player: foe, card: card.name, cardId: id });
    const typeOk = card.type === "attack" || card.type === "versatile";
    const playable =
      typeOk &&
      !isScheme(card) &&
      allowedFor(card, fighter) &&
      (attackerRole ? attackPlayable(foe, card, fighter) : canDefendWith(card));
    if (playable) {
      found = card;
      break;
    }
    revealed.push(id);
  }
  const old = combat.cards[foe];
  if (found && old) {
    pl(foe).discard.push(old.id);
    log("logMistsDiscard", { card: old.name, cardId: old.id });
    fx("discard", foe, { cardId: old.id });
  }
  const bottom = shuffle(revealed);
  pl(foe).deck.push(...bottom);
  for (const id of bottom) {
    log("logMistsBottom", { player: foe, card: getCard(id).name, cardId: id });
  }
  yield {
    kind: "info",
    player: null,
    title: "gameMistsTitle",
    mists: {
      owner: foe,
      rejected: [...revealed],
      found: found ? found.id : null,
      kept: !found && old ? old.id : null,
    },
  };
  if (found) {
    combat.cards[foe] = found;
    combat.canceled[foe] = false;
    if (game.combat) {
      game.combat.cardIds[foe] = found.id;
      game.combat.covers[foe] = found.heroId;
      game.combat.shown[foe] = found.id;
    }
    log("logMistsPlay", { player: foe, card: found.name, cardId: found.id });
    if (combat.immediateDone[foe]) {
      yield* runEffect(foe, found, "immediate", combat);
      currentNote = outer;
      game.announce = outer;
    }
  } else {
    log("logMistsNone", { player: foe });
  }
}

function* startTurn() {
  const me = game.turn;
  resetTurnFlags();
  game.actions = ACTIONS_PER_TURN;
  game.turnStart = spaceOf(me);
  game.redRoomIgnored[me] = false;
  log("logTurn", { player: me });
  cur[me] = "hero";
  if (hero(me).id === "blackbeard" && pl(me).coins > 0) {
    const ok = yield askConfirm(me, "promptPayAction");
    if (ok) {
      payCoin(me);
      gainAction(1);
    }
  }
  if (hero(me).id === "ms-marvel") {
    yield* walk(me, me, 1, "promptStretchy");
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

const escapeReady = (player, boosted) =>
  boosted &&
  cur[player] === "hero" &&
  hero(player).id === "harry-houdini" &&
  anySpaces().length > 0;

function* maneuver(me) {
  spendAction();
  log("logManeuver", { player: me });
  draw(me, 1);
  if (game.phase !== "play") return true;

  let boosted = false;
  let boostSteps = 0;
  let started = false;
  const remaining = [...fightersOf(me)];
  while (game.phase === "play") {
    const fighter = yield* chooseMover(
      me,
      remaining,
      () =>
        escapeReady(me, boosted) ||
        stepOptions(me, false, hero(me).move + boostSteps).size > 0,
    );
    if (!fighter) break;
    remaining.splice(remaining.indexOf(fighter), 1);
    cur[me] = fighter;
    let moved = 0;
    while (
      !escapeReady(me, boosted) &&
      moved < hero(me).move + boostSteps &&
      game.phase === "play"
    ) {
      const left = hero(me).move + boostSteps - moved;
      const hops = stepOptions(me, false, left);
      if (!hops.size) break;
      const prompt = askSpace(
        me,
        fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
        [...hops.keys()],
      );
      prompt.fighter = fighter;
      prompt.left = left;
      prompt.boostOptions = !boosted && !started ? boostPool(me) : [];
      prompt.undo = !boosted;
      const answer = yield prompt;
      if (answer && typeof answer === "object") {
        const boostCard = spendBoostCard(me, answer.boost);
        boostSteps += boostCard.boost;
        afterBoost(me);
        boosted = true;
        yield* boostedWith(me, boostCard);
        if (!fightersOf(me).includes(fighter)) break;
        continue;
      }
      if (!answer) break;
      place(me, answer);
      moved += hops.get(answer);
      started = true;
    }
    if (
      escapeReady(me, boosted) &&
      fightersOf(me).includes(fighter) &&
      game.phase === "play"
    ) {
      const places = anySpaces();
      if (places.length) {
        const prompt = askSpace(me, "promptEscapeArtist", places);
        prompt.fighter = fighter;
        const space = yield prompt;
        if (space) place(me, space);
      }
    }
    started = true;
  }
  cur[me] = "hero";
  return true;
}

function* useSchemeToken(me, fighter) {
  const token = tokenAt(fighterSpace(me, fighter), "scheme");
  const foe = other(me);
  log("logToken", { player: me, token: token.id });
  if (token.id === "rocket-pack") {
    const options = active.map.spaces
      .map((space) => space.id)
      .filter((id) => !occupied().includes(id));
    if (!options.length) return;
    const space = yield askSpace(me, "promptRocketPack", options);
    if (!space) return;
    withFighter(me, fighter, () => place(me, space));
    removeToken(token);
  } else if (token.id === "laser-turret") {
    const zones = active.spaceById.get(fighterSpace(me, fighter)).zones;
    const targets = fightersOf(foe).filter((target) =>
      active.spaceById
        .get(fighterSpace(foe, target))
        .zones.some((zone) => zones.includes(zone)),
    );
    if (!targets.length) {
      log("logNoTarget");
      return;
    }
    const target = yield* pickTarget(me, foe, targets);
    if (!target) return;
    damage(foe, 2, target);
    removeToken(token);
  } else if (token.id === "first-aid-kit") {
    heal(me, 2, fighter);
    draw(me, 1);
    removeToken(token);
  } else if (token.id === "map-token") {
    turnFlags.anyRange[me] = true;
    removeToken(token);
  } else if (token.id === "payphone") {
    const pile = [...pl(me).discard];
    if (pile.length) {
      const ids = yield askCards(me, "promptPayphone", pile, {
        min: 1,
        max: 1,
      });
      for (const id of ids) {
        pl(me).discard.splice(pl(me).discard.indexOf(id), 1);
        pl(me).hand.push(id);
      }
    } else {
      log("logNoTarget");
    }
    removeToken(token);
  } else if (token.id === "helium-balloons") {
    removeToken(token);
    cur[me] = fighter;
    yield* walk(
      me,
      me,
      2,
      fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
      { fighter },
    );
    cur[me] = "hero";
    gainAction(1);
  } else if (token.id === "xl-slushie") {
    heal(me, 3, fighter);
    removeToken(token);
  } else if (token.id === "zazoom") {
    const who = yield askChoice(me, "promptZazoomDeck", [
      { value: me, label: "gameZazoomOwn" },
      { value: foe, label: "gameZazoomFoe" },
    ]);
    const target = pl(who);
    const rest = target.deck.slice(0, 3);
    const order = [];
    while (rest.length > 1) {
      const ids = yield askCards(me, "promptZazoom", [...rest], {
        min: 1,
        max: 1,
      });
      const id = ids[0] || rest[0];
      rest.splice(rest.indexOf(id), 1);
      order.push(id);
    }
    order.push(...rest);
    target.deck = [...order, ...target.deck.slice(order.length)];
    removeToken(token);
  } else if (token.id === "brazier") {
    const schemes = pl(me).deck.filter((id) => isScheme(getCard(id)));
    if (!schemes.length) {
      log("logNoTarget");
    } else {
      const ids = yield askCards(me, "promptBrazier", schemes, {
        min: 1,
        max: 1,
      });
      if (ids.length) {
        const card = getCard(ids[0]);
        pl(me).deck.splice(pl(me).deck.indexOf(card.id), 1);
        pl(me).deck = shuffle(pl(me).deck);
        log("logScheme", { player: me, card: card.name });
        removeToken(token);
        yield* runEffect(me, card, "scheme", null);
        pl(me).discard.push(card.id);
        return;
      }
    }
    removeToken(token);
  } else if (token.id === "daily-bugle") {
    draw(me, 3);
    const hand = [...pl(me).hand];
    if (hand.length) {
      const ids = yield askCards(me, "promptDailyBugle", hand, {
        min: 1,
        max: 1,
      });
      for (const id of ids) {
        pl(me).hand.splice(pl(me).hand.indexOf(id), 1);
        pl(me).deck.push(id);
      }
    }
    removeToken(token);
  } else if (token.id === "astral-ring") {
    removeToken(token);
    yield* moveAll(me, 1, false);
    yield* moveAll(foe, 1, false);
  } else if (token.id === "emp-pulse-array") {
    for (const player of [me, foe]) {
      const hand = [...pl(player).hand];
      const count = Math.min(2, hand.length);
      if (!count) continue;
      const ids = yield askCards(player, "promptEmpDiscard", hand, {
        min: count,
        max: count,
      });
      for (const id of ids) discardFromHand(player, id);
      removeToken(token);
    }
  }
}

function* scheme(me) {
  const options = pl(me).hand.filter((id) => isScheme(getCard(id)));
  const carriers = tokenFighters(me, "scheme");
  if (!options.length && !carriers.length) return false;
  let source = "card";
  if (carriers.length && options.length) {
    source = yield askChoice(me, "promptSchemeSource", [
      { value: "card", label: "gameSchemeCard" },
      { value: "token", label: "gameSchemeToken" },
      { value: "cancel", label: "gameCancel" },
    ]);
    if (source === "cancel") return false;
  } else if (!options.length) {
    source = "token";
  }
  if (source === "token") {
    let fighter = carriers[0];
    if (carriers.length > 1) {
      fighter = yield* pickFighter(me, "promptTokenFighter", carriers);
      if (!fighter) return false;
    }
    spendAction();
    yield* useSchemeToken(me, fighter);
    return true;
  }
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

function* pickFighter(me, title, fighters) {
  if (fighters.length === 1) return fighters[0];
  const prompt = askSpace(
    me,
    title,
    fighters.map((fighter) => fighterSpace(me, fighter)),
  );
  prompt.undo = true;
  const space = yield prompt;
  if (!space) return null;
  return fighters.find((fighter) => fighterSpace(me, fighter) === space);
}

function* pickTarget(me, foe, fighters) {
  if (fighters.length === 1) return fighters[0];
  const prompt = askSpace(
    me,
    "promptAttackTarget",
    fighters.map((fighter) => fighterSpace(foe, fighter)),
  );
  prompt.undo = true;
  const space = yield prompt;
  if (!space) return null;
  return fighters.find((fighter) => fighterSpace(foe, fighter) === space);
}

function* attack(me) {
  const foe = other(me);
  const choices = attackChoices(me);
  if (!choices.length) return false;

  const mine = yield* pickFighter(me, "promptAttackWith", [
    ...new Set(choices.map((item) => item.mine)),
  ]);
  if (!mine) return false;
  const theirs = yield* pickTarget(me, foe, [
    ...new Set(
      choices.filter((item) => item.mine === mine).map((item) => item.theirs),
    ),
  ]);
  if (!theirs) return false;

  cur[me] = mine;
  cur[foe] = theirs;

  const options = attackCardsFor(me, mine);
  const attackIds = yield askCards(me, "promptAttackCard", options, {
    min: 0,
    max: 1,
    skip: "gameCancel",
  });
  if (!attackIds.length) {
    resetFighters();
    return false;
  }

  spendAction();
  turnFlags.anyRange[me] = false;
  const attackCard = getCard(attackIds[0]);
  pl(me).hand.splice(pl(me).hand.indexOf(attackCard.id), 1);
  log("logAttack", { player: me });

  const faceUp = Boolean(cardEffects[attackCard.key]?.faceUp);
  game.combat = {
    attacker: me,
    defender: foe,
    stage: "defense",
    defense: "pending",
    fighters: { [me]: mine, [foe]: theirs },
    cardIds: { [me]: attackCard.id, [foe]: null },
    covers: { [me]: attackCard.heroId, [foe]: null },
    revealed: { p1: null, p2: null, [me]: faceUp ? attackCard.id : null },
    // Карти, відкриті обом з моменту вибору захисту (видно під час immediate/boost).
    shown: { p1: null, p2: null },
    announcedValue: hero(foe).id === "spider-man" ? attackCard.value : null,
    terrain: active.spaceById
      .get(fighterSpace(me, mine))
      .bonusTo.includes(fighterSpace(foe, theirs))
      ? 1
      : 0,
    boost: { p1: false, p2: false },
    rescue: { p1: false, p2: false },
    pending: { p1: false, p2: false },
  };

  let defenseCard = null;
  const defenseOptions = pl(foe).hand.filter((id) => {
    const card = getCard(id);
    return canDefendWith(card) && allowedFor(card, theirs);
  });
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
  game.combat.defense = defenseCard ? "card" : "none";
  game.combat.cardIds[foe] = defenseCard ? defenseCard.id : null;
  game.combat.covers[foe] = defenseCard ? defenseCard.heroId : null;
  game.combat.shown[me] = attackCard.id;
  game.combat.shown[foe] = defenseCard ? defenseCard.id : null;
  game.combat.stage = "immediate";

  const combat = {
    attacker: me,
    defender: foe,
    fighters: { [me]: mine, [foe]: theirs },
    cards: { [me]: attackCard, [foe]: defenseCard },
    canceled: { p1: false, p2: false },
    taken: { p1: 0, p2: 0 },
    won: { p1: false, p2: false },
    values: { p1: 0, p2: 0 },
    returnToHand: { p1: false, p2: false },
    kept: { p1: false, p2: false },
    ransomPaid: { p1: 0, p2: 0 },
    immediateDone: { p1: false, p2: false },
    boosts: { p1: 0, p2: 0 },
    boostCardIds: { p1: null, p2: null },
    boostLists: { p1: [], p2: [] },
  };

  const players = [foe, me];
  for (const player of players) {
    const card = combat.cards[player];
    if (card && !combat.canceled[player]) {
      yield* runEffect(player, card, "immediate", combat);
    }
    combat.immediateDone[player] = true;
  }
  if (game.phase !== "play" || !game.combat) return true;

  game.combat.stage = "boost";
  for (const player of players) {
    const card = combat.cards[player];
    game.combat.rescue[player] = Boolean(
      card && !combat.canceled[player] && cardEffects[card.key]?.rescue,
    );
  }
  const boosts = combat.boosts;
  const boostCardIds = combat.boostCardIds;
  const boostLists = combat.boostLists;
  const baseValues = { p1: 0, p2: 0 };
  for (const player of players) {
    const card = combat.cards[player];
    const effect = card && cardEffects[card.key];
    if (
      card &&
      !combat.canceled[player] &&
      effect?.canBoost?.(context(player, card, combat))
    ) {
      const times = effect.maxBoosts?.(context(player, card, combat)) ?? 1;
      for (let i = 0; i < times && boostPool(player).length; i++) {
        const ids = yield askCards(player, "promptBoost", boostPool(player), {
          min: 0,
          max: 1,
          skip: "gameSkipBoost",
        });
        if (!ids.length) break;
        const boostCard = spendBoostCard(player, ids[0]);
        boosts[player] += boostCard.boost;
        boostCardIds[player] = boostCard.id;
        boostLists[player].push(boostCard.id);
        game.combat.boost[player] = true;
        afterBoost(player);
        yield* boostedWith(player, boostCard, combat);
      }
    }
    const blind = effect?.blindBoost?.(context(player, card, combat)) || 0;
    for (let i = 0; card && !combat.canceled[player] && i < blind; i++) {
      if (!pl(player).deck.length) break;
      const ok = yield askConfirm(player, "promptBlindBoost");
      if (!ok) break;
      const id = pl(player).deck.shift();
      pl(player).discard.push(id);
      const boostCard = getCard(id);
      boosts[player] += boostCard.boost;
      boostCardIds[player] = id;
      boostLists[player].push(id);
      game.combat.boost[player] = true;
      log("logBlindBoost", {
        player,
        card: boostCard.name,
        cardId: id,
        n: boostCard.boost,
      });
      fx("discard", player, { cardId: id });
    }
  }

  const tokenBoost = { p1: null, p2: null };
  for (const player of players) {
    const token = tokenAt(
      fighterSpace(player, combat.fighters[player]),
      "boost",
    );
    if (!token) continue;
    const use = yield askConfirm(player, "promptBoostToken");
    if (!use) continue;
    boosts[player] += TOKENS[token.id].value;
    tokenBoost[player] = token.id;
    removeToken(token);
    game.combat.boost[player] = true;
    log("logToken", { player, token: token.id });
  }

  if (game.phase !== "play" || !game.combat) return true;

  const ignored = { p1: false, p2: false };
  for (const player of players) {
    const card = combat.cards[player];
    const effect = card && cardEffects[card.key];
    if (
      effect?.ignoreFoeValue &&
      !combat.canceled[player] &&
      effect.ignoreFoeValue(context(player, card, combat))
    ) {
      ignored[other(player)] = true;
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
    if (ignored[player]) value = 0;
    baseValues[player] = value;
    let total = value + boosts[player];
    if (effect?.finalValue && !combat.canceled[player]) {
      total = effect.finalValue(context(player, card, combat), total);
    }
    combat.values[player] = total;
  }
  const terrain = game.combat.terrain;
  combat.values[me] += turnFlags.attackBonus[me] + terrain;

  const raw = Math.max(0, combat.values[me] - combat.values[foe]);
  let dealt = raw;
  const capEffect =
    combat.cards[foe] && cardEffects[combat.cards[foe].key]?.damageCap;
  if (capEffect && !combat.canceled[foe]) {
    dealt = Math.min(dealt, capEffect(context(foe, combat.cards[foe], combat)));
  }
  combat.taken[foe] = dealt;
  combat.won[me] = raw > 0;
  combat.won[foe] = raw === 0;
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
      fighters: { ...combat.fighters },
      cardIds: {
        [me]: combat.cards[me] ? combat.cards[me].id : null,
        [foe]: combat.cards[foe] ? combat.cards[foe].id : null,
      },
      values: { ...combat.values },
      boosts: { ...boosts },
      boostCardIds: { ...boostCardIds },
      boostCardLists: { p1: [...boostLists.p1], p2: [...boostLists.p2] },
      tokenBoost: { ...tokenBoost },
      base: { ...baseValues },
      bonus: turnFlags.attackBonus[me],
      terrain,
      dealt,
    },
  };

  if (dealt > 0) damage(foe, dealt);
  else log("logNoDamage");
  if (
    dealt > 0 &&
    game.phase === "play" &&
    combat.fighters[foe] === "hero" &&
    hero(foe).id === "blackbeard"
  ) {
    payCoin(foe);
  }

  if (game.combat) game.combat.stage = "after";
  for (const player of players) {
    const card = combat.cards[player];
    if (card && !combat.canceled[player] && game.phase === "play") {
      yield* runEffect(player, card, "after", combat);
    }
  }

  for (const player of players) {
    if (game.phase === "play" && game.combat?.pending[player]) {
      game.combat.pending[player] = false;
      finalizeDefeat(player, combat.fighters[player]);
    }
  }

  for (const player of players) {
    const card = combat.cards[player];
    if (
      game.phase === "play" &&
      card &&
      combat.fighters[player] === "hero" &&
      hero(player).id === "doctor-strange" &&
      !combat.returnToHand[player]
    ) {
      beginAnnounce(player, card, "after");
      const ok = yield askConfirm(player, "promptDarkPact");
      if (ok) {
        activeCard = hero(player).passive.name;
        log("logDarkPact", { player, card: card.name, cardId: card.id });
        damage(player, 1, "hero");
        activeCard = null;
        if (game.phase === "play") {
          pl(player).deck.push(card.id);
          combat.kept[player] = true;
          draw(player, 1);
        }
      }
      endAnnounce();
    }
  }

  const finish = (player, card) => {
    if (!card || combat.kept[player]) return;
    if (combat.returnToHand[player]) pl(player).hand.push(card.id);
    else pl(player).discard.push(card.id);
  };
  finish(me, combat.cards[me]);
  finish(foe, combat.cards[foe]);
  for (const player of ["p1", "p2"]) {
    pl(player).sidekicks = pl(player).sidekicks.filter((kid) => !kid.down);
  }
  game.combat = null;
  resetFighters();
  return true;
}

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
  resetFighters();
  flow = generator;
  advance(undefined);
}

const canAct = () =>
  game.phase === "play" && !game.prompt && !flow && game.actions > 0;

function placeTokens() {
  const result = [];
  for (const kind of ["scheme", "boost"]) {
    const slots = active.map.tokenSlots.filter((slot) => slot.kind === kind);
    const ids = shuffle(tokenIds(kind, active.map.id));
    slots.forEach((slot, index) => {
      if (ids[index]) result.push({ id: ids[index], kind, space: slot.space });
    });
  }
  return result;
}

function placeSidekicks() {
  for (const player of ["p1", "p2"]) {
    for (const kid of pl(player).sidekicks) kid.space = null;
  }
  const taken = new Set(occupiedBy("p1").concat(occupiedBy("p2")));
  for (const player of ["p1", "p2"]) {
    const home = pl(player).space;
    for (const kid of pl(player).sidekicks) {
      const links = active.spaceById.get(home).links;
      kid.space = links.find((id) => !taken.has(id)) || home;
      taken.add(kid.space);
    }
  }
}

function startGame(deckA, deckB, first = "p1", chooser = "p2") {
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
      sidekicks: data.sidekick
        ? Array.from(
            {
              length: data.sidekick.summon ? (data.sidekick.start ?? 0) : 1,
            },
            (_, i) => ({
              id: "sk" + (i + 1),
              name: data.sidekick.name,
              hp: data.sidekick.hp,
              maxHp: data.sidekick.hp,
              attack: data.sidekick.attack,
              space: null,
              down: false,
            }),
          )
        : [],
      coins: data.id === "blackbeard" ? 2 : 0,
      deck: shuffled.slice(START_HAND),
      hand: shuffled.slice(0, START_HAND),
      discard: [],
      suit: [],
    };
  };

  useMapId(game.mapId);
  game.players.p1 = setup(deckA, "p1");
  game.players.p2 = setup(deckB, "p2");
  game.tokens = placeTokens();
  placeSidekicks();
  game.treasury = [deckA, deckB].some((deck) => deck.heroId === "blackbeard")
    ? 1
    : 0;
  resetFighters();
  game.turn = first;
  game.viewer = "p1";
  game.winner = null;
  game.log = [];
  game.toss = null;
  log("logFirstPlayer", { player: first });
  game.combat = null;
  game.announce = null;
  game.announces = [];
  currentNote = null;
  undoPoint = null;
  game.redRoomIgnored = { p1: false, p2: false };
  mulliganChoices = { p1: null, p2: null };
  game.mulligan = { decided: { p1: false, p2: false }, reveal: null };
  game.startPick = null;
  game.phase = "mulligan";
  if (game.tokens.length) {
    game.startPick = { order: [chooser], index: 0, taken: [] };
    game.phase = "startpick";
  }
  syncOut();
}

function startOptions() {
  const pick = game.startPick;
  if (!pick) return [];
  return [active.map.starts.p1, active.map.starts.p2].filter(
    (id) => !pick.taken.includes(id),
  );
}

function applyStartPick(player, spaceId) {
  const pick = game.startPick;
  if (game.phase !== "startpick" || !pick) return;
  if (pick.order[pick.index] !== player) return;
  if (!startOptions().includes(spaceId)) return;
  const rest = startOptions().find((id) => id !== spaceId);
  pl(player).space = spaceId;
  pl(other(player)).space = rest;
  pick.taken.push(spaceId, rest);
  pick.index += 1;
  if (pick.index >= pick.order.length) {
    placeSidekicks();
    game.startPick = null;
    game.phase = "mulligan";
  }
}

function beginPlay() {
  game.mulligan = null;
  game.viewer = "p1";
  game.phase = "play";
  log("logStart");
  run(startTurn());
  syncOut();
}

function revealMulligan() {
  const reveal = { p1: "keep", p2: "keep" };
  for (const player of ["p1", "p2"]) {
    if (mulliganChoices[player]) {
      const state = pl(player);
      const pile = shuffle([...state.hand, ...state.deck]);
      state.hand = pile.slice(0, START_HAND);
      state.deck = pile.slice(START_HAND);
      reveal[player] = "mulligan";
      log("logMulligan", { player });
    } else {
      log("logKeepHand", { player });
    }
  }
  game.mulligan.reveal = reveal;
}

function applyMulligan(player, redraw) {
  const state = game.mulligan;
  if (game.phase !== "mulligan" || !state || state.reveal) return;
  if (player !== "p1" && player !== "p2") return;
  if (typeof redraw !== "boolean" || state.decided[player]) return;
  mulliganChoices[player] = redraw;
  state.decided[player] = true;
  if (state.decided.p1 && state.decided.p2) revealMulligan();
  syncOut();
}

function applyMulliganContinue() {
  if (game.phase !== "mulligan" || !game.mulligan?.reveal) return;
  beginPlay();
}

function resetGame(clearNotice = true) {
  flow = null;
  if (clearNotice) game.notice = null;
  lobbyDecks = { p1: null, p2: null };
  mulliganChoices = { p1: null, p2: null };
  game.mulligan = null;
  game.tokens = [];
  game.startPick = null;
  game.lobby = { p1: null, p2: null };
  game.toss = null;
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
    tokens: game.tokens,
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
  turnFlags.anyRange = snap.flags.anyRange;
  game.tokens = snap.tokens;
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
  else if (type === "attack" && canAct() && attackChoices(game.turn).length) {
    takeSnapshot();
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

function pickStart(spaceId, player) {
  if (net.isGuest.value) send({ type: "startPick", spaceId });
  else applyStartPick(net.isHost.value ? "p1" : player, spaceId);
}

function chooseMulligan(redraw, player) {
  if (net.isGuest.value) send({ type: "mulligan", redraw });
  else applyMulligan(net.isHost.value ? "p1" : player, redraw);
}

function continueMulligan() {
  if (net.isGuest.value) send({ type: "mulliganContinue" });
  else applyMulliganContinue();
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
  if (game.phase !== "setup" || game.toss || !validDeck(deck)) return;
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

function rollDie() {
  return 1 + Math.floor(Math.random() * 6);
}

function rollToss() {
  let rolls;
  let rerolls = -1;
  do {
    rolls = { p1: rollDie(), p2: rollDie() };
    rerolls += 1;
  } while (rolls.p1 === rolls.p2);
  game.fxSeq += 1;
  game.toss = {
    id: game.fxSeq,
    rolls,
    rerolls,
    winner: rolls.p1 > rolls.p2 ? "p1" : "p2",
    stage: "map",
  };
  syncOut();
}

function applyMap(player, id) {
  if (game.phase !== "setup") return;
  if (!gameMaps.some((item) => item.id === id)) return;
  if (net.online.value) {
    if (game.toss?.stage !== "map" || game.toss.winner !== player) return;
  }
  game.mapId = id;
  useMapId(id);
  syncOut();
}

function applyMapConfirm(player) {
  const toss = game.toss;
  if (game.phase !== "setup" || toss?.stage !== "map") return;
  if (toss.winner !== player) return;
  toss.stage = "order";
  syncOut();
}

function applyOrder(player, goFirst) {
  const toss = game.toss;
  if (game.phase !== "setup" || toss?.stage !== "order") return;
  if (player !== other(toss.winner) || typeof goFirst !== "boolean") return;
  if (!lobbyDecks.p1 || !lobbyDecks.p2) return;
  startGame(
    lobbyDecks.p1,
    lobbyDecks.p2,
    goFirst ? player : toss.winner,
    player,
  );
}

function setMap(id) {
  if (net.isGuest.value) send({ type: "map", id });
  else applyMap("p1", id);
}

function confirmMap() {
  if (net.isGuest.value) send({ type: "mapConfirm" });
  else applyMapConfirm("p1");
}

function chooseOrder(goFirst) {
  if (net.isGuest.value) send({ type: "order", goFirst });
  else applyOrder("p1", goFirst);
}
function startOnlineGame() {
  game.notice = null;
  if (!net.isHost.value || game.phase !== "setup" || game.toss) return;
  if (!lobbyDecks.p1 || !lobbyDecks.p2) return;
  if (lobbyDecks.p1.heroId === lobbyDecks.p2.heroId) return;
  rollToss();
}

function availableActions() {
  const none = { maneuver: false, scheme: false, attack: false };
  if (game.phase !== "play" || blocked()) return none;
  const me = game.turn;
  const idle = !game.prompt && !flow;
  const hand = pl(me).hand.map(getCard);
  return {
    maneuver: idle && game.actions > 0,
    scheme:
      idle &&
      game.actions > 0 &&
      (hand.some(isScheme) || tokenFighters(me, "scheme").length > 0),
    attack: idle && game.actions > 0 && attackChoices(me).length > 0,
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
  else if (message.type === "startPick") applyStartPick("p2", message.spaceId);
  else if (message.type === "mulligan") applyMulligan("p2", message.redraw);
  else if (message.type === "mulliganContinue") applyMulliganContinue();
  else if (message.type === "map") applyMap("p2", message.id);
  else if (message.type === "mapConfirm") applyMapConfirm("p2");
  else if (message.type === "order") applyOrder("p2", message.goFirst);
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
    chooseMulligan,
    continueMulligan,
    doManeuver,
    doScheme,
    doAttack,
    doUndo,
    surrender,
    availableActions,
    heroOf: (player) => (pl(player) ? hero(player) : null),
    other,
    confirmMap,
    chooseOrder,
    pickStart,
  };
}
