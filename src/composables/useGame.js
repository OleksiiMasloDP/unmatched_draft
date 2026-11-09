import { reactive, computed } from "vue";
import { gameMaps, getMap } from "../gameMaps.js";
import { getCard, getHero } from "../gameDecks.js";
import { cardEffects } from "../gameEffects.js";
import { TOKENS, tokenIds } from "../gameTokens.js";
import { useOnline } from "./useOnline.js";
import "../i18nSanta.js";

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
  turnNo: 0,
  actions: 0,
  freeAttacks: [],
  turnStart: null,
  redRoomIgnored: { p1: false, p2: false },
  gadget: { p1: null, p2: null },
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
  bot: null,
  botLevel: "normal",
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
  showdown: { p1: [], p2: [] },
};

function resetTurnFlags() {
  turnFlags.noDraw = { p1: false, p2: false };
  turnFlags.attackBonus = { p1: 0, p2: 0 };
  turnFlags.pinned = { p1: false, p2: false };
  turnFlags.anyRange = { p1: false, p2: false };
  turnFlags.showdown = { p1: [], p2: [] };
}

let activeCard = null;
let damageSrc = null;

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

function fallHero(player) {
  const target = pl(player);
  if (game.phase !== "play" || target.hp > 0) return;
  const kid = hero(player).team
    ? target.sidekicks.find((item) => !item.down)
    : null;
  if (!kid) {
    setOver(other(player));
    return;
  }
  log("logSidekickDown", { who: kid.name });
  target.hp = kid.hp;
  target.maxHp = kid.maxHp;
  target.space = kid.space;
  target.skin = kid.image;
  kid.down = true;
  kid.hp = 0;
  if (!game.combat) buryKids(player);
}

function finalizeDefeat(player, fighter) {
  if (fighter === "hero") {
    fallHero(player);
    return;
  }
  const kid = kidOf(player, fighter);
  if (!kid) return;
  kid.down = true;
  log("logSidekickDown", { who: kid.name });
}

const source = () => activeCard || damageSrc;

function buryKids(player) {
  const target = pl(player);
  if (!target.fallen) target.fallen = [];
  for (const kid of target.sidekicks.filter((item) => item.down)) {
    target.fallen.push(kid);
  }
  target.sidekicks = target.sidekicks.filter((kid) => !kid.down);
}

let combatHit = false;
function noteReveal(player, id, kind = "reveal") {
  if (game.combat?.reveals)
    game.combat.reveals.push({ player, cardId: id, kind });
}

function damage(player, amount, fighter = cur[player]) {
  if (amount <= 0 || game.phase !== "play") return;
  if (
    !combatHit &&
    game.combat?.immune?.[player] &&
    game.combat.fighters[player] === fighter
  ) {
    return;
  }
  if (fighter !== "hero") {
    const kid = kidOf(player, fighter);
    if (!kid || kid.down) return;
    kid.hp = Math.max(0, kid.hp - amount);
    log(source() ? "logDamageSkSrc" : "logDamageSk", {
      who: kid.name,
      n: amount,
      src: source(),
    });
    fx("damage", player, { n: amount, src: activeCard, fighter });
    if (kid.hp === 0 && defeatDeferred(player, fighter)) {
      game.combat.pending[player] = true;
      return;
    }
    if (kid.hp === 0) {
      kid.down = true;
      log("logSidekickDown", { who: kid.name });
      if (!game.combat) buryKids(player);
    }
    return;
  }
  const target = pl(player);
  target.hp = Math.max(0, target.hp - amount);
  log(source() ? "logDamageSrc" : "logDamage", {
    player,
    n: amount,
    src: source(),
  });
  fx("damage", player, { n: amount, src: activeCard, fighter: "hero" });
  if (target.hp === 0 && defeatDeferred(player, "hero")) {
    game.combat.pending[player] = true;
    return;
  }
  if (target.hp === 0 && !game.combat) fallHero(player);
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

function raptorPack(me, combat) {
  if (hero(me).id !== "raptors") return 0;
  const foe = other(me);
  const links = active.spaceById.get(
    fighterSpace(foe, combat.fighters[foe]),
  ).links;
  return fightersOf(me).filter(
    (fighter) =>
      fighter !== combat.fighters[me] &&
      links.includes(fighterSpace(me, fighter)),
  ).length;
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
    image: kidData.images?.[n - 1],
    attack: kidData.attack,
    space: spaceId,
    down: false,
  });
  log("logSummon", { who: kidData.name, space: spaceId });
}

