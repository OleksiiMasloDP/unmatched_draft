import { BOT_STYLES } from "../botStyles";
import { onBeforeUnmount, onMounted } from "vue";
import { getMap } from "../gameMaps.js";
import { getCard, getHero } from "../gameDecks.js";
import { botProfiles } from "../botProfiles.js";
import {
  cardInfo,
  heroInfo,
  heroSettingKeys,
  kidInfo,
  loadBotData,
} from "../botData.js";
import { useGame } from "./useGame.js";
import { createSearch, validReply } from "./botSearch.js";

const TICK = 650;
const other = (seat) => (seat === "p1" ? "p2" : "p1");
const isAttackCard = (card) =>
  card && card.type !== "defense" && card.type !== "scheme" && card.value;
const isDefenseCard = (card) =>
  card && card.type !== "attack" && card.type !== "scheme";
const cardPower = (card) => (card.value ?? 0) + (card.boost ?? 0) * 0.35;
let currentStore = loadBotData();
const leanOf = (card) =>
  card.type === "versatile" ? cardInfo(card, currentStore).lean - 5 : 0;
const attackPower = (card) =>
  cardPower(card) - (card.type === "versatile" ? 0.3 : 0) + leanOf(card) * 0.15;
const defensePower = (card) =>
  cardPower(card) - (card.type === "versatile" ? 0.3 : 0) - leanOf(card) * 0.15;
const schemeDamage = (card) => {
  if (!card || card.type !== "scheme") return 0;
  const found = /(\d+) damage/i.exec(card.text?.en || "");
  return found ? Number(found[1]) : 0;
};
const HEAL = /recover|heal|regain/i;
const KID_HEROES = ["dr-jill-trent", "black-panther"];

const graphCache = new Map();
const reachCache = new Map();

function graphOf(mapId) {
  if (!graphCache.has(mapId)) {
    const map = getMap(mapId);
    graphCache.set(mapId, {
      map,
      byId: new Map(map.spaces.map((space) => [space.id, space])),
    });
  }
  return graphCache.get(mapId);
}

