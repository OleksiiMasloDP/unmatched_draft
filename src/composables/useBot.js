import { onBeforeUnmount, onMounted } from "vue";
import { getMap } from "../gameMaps.js";
import { getCard, getHero } from "../gameDecks.js";
import { botProfiles } from "../botProfiles.js";
import { useGame } from "./useGame.js";

const TICK = 650;
const other = (seat) => (seat === "p1" ? "p2" : "p1");
const isAttackCard = (card) =>
  card && card.type !== "defense" && card.type !== "scheme" && card.value;
const isDefenseCard = (card) =>
  card && card.type !== "attack" && card.type !== "scheme";
const cardPower = (card) => (card.value ?? 0) + (card.boost ?? 0) * 0.35;
const attackPower = (card) =>
  cardPower(card) - (card.type === "versatile" ? 0.3 : 0);
const defensePower = (card) =>
  cardPower(card) - (card.type === "versatile" ? 0.3 : 0);
const schemeDamage = (card) => {
  if (!card || card.type !== "scheme") return 0;
  const found = /(\d+) damage/i.exec(card.text?.en || "");
  return found ? Number(found[1]) : 0;
};
const HEAL = /recover|heal|regain/i;

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
  const level = () => game.botLevel || "normal";
  const slip = () => level() === "easy" && Math.random() < 0.3;
  const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

  const knowledge = (bot) => {
    if (level() !== "hard") return null;
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
  let lastHp = -1;

  const byId = () => graphOf(game.mapId).byId;
  const spaceOf = (id) => byId().get(id);

  const distances = (from) => {
    const dist = new Map([[from, 0]]);
    const queue = [from];
    while (queue.length) {
      const id = queue.shift();
      const node = spaceOf(id);
      for (const next of [...(node?.links || []), ...(node?.secret || [])]) {
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
      for (const next of [...(node?.links || []), ...(node?.secret || [])]) {
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
      best = Math.min(best, dist.get(foe.space) ?? 60);
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
    if (level() === "easy") return { finisher: false, turtle: false };
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
    return {
      finisher: inHand >= foeHero.hp,
      turtle:
        safe &&
        inHand < foeHero.hp &&
        inHand + inDeck >= foeHero.hp &&
        deckLeft > 2,
    };
  };

  const fear = (fighter, turtle) => {
    if (level() === "easy") return 0;
    let base = fighter.isHero
      ? 1 + (1 - fighter.hp / fighter.max) * 1.5
      : (profile.kidFear ?? 0.5);
    const known = knowledge(game.bot);
    if (
      known &&
      fighter.isHero &&
      known.attack + known.boost * 0.5 >= fighter.hp
    ) {
      base *= 2;
    }
    return base * (turtle ? 3 : 1);
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
      const weight = foe.isHero ? 1 : 0.6;
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
    const dist = nearestFoe(space, bot);
    if (turtle)
      return -fear(fighter, true) * exposure + 0.2 * Math.min(dist, 8);
    const aggro = profile.aggro ?? 1;
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
    return (
      2 * aggro * strike +
      0.8 * aggro * reachStrike +
      contain -
      (fear(fighter, false) * exposure * Math.max(0, 0.5 - idle * 0.1)) /
        aggro -
      (strike ? 0 : 0.25 * aggro * dist)
    );
  };

  const fighterAt = (space, bot) =>
    fightersOf(bot).find((item) => item.space === space);

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
    (foe.isHero ? (profile.heroFocus ?? 3) : 0) +
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
        return top + (me.isHero ? 0 : 0.5) + me.hp * 0.01;
      });
    }
    const foes = options.filter((id) => foeAt(id, bot));
    if (title === "promptAttackTarget" || foes.length === options.length) {
      const pick = slip() ? pickRandom(foes) : bestTarget(foes, bot);
      lastTarget = foeAt(pick, bot);
      return pick;
    }
    if (title === "promptMoveWith") {
      let best = null;
      let bestGain = 0.3;
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
      const target = bestBy(options, (id) =>
        positionScore(me, id, bot, state.turtle),
      );
      if (positionScore(me, target, bot, state.turtle) <= now + 0.1)
        return null;
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

  const answerCards = (prompt, bot) => {
    const options = prompt.options.map(getCard).filter(Boolean);
    const title = prompt.title;
    const state = plan(bot);
    if (title === "promptAttackCard") {
      if (!options.length) return [];
      const sorted = [...options].sort(
        (a, b) => attackPower(b) - attackPower(a),
      );
      if (slip()) return [pickRandom(options).id];
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
      const spare = sorted.filter((card) => !profile.keep?.includes(card.key));
      return [(spare.length ? spare[0] : sorted[0]).id];
    }
    if (title === "promptDefenseCard") {
      const pool = options.filter(isDefenseCard);
      if (!pool.length) return [];
      const sorted = [...pool].sort(
        (a, b) => defensePower(b) - defensePower(a),
      );
      const me = game.players[bot];
      if (slip()) return [pickRandom(pool).id];
      const known = knowledge(bot);
      if (known) {
        if (!known.attack) return [];
        const incoming =
          known.attack + (known.size > 1 ? known.boost * 0.5 : 0);
        const enough = sorted.filter((card) => (card.value ?? 0) >= incoming);
        if (enough.length) return [enough[enough.length - 1].id];
        if (me.hp > incoming && (sorted[0].value ?? 0) < incoming * 0.4)
          return [];
        return [sorted[0].id];
      }
      const expected = foeAverageAttack(other(bot));
      if (me.hp <= 6 || state.turtle) return [sorted[0].id];
      if (
        profile.thrifty &&
        me.hp > me.maxHp * 0.6 &&
        handOf(bot).length <= 3
      ) {
        return [];
      }
      const enough = sorted.filter((card) => (card.value ?? 0) >= expected);
      return [(enough.length ? enough[enough.length - 1] : sorted[0]).id];
    }
    if (title === "promptBoost") {
      if (level() === "easy") return [];
      const hand = handOf(bot).length;
      const low = game.players[bot].hp <= 8;
      const pool = options.filter(
        (card) => card.boost && !profile.keep?.includes(card.key),
      );
      const need = low || state.turtle ? 2 : (profile.boostHand ?? 3);
      if (!pool.length || hand < Math.min(need, profile.boostHand ?? need)) {
        return [];
      }
      return [
        pool.reduce((a, b) =>
          b.boost - (b.value ?? 0) * 0.35 > a.boost - (a.value ?? 0) * 0.35
            ? b
            : a,
        ).id,
      ];
    }
    if (title === "promptSchemeCard") {
      if (!options.length) return [];
      return [
        options.reduce((a, b) => (schemeDamage(b) > schemeDamage(a) ? b : a))
          .id,
      ];
    }
    const min = prompt.min ?? 0;
    if (!min) return [];
    const discard = /Discard|Bottom|Sacrifice/i.test(title);
    const worth = (card) =>
      cardPower(card) + (profile.keep?.includes(card.key) ? 5 : 0);
    const ranked = [...options].sort((a, b) =>
      discard ? worth(a) - worth(b) : worth(b) - worth(a),
    );
    return ranked.slice(0, min).map((card) => card.id);
  };

  const answer = (prompt, bot) => {
    if (prompt.kind === "space") return answerSpace(prompt, bot);
    if (prompt.kind === "cards") return answerCards(prompt, bot);
    if (prompt.kind === "confirm") return true;
    if (prompt.kind === "choice") return prompt.choices[0].value;
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

  const act = (bot) => {
    const available = engine.availableActions(true);
    const hand = handOf(bot);
    const hasScheme = hand.some((card) => card.type === "scheme");
    const state = plan(bot);
    reachCache.clear();
    const choices = Object.keys(available).filter((key) => available[key]);
    if (slip() && choices.length) {
      const key = pickRandom(choices);
      const run = {
        attack: engine.doAttack,
        scheme: engine.doScheme,
        maneuver: engine.doManeuver,
      }[key];
      if (run) return run();
    }
    const known = knowledge(bot);
    if (known && known.size && available.attack && available.maneuver) {
      const best = hand
        .filter(isAttackCard)
        .reduce((top, card) => Math.max(top, card.value ?? 0), 0);
      if (best <= known.defense) return engine.doManeuver();
    }
    if (state.finisher && available.scheme) return engine.doScheme();
    if (state.turtle && available.maneuver) return engine.doManeuver();
    if (
      available.attack &&
      !(
        available.scheme &&
        hasScheme &&
        hand.length >= (profile.schemeHand ?? 5)
      )
    ) {
      return engine.doAttack();
    }
    if (available.scheme && hasScheme) return engine.doScheme();
    if (available.maneuver) return engine.doManeuver();
    if (available.attack) return engine.doAttack();
    if (available.scheme) return engine.doScheme();
  };

  const step = () => {
    const bot = game.bot;
    if (!bot) return;
    profile =
      level() === "easy" ? {} : botProfiles[game.players[bot]?.heroId] || {};
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
        const options = Object.values(map.starts).filter(
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
      const reply =
        repeats < 2 ? answer(prompt, bot) : fallback(prompt, repeats);
      engine.answerPrompt(reply);
      return;
    }
    signature = "";
    repeats = 0;
    if (game.turn === bot) {
      if (game.turnNo !== lastTurn) {
        lastTurn = game.turnNo;
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
}
