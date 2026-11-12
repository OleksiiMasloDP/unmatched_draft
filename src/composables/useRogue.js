import { reactive } from "vue";
import { getCard, getHero } from "../gameDecks.js";
import { gameMaps } from "../gameMaps.js";
import { buildAllCards, packDraftHeroes } from "../packDraftData.js";
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
  removePrice,
  themes,
} from "../rogueData.js";
import { useGame } from "./useGame.js";

const STORAGE_KEY = "unmatched-rogue-run-v2";

const allCards = buildAllCards();

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
  victory: false,
  best: 0,
});

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.phase) return { ...emptyRun(), ...saved };
  } catch {
    return emptyRun();
  }
  return emptyRun();
}

const run = reactive(load());

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
  } catch {
    return;
  }
}

const baseId = (id) => (id.endsWith("+") ? id.slice(0, -1) : id);

const nodeById = (id) => run.map.flat().find((node) => node.id === id) || null;

const kindOf = (node) => (node.type === "mystery" ? node.secret : node.type);

const hpScale = (node) => Math.min(1, 0.5 + 0.05 * node.row);

const foeScale = (node) => {
  const kind = kindOf(node);
  if (kind === "boss") return 1.3;
  if (kind === "elite") return hpScale(node) * 1.1;
  return hpScale(node) * 1.05;
};

const botLevelFor = (node) => {
  const kind = kindOf(node);
  if (kind === "boss") return "hard";
  const order = ["easy", "normal", "hard"];
  const base = node.row <= 2 ? 0 : node.row <= 6 ? 1 : 2;
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
  const heroes = packDraftHeroes.filter((hero) => hero.id !== run.heroId);
  const hero = heroes[Math.floor(Math.random() * heroes.length)];
  const kind = kindOf(node);
  const pool = allCards
    .filter((card) => card.heroId === hero.id)
    .map((card) => card.id);
  const size = Math.min(
    pool.length,
    kind === "boss" ? pool.length : 10 + node.row + (kind === "elite" ? 2 : 0),
  );
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
    run.map = generateMap(mulberry32(Math.floor(Math.random() * 2 ** 31)));
    run.pos = null;
    run.visited = [];
    run.wins = 0;
    run.phase = "map";
    save();
  }

  function finishNode() {
    if (run.node && !run.visited.includes(run.node)) {
      run.visited.push(run.node);
    }
    run.pos = run.node;
    const node = nodeById(run.node);
    run.enemy = null;
    run.rewards = [];
    run.packs = [];
    run.packChosen = null;
    run.shop = null;
    run.event = null;
    run.rest = null;
    if (node && node.type === "boss") {
      run.victory = true;
      run.best = Math.max(run.best, run.wins);
      run.phase = "over";
    } else {
      run.phase = "map";
    }
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
      run.rest = { mode: "remove" };
      run.phase = "rest";
    } else if (kind === "shop") {
      makeShop();
      run.phase = "shop";
    } else {
      const pick = events[Math.floor(Math.random() * events.length)];
      run.event = { id: pick.id, step: "choose", result: null, options: [] };
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
        scale: hpScale(node),
        foeScale: foeScale(node),
        botLevel: botLevelFor(node),
        first: Math.random() < 0.5 ? "p1" : "p2",
      },
    );
    run.phase = "battle";
    save();
    return true;
  }

  function syncBattle() {
    if (run.phase !== "battle") return;
    if (game.phase === "over" && game.winner) {
      if (game.winner === "p1") {
        const kind = run.enemy?.kind || "fight";
        run.wins += 1;
        run.gold += kind === "boss" ? 80 : kind === "elite" ? 45 : 20;
        if (kind === "boss") {
          run.best = Math.max(run.best, run.wins);
          run.victory = true;
          run.phase = "over";
        } else if (kind === "fight") {
          makeRewards();
          run.phase = "reward";
        } else {
          makePacks();
          run.phase = "packs";
        }
      } else {
        run.best = Math.max(run.best, run.wins);
        run.phase = "over";
      }
      save();
      return;
    }
    if (game.phase === "setup" || !game.players.p1) {
      run.phase = "encounter";
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

  function restPick(cardId) {
    if (run.phase !== "rest") return;
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

  function chooseEvent(index) {
    if (run.phase !== "event" || run.event.step !== "choose") return;
    const data = events.find((item) => item.id === run.event.id);
    const choice = data.choices[index];
    if (!choice || run.gold < (choice.cost || 0)) return;
    if (choice.effect.remove && run.deck.length <= MIN_DECK) return;
    run.gold -= choice.cost || 0;
    const effect = choice.effect;
    if (effect.gold) run.gold += effect.gold;
    if (effect.gamble) {
      const won = Math.random() < 0.5;
      if (won) run.gold += effect.gamble;
      run.event.result = won
        ? { en: "You win.", ua: "Ти виграв." }
        : { en: "You lose the bet.", ua: "Ставка програна." };
      run.event.step = "result";
    } else if (effect.card) {
      const [card] = pickMany(eventPool(), 1);
      if (card) run.deck.push(card.id);
      run.event.cards = card ? [card.id] : [];
      run.event.result = choice.result;
      run.event.step = "result";
    } else if (effect.pick) {
      run.event.options = pickMany(eventPool(), effect.pick).map(
        (card) => card.id,
      );
      run.event.step = "pickCard";
    } else if (effect.remove && run.deck.length > MIN_DECK) {
      run.event.step = "pickRemove";
    } else {
      run.event.result = choice.result || {
        en: "Nothing happens.",
        ua: "Нічого не відбувається.",
      };
      run.event.step = "result";
    }
    save();
  }

  function eventPick(cardId) {
    if (run.phase !== "event") return;
    const step = run.event.step;
    if (step === "pickCard" && run.event.options.includes(cardId)) {
      run.deck.push(cardId);
      run.event.cards = [cardId];
    } else if (step === "pickRemove") {
      removeCard(cardId);
    } else {
      return;
    }
    run.event.result = { en: "Done.", ua: "Готово." };
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
    run.best = Math.max(run.best, run.wins);
    run.phase = "over";
    save();
  }

  function reset() {
    const best = run.best;
    Object.assign(run, emptyRun(), { best });
    save();
  }

  return {
    run,
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
    pickReward,
    pickPack,
    leavePacks,
    restPick,
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