export function useBot() {
  const engine = useGame();
  const { game } = engine;
  let timer = null;
  let signature = "";
  let repeats = 0;
  let lastTarget = null;
  let idle = 0;
  let profile = {};
  let store = loadBotData();
  const rate = (card) => cardInfo(card, store);

  const styleOf = () => profile.style ?? BOT_STYLES.NEUTRAL;

  const profileOf = (seat) => {
    const heroKey = game.players[seat]?.heroId;
    const edited = heroInfo(heroKey, store);
    const result = { ...(botProfiles[heroKey] || {}) };
    for (const name of heroSettingKeys) {
      if (edited[name] !== undefined) result[name] = edited[name];
    }
    return result;
  };

  const withSeat = (seat, fn) => {
    const keepProfile = profile;
    const keepBot = game.bot;
    profile = profileOf(seat);
    game.bot = seat;
    try {
      return fn();
    } finally {
      profile = keepProfile;
      game.bot = keepBot;
    }
  };

  let inSim = false;
  let simTurn = -1;
  let saveSim = null;
  let planned = null;

  const reserve = (seat) => {
    const state = game.players[seat];
    const cards = [...(state.deck || []), ...(state.hand || [])]
      .map(getCard)
      .filter(Boolean);
    const drawers = cards.filter((card) =>
      /draw (\d+|until)/i.test(card.text?.en || ""),
    ).length;
    return (state.deck || []).length + (state.hp ?? 0) / 2 - drawers * 0.7;
  };

  const fatigueEdge = (bot) => reserve(bot) - reserve(other(bot));

  const knowledge = (bot) => {
    const hand = handOf(other(bot));
    const value = (list) =>
      list.reduce((best, card) => Math.max(best, card.value ?? 0), 0);
    return {
      attack: value(hand.filter(isAttackCard)),
      defense: value(hand.filter(isDefenseCard)),
      boost: hand.reduce((best, card) => Math.max(best, card.boost ?? 0), 0),
      size: hand.length,
    };
  };
  let lastTurn = -1;
  let turnManeuvers = 0;
  let lastHp = -1;

  const byId = () => graphOf(game.mapId).byId;
  const spaceOf = (id) => byId().get(id);

  const distances = (from) => {
    const dist = new Map([[from, 0]]);
    const queue = [from];
    while (queue.length) {
      const id = queue.shift();
      const node = spaceOf(id);
      for (const next of [...(node?.moves || []), ...(node?.secret || [])]) {
        if (!dist.has(next)) {
          dist.set(next, dist.get(id) + 1);
          queue.push(next);
        }
      }
    }
    return dist;
  };

  const reachSet = (from, steps) => {
    const key = `${game.mapId}|${from}|${steps}`;
    if (reachCache.has(key)) return reachCache.get(key);
    const seen = new Map([[from, 0]]);
    const queue = [from];
    while (queue.length) {
      const id = queue.shift();
      if (seen.get(id) >= steps) continue;
      const node = spaceOf(id);
      for (const next of [...(node?.moves || []), ...(node?.secret || [])]) {
        if (!seen.has(next)) {
          seen.set(next, seen.get(id) + 1);
          queue.push(next);
        }
      }
    }
    const result = new Set(seen.keys());
    reachCache.set(key, result);
    return result;
  };

  const linked = (a, b) => (spaceOf(a)?.links || []).includes(b);

  const sharesZone = (a, b) => {
    const zones = spaceOf(a)?.zones || [];
    return (spaceOf(b)?.zones || []).some((zone) => zones.includes(zone));
  };

  const attackPositions = (attack, target) => {
    if (attack === "range") {
      return [...byId().keys()].filter((id) => sharesZone(id, target));
    }
    return spaceOf(target)?.links || [];
  };

  const fightersOf = (seat) => {
    const state = game.players[seat];
    if (!state) return [];
    const data = getHero(state.heroId);
    const list = [];
    if (state.hp > 0) {
      list.push({
        id: "hero",
        isHero: true,
        core: true,
        space: state.space,
        hp: state.hp,
        max: state.maxHp || state.hp,
        attack: data.attack,
        move: data.move ?? 3,
      });
    }
    for (const kid of state.sidekicks || []) {
      if (!kid.down && kid.space) {
        list.push({
          id: kid.id,
          isHero: false,
          core:
            KID_HEROES.includes(state.heroId) ||
            kidInfo(state.heroId, store).importance >= 8,
          importance: kidInfo(state.heroId, store).importance,
          block: kidInfo(state.heroId, store).block,
          space: kid.space,
          hp: kid.hp,
          max: kid.maxHp || kid.hp,
          attack: kid.attack || data.sidekick?.attack,
          move: data.move ?? 3,
        });
      }
    }
    return list;
  };

  const nearestFoe = (space, bot) => {
    const dist = distances(space);
    let best = 60;
    for (const foe of fightersOf(other(bot))) {
      best = Math.min(best, (dist.get(foe.space) ?? 60) + (foe.core ? 0 : 3));
    }
    return best;
  };

  const canHit = (fighter, from, targetSpace) =>
    fighter.attack === "range"
      ? sharesZone(from, targetSpace)
      : linked(from, targetSpace);

  const handOf = (seat) => (game.players[seat]?.hand || []).map(getCard);
  const deckOf = (seat) => (game.players[seat]?.deck || []).map(getCard);

  const healsFoe = (foeSeat) => {
    const state = game.players[foeSeat];
    const data = state && getHero(state.heroId);
    if (!data) return false;
    const texts = [data.passive?.text?.en || ""];
    for (const entry of data.cards || []) texts.push(entry[4] || "");
    return texts.some((text) => HEAL.test(text));
  };

  const foeAverageAttack = (foeSeat) => {
    const data = getHero(game.players[foeSeat]?.heroId);
    const values = (data?.cards || [])
      .filter((entry) => entry[2] && entry[7] !== "defense")
      .flatMap((entry) => Array(entry[0]).fill(entry[2]));
    if (!values.length) return 3;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const plan = (bot) => {
    const foeSeat = other(bot);
    const foeHero = fightersOf(foeSeat).find((fighter) => fighter.isHero);
    if (!foeHero || getHero(game.players[foeSeat].heroId).team) {
      return { finisher: false, turtle: false };
    }
    const inHand = handOf(bot).reduce(
      (sum, card) => sum + schemeDamage(card),
      0,
    );
    const inDeck = deckOf(bot).reduce(
      (sum, card) => sum + schemeDamage(card),
      0,
    );
    const safe = !healsFoe(foeSeat);
    const deckLeft = (game.players[bot].deck || []).length;
    const mine = fightersOf(bot).find((fighter) => fighter.isHero);
    const refill =
      handOf(bot).length <
        (profile.refill ?? (styleOf() === BOT_STYLES.PRESSURE ? 3 : 4)) &&
      Boolean(mine) &&
      mine.hp > foeHero.hp &&
      deckLeft > (game.players[foeSeat].deck || []).length &&
      deckLeft > 2;
    return {
      finisher: inHand >= foeHero.hp,
      turtle:
        refill ||
        (safe &&
          inHand < foeHero.hp &&
          inHand + inDeck >= foeHero.hp &&
          deckLeft > 2),
    };
  };

  const fear = (fighter, turtle) => {
    let base = fighter.isHero
      ? 1 + (1 - fighter.hp / fighter.max) * 1.5
      : (profile.kidFear ?? 0.5) * ((fighter.importance ?? 5) / 5);
    const known = knowledge(game.bot);
    if (
      known &&
      fighter.isHero &&
      known.attack + known.boost * 0.5 >= fighter.hp
    ) {
      base *= 2;
    }
    const styled =
      styleOf() === BOT_STYLES.PASS
        ? 1.4
        : styleOf() === BOT_STYLES.PRESSURE
          ? 0.6
          : 1;
    return base * styled * (turtle ? 3 : 1);
  };

  const coverage = (fighter, space, foe) => {
    const spots = [...reachSet(foe.space, foe.move)];
    const mine = reachSet(space, fighter.move);
    const covered = spots.filter((spot) =>
      [...mine].some((from) => canHit(fighter, from, spot)),
    );
    return covered.length / Math.max(spots.length, 1);
  };

  const positionScore = (fighter, space, bot, turtle = false) => {
    const foes = fightersOf(other(bot));
    if (!foes.length) return 0;
    const occupied = new Set(
      [...fightersOf(bot), ...foes]
        .filter((item) => item.space !== fighter.space)
        .map((item) => item.space),
    );
    const reachMine = reachSet(space, fighter.move);
    let exposure = 0;
    let strike = 0;
    let reachStrike = 0;
    for (const foe of foes) {
      const weight = foe.isHero ? 1 : foe.core ? 0.8 : 0.25;
      const reachFoe = reachSet(foe.space, foe.move);
      for (const spot of attackPositions(foe.attack, space)) {
        if (spot === space || !reachFoe.has(spot)) continue;
        if (spot !== foe.space && occupied.has(spot)) continue;
        const near = linked(spot, space);
        let cost;
        if (fighter.attack === "range") cost = near ? 1.2 : 1;
        else cost = near ? 0.35 : 1.6;
        const retaliate = attackPositions(fighter.attack, spot).some(
          (id) => id === space || reachMine.has(id),
        );
        exposure += cost * weight * (retaliate ? 1 : 1.4);
      }
      if (canHit(fighter, space, foe.space)) strike += weight;
      else if (
        attackPositions(fighter.attack, foe.space).some((id) =>
          reachMine.has(id),
        )
      ) {
        reachStrike = Math.max(reachStrike, weight);
      }
    }
    let blocked = 0;
    if (!fighter.isHero && fighter.block > 0) {
      const lead = fightersOf(bot).find((item) => item.isHero);
      if (lead) {
        for (const foe of foes) {
          if (foe.attack === "range") continue;
          const reachFoe = reachSet(foe.space, foe.move);
          for (const spot of attackPositions(foe.attack, lead.space)) {
            if (spot === space && reachFoe.has(spot)) blocked += 1;
          }
        }
      }
    }
    const dist = nearestFoe(space, bot);
    const lead = foes.find((foe) => foe.isHero);
    if (!turtle && game.turnNo === 1 && fighter.isHero && lead) {
      return 4 * coverage(fighter, space, lead) - 0.01 * dist;
    }
    if (turtle)
      return -fear(fighter, true) * exposure + 0.2 * Math.min(dist, 8);
    const aggro =
      (profile.aggro ?? 1) * (styleOf() === BOT_STYLES.PRESSURE ? 1.25 : 1);
    const early = game.turnNo <= 3;
    const cards = handOf(bot);
    const bare = cards.length < 6 && !cards.some(isDefenseCard);
    let contain = 0;
    if (profile.contain && fighter.isHero) {
      const zone = [...byId().keys()].filter((id) =>
        sharesZone(id, space),
      ).length;
      contain =
        (foes.some((foe) => foe.isHero && sharesZone(foe.space, space))
          ? 0.6
          : 0) -
        zone * 0.04;
    }
    const needsClose = cards.some(
      (card) => isAttackCard(card) && /adjacent/i.test(textOf(card)),
    );
    const hugging =
      fighter.attack === "range" &&
      !needsClose &&
      foes.some((foe) => linked(space, foe.space));
    return (
      (hugging ? -1.5 : 0) +
      (blocked * fighter.block * 1.5) / 10 +
      2 * aggro * strike +
      0.8 * aggro * reachStrike +
      contain -
      (fear(fighter, false) *
        Math.min(exposure, bare ? 8 : 4) *
        (bare
          ? 1.5
          : Math.max(0, 0.5 - idle * 0.1) *
            (early ? 0.3 : 1) *
            (handOf(bot).length >= 7 ? 0.2 : 1))) /
        aggro -
      (strike ? 0 : 0.35 * aggro * dist * (early ? 2 : 1))
    );
  };

  const fighterAt = (space, bot) =>
    fightersOf(bot).find((item) => item.space === space);

  const missingHp = (bot) => {
    const me = game.players[bot];
    return Math.max(0, (me.maxHp || me.hp) - me.hp);
  };

  const textOf = (card) => (card?.text?.en || "").toLowerCase();
  const numberIn = (pattern, text) => {
    const found = pattern.exec(text);
    return found ? Number(found[1]) : 0;
  };

  const effectBonus = (card, bot) => {
    const text = textOf(card);
    let bonus = 0;
    bonus += 0.4 * numberIn(/draw (\d+) card/, text);
    bonus +=
      0.35 * Math.min(numberIn(/recover (\d+) health/, text), missingHp(bot));
    bonus += 0.6 * numberIn(/deal (\d+) damage/, text);
    if (/gain 1 action|free action/.test(text)) bonus += 1;
    if (/cancel/.test(text)) bonus += 0.6;
    return bonus;
  };

  const bestMoveGain = (bot, steps) => {
    const turtle = plan(bot).turtle;
    let total = 0;
    for (const me of fightersOf(bot)) {
      const range = steps ?? me.move;
      const now = positionScore(me, me.space, bot, turtle);
      let best = 0;
      for (const spot of reachSet(me.space, range)) {
        if (spot === me.space) continue;
        best = Math.max(best, positionScore(me, spot, bot, turtle) - now);
      }
      total += best * (me.isHero ? 1 : 0.4);
    }
    return Math.min(total, 3);
  };

  const foeHasCancel = (bot) =>
    handOf(other(bot)).some((card) => /cancel/i.test(textOf(card)));

  const fighterKind = (bot) => game.combat?.fighters?.[bot];

  const playBias = (card, bot) => {
    const info = rate(card);
    const kind = fighterKind(bot);
    const who = kind ? ((info.who - 5) / 5) * (kind === "hero" ? 1 : -1) : 0;
    return (
      (info.timing - 5) * 0.15 -
      (foeHasCancel(bot) ? info.cancelCare * 0.25 : 0) +
      who
    );
  };

  const schemeValue = (card, bot) => {
    const text = textOf(card);
    const hand = handOf(bot).length - 1;
    let value = 0;
    let known = false;
    const drawN = numberIn(/draw (\d+) cards?/, text);
    const until = numberIn(/draw until you have (\d+) cards/, text);
    if (until) {
      value += 0.45 * Math.max(0, until - hand);
      known = true;
    } else if (drawN) {
      value += 0.45 * Math.min(drawN, Math.max(0, 7 - hand));
      known = true;
    }
    const heal = numberIn(/recover[s]? (\d+) health/, text);
    if (heal && !/unless/.test(text)) {
      value += 0.5 * Math.min(heal, missingHp(bot));
      known = true;
    }
    const damage = numberIn(/deal (\d+) damage/, text);
    if (damage) {
      value += 1.2 * damage;
      known = true;
    }
    if (/gain 1 (free )?action/.test(text)) {
      value += handOf(bot).some(isAttackCard) ? 1 : 0.5;
      known = true;
    }
    if (
      /summon|revive|return|place/.test(text) &&
      /sidekick|raptor|sea dog/.test(text)
    ) {
      const fallen = (game.players[bot].sidekicks || []).filter(
        (kid) => kid.down || !kid.space,
      ).length;
      value += 1.3 * Math.min(fallen, 2);
      known = true;
    }
    const move = numberIn(/move [^.]*?up to (\d+) spaces/, text);
    if (move) {
      value += bestMoveGain(bot, move);
      known = true;
    }
    if (/excalibur/.test(text)) {
      value += handOf(bot).some((item) => /excalibur/i.test(item.name))
        ? 0
        : 1.4;
      known = true;
    }
    if (/shuffle your hand into your deck/.test(text)) {
      value -= 0.4 * Math.max(0, hand - 1);
    }
    const info = rate(card);
    const waiting = foeHasCancel(bot) ? info.cancelCare * 0.35 : 0;
    return (
      (known ? value + (info.importance - 5) * 0.15 : 0) -
      (5 - info.timing) * 0.35 -
      waiting
    );
  };

  const bestScheme = (bot) =>
    handOf(bot)
      .filter((card) => card.type === "scheme")
      .reduce(
        (best, card) => {
          const value = schemeValue(card, bot);
          return value > best.value ? { card, value } : best;
        },
        { card: null, value: -Infinity },
      );

  const attackUtility = (bot) => {
    const known = knowledge(bot);
    const cards = handOf(bot).filter(isAttackCard);
    if (!cards.length) return 0;
    const top = cards.reduce((best, card) =>
      attackPower(card) > attackPower(best) ? card : best,
    );
    const guard = known ? known.defense : 2;
    return (
      Math.max(0, (top.value ?? 0) - guard) + effectBonus(top, bot) * 0.5 + 0.5
    );
  };

  const chooseMulligan = (bot) => {
    const hand = handOf(bot);
    if (hand.some((card) => (profile.keepInHand || []).includes(card.key))) {
      return engine.chooseMulligan(false, bot);
    }
    const good = hand.filter(isAttackCard).length;
    const power = hand.reduce((sum, card) => sum + cardPower(card), 0);
    engine.chooseMulligan(
      good < 2 || power / Math.max(hand.length, 1) < 2.2,
      bot,
    );
  };

  const startScore = (id, bot) => {
    const data = getHero(game.players[bot].heroId);
    const size = [...byId().keys()].filter((other) =>
      sharesZone(id, other),
    ).length;
    return data.attack === "range" ? size : -size;
  };

  const foeAt = (space, bot) =>
    fightersOf(other(bot)).find((foe) => foe.space === space);

  const targetScore = (foe) =>
    (foe.isHero ? (profile.heroFocus ?? 6) : foe.core ? 5 : 0) +
    (foe.hp <= 4 ? 2 : 0) -
    foe.hp * 0.3;

  const bestTarget = (options, bot) =>
    options.reduce((best, id) =>
      targetScore(foeAt(id, bot)) > targetScore(foeAt(best, bot)) ? id : best,
    );

  const bestBy = (options, scoreOf) => {
    let best = options[0];
    let bestScore = -Infinity;
    for (const id of options) {
      const value = scoreOf(id);
      if (value > bestScore) {
        best = id;
        bestScore = value;
      }
    }
    return best;
  };

  const answerSpace = (prompt, bot) => {
    const options = prompt.options;
    if (!options.length) return null;
    const title = prompt.title;
    const state = plan(bot);
    if (title === "promptAttackWith") {
      return bestBy(options, (id) => {
        const me = fighterAt(id, bot);
        if (!me) return 0;
        const targets = fightersOf(other(bot)).filter((foe) =>
          canHit(me, id, foe.space),
        );
        const top = targets.length
          ? Math.max(...targets.map(targetScore))
          : -10;
        const prefer = handOf(bot)
          .filter(isAttackCard)
          .map((card) => (rate(card).who - 5) / 5);
        const lean = prefer.length
          ? prefer.reduce((sum, value) => sum + value, 0) / prefer.length
          : 0;
        return (
          top +
          (me.isHero ? 0 : 0.5) +
          lean * (me.isHero ? 0.6 : -0.6) +
          me.hp * 0.01
        );
      });
    }
    const foes = options.filter((id) => foeAt(id, bot));
    if (title === "promptAttackTarget" || foes.length === options.length) {
      const pick = bestTarget(foes, bot);
      lastTarget = foeAt(pick, bot);
      return pick;
    }
    if (
      prompt.boostOptions?.length &&
      /^promptMove(With|Space|Sidekick)$/.test(title)
    ) {
      const boost = boostToReach(prompt, bot);
      if (boost) return { boost };
    }
    if (title === "promptMoveFoe" && fightersOf(bot).some((f) => f.isHero)) {
      const lead = game.players[bot].heroId === "tomoe-gozen";
      if (lead && (!prompt.fighter || prompt.fighter === "hero")) {
        const pick = tomoePush(prompt, bot);
        if (pick !== undefined) return pick;
      }
    }
    if (title === "promptMoveWith") {
      let best = null;
      let bestGain = 0.5;
      for (const id of options) {
        const me = fighterAt(id, bot);
        if (!me) continue;
        const now = positionScore(me, me.space, bot, state.turtle);
        for (const spot of reachSet(me.space, me.move)) {
          if (spot === me.space) continue;
          const gain = positionScore(me, spot, bot, state.turtle) - now;
          if (gain > bestGain) {
            best = id;
            bestGain = gain;
          }
        }
      }
      return best;
    }
    if (title === "promptMoveSpace" || title === "promptMoveSidekick") {
      const me = fightersOf(bot).find((item) => item.id === prompt.fighter);
      if (!me) return null;
      const now = positionScore(me, me.space, bot, state.turtle);
      const ahead = (id) => {
        let best = positionScore(me, id, bot, state.turtle);
        for (const spot of reachSet(id, Math.max(me.move - 1, 1))) {
          if (spot === id) continue;
          best = Math.max(best, positionScore(me, spot, bot, state.turtle));
        }
        return best;
      };
      const target = bestBy(options, ahead);
      if (ahead(target) <= now + 0.2) return null;
      return target;
    }
    if (foes.length) return bestTarget(foes, bot);
    if (/Foe/.test(title)) {
      return options.reduce((best, id) =>
        nearestFoe(id, bot) > nearestFoe(best, bot) ? id : best,
      );
    }
    const hero = fightersOf(bot).find((item) => item.isHero);
    const stand = hero || { attack: "melee", move: 3, hp: 1, max: 1 };
    return bestBy(options, (id) => positionScore(stand, id, bot, state.turtle));
  };

  const strikeFrom = (me, steps, bot) => {
    const foes = fightersOf(other(bot));
    const taken = new Set(
      [...fightersOf(bot), ...foes]
        .filter((item) => item.space !== me.space)
        .map((item) => item.space),
    );
    for (const spot of reachSet(me.space, steps)) {
      if (taken.has(spot)) continue;
      if (foes.some((foe) => canHit(me, spot, foe.space))) return true;
    }
    return false;
  };

  const boostToReach = (prompt, bot) => {
    const hand = handOf(bot);
    if (!hand.some(isAttackCard)) return null;
    const movers = prompt.fighter
      ? fightersOf(bot).filter((item) => item.id === prompt.fighter)
      : fightersOf(bot);
    const steps = (me) => prompt.left ?? me.move;
    if (movers.some((me) => strikeFrom(me, steps(me), bot))) return null;
    const pool = prompt.boostOptions
      .map(getCard)
      .filter(
        (card) =>
          card &&
          card.boost > 0 &&
          !profile.keep?.includes(card.key) &&
          hand.some((item) => item.id !== card.id && isAttackCard(item)),
      )
      .sort(
        (a, b) =>
          a.boost - b.boost ||
          cardPower(a) +
            rate(a).importance * 0.25 -
            (cardPower(b) + rate(b).importance * 0.25),
      );
    for (const card of pool) {
      if (movers.some((me) => strikeFrom(me, steps(me) + card.boost, bot))) {
        return card.id;
      }
    }
    return null;
  };

  const tomoePush = (prompt, bot) => {
    const tomoe = fightersOf(bot).find((item) => item.isHero);
    const foe = fightersOf(other(bot)).find((item) => item.isHero);
    if (!tomoe || !foe) return undefined;
    const inside = (space) => sharesZone(space, tomoe.space);
    const options = prompt.options;
    if (inside(foe.space)) {
      const out = options.filter((id) => !inside(id));
      if (!out.length) return undefined;
      const left = prompt.left ?? 1;
      return bestBy(out, (id) => {
        const back =
          left > 2 && options.length
            ? [...reachSet(id, 1)].some((next) => inside(next))
            : false;
        return (back ? 2 : 0) - nearestFoe(id, bot) * 0.01;
      });
    }
    if ((prompt.left ?? 1) >= 2) {
      const into = options.filter(inside);
      if (into.length) return into[0];
    }
    return null;
  };

  const boostWorth = (card) =>
    card.boost -
    (card.value ?? 0) * 0.35 -
    (rate(card).importance - 5) * 0.2 +
    (rate(card).boostWill - 5) * 0.25;

  const cheapest = (cards) =>
    cards.reduce((best, card) =>
      (card.value ?? 0) + rate(card).importance * 0.25 <
      (best.value ?? 0) + rate(best).importance * 0.25
        ? card
        : best,
    );

  const wakandaFit = (card) => {
    if (card.key !== "wakanda-forever") return true;
    const target = lastTarget;
    if (!target) return false;
    if (target.isHero) return true;
    return target.max > 2 && (card.value ?? 0) >= target.hp;
  };

  const answerCards = (prompt, bot) => {
    let options = prompt.options.map(getCard).filter(Boolean);
    const title = prompt.title;
    if (title === "promptDefenseCard" || title === "promptAttackCard") {
      const attacking = title === "promptAttackCard";
      const fit = options.filter(
        (card) =>
          card.key !== "wakanda-forever" || (attacking && wakandaFit(card)),
      );
      if (fit.length) options = fit;
    }
    const state = plan(bot);
    if (title === "promptAttackCard") {
      if (!options.length) return [];
      const sorted = [...options].sort(
        (a, b) =>
          attackPower(b) +
          effectBonus(b, bot) * 0.5 -
          (rate(b).importance - 5) * 0.2 +
          playBias(b, bot) -
          (attackPower(a) +
            effectBonus(a, bot) * 0.5 -
            (rate(a).importance - 5) * 0.2 +
            playBias(a, bot)),
      );
      const hp = lastTarget?.hp;
      const known = knowledge(bot);
      const guard = known && known.size ? known.defense + known.boost * 0.5 : 0;
      if (
        known &&
        sorted[sorted.length - 1] &&
        (sorted[0].value ?? 0) <= guard
      ) {
        return [sorted[sorted.length - 1].id];
      }
      const killers = hp
        ? sorted.filter((card) => (card.value ?? 0) - guard >= hp)
        : [];
      if (killers.length) return [killers[killers.length - 1].id];
      if (profile.bait && hp && (sorted[0].value ?? 0) < hp + 4) {
        const bait = sorted.filter((card) => (card.value ?? 0) >= 3);
        if (
          bait.length > 1 &&
          !profile.keep?.includes(bait[bait.length - 1].key)
        ) {
          return [bait[bait.length - 1].id];
        }
      }
      const guards = handOf(bot).filter(isDefenseCard).length;
      const pure = sorted.filter((card) => card.type !== "versatile");
      const spare = (guards <= 2 && pure.length ? pure : sorted).filter(
        (card) => !profile.keep?.includes(card.key) && !rate(card).hold,
      );
      return [(spare.length ? spare[0] : sorted[0]).id];
    }
    if (title === "promptDefenseCard") {
      const pool = options.filter(isDefenseCard);
      if (!pool.length) return [];
      const sorted = [...pool].sort(
        (a, b) =>
          defensePower(b) +
          playBias(b, bot) -
          (defensePower(a) + playBias(a, bot)),
      );
      const me = game.players[bot];
      const known = knowledge(bot);
      if (known) {
        const comingCard = getCard(game.combat?.cardIds?.[other(bot)]);
        const incoming =
          (comingCard?.value ?? known.attack) +
          (known.size > 1 ? known.boost * 0.5 : 0);
        const enough = sorted.filter((card) => (card.value ?? 0) >= incoming);
        if (enough.length) return [cheapest(enough).id];
        if (me.hp > incoming * 2 && (sorted[0].value ?? 0) < incoming * 0.3)
          return [];
        return [sorted[0].id];
      }
      const comingCard = getCard(game.combat?.cardIds?.[other(bot)]);
      const expected = comingCard?.value ?? foeAverageAttack(other(bot));
      if (me.hp <= 6 || state.turtle) return [sorted[0].id];
      if (
        profile.thrifty &&
        me.hp > me.maxHp * 0.6 &&
        handOf(bot).length <= 3
      ) {
        return [];
      }
      const enough = sorted.filter((card) => (card.value ?? 0) >= expected);
      return [(enough.length ? cheapest(enough) : sorted[0]).id];
    }
    if (title === "promptBoost") {
      const hand = handOf(bot).length;
      const combat = game.combat;
      const played = combat?.cardIds?.[bot] && getCard(combat.cardIds[bot]);
      const known = knowledge(bot);
      if (played) {
        const value = Math.max(played.value ?? 0, combat.values?.[bot] ?? 0);
        const gain = options.reduce(
          (best, card) => Math.max(best, card.boost ?? 0),
          0,
        );
        if (combat.defender === bot) {
          const comingCard = getCard(combat.cardIds?.[other(bot)]);
          const base = comingCard?.value ?? foeAverageAttack(other(bot));
          const need = known
            ? base + (known.size > 1 ? known.boost * 0.5 : 0)
            : base;
          if (value >= need) return [];
          if (known && value + gain < need && game.players[bot].hp > need) {
            return [];
          }
        } else if (combat.attacker === bot && known && lastTarget) {
          if (value - known.defense >= lastTarget.hp) return [];
        }
      }
      const low = game.players[bot].hp <= 8;
      const guards = handOf(bot).filter(isDefenseCard).length;
      const fodder = options.filter(
        (card) =>
          card.boost &&
          rate(card).boostWill > 1 &&
          !profile.keep?.includes(card.key) &&
          (rate(card).fodder || rate(card).importance < 8),
      );
      const spareFodder = fodder.filter((card) => !isDefenseCard(card));
      const pool = guards <= 2 ? spareFodder : fodder;
      const need = low || state.turtle ? 2 : (profile.boostHand ?? 3);
      if (!pool.length || hand < Math.min(need, profile.boostHand ?? need)) {
        return [];
      }
      return [
        pool.reduce((a, b) => (boostWorth(b) > boostWorth(a) ? b : a)).id,
      ];
    }
    if (title === "promptSchemeCard") {
      if (!options.length) return [];
      return [
        options.reduce((a, b) =>
          schemeValue(b, bot) > schemeValue(a, bot) ? b : a,
        ).id,
      ];
    }
    if (title === "promptSearchDeck") {
      const guards = handOf(bot).filter(isDefenseCard).length;
      const wanted = guards
        ? options.filter(isAttackCard)
        : options.filter(isDefenseCard);
      const pool = wanted.length ? wanted : options;
      return [pool.reduce((a, b) => (cardPower(b) > cardPower(a) ? b : a)).id];
    }
    if (title === "promptShuffleBack") {
      return [...options]
        .sort((a, b) => cardPower(a) - cardPower(b))
        .slice(0, prompt.min ?? 1)
        .map((card) => card.id);
    }
    const min = prompt.min ?? 0;
    if (!min) return [];
    const discard = /Discard|Bottom|Sacrifice/i.test(title);
    const worth = (card) =>
      cardPower(card) +
      (profile.keep?.includes(card.key) ? 5 : 0) +
      (isDefenseCard(card) ? 1.5 : 0) +
      (rate(card).importance - 5) * 0.4 -
      (rate(card).boostWill - 5) * 0.5;
    const ranked = [...options].sort((a, b) =>
      discard ? worth(a) - worth(b) : worth(b) - worth(a),
    );
    return ranked.slice(0, min).map((card) => card.id);
  };

  const myHp = (bot) => game.players[bot].hp;
  const foeLead = (bot) =>
    fightersOf(other(bot)).find((fighter) => fighter.isHero);

  const answerConfirm = (prompt, bot) => {
    const hand = handOf(bot).length;
    switch (prompt.title) {
      case "promptSwap":
      case "promptSmokeSwap":
      case "promptSleightReturn":
        return false;
      case "promptScareTactics":
        return myHp(bot) > 5 && handOf(other(bot)).length > 0;
      case "promptSavage":
        return myHp(bot) > 8;
      case "promptGoodEnough":
        return hand <= 4 && myHp(bot) > 5;
      case "promptTotallySane": {
        const foeHp = foeLead(bot)?.hp ?? 99;
        const mine = myHp(bot);
        return (foeHp <= 2 && mine > 2) || (mine > 6 && mine > foeHp + 1);
      }
      case "promptDrawUp":
        return hand < 5;
      case "promptFiveAgainst":
        return hand >= 2;
      case "promptStealDiscard":
        return hand >= 4;
      default:
        return true;
    }
  };

  const answerChoice = (prompt, bot) => {
    const values = prompt.choices.map((item) => item.value);
    const has = (value) => values.includes(value);
    const missing = missingHp(bot);
    const hand = handOf(bot).length;
    switch (prompt.title) {
      case "promptKisoChoice":
        return missing >= 2 ? "heal" : "action";
      case "promptUtilityBelt":
        if (missing >= 1 && has("heal")) return "heal";
        return hand < 5 && has("draw") ? "draw" : "move";
      case "promptMoveWho":
      case "promptSkirmishWho":
        return has("mine") ? "mine" : has("me") ? "me" : values[0];
      case "promptShrinkChoice":
        return hand >= 4 && has("discard") ? "discard" : "move";
      case "promptVenomFirst":
      case "promptVenomSecond": {
        const near = fightersOf(other(bot)).some((foe) =>
          fightersOf(bot).some((me) => linked(me.space, foe.space)),
        );
        if (has("draw") && hand < 5) return "draw";
        if (has("damage") && near) return "damage";
        return has("draw") ? "draw" : has("move") ? "move" : values[0];
      }
      case "promptSchemeSource":
        return has("card") ? "card" : values[0];
      default:
        return values[0];
    }
  };

  const answer = (prompt, bot) => {
    if (prompt.kind === "space") return answerSpace(prompt, bot);
    if (prompt.kind === "cards") return answerCards(prompt, bot);
    if (prompt.kind === "confirm") return answerConfirm(prompt, bot);
    if (prompt.kind === "choice") return answerChoice(prompt, bot);
    return true;
  };

  const fallback = (prompt, attempt) => {
    if (prompt.kind === "space") {
      return attempt % 2 ? (prompt.options[0] ?? null) : null;
    }
    if (prompt.kind === "cards") {
      return prompt.options.slice(0, prompt.min ?? 0);
    }
    if (prompt.kind === "confirm") return attempt % 2 === 0;
    if (prompt.kind === "choice") {
      return prompt.choices[attempt % prompt.choices.length].value;
    }
    return true;
  };

  const lethalMove = (bot, available) => {
    const foeHero = fightersOf(other(bot)).find((item) => item.isHero);
    if (!foeHero) return null;
    const hp = foeHero.hp;
    const foeHand = handOf(other(bot));
    const guards = foeHand.filter(isDefenseCard);
    const bestBoost = (cards) =>
      cards.reduce((best, card) => Math.max(best, card.boost ?? 0), 0);
    const guard = guards.length
      ? guards.reduce((best, card) => Math.max(best, card.value ?? 0), 0) +
        (foeHand.length > 1 ? bestBoost(foeHand) : 0)
      : 0;
    const mine = handOf(bot);
    const cards = mine.filter(isAttackCard);
    const reach = fightersOf(bot).some((fighter) =>
      canHit(fighter, fighter.space, foeHero.space),
    );
    let attack = -Infinity;
    if (available.attack && reach && cards.length) {
      const top = cards.reduce((best, card) =>
        (card.value ?? 0) > (best.value ?? 0) ? card : best,
      );
      const rest = mine.filter((card) => card.id !== top.id);
      attack = (top.value ?? 0) + bestBoost(rest) - guard;
    }
    const damages = mine
      .map(schemeDamage)
      .filter(Boolean)
      .sort((a, b) => b - a);
    const sum = (count) =>
      damages.slice(0, Math.max(count, 0)).reduce((a, b) => a + b, 0);
    if (available.scheme && sum(game.actions) >= hp) return "scheme";
    if (attack >= hp) return "attack";
    if (
      available.scheme &&
      game.actions >= 2 &&
      sum(1) + attack >= hp &&
      attack > -Infinity
    ) {
      return "scheme";
    }
    return null;
  };

  const act = (bot) => {
    if (!inSim) planned = null;
    const available = engine.availableActions(true);
    const hand = handOf(bot);
    const state = plan(bot);
    if (!inSim) reachCache.clear();
    if (state.finisher && available.scheme) return engine.doScheme();
    const kill = lethalMove(bot, available);
    if (kill === "scheme") return engine.doScheme();
    if (kill === "attack") return engine.doAttack();
    if (
      available.attack &&
      !handOf(other(bot)).some(isDefenseCard) &&
      hand.some(isDefenseCard)
    ) {
      return engine.doAttack();
    }
    if (game.turnNo === 1 && available.maneuver && turnManeuvers < 2) {
      turnManeuvers += 1;
      return engine.doManeuver();
    }
    if (state.turtle && available.maneuver) {
      turnManeuvers += 1;
      return engine.doManeuver();
    }
    const scheme = available.scheme ? bestScheme(bot) : null;
    const style = styleOf();
    const weight = profile.fatigue ?? 1;
    const edge = fatigueEdge(bot) * weight;
    const options = [];
    if (available.attack) {
      options.push([
        "attack",
        attackUtility(bot) +
          1.5 +
          (hand.length >= 6 ? 0.7 : 0) +
          (style === BOT_STYLES.PASS
            ? 1.2
            : style === BOT_STYLES.PRESSURE
              ? 0.8
              : edge >= 3 || edge <= -3
                ? 1
                : 0.5),
      ]);
    }
    const defenders = hand.filter(isDefenseCard).length;
    const crowded = hand.length >= 6;
    const afterMove = turnManeuvers > 0;
    if (scheme?.card && scheme.value >= (afterMove ? 0.6 : 0.8)) {
      const text = textOf(scheme.card);
      const quiet = !/draw|gain 1 (free )?action/.test(text);
      const bonus =
        style === BOT_STYLES.PASS
          ? quiet
            ? 0.8
            : -0.3
          : style === BOT_STYLES.PRESSURE
            ? quiet
              ? 0
              : 0.5
            : 0;
      options.push(["scheme", scheme.value + bonus + (crowded ? 0.6 : 0)]);
    }
    if (available.maneuver) {
      const draw =
        hand.length >= 7
          ? -3
          : hand.length >= 6
            ? -1
            : hand.length <= 2
              ? 1.4
              : 0.8;
      const top = getCard(game.players[bot].deck?.[0]);
      const need =
        (!defenders && hand.length < 7 ? 1.6 : 0) +
        (top && !defenders && isDefenseCard(top) ? 1 : 0);
      const styleDraw =
        style === BOT_STYLES.PASS && hand.length >= 4
          ? -0.6
          : style === BOT_STYLES.PRESSURE
            ? 0.4
            : 0;
      const repeat = afterMove ? -1.5 : 0;
      const gain = bestMoveGain(bot) * (available.attack ? 0.4 : 1);
      options.push(["maneuver", draw + styleDraw + need + repeat + gain]);
    }
    if (!options.length) return;
    if (!inSim && !(game.noSearch || []).includes(bot)) {
      const prior = Object.fromEntries(options);
      const found = search.choose(bot, available, prior);
      if (found) {
        planned = { index: 0, list: found.overrides, turn: game.turnNo };
        if (found.action === "attack") return engine.doAttack();
        if (found.action === "scheme") return engine.doScheme();
        turnManeuvers += 1;
        return engine.doManeuver();
      }
    }
    options.sort((a, b) => b[1] - a[1]);
    const [pick, value] = options[0];
    if (
      pick === "scheme" &&
      value < 1.2 &&
      available.attack &&
      hand.length < 6
    ) {
      return engine.doAttack();
    }
    if (pick === "attack") return engine.doAttack();
    if (pick === "scheme") return engine.doScheme();
    turnManeuvers += 1;
    return engine.doManeuver();
  };

  const search = createSearch({
    engine,
    game,
    fightersOf,
    handOf,
    fatigueEdge,
    positionScore: (fighter, space, bot) =>
      positionScore(fighter, space, bot, false),
    nearestFoe,
    canHit,
    isAttackCard,
    isDefenseCard,
    fallback,
    styleOf: (seat) => profileOf(seat).style ?? BOT_STYLES.NEUTRAL,
    decide: (prompt, seat) => withSeat(seat, () => answer(prompt, seat)),
    step: (seat) =>
      withSeat(seat, () => {
        if (game.turnNo !== simTurn) {
          simTurn = game.turnNo;
          turnManeuvers = 0;
        }
        act(seat);
      }),
    startSim: (action) => {
      saveSim = { turnManeuvers, lastTarget };
      inSim = true;
      simTurn = game.turnNo;
      if (action === "maneuver") turnManeuvers += 1;
    },
    endSim: () => {
      inSim = false;
      if (saveSim) {
        turnManeuvers = saveSim.turnManeuvers;
        lastTarget = saveSim.lastTarget;
      }
    },
  });

  const step = () => {
    const bot = game.bot;
    if (!bot) return;
    store = loadBotData();
    currentStore = store;
    profile = profileOf(bot);
    if (game.phase === "mulligan" && game.mulligan) {
      if (!game.mulligan.reveal && !game.mulligan.decided[bot]) {
        chooseMulligan(bot);
      }
      return;
    }
    if (game.phase === "startpick" && game.startPick) {
      const { order, index, taken } = game.startPick;
      if (order[index] === bot) {
        const map = getMap(game.mapId);
        const options = [map.starts.p1, map.starts.p2].filter(
          (id) => !taken.includes(id),
        );
        if (options.length) {
          engine.pickStart(
            bestBy(options, (id) => startScore(id, bot)),
            bot,
          );
        }
      }
      return;
    }
    if (game.phase !== "play") return;
    const prompt = game.prompt;
    if (prompt) {
      if (prompt.player !== bot) return;
      const key = JSON.stringify([
        prompt.title,
        prompt.options,
        prompt.choices?.length,
        game.turnNo,
      ]);
      repeats = key === signature ? repeats + 1 : 0;
      signature = key;
      let reply;
      if (repeats >= 2) reply = fallback(prompt, repeats);
      else {
        const forced = planned?.list.get(planned.index);
        if (planned) planned.index += 1;
        reply =
          forced &&
          forced.title === prompt.title &&
          validReply(prompt, forced.value)
            ? forced.value
            : answer(prompt, bot);
      }
      engine.answerPrompt(reply);
      return;
    }
    signature = "";
    repeats = 0;
    if (game.turn === bot) {
      if (game.turnNo !== lastTurn) {
        lastTurn = game.turnNo;
        turnManeuvers = 0;
        const total = ["p1", "p2"].reduce(
          (sum, seat) =>
            sum +
            fightersOf(seat).reduce((acc, fighter) => acc + fighter.hp, 0),
          0,
        );
        idle = total === lastHp ? idle + 1 : 0;
        lastHp = total;
      }
      act(bot);
    }
  };

  onMounted(() => {
    timer = setInterval(() => {
      try {
        step();
      } catch (error) {
        console.error(error);
      }
    }, TICK);
  });

  onBeforeUnmount(() => clearInterval(timer));

  return { step };
}
