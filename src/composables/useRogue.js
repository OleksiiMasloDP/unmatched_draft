import { reactive } from "vue";
import { getCard, getHero } from "../gameDecks.js";
import { gameMaps } from "../gameMaps.js";
import {
  buildAllCards,
  buildCustomCards,
  packDraftHeroes,
} from "../packDraftData.js";
import { generateMap } from "../rogueMap.js";
import {
  BASE_DECK,
  HERO_CHOICES,
  MIN_DECK,
  PACK_COUNT,
  PACK_SIZE,
  REWARD_CHOICES,
  START_GOLD,
  cardPrice,
  events,
  heroEvents,
  levels,
  removePrice,
  themes,
} from "../rogueData.js";
import { useGame } from "./useGame.js";
import { notifyChanged, registerSyncable } from "../cloud/sync.js";

const STORAGE_KEY = "unmatched-rogue-run-v2";

const allCards = buildAllCards();
const bossCards = buildCustomCards();

const mulberry32 = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pickMany = (list, count) => {
  const pool = [...list];
  const result = [];
  while (pool.length && result.length < count) {
    result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return result;
};

const emptyRun = () => ({
  phase: "idle",
  level: 1,
  heroOptions: [],
  heroId: null,
  deck: [],
  gold: 0,
  map: [],
  pos: null,
  visited: [],
  node: null,
  wins: 0,
  enemy: null,
  rewards: [],
  packs: [],
  packChosen: null,
  shop: null,
  event: null,
  rest: null,
  hp: null,
  maxHp: null,
  victory: false,
  best: 0,
  battleSave: null,
  seenEvents: [],
});

const teamSize = (heroId) => {
  const found = getHero(heroId);
  return found?.team ? 1 + (found.sidekick?.count || 0) : 1;
};

const maxHpOf = (heroId) => getHero(heroId).hp * teamSize(heroId);

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.phase) {
      const loaded = { ...emptyRun(), ...saved };
      if (loaded.heroId && loaded.deck.length && loaded.hp == null) {
        loaded.maxHp = maxHpOf(loaded.heroId);
        loaded.hp = loaded.maxHp;
      } else if (
        loaded.heroId &&
        loaded.deck.length &&
        loaded.maxHp === getHero(loaded.heroId).hp &&
        teamSize(loaded.heroId) > 1
      ) {
        const size = teamSize(loaded.heroId);
        loaded.maxHp *= size;
        loaded.hp *= size;
      }
      return loaded;
    }
  } catch {
    return emptyRun();
  }
  return emptyRun();
}

const HISTORY_KEY = "unmatched-rogue-history";

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

const history = reactive(loadHistory());

const run = reactive(load());

registerSyncable({
  name: "rogue",
  docKey: "rogue",
  storageKey: STORAGE_KEY,
  toRemote: (raw) => (raw ? JSON.parse(raw) : null),
  fromRemote: (value) => (value == null ? null : JSON.stringify(value)),
  apply: () => {
    if (run.phase === "battle" && useGame().game.phase === "play") return;
    for (const key of Object.keys(run)) delete run[key];
    Object.assign(run, load());
  },
});

registerSyncable({
  name: "rogueHistory",
  docKey: "rogueHistory",
  storageKey: HISTORY_KEY,
  toRemote: (raw) => (raw ? JSON.parse(raw) : null),
  fromRemote: (value) => JSON.stringify(Array.isArray(value) ? value : []),
  apply: () => {
    history.splice(0, history.length, ...loadHistory());
  },
});

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
    notifyChanged("rogue");
  } catch {
    return;
  }
}

const baseId = (id) => (id.endsWith("+") ? id.slice(0, -1) : id);

const nodeById = (id) => run.map.flat().find((node) => node.id === id) || null;

const kindOf = (node) => (node.type === "mystery" ? node.secret : node.type);

const hpScale = (node) =>
  Math.min(1, 0.5 + 0.05 * node.row) + (run.level - 1) * 0.25 - 0.2;

const foeScale = (node) => {
  const kind = kindOf(node);
  if (kind === "boss") return 1.05 + (run.level - 1) * 0.25;
  if (kind === "elite") return hpScale(node) * 1.5;
  return hpScale(node);
};

