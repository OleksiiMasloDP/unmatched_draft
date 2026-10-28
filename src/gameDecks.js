import { buildAllCards, packDraftHeroes } from "./packDraftData.js";

const allCards = buildAllCards();
const cardById = new Map(allCards.map((card) => [card.id, card]));

export const getCard = (id) => cardById.get(id);

export const getHero = (id) => packDraftHeroes.find((hero) => hero.id === id);

function buildTestDecks() {
  const mixed = allCards
    .filter((card) => ["ms-marvel", "winter-soldier"].includes(card.heroId))
    .sort((a, b) => a.id.localeCompare(b.id));

  return [
    {
      id: "test-deck-1",
      name: "Test deck 1",
      heroId: "ms-marvel",
      cardIds: mixed.filter((_, index) => index % 2 === 0).map((c) => c.id),
      isTest: true,
    },
    {
      id: "test-deck-2",
      name: "Test deck 2",
      heroId: "winter-soldier",
      cardIds: mixed.filter((_, index) => index % 2 === 1).map((c) => c.id),
      isTest: true,
    },
  ];
}

export const testDecks = buildTestDecks();
