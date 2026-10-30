import { buildAllCards, packDraftHeroes } from "./packDraftData.js";

const allCards = buildAllCards();
const cardById = new Map(allCards.map((card) => [card.id, card]));

export const getCard = (id) => cardById.get(id);

export const getHero = (id) => packDraftHeroes.find((hero) => hero.id === id);

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(list, seed) {
  const result = [...list];
  const random = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function dealPair(heroA, heroB, seed) {
  const pool = allCards
    .filter((card) => [heroA, heroB].includes(card.heroId))
    .map((card) => card.id)
    .sort();
  const mixed = seededShuffle(pool, seed);
  const half = Math.floor(mixed.length / 2);
  return [mixed.slice(0, half), mixed.slice(half, half * 2)];
}

function buildTestDecks() {
  const [marvelCards, soldierCards] = dealPair(
    "ms-marvel",
    "winter-soldier",
    20261030,
  );
  const [tomoeCards, spiderCards] = dealPair(
    "tomoe-gozen",
    "spider-man",
    20261031,
  );

  return [
    {
      id: "test-deck-1",
      name: "Test deck 1",
      heroId: "ms-marvel",
      cardIds: marvelCards,
      isTest: true,
    },
    {
      id: "test-deck-2",
      name: "Test deck 2",
      heroId: "winter-soldier",
      cardIds: soldierCards,
      isTest: true,
    },
    {
      id: "test-deck-3",
      name: "Test deck 3",
      heroId: "tomoe-gozen",
      cardIds: tomoeCards,
      isTest: true,
    },
    {
      id: "test-deck-4",
      name: "Test deck 4",
      heroId: "spider-man",
      cardIds: spiderCards,
      isTest: true,
    },
  ];
}

export const testDecks = buildTestDecks();