const botLevelFor = (node) => {
  const kind = kindOf(node);
  if (kind === "boss") return "hard";
  const order = ["easy", "normal", "hard"];
  const base = (node.row <= 2 ? 0 : node.row <= 6 ? 1 : 2) + run.level - 1;
  return order[Math.min(2, base + (kind === "elite" ? 1 : 0))];
};

function ownedKeys() {
  return new Set(run.deck.map((id) => getCard(id)?.key));
}

function freshPool(extra = new Set()) {
  const owned = new Set(run.deck.map(baseId));
  const seen = new Set();
  return allCards.filter((card) => {
    if (owned.has(card.id) || extra.has(card.id) || seen.has(card.id)) {
      return false;
    }
    seen.add(card.id);
    return true;
  });
}

function uniqueByKey(cards) {
  const seen = new Set();
  return cards.filter((card) => {
    if (seen.has(card.key)) return false;
    seen.add(card.key);
    return true;
  });
}

function makeRewards() {
  const keys = ownedKeys();
  const pool = uniqueByKey(freshPool()).filter((card) => !keys.has(card.key));
  run.rewards = pickMany(pool, REWARD_CHOICES).map((card) => card.id);
}

function makePacks() {
  const used = new Set();
  const packs = [];
  for (const theme of pickMany(themes, themes.length)) {
    if (packs.length >= PACK_COUNT) break;
    const pool = uniqueByKey(freshPool(used)).filter((card) =>
      theme.test(card),
    );
    if (pool.length < PACK_SIZE) continue;
    const cards = pickMany(pool, PACK_SIZE).map((card) => card.id);
    cards.forEach((id) => used.add(id));
    packs.push({ id: theme.id, cards });
  }
  run.packs = packs;
}

function makeEnemy(node) {
  const kind = kindOf(node);
  const heroes = packDraftHeroes.filter((item) => item.id !== run.heroId);
  const bossId = levels[run.level - 1].boss;
  const hero =
    kind === "boss"
      ? getHero(bossId)
      : heroes[Math.floor(Math.random() * heroes.length)];
  const pool = [...allCards, ...bossCards]
    .filter((card) => card.heroId === hero.id)
    .map((card) => card.id);
  const wanted = Math.max(
    BASE_DECK + 4 + node.row + (run.level - 1) * 2 + (kind === "elite" ? 2 : 0),
    run.deck.length + 2,
  );
  const size = Math.min(pool.length, kind === "boss" ? pool.length : wanted);
  run.enemy = {
    heroId: hero.id,
    cardIds: pickMany(pool, size),
    kind,
    mapId: gameMaps[Math.floor(Math.random() * gameMaps.length)].id,
  };
}

function makeShop() {
  const keys = ownedKeys();
  const pool = uniqueByKey(freshPool()).filter((card) => !keys.has(card.key));
  run.shop = {
    cards: pickMany(pool, 5).map((card) => ({
      id: card.id,
      price: cardPrice(card),
      sold: false,
    })),
    removed: 0,
    picking: false,
  };
}

function eventPool() {
  const keys = ownedKeys();
  return uniqueByKey(freshPool()).filter((card) => !keys.has(card.key));
}