function* chooseMover(player, remaining, canMove, booster = null, undo = true) {
  for (;;) {
    const able = remaining.filter((fighter) => {
      if (!fightersOf(player).includes(fighter)) return false;
      cur[player] = fighter;
      return canMove();
    });
    if (!able.length) return null;
    if (able.length === 1) return able[0];
    const prompt = askSpace(
      player,
      "promptMoveWith",
      able.map((fighter) => fighterSpace(player, fighter)),
    );
    prompt.undo = undo;
    prompt.boostOptions = booster ? booster.pool() : [];
    const answer = yield prompt;
    if (answer && typeof answer === "object") {
      yield* booster.use(answer.boost);
      continue;
    }
    if (!answer) return able[0];
    return (
      able.find((fighter) => fighterSpace(player, fighter) === answer) ||
      able[0]
    );
  }
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

function* ransom(owner, cost, combat, prompt) {
  if (hero(owner).id !== "blackbeard" || game.treasury < cost) return false;
  const payer = other(owner);
  const ok = yield askConfirm(
    payer,
    prompt || (cost === 2 ? "promptRansom2" : "promptRansom1"),
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
      for (const kid of [...target.sidekicks]) {
        damage(player, EXHAUSTION_DAMAGE, kid.id);
      }
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
    log("logMove", { player, who: kidOf(player, cur[player]).name });
  } else {
    log("logMove", { player, who: hero(player).name });
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

const regularActions = () =>
  Math.max(0, game.actions - game.freeAttacks.length);

function gainAttackAction(target = null) {
  game.actions += 1;
  game.freeAttacks.push(target);
  log("logAttackAction");
}

function useFreeAttack(target) {
  let index = game.freeAttacks.findIndex((item) => item === target);
  if (index === -1) index = game.freeAttacks.findIndex((item) => item === null);
  if (index !== -1) game.freeAttacks.splice(index, 1);
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
function* damageAny(player, amount, title = "promptDamageAny") {
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
    title,
    targets.map((target) => target.space),
  );
  const target = targets.find((item) => item.space === space);
  if (target) damage(target.owner, amount, target.fighter);
}

const swapKid = (player) =>
  pl(player).sidekicks.find((item) => !item.down && item.hp > 0);

const canSwapWithSidekick = (player) => Boolean(swapKid(player));

function swapWithSidekick(player, combat) {
  const kid = swapKid(player);
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
    noteReveal(from, id);
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
  gainAttackAction: (target) => gainAttackAction(target),
  fighterDefeated: (owner, fighter) => {
    if (fighter === "hero") return pl(owner).hp <= 0;
    const kid = kidOf(owner, fighter);
    return !kid || kid.down || kid.hp <= 0;
  },
  cardKind: (id) => getCard(id).kind,
  gadgetOf: (player) => game.gadget[player],
  setImmune: (player) => {
    if (game.combat) game.combat.immune[player] = true;
  },
  topCards: (player, count) => pl(player).deck.slice(0, count),
  reorderTop: (player, count, bottomId, order) => {
    const deck = pl(player).deck;
    deck.splice(0, count);
    deck.unshift(...order);
    if (bottomId) deck.push(bottomId);
  },
  discardOf: (player) => [...pl(player).discard],
  noteDiscard: (player, id) => noteReveal(player, id, "discard"),
  logRevealOwn: (player, id) => {
    noteReveal(player, id);
    log("logRevealOwn", { player, card: getCard(id).name, cardId: id });
  },
  foeFighterIds: (player) => fightersOf(other(player)),
  peekTop: (player) => pl(player).deck[0] || null,
  topToBottom: (player) => {
    const deck = pl(player).deck;
    if (deck.length > 1) deck.push(deck.shift());
  },
  logRevealTop: (player, id) => {
    noteReveal(player, id);
    log("logRevealTop", {
      player,
      card: getCard(id).name,
      cardId: id,
    });
  },
  setFighter: (player, fighter) => {
    cur[player] = fighter;
  },
  reviveSpaces: (player) => {
    const zones = active.spaceById.get(pl(player).space).zones;
    const busy = occupied();
    return active.map.spaces
      .filter(
        (space) =>
          !busy.includes(space.id) &&
          space.zones.some((zone) => zones.includes(zone)),
      )
      .map((space) => space.id);
  },
  friends: (player) => fightersOf(player),
  packNearFoe: (player) => {
    const links = active.spaceById.get(spaceOf(other(player))).links;
    return fightersOf(player).filter((fighter) =>
      links.includes(fighterSpace(player, fighter)),
    ).length;
  },
  freeSpacesNearFoe: (player) =>
    adjacentSpaces(player).filter((id) => !occupied().includes(id)),
  zoneSpacesFor: (player, fighter) =>
    withFighter(player, fighter, () => zoneSpaces(player)),
  placeFighter: (player, fighter, spaceId) =>
    withFighter(player, fighter, () => place(player, spaceId)),
  hasDefeatedKid: (player) =>
    Boolean(pl(player).fallen?.length) ||
    pl(player).sidekicks.some((kid) => kid.down),
  reviveKid: (player, spaceId) => {
    const target = pl(player);
    let kid = target.sidekicks.find((item) => item.down);
    if (!kid && target.fallen?.length) {
      kid = target.fallen.shift();
      target.sidekicks.push(kid);
    }
    if (!kid) return;
    kid.down = false;
    kid.unplaced = false;
    kid.hp = kid.maxHp;
    kid.space = spaceId;
    log("logSummon", { who: kid.name, space: spaceId });
  },
  swapWithSidekick,
  canSwapWithSidekick,
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
  actionsLeft: regularActions,
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
  const found = attackPairs(player).filter(
    ({ mine }) => attackCardsFor(player, mine).length,
  );
  if (game.turn !== player || regularActions() > 0) return found;
  return found.filter(({ theirs }) =>
    game.freeAttacks.some((target) => target === null || target === theirs),
  );
}

function pruneFreeAttacks() {
  if (game.phase !== "play" || !game.freeAttacks.length) return;
  if (regularActions() > 0) return;
  const me = game.turn;
  const choices = attackChoices(me);
  game.freeAttacks = game.freeAttacks.filter((target) =>
    choices.some(({ theirs }) => target === null || target === theirs),
  );
  game.actions = game.freeAttacks.length;
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
  game.freeAttacks = [];
  game.turnStart = spaceOf(me);
  game.redRoomIgnored[me] = false;
  game.turnNo += 1;
  log("logTurn", { player: me, n: game.turnNo, hero: hero(me).name });
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
  if (hero(me).id === "dr-jill-trent") {
    const pick = yield askChoice(me, "promptGadget", [
      { value: "hypnoray", label: "gadgetHypnoray" },
      { value: "tonic", label: "gadgetTonic" },
    ]);
    game.gadget[me] = pick || "hypnoray";
    log("logGadget", { player: me, gadget: game.gadget[me] });
  }
}

function gadgetFor(player, fighter, card, combat) {
  if (hero(player).id !== "dr-jill-trent" || !game.gadget[player]) return null;
  if (fighter === "hero") return game.gadget[player];
  const kid = kidOf(player, fighter);
  if (
    card?.key === "sisters-in-arms" &&
    kid &&
    active.spaceById.get(pl(player).space).links.includes(kid.space)
  ) {
    return game.gadget[player];
  }
  return null;
}

function* conveyor() {
  const belt = active.map.conveyor;
  if (!belt) return;
  const { path, launchZone } = belt;
  const nameOf = (player, fighter) =>
    fighter === "hero" ? hero(player).name : kidOf(player, fighter).name;
  for (let i = path.length - 1; i >= 0; i--) {
    for (const player of [game.turn, other(game.turn)]) {
      for (const fighter of fightersOf(player)) {
        if (fighterSpace(player, fighter) !== path[i]) continue;
        if (i === path.length - 1) {
          const options = active.map.spaces
            .filter((space) => space.zones.includes(launchZone))
            .map((space) => space.id)
            .filter((id) => !occupied().includes(id));
          if (!options.length) continue;
          const prompt = askSpace(player, "promptLaunch", options);
          prompt.fighter = fighter;
          const target = yield prompt;
          if (!target) continue;
          setSpace(player, fighter, target);
          log("logLaunch", { who: nameOf(player, fighter), space: target });
        } else {
          const next = path[i + 1];
          if (occupied().includes(next)) continue;
          setSpace(player, fighter, next);
          log("logConveyor", { who: nameOf(player, fighter), space: next });
        }
      }
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
  yield* conveyor();
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
  log("logManeuver", { player: me, act: 1 });
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
      {
        pool: () => (!boosted && !started ? boostPool(me) : []),
        *use(cardId) {
          const boostCard = spendBoostCard(me, cardId);
          boostSteps += boostCard.boost;
          afterBoost(me);
          boosted = true;
          yield* boostedWith(me, boostCard);
        },
      },
      false,
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
      prompt.undo = false;
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
        log("logScheme", { player: me, card: card.name, cardId: card.id });
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
  log("logScheme", {
    player: me,
    card: card.name,
    cardId: card.id,
    act: 1,
  });
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

function* offerBoostToken(player, fighter) {
  const token = tokenAt(fighterSpace(player, fighter), "boost");
  if (!token) return null;
  const use = yield askConfirm(player, "promptBoostToken");
  if (!use) return null;
  removeToken(token);
  log("logToken", { player, token: token.id });
  return token.id;
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
  useFreeAttack(theirs);
  turnFlags.anyRange[me] = false;
  const attackCard = getCard(attackIds[0]);
  pl(me).hand.splice(pl(me).hand.indexOf(attackCard.id), 1);
  log("logAttack", { player: me, act: 1 });
  const attackToken = yield* offerBoostToken(me, mine);

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
    token: { p1: null, p2: null, [me]: attackToken },
    rescue: { p1: false, p2: false },
    pending: { p1: false, p2: false },
    immune: { p1: false, p2: false },
    reveals: [],
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
  if (attackToken) {
    defensePrompt.hint = {
      key: "promptAttackToken",
      n: TOKENS[attackToken].value,
    };
  }
  if (hero(foe).id === "spider-man") {
    defensePrompt.hint = { key: "promptSpideySense", n: attackCard.value };
  }
  const defenseIds = yield defensePrompt;
  if (defenseIds.length) {
    defenseCard = getCard(defenseIds[0]);
    pl(foe).hand.splice(pl(foe).hand.indexOf(defenseCard.id), 1);
  }
  const defenseToken = defenseCard ? yield* offerBoostToken(foe, theirs) : null;
  game.combat.token[foe] = defenseToken;
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
    const id = game.combat.token[player];
    if (!id) continue;
    if (combat.canceled[player]) {
      log("logTokenCanceled", { token: id });
      continue;
    }
    boosts[player] += TOKENS[id].value;
    tokenBoost[player] = id;
    game.combat.boost[player] = true;
  }

  if (game.phase !== "play" || !game.combat) return true;

  const gadget = gadgetFor(me, mine, combat.cards[me], combat);
  if (gadget === "hypnoray" && combat.cards[me]) {
    const foeValue = combat.cards[foe] ? combat.cards[foe].value : 0;
    const top = pl(foe).deck[0];
    if (combat.cards[me].value < foeValue && top) {
      noteReveal(me, top);
      log("logRevealTop", {
        player: me,
        card: getCard(top).name,
        cardId: top,
      });
      boosts[me] += getCard(top).boost;
      game.combat.boost[me] = true;
    }
  }

  const locked = { p1: false, p2: false };
  const ignored = { p1: false, p2: false };
  for (const player of players) {
    const card = combat.cards[player];
    const effect = card && cardEffects[card.key];
    if (
      effect?.lockFoeValue &&
      !combat.canceled[player] &&
      effect.lockFoeValue(context(player, card, combat))
    ) {
      locked[other(player)] = true;
    }
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
    if (locked[player]) value = card.value;
    if (ignored[player]) value = 0;
    baseValues[player] = value;
    let total = value + boosts[player];
    if (effect?.finalValue && !combat.canceled[player]) {
      total = effect.finalValue(context(player, card, combat), total);
    }
    if (locked[player]) total = ignored[player] ? 0 : card.value;
    combat.values[player] = total;
  }
  const terrain = game.combat.terrain;
  const pack = raptorPack(me, combat);
  combat.values[me] += turnFlags.attackBonus[me] + terrain + pack;

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
  const blindIds = new Set(
    game.log
      .filter((entry) => entry.key === "logBlindBoost")
      .map((entry) => entry.params.cardId),
  );
  for (const player of [me, foe]) {
    const card = combat.cards[player];
    if (!card) {
      log("logRevealNoDefense", { player });
      continue;
    }
    log(player === me ? "logRevealAttack" : "logRevealDefense", {
      player,
      card: card.name,
      cardId: card.id,
      n: baseValues[player],
    });
    if (combat.canceled[player]) log("logRevealCanceled", { player });
    for (const id of boostLists[player]) {
      if (blindIds.has(id)) continue;
      log("logRevealBoost", {
        player,
        card: getCard(id).name,
        cardId: id,
        n: getCard(id).boost,
      });
    }
  }
  log("logCombat", {
    attacker: me,
    a: combat.values[me],
    defender: foe,
    d: combat.values[foe],
  });

  game.combat.stage = "reveal";
  const revealInfo = () => ({
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
      reveals: [...(game.combat?.reveals || [])],
      tokenBoost: { ...tokenBoost },
      base: { ...baseValues },
      bonus: turnFlags.attackBonus[me] + pack,
      terrain,
      dealt,
    },
  });
  const shownReveals = (game.combat?.reveals || []).length;
  yield revealInfo();

  if (dealt > 0) {
    damageSrc = combat.cards[me] ? combat.cards[me].name : null;
    combatHit = true;
    damage(foe, dealt);
    combatHit = false;
    damageSrc = null;
  } else log("logNoDamage");
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

  if (
    game.phase === "play" &&
    game.combat &&
    game.combat.reveals.length > shownReveals
  ) {
    yield revealInfo();
  }

  if (
    game.phase === "play" &&
    gadget === "tonic" &&
    combat.cards[me] &&
    combat.cards[me].value > (combat.cards[foe] ? combat.cards[foe].value : 0)
  ) {
    heal(me, 1, "hero");
  }

  for (const player of players) {
    if (game.phase === "play" && game.combat?.pending[player]) {
      game.combat.pending[player] = false;
      finalizeDefeat(player, combat.fighters[player]);
    }
  }
  for (const player of players) fallHero(player);

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

  if (game.phase === "play" && hero(me).id === "robin-hood") {
    const fighter = cur[me];
    const alive = fighter === "hero" || !kidOf(me, fighter)?.down;
    if (alive) {
      yield* walk(
        me,
        me,
        2,
        fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
        { fighter },
      );
    }
  }

  if (
    game.phase === "play" &&
    combat.won[me] &&
    hero(me).id === "wyatt-earp" &&
    combat.cards[me]
  ) {
    const used = turnFlags.showdown[me];
    const choices = ["draw", "attack", "move"].filter(
      (item) => !used.includes(item),
    );
    if (choices.length) {
      beginAnnounce(me, combat.cards[me], "after");
      const pick = yield askChoice(
        me,
        "promptShowdown",
        choices.map((item) => ({ value: item, label: "gameShowdown_" + item })),
      );
      used.push(pick);
      activeCard = hero(me).passive.name;
      if (pick === "draw") draw(me, 1);
      else if (pick === "attack") gainAttackAction(null);
      else {
        const fighter = cur[me];
        yield* walk(
          me,
          me,
          1,
          fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
          { fighter },
        );
      }
      activeCard = null;
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
  for (const player of ["p1", "p2"]) buryKids(player);
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
      pruneFreeAttacks();
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
    for (const kid of pl(player).sidekicks) {
      kid.space = null;
      kid.unplaced = true;
    }
  }
  const taken = new Set(occupiedBy("p1").concat(occupiedBy("p2")));
  for (const player of ["p1", "p2"]) {
    const home = pl(player).space;
    for (const kid of pl(player).sidekicks) {
      const links = active.spaceById.get(home).links;
      const belt = active.map.conveyor?.path || [];
      kid.space =
        links.find((id) => !taken.has(id) && !belt.includes(id)) ||
        links.find((id) => !taken.has(id)) ||
        home;
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
              length: data.sidekick.summon
                ? (data.sidekick.start ?? 0)
                : (data.sidekick.count ?? 1),
            },
            (_, i) => ({
              id: "sk" + (i + 1),
              name: data.sidekick.name,
              hp: data.sidekick.hp,
              maxHp: data.sidekick.hp,
              image: data.sidekick.images?.[i],
              attack: data.sidekick.attack,
              space: null,
              down: false,
            }),
          )
        : [],
      fallen: [],
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
  if (!active.map.tokenSlots.length) {
    pl(first).space = active.map.starts.p1;
    pl(other(first)).space = active.map.starts.p2;
  }
  game.tokens = placeTokens();
  placeSidekicks();
  game.gadget = { p1: null, p2: null };
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

function* placeKidsFlow() {
  const first = game.turn;
  const taken = new Set(["p1", "p2"].map((player) => pl(player).space));
  for (const player of [first, other(first)]) {
    const home = pl(player).space;
    const zones = active.spaceById.get(home).zones;
    const dist = active.distances.get(home);
    for (const kid of pl(player).sidekicks.filter((item) => !item.down)) {
      const free = active.map.spaces.filter((space) => !taken.has(space.id));
      let options = free
        .filter((space) => space.zones.some((zone) => zones.includes(zone)))
        .map((space) => space.id);
      if (!options.length) {
        const nearest = Math.min(...free.map((space) => dist.get(space.id)));
        options = free
          .filter((space) => dist.get(space.id) === nearest)
          .map((space) => space.id);
      }
      let chosen = options[0];
      if (options.length > 1) {
        const prompt = askSpace(player, "promptPlaceKid", options);
        prompt.undo = false;
        chosen = (yield prompt) || options[0];
      }
      kid.space = chosen;
      kid.unplaced = false;
      taken.add(chosen);
    }
  }
}

function* openingFlow() {
  yield* placeKidsFlow();
  yield* startTurn();
}

function beginPlay() {
  game.mulligan = null;
  game.viewer = "p1";
  game.phase = "play";
  log("logStart");
  run(openingFlow());
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
  game.turnNo = 0;
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
  return (
    (net.online.value && net.mySeat.value !== game.turn) ||
    Boolean(game.bot && game.turn === game.bot)
  );
}

function setBot(seat) {
  game.bot = seat === "p1" || seat === "p2" ? seat : null;
}

function startRogueBattle(deckA, deckB, options) {
  resetGame();
  game.mapId = options.mapId;
  useMapId(options.mapId);
  startGame(deckA, deckB, options.first, "p2");
  const cut = (value) => Math.max(1, Math.ceil(value * options.scale));
  for (const seat of ["p1", "p2"]) {
    const state = game.players[seat];
    if (!state) return;
    state.hp = cut(state.hp);
    state.maxHp = state.hp;
    for (const kid of state.sidekicks) {
      kid.hp = cut(kid.hp);
      kid.maxHp = kid.hp;
    }
  }
  setBot("p2");
  setBotLevel(options.botLevel);
  syncOut();
}

function setBotLevel(level) {
  game.botLevel = ["easy", "normal", "hard"].includes(level) ? level : "normal";
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
    freeAttacks: game.freeAttacks,
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
  game.freeAttacks = snap.freeAttacks;
  game.turnStart = snap.turnStart;
  game.redRoomIgnored = snap.redRoomIgnored;
  game.log.length = snap.logLength;
  turnFlags.noDraw = snap.flags.noDraw;
  turnFlags.attackBonus = snap.flags.attackBonus;
  turnFlags.pinned = snap.flags.pinned;
  turnFlags.anyRange = snap.flags.anyRange;
  turnFlags.showdown = snap.flags.showdown;
  game.tokens = snap.tokens;
  flow = null;
  game.prompt = null;
  undoPoint = null;
}

function applyAction(type, seat) {
  if (game.phase !== "play" || (seat && seat !== game.turn)) return;
  if (type === "undo") undoAction(seat);
  else if (type === "maneuver" && canAct() && regularActions() > 0) {
    takeSnapshot();
    run(maneuver(game.turn));
  } else if (type === "scheme" && canAct() && regularActions() > 0) {
    run(scheme(game.turn));
  } else if (type === "attack" && canAct() && attackChoices(game.turn).length) {
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
  return 1 + Math.floor(Math.random() * 20);
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
  if (game.toss?.stage !== "map" || game.toss.winner !== player) return;
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

function tossActor(role) {
  if (net.online.value || !game.toss) return "p1";
  return role === "loser" ? other(game.toss.winner) : game.toss.winner;
}

function setMap(id) {
  if (net.isGuest.value) send({ type: "map", id });
  else applyMap(tossActor("winner"), id);
}

function confirmMap() {
  if (net.isGuest.value) send({ type: "mapConfirm" });
  else applyMapConfirm(tossActor("winner"));
}

function chooseOrder(goFirst) {
  if (net.isGuest.value) send({ type: "order", goFirst });
  else applyOrder(tossActor("loser"), goFirst);
}

function startLocalToss(deckA, deckB) {
  game.notice = null;
  if (game.phase !== "setup" || game.toss || net.online.value) return;
  if (!validDeck(deckA) || !validDeck(deckB)) return;
  if (deckA.heroId === deckB.heroId) return;
  lobbyDecks.p1 = {
    name: deckA.name,
    heroId: deckA.heroId,
    cardIds: [...deckA.cardIds],
  };
  lobbyDecks.p2 = {
    name: deckB.name,
    heroId: deckB.heroId,
    cardIds: [...deckB.cardIds],
  };
  game.lobby.p1 = { name: deckA.name, heroId: deckA.heroId };
  game.lobby.p2 = { name: deckB.name, heroId: deckB.heroId };
  rollToss();
}
function startOnlineGame() {
  game.notice = null;
  if (!net.isHost.value || game.phase !== "setup" || game.toss) return;
  if (!lobbyDecks.p1 || !lobbyDecks.p2) return;
  if (lobbyDecks.p1.heroId === lobbyDecks.p2.heroId) return;
  rollToss();
}

function availableActions(forBot = false) {
  const none = { maneuver: false, scheme: false, attack: false };
  if (game.phase !== "play" || (!forBot && blocked())) return none;
  const me = game.turn;
  const idle = !game.prompt && !flow;
  const hand = pl(me).hand.map(getCard);
  return {
    maneuver: idle && regularActions() > 0,
    scheme:
      idle &&
      regularActions() > 0 &&
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
    startLocalToss,
    setBot,
    setBotLevel,
    startRogueBattle,
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
