import { BOT_STYLES } from "../botStyles.js";
import { getCard } from "../gameDecks.js";

const other = (seat) => (seat === "p1" ? "p2" : "p1");
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const validReply = (prompt, value) => {
  if (prompt.kind === "space") {
    if (value && typeof value === "object") {
      return (prompt.boostOptions || []).includes(value.boost);
    }
    return value === null || prompt.options.includes(value);
  }
  if (prompt.kind === "cards") {
    return (
      Array.isArray(value) &&
      value.length >= (prompt.min ?? 0) &&
      value.length <= (prompt.max ?? 99) &&
      value.every((id) => prompt.options.includes(id))
    );
  }
  if (prompt.kind === "confirm") return typeof value === "boolean";
  if (prompt.kind === "choice") {
    return prompt.choices.some((item) => item.value === value);
  }
  return true;
};

export const DEFAULT_WEIGHTS = {
  hp: 2,
  kidHp: 0.7,
  kidCount: 1.2,
  card: 0.9,
  lowHand: 1.1,
  noDefense: 2.2,
  noAttack: 1.2,
  deck: 0.2,
  fatigue: 0.45,
  fatiguePass: 0.7,
  reach: 0.6,
  beatGuard: 0.4,
  position: 0.3,
  prior: 3,
};

export function createSearch(api) {
  const { engine, game } = api;
  const BUDGET = () => api.weightsOf(null).budget ?? 700;
  const SAMPLES = 3;
  const DEPTH = 7;

  const evaluate = (bot) => {
    const w = api.weightsOf(bot);
    if (game.phase === "over") return game.winner === bot ? 1000 : -1000;
    const foe = other(bot);
    const me = game.players[bot];
    const them = game.players[foe];
    const style = api.styleOf(bot);
    const kidHp = (state) =>
      (state.sidekicks || [])
        .filter((kid) => !kid.down)
        .reduce((sum, kid) => sum + kid.hp, 0);
    const kidCount = (state) =>
      (state.sidekicks || []).filter((kid) => !kid.down).length;
    const dmgWeight = style === BOT_STYLES.PRESSURE ? 1.25 : 1;
    const cardWeight = style === BOT_STYLES.PASS ? 1.3 : 1;
    let score = 0;
    score += (me.hp - them.hp * dmgWeight) * w.hp;
    score += (kidHp(me) - kidHp(them) * dmgWeight) * w.kidHp;
    score += (kidCount(me) - kidCount(them)) * w.kidCount;
    const hand = api.handOf(bot);
    const foeHand = api.handOf(foe);
    const defenders = hand.filter(api.isDefenseCard).length;
    const attackers = hand.filter(api.isAttackCard).length;
    const size = Math.min(hand.length, 7);
    score += size * w.card * cardWeight;
    if (hand.length < 4) score -= (4 - hand.length) * w.lowHand;
    if (!defenders) score -= w.noDefense;
    if (!attackers) score -= w.noAttack;
    score -= Math.min(foeHand.length, 7) * w.card * cardWeight;
    score += (me.deck.length - them.deck.length) * w.deck;
    score +=
      api.fatigueEdge(bot) *
      (style === BOT_STYLES.PASS ? w.fatiguePass : w.fatigue);
    const hero = api.fightersOf(bot).find((item) => item.isHero);
    const foeHero = api.fightersOf(foe).find((item) => item.isHero);
    if (hero && foeHero) {
      const best = hand
        .filter(api.isAttackCard)
        .reduce((top, card) => Math.max(top, card.value ?? 0), 0);
      const reach = api
        .fightersOf(bot)
        .some((fighter) => api.canHit(fighter, fighter.space, foeHero.space));
      if (reach && best) score += best * w.reach;
      const guard = foeHand
        .filter(api.isDefenseCard)
        .reduce((top, card) => Math.max(top, card.value ?? 0), 0);
      if (reach && best > guard) score += (best - guard) * w.beatGuard;
      score += api.positionScore(hero, hero.space, bot) * w.position;
    }
    return score;
  };

  const brief = (prompt) => ({
    title: prompt.title,
    kind: prompt.kind,
    options: prompt.options ? [...prompt.options] : undefined,
    choices: prompt.choices ? prompt.choices.map((item) => ({ ...item })) : [],
    boostOptions: prompt.boostOptions ? [...prompt.boostOptions] : undefined,
    min: prompt.min,
    max: prompt.max,
    fighter: prompt.fighter,
  });

  const alternatives = (prompt, reply, bot) => {
    const out = [];
    const add = (value) => {
      if (!validReply(prompt, value)) return;
      if (same(value, reply) || out.some((item) => same(item, value))) return;
      out.push(value);
    };
    if (prompt.kind === "confirm") add(!reply);
    else if (prompt.kind === "choice") {
      for (const item of prompt.choices) add(item.value);
    } else if (prompt.kind === "cards") {
      const ids = [...prompt.options].sort(
        (a, b) => (getCard(b)?.value ?? 0) - (getCard(a)?.value ?? 0),
      );
      if ((prompt.max ?? 0) === 1) for (const id of ids.slice(0, 5)) add([id]);
      if (!prompt.min) add([]);
    } else if (prompt.kind === "space") {
      add(null);
      const ordered = [...prompt.options].sort(
        (a, b) => api.nearestFoe(a, bot) - api.nearestFoe(b, bot),
      );
      for (const id of ordered.slice(0, 3)) add(id);
      if (prompt.boostOptions?.length) add({ boost: prompt.boostOptions[0] });
    }
    return out.slice(0, 5);
  };

  const drive = (ctx, root) => {
    let guard = 0;
    let key = "";
    let repeats = 0;
    const seen = new Map();
    while (game.prompt && game.phase === "play" && guard++ < 300) {
      const prompt = game.prompt;
      if (!prompt.player) {
        engine.answerPrompt();
        continue;
      }
      const seat = prompt.player;
      const same_ = JSON.stringify([prompt.title, prompt.options]);
      repeats = same_ === key ? repeats + 1 : 0;
      key = same_;
      const times = (seen.get(prompt.title) || 0) + 1;
      seen.set(prompt.title, times);
      let reply;
      if (prompt.kind === "confirm" && times > 4) reply = false;
      else if (repeats >= 2) reply = api.fallback(prompt, repeats);
      else if (root && seat === ctx.bot) {
        const index = ctx.index++;
        const forced = ctx.overrides.get(index);
        if (
          forced &&
          forced.title === prompt.title &&
          validReply(prompt, forced.value)
        ) {
          reply = forced.value;
        } else {
          reply = api.decide(prompt, seat);
          if (ctx.trace) {
            ctx.trace.push({ index, prompt: brief(prompt), reply });
          }
        }
      } else {
        reply = api.decide(prompt, seat);
      }
      engine.answerPrompt(reply);
    }
  };

  const playout = (bot, saved, action, overrides, trace) => {
    engine.restore(saved);
    engine.shuffleDecks();
    const ctx = { bot, overrides, trace, index: 0 };
    api.startSim(action);
    if (action === "attack") engine.doAttack();
    else if (action === "scheme") engine.doScheme();
    else engine.doManeuver();
    drive(ctx, true);
    let guard = 0;
    let away = false;
    while (game.phase === "play" && guard++ < DEPTH * 6) {
      if (game.prompt) {
        drive(ctx, false);
        continue;
      }
      const seat = game.turn;
      if (seat !== bot) away = true;
      else if (away) break;
      const before = JSON.stringify([game.actions, game.turnNo]);
      api.step(seat);
      drive(ctx, false);
      if (
        !game.prompt &&
        game.turn === seat &&
        JSON.stringify([game.actions, game.turnNo]) === before
      ) {
        break;
      }
    }
    const score = evaluate(bot);
    return score;
  };

  const mean = (list) => list.reduce((a, b) => a + b, 0) / list.length;

  const choose = (bot, available, prior = {}) => {
    const saved = engine.snapshot();
    if (!saved) return null;
    const options = ["attack", "scheme", "maneuver"].filter(
      (name) => available[name],
    );
    if (!options.length) return null;
    const started = performance.now();
    const over = () => performance.now() - started > BUDGET();
    let result = null;
    engine.simulate(() => {
      const keep = game.bot;
      try {
        const rows = options.map((action) => ({
          action,
          scores: [],
          trace: [],
        }));
        for (let round = 0; round < SAMPLES; round++) {
          for (const row of rows) {
            if (round && over()) continue;
            row.scores.push(
              playout(
                bot,
                saved,
                row.action,
                new Map(),
                round === 0 ? row.trace : null,
              ),
            );
          }
        }
        const total = (row) =>
          mean(row.scores) +
          (prior[row.action] ?? 0) * api.weightsOf(bot).prior;
        rows.sort((a, b) => total(b) - total(a));
        const best = rows[0];
        let base = mean(best.scores);
        const overrides = new Map();
        let trace = best.trace;
        for (let at = 0; at < 6 && !over(); at++) {
          const entry = trace.find((item) => item.index === at);
          if (!entry) break;
          const alts = alternatives(entry.prompt, entry.reply, bot);
          let picked = false;
          let pickValue = null;
          for (const value of alts) {
            if (over()) break;
            const trial = new Map(overrides);
            trial.set(at, { title: entry.prompt.title, value });
            const scores = [];
            for (let i = 0; i < 2; i++) {
              scores.push(playout(bot, saved, best.action, trial, null));
            }
            const gain = mean(scores);
            if (gain > base + 1.5) {
              base = gain;
              picked = true;
              pickValue = value;
            }
          }
          if (picked) {
            overrides.set(at, { title: entry.prompt.title, value: pickValue });
          }
          const next = [];
          playout(bot, saved, best.action, overrides, next);
          trace = next;
        }
        result = {
          action: best.action,
          overrides,
          scores: rows.map((row) => [row.action, total(row)]),
        };
      } finally {
        game.bot = keep;
        api.endSim();
      }
    });
    engine.restore(saved);
    return result;
  };

  return { choose, evaluate };
}