export function useRogue() {
  const engine = useGame();
  const { game } = engine;

  const heroCards = (heroId) =>
    allCards.filter((card) => card.heroId === heroId);

  const reachable = () => {
    if (!run.map.length) return [];
    if (!run.pos) return run.map[0].map((node) => node.id);
    return nodeById(run.pos)?.next || [];
  };

  function endRun(victory) {
    run.victory = victory;
    run.best = Math.max(run.best, run.wins);
    run.phase = "over";
    if (run.heroId) {
      history.unshift({
        hero: run.heroId,
        wins: run.wins,
        victory,
        deck: run.deck.length,
        date: Date.now(),
      });
      history.splice(30);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        notifyChanged("rogueHistory");
      } catch {
        return;
      }
    }
  }

  function startRun() {
    const best = run.best;
    Object.assign(run, emptyRun(), { best });
    run.phase = "hero";
    run.heroOptions = pickMany(
      packDraftHeroes.map((hero) => hero.id),
      HERO_CHOICES,
    );
    save();
  }

  function pickHero(heroId) {
    if (run.phase !== "hero" || !run.heroOptions.includes(heroId)) return;
    run.heroId = heroId;
    run.phase = "deck";
    save();
  }

  function confirmDeck(cardIds) {
    if (run.phase !== "deck" || cardIds.length !== BASE_DECK) return;
    run.deck = [...cardIds];
    run.gold = START_GOLD;
    run.maxHp = maxHpOf(run.heroId);
    run.hp = run.maxHp;
    run.map = generateMap(mulberry32(Math.floor(Math.random() * 2 ** 31)));
    run.pos = null;
    run.visited = [];
    run.wins = 0;
    run.level = 1;
    run.seenEvents = [];
    run.phase = "map";
    save();
  }

  function startLevel() {
    if (run.phase !== "level") return;
    run.phase = "map";
    save();
  }

  function advanceLevel() {
    run.level += 1;
    run.hp = Math.min(run.maxHp, run.hp + Math.ceil(run.maxHp * 0.5));
    run.map = generateMap(mulberry32(Math.floor(Math.random() * 2 ** 31)));
    run.node = null;
    run.pos = null;
    run.visited = [];
    run.enemy = null;
    run.rewards = [];
    run.packs = [];
    run.packChosen = null;
    run.shop = null;
    run.event = null;
    run.rest = null;
    run.phase = "map";
    save();
  }

  function finishNode() {
    if (
      run.node &&
      run.level < levels.length &&
      nodeById(run.node) &&
      kindOf(nodeById(run.node)) === "boss"
    ) {
      advanceLevel();
      return;
    }
    if (run.node && !run.visited.includes(run.node)) {
      run.visited.push(run.node);
    }
    run.pos = run.node;
    run.enemy = null;
    run.rewards = [];
    run.packs = [];
    run.packChosen = null;
    run.shop = null;
    run.event = null;
    run.rest = null;
    run.phase = "map";
    save();
  }

  function enterNode(id) {
    if (run.phase !== "map" || !reachable().includes(id)) return;
    const node = nodeById(id);
    run.node = id;
    const kind = kindOf(node);
    if (kind === "fight" || kind === "elite" || kind === "boss") {
      makeEnemy(node);
      run.phase = "encounter";
    } else if (kind === "rest") {
      run.rest = { mode: "choose" };
      run.phase = "rest";
    } else if (kind === "shop") {
      makeShop();
      run.phase = "shop";
    } else {
      startEvent();
      run.phase = "event";
    }
    save();
  }

  function startBattle() {
    if (run.phase !== "encounter" || !run.enemy) return false;
    const node = nodeById(run.node);
    engine.startRogueBattle(
      {
        name: getHero(run.heroId).name,
        heroId: run.heroId,
        cardIds: run.deck,
      },
      {
        name: getHero(run.enemy.heroId).name,
        heroId: run.enemy.heroId,
        cardIds: run.enemy.cardIds,
      },
      {
        mapId: run.enemy.mapId,
        scale: 1,
        heroHp: run.hp,
        foeScale: foeScale(node),
        botLevel: botLevelFor(node),
        first: Math.random() < 0.5 ? "p1" : "p2",
      },
    );
    run.phase = "battle";
    run.battleSave = null;
    snapshotBattle();
    save();
    return true;
  }

  function snapshotBattle() {
    if (run.phase !== "battle") return;
    const saved = engine.exportBattle();
    if (!saved) return;
    run.battleSave = saved;
    save();
  }

  function resumeBattle() {
    if (run.phase !== "battle") return;
    if (run.battleSave && engine.importBattle(run.battleSave)) return;
    run.phase = run.enemy ? "encounter" : "map";
    save();
  }

  function syncBattle() {
    if (run.phase !== "battle") return;
    if (game.phase === "over" && game.winner) {
      run.battleSave = null;
      if (game.winner === "p1") {
        const mine = game.players.p1;
        const members = getHero(run.heroId)?.team
          ? [mine, ...mine.sidekicks.filter((kid) => !kid.down)]
          : [mine];
        run.hp = Math.max(
          1,
          Math.min(
            run.maxHp,
            members.reduce((sum, item) => sum + Math.max(0, item.hp), 0),
          ),
        );
        const kind = run.enemy?.kind || "fight";
        run.wins += 1;
        run.gold += kind === "boss" ? 80 : kind === "elite" ? 60 : 20;
        if (kind === "boss" && run.level >= levels.length) {
          endRun(true);
        } else if (kind === "fight") {
          makeRewards();
          run.phase = "reward";
        } else {
          makePacks();
          run.phase = "packs";
        }
      } else if (game.overActive) {
        run.hp = 1;
        run.enemy = null;
        run.phase = "map";
        if (!(kindOf(nodeById(run.node) || {}) === "boss")) finishNode();
      } else {
        endRun(false);
      }
      save();
      return;
    }
    if (game.phase === "setup" || !game.players.p1) {
      endRun(false);
      save();
    }
  }

  function pickReward(cardId) {
    if (run.phase !== "reward" || !run.rewards.includes(cardId)) return;
    run.deck.push(cardId);
    finishNode();
  }

  function pickPack(packId) {
    if (run.phase !== "packs" || run.packChosen) return [];
    const pack = run.packs.find((item) => item.id === packId);
    if (!pack) return [];
    run.deck.push(...pack.cards);
    run.packChosen = packId;
    save();
    return pack.cards;
  }

  function leavePacks() {
    if (run.phase === "packs") finishNode();
  }

  const healAmount = () => Math.ceil((run.maxHp || 0) * 0.35);

  function canRestHeal() {
    return run.phase === "rest" && run.hp < run.maxHp;
  }

  function canRestRemove() {
    return run.phase === "rest" && run.deck.length > MIN_DECK;
  }

  function restHeal() {
    if (!canRestHeal()) return;
    run.hp = Math.min(run.maxHp, run.hp + healAmount());
    finishNode();
  }

  function restRemove() {
    if (!canRestRemove()) return;
    run.rest = { mode: "remove" };
    save();
  }

  function restBack() {
    if (run.phase !== "rest") return;
    run.rest = { mode: "choose" };
    save();
  }

  function restPick(cardId) {
    if (run.phase !== "rest" || run.rest?.mode !== "remove") return;
    removeCard(cardId);
    finishNode();
  }

  function removeCard(cardId) {
    const index = run.deck.indexOf(cardId);
    if (index >= 0 && run.deck.length > MIN_DECK) run.deck.splice(index, 1);
  }

  function buy(index) {
    if (run.phase !== "shop") return;
    const item = run.shop.cards[index];
    if (!item || item.sold || run.gold < item.price) return;
    run.gold -= item.price;
    item.sold = true;
    run.deck.push(item.id);
    save();
  }

  function startShopRemove() {
    if (run.phase !== "shop") return;
    if (run.gold < removePrice(run.shop.removed)) return;
    if (run.deck.length <= MIN_DECK) return;
    run.shop.picking = true;
    save();
  }

  function shopRemove(cardId) {
    if (run.phase !== "shop" || !run.shop.picking) return;
    const price = removePrice(run.shop.removed);
    if (run.gold < price) return;
    run.gold -= price;
    removeCard(cardId);
    run.shop.removed += 1;
    run.shop.picking = false;
    save();
  }

  function cancelShopRemove() {
    if (run.shop) run.shop.picking = false;
  }

  const eventData = () => {
    if (!run.event) return null;
    return (
      [...events, ...heroEvents].find((item) => item.id === run.event.id) ||
      null
    );
  };

  function startEvent() {
    const all = [
      ...events,
      ...heroEvents.filter((item) => item.hero !== run.heroId),
    ];
    const seen = run.seenEvents || [];
    const fresh = all.filter((item) => !seen.includes(item.id));
    const list = fresh.length ? fresh : all;
    const total = list.reduce((sum, item) => sum + (item.weight || 1), 0);
    let roll = Math.random() * total;
    const pick = list.find((item) => (roll -= item.weight || 1) < 0) || list[0];
    run.seenEvents = [...seen, pick.id];
    run.event = {
      id: pick.id,
      hero: pick.hero || null,
      step: "choose",
      hp: 0,
      result: null,
      options: [],
      cards: [],
      gold: 0,
      removed: null,
    };
  }

  function eventCardFor(kind) {
    const keys = ownedKeys();
    const fresh = uniqueByKey(freshPool()).filter(
      (card) => !keys.has(card.key),
    );
    const own = fresh.filter((card) => card.heroId === run.heroId);
    const ally = fresh.filter((card) => card.heroId === run.event.hero);
    const pool = kind === "own" ? own : kind === "ally" ? ally : fresh;
    const [card] = pickMany(pool.length ? pool : fresh, 1);
    return card || null;
  }

  function applyOutcome(outcome) {
    const before = run.gold;
    run.gold = Math.max(0, run.gold + (outcome.gold || 0));
    run.event.gold += run.gold - before;
    if (outcome.health) {
      const hpBefore = run.hp;
      run.hp = Math.max(1, Math.min(run.maxHp, run.hp + outcome.health));
      run.event.hp = (run.event.hp || 0) + run.hp - hpBefore;
    }
    if (outcome.card) {
      const card = eventCardFor(outcome.card);
      if (card) {
        run.deck.push(card.id);
        run.event.cards.push(card.id);
      }
    }
    run.event.result = outcome.text || { en: "", ua: "" };
    run.event.step = "result";
  }

  function chooseEvent(index) {
    if (run.phase !== "event" || run.event.step !== "choose") return;
    const choice = eventData()?.choices[index];
    if (!choice || run.gold < (choice.cost || 0)) return;
    if (choice.remove && run.deck.length <= MIN_DECK) return;
    const before = run.gold;
    run.gold -= choice.cost || 0;
    run.event.gold -= before - run.gold;
    run.event.choice = index;
    if (choice.outcomes) {
      const total = choice.outcomes.reduce((sum, item) => sum + item.w, 0);
      let roll = Math.random() * total;
      const outcome =
        choice.outcomes.find((item) => (roll -= item.w) < 0) ||
        choice.outcomes[0];
      applyOutcome(outcome);
    } else if (choice.pick || choice.pickAlly) {
      const kind = choice.pickAlly ? "ally" : "any";
      const count = choice.pick || choice.pickAlly;
      const keys = ownedKeys();
      const fresh = uniqueByKey(freshPool()).filter(
        (card) => !keys.has(card.key),
      );
      const pool =
        kind === "ally"
          ? fresh.filter((card) => card.heroId === run.event.hero)
          : fresh;
      run.event.options = pickMany(pool.length ? pool : fresh, count).map(
        (card) => card.id,
      );
      run.event.step = "pickCard";
    } else if (choice.remove) {
      run.event.step = "pickRemove";
    }
    save();
  }

  function eventPick(cardId) {
    if (run.phase !== "event") return;
    const step = run.event.step;
    const choice = eventData()?.choices[run.event.choice];
    if (step === "pickCard" && run.event.options.includes(cardId)) {
      run.deck.push(cardId);
      run.event.cards = [cardId];
      run.event.result = {
        en: "You take the card.",
        ua: "Ти береш карту.",
      };
    } else if (step === "pickRemove") {
      removeCard(cardId);
      run.event.removed = cardId;
      const before = run.gold;
      run.gold += choice?.gold || 0;
      run.event.gold += run.gold - before;
      run.event.result = choice?.text || { en: "Done.", ua: "Готово." };
    } else {
      return;
    }
    run.event.step = "result";
    save();
  }

  function skipEventPick() {
    if (run.phase !== "event") return;
    run.event.result = { en: "You walk away.", ua: "Ти йдеш геть." };
    run.event.step = "result";
    save();
  }

  function leave() {
    if (["shop", "event", "rest"].includes(run.phase)) finishNode();
  }

  function abandon() {
    endRun(false);
    save();
  }

  function reset() {
    const best = run.best;
    Object.assign(run, emptyRun(), { best });
    save();
  }

  return {
    run,
    history,
    eventData,
    heroCards,
    getCard,
    reachable,
    nodeById,
    kindOf,
    hpScale,
    foeScale,
    botLevelFor,
    constants: { BASE_DECK, MIN_DECK },
    removePrice,
    startRun,
    pickHero,
    confirmDeck,
    enterNode,
    startBattle,
    syncBattle,
    resumeBattle,
    snapshotBattle,
    startLevel,
    pickReward,
    pickPack,
    leavePacks,
    restPick,
    restHeal,
    restRemove,
    restBack,
    canRestHeal,
    canRestRemove,
    healAmount,
    buy,
    startShopRemove,
    shopRemove,
    cancelShopRemove,
    chooseEvent,
    eventPick,
    skipEventPick,
    leave,
    abandon,
    reset,
  };
}
