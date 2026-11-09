import { onBeforeUnmount, onMounted } from "vue";
import { getMap } from "../gameMaps.js";
import { getCard, getHero } from "../gameDecks.js";
import { useGame } from "./useGame.js";

const TICK = 650;
const other = (seat) => (seat === "p1" ? "p2" : "p1");
const isAttackCard = (card) =>
  card && (card.type === "attack" || card.type === "versatile") && card.value;
const isDefenseCard = (card) =>
  card && (card.type === "defense" || card.type === "versatile");
const cardPower = (card) => (card.value ?? 0) + (card.boost ?? 0) * 0.35;

export function useBot() {
  const engine = useGame();
  const { game } = engine;
  let timer = null;
  let signature = "";
  let repeats = 0;

  const graph = () => {
    const map = getMap(game.mapId);
    const byId = new Map(map.spaces.map((space) => [space.id, space]));
    return { map, byId };
  };

  const distances = (from) => {
    const { byId } = graph();
    const dist = new Map([[from, 0]]);
    const queue = [from];
    while (queue.length) {
      const id = queue.shift();
      for (const next of byId.get(id)?.links || []) {
        if (!dist.has(next)) {
          dist.set(next, dist.get(id) + 1);
          queue.push(next);
        }
      }
    }
    return dist;
  };

  const fightersOf = (seat) => {
    const state = game.players[seat];
    if (!state) return [];
    const data = getHero(state.heroId);
    const list = [];
    if (state.hp > 0) {
      list.push({
        id: "hero",
        space: state.space,
        hp: state.hp,
        attack: data.attack,
      });
    }
    for (const kid of state.sidekicks || []) {
      if (!kid.down && kid.space) {
        list.push({
          id: kid.id,
          space: kid.space,
          hp: kid.hp,
          attack: kid.attack || data.sidekick?.attack,
        });
      }
    }
    return list;
  };

  const nearestFoe = (space, bot) => {
    const dist = distances(space);
    let best = Infinity;
    for (const foe of fightersOf(other(bot))) {
      best = Math.min(best, dist.get(foe.space) ?? Infinity);
    }
    return best;
  };

  const sharesZone = (a, b) => {
    const { byId } = graph();
    const zones = byId.get(a)?.zones || [];
    return (byId.get(b)?.zones || []).some((zone) => zones.includes(zone));
  };

  const inRange = (fighter, bot) =>
    fightersOf(other(bot)).some((foe) =>
      fighter.attack === "range"
        ? sharesZone(fighter.space, foe.space)
        : distances(fighter.space).get(foe.space) === 1,
    );

  const handOf = (seat) => (game.players[seat]?.hand || []).map(getCard);

  const chooseMulligan = (bot) => {
    const good = handOf(bot).filter(isAttackCard).length;
    engine.chooseMulligan(good < 2, bot);
  };

  const pickSpaceNear = (options, bot) => {
    let best = options[0];
    let bestDist = Infinity;
    for (const id of options) {
      const dist = nearestFoe(id, bot);
      if (dist < bestDist) {
        best = id;
        bestDist = dist;
      }
    }
    return best;
  };

  const foeAt = (space, bot) =>
    fightersOf(other(bot)).find((foe) => foe.space === space);

  const answerSpace = (prompt, bot) => {
    const options = prompt.options;
    if (!options.length) return null;
    const title = prompt.title;
    if (title === "promptAttackWith") return pickSpaceNear(options, bot);
    const foes = options.filter((id) => foeAt(id, bot));
    if (title === "promptAttackTarget" || foes.length === options.length) {
      return foes.reduce((best, id) =>
        foeAt(id, bot).hp < foeAt(best, bot).hp ? id : best,
      );
    }
    if (title === "promptMoveWith") {
      const movers = options
        .map((id) => ({
          id,
          fighter: fightersOf(bot).find((item) => item.space === id),
        }))
        .filter((item) => item.fighter && !inRange(item.fighter, bot));
      if (!movers.length) return null;
      return movers.reduce((best, item) =>
        nearestFoe(item.id, bot) > nearestFoe(best.id, bot) ? item : best,
      ).id;
    }
    if (title === "promptMoveSpace" || title === "promptMoveSidekick") {
      const fighter = fightersOf(bot).find(
        (item) => item.id === prompt.fighter,
      );
      if (!fighter || inRange(fighter, bot)) return null;
      const current = nearestFoe(fighter.space, bot);
      const target = pickSpaceNear(options, bot);
      if (nearestFoe(target, bot) >= current) return null;
      return target;
    }
    if (foes.length) {
      return foes.reduce((best, id) =>
        foeAt(id, bot).hp < foeAt(best, bot).hp ? id : best,
      );
    }
    if (/Foe/.test(title)) {
      return options.reduce((best, id) =>
        nearestFoe(id, bot) > nearestFoe(best, bot) ? id : best,
      );
    }
    return pickSpaceNear(options, bot);
  };

  const answerCards = (prompt, bot) => {
    const options = prompt.options.map(getCard).filter(Boolean);
    const title = prompt.title;
    if (title === "promptAttackCard") {
      if (!options.length) return [];
      return [
        options.reduce((a, b) => (cardPower(b) > cardPower(a) ? b : a)).id,
      ];
    }
    if (title === "promptDefenseCard") {
      const pool = options.filter(isDefenseCard);
      if (!pool.length) return [];
      return [pool.reduce((a, b) => (cardPower(b) > cardPower(a) ? b : a)).id];
    }
    if (title === "promptBoost") {
      const hand = handOf(bot).length;
      const pool = options.filter((card) => card.boost);
      if (hand < 3 || !pool.length) return [];
      return [pool.reduce((a, b) => (b.boost > a.boost ? b : a)).id];
    }
    if (title === "promptSchemeCard") {
      return options.length ? [options[0].id] : [];
    }
    const min = prompt.min ?? 0;
    if (!min) return [];
    const discard = /Discard|Bottom|Sacrifice/i.test(title);
    const ranked = [...options].sort((a, b) =>
      discard ? cardPower(a) - cardPower(b) : cardPower(b) - cardPower(a),
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
    const schemes = handOf(bot).filter((card) => card.type === "scheme");
    if (available.attack && !(available.scheme && Math.random() < 0.2)) {
      engine.doAttack();
    } else if (available.scheme && (schemes.length || !available.maneuver)) {
      engine.doScheme();
    } else if (available.maneuver) {
      engine.doManeuver();
    }
  };

  const step = () => {
    const bot = game.bot;
    if (!bot) return;
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
        if (options.length) engine.pickStart(options[0], bot);
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
    if (game.turn === bot) act(bot);
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
