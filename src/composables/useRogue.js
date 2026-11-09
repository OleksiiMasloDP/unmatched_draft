import { reactive } from "vue";
import { getCard, getHero } from "../gameDecks.js";
import { gameMaps } from "../gameMaps.js";
import { buildAllCards, packDraftHeroes } from "../packDraftData.js";
import { useGame } from "./useGame.js";

const STORAGE_KEY = "unmatched-rogue-run";
const BASE_DECK = 15;
const FULL_DECK = 30;
const HERO_CHOICES = 3;
const REWARD_CHOICES = 3;

const allCards = buildAllCards();

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
  level: 1,
  wins: 0,
  enemy: null,
  rewards: [],
  mapId: null,
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

const scaleFor = () => Math.min(1, run.deck.length / FULL_DECK);

const botLevelFor = () => {
  if (run.level <= 2) return "easy";
  if (run.level <= 5) return "normal";
  return "hard";
};

function makeEnemy() {
  const heroes = packDraftHeroes.filter((hero) => hero.id !== run.heroId);
  const hero = heroes[Math.floor(Math.random() * heroes.length)];
  const pool = allCards
    .filter((card) => card.heroId === hero.id)
    .map((card) => card.id);
  const size = Math.min(run.deck.length, FULL_DECK);
  run.enemy = { heroId: hero.id, cardIds: pickMany(pool, size) };
  run.mapId = gameMaps[Math.floor(Math.random() * gameMaps.length)].id;
}

function makeRewards() {
  const owned = new Set(run.deck);
  const seen = new Set();
  const pool = allCards.filter((card) => {
    if (owned.has(card.id) || seen.has(card.key)) return false;
    seen.add(card.key);
    return true;
  });
  run.rewards = pickMany(pool, REWARD_CHOICES).map((card) => card.id);
}

export function useRogue() {
  const engine = useGame();
  const { game } = engine;

  const heroCards = (heroId) =>
    allCards.filter((card) => card.heroId === heroId);

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
    run.level = 1;
    run.wins = 0;
    makeEnemy();
    run.phase = "map";
    save();
  }

  function startBattle() {
    if (run.phase !== "map" || !run.enemy) return false;
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
        mapId: run.mapId,
        scale: scaleFor(),
        botLevel: botLevelFor(),
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
        run.wins += 1;
        makeRewards();
        run.phase = "reward";
      } else {
        run.best = Math.max(run.best, run.wins);
        run.phase = "over";
      }
      save();
      return;
    }
    if (game.phase === "setup" || !game.players.p1) {
      run.phase = "map";
      save();
    }
  }

  function pickReward(cardId) {
    if (run.phase !== "reward" || !run.rewards.includes(cardId)) return;
    run.deck.push(cardId);
    run.rewards = [];
    run.level += 1;
    makeEnemy();
    run.phase = "map";
    save();
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
    scale: scaleFor,
    botLevel: botLevelFor,
    constants: { BASE_DECK, FULL_DECK },
    startRun,
    pickHero,
    confirmDeck,
    startBattle,
    syncBattle,
    pickReward,
    abandon,
    reset,
  };
}
