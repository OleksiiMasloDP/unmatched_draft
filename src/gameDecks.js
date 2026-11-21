import { buildAllCards, buildCustomCards, everyHero } from "./packDraftData.js";
import { customHeroes } from "./customHeroes.js";

const allCards = [...buildAllCards(), ...buildCustomCards()];
const cardById = new Map(allCards.map((card) => [card.id, card]));

export const getCard = (id) => cardById.get(id);

export const getHero = (id) => everyHero.find((hero) => hero.id === id);

function buildTestDecks() {
  return [
    {
      id: "tesst-deck-1",
      name: "Strange Deck",
      heroId: "doctor-strange",
      cardIds: allCards
        .filter((card) => card.heroId === "doctor-strange")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-2",
      name: "Blackbeard Deck",
      heroId: "blackbeard",
      cardIds: allCards
        .filter((card) => card.heroId === "blackbeard")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-3",
      name: "Black Panther Deck",
      heroId: "black-panther",
      cardIds: allCards
        .filter((card) => card.heroId === "black-panther")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-4",
      name: "Houdini Deck",
      heroId: "harry-houdini",
      cardIds: allCards
        .filter((card) => card.heroId === "harry-houdini")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-5",
      name: "Wyatt Earp Deck",
      heroId: "wyatt-earp",
      cardIds: allCards
        .filter((card) => card.heroId === "wyatt-earp")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-6",
      name: "Robin Hood Deck",
      heroId: "robin-hood",
      cardIds: allCards
        .filter((card) => card.heroId === "robin-hood")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-7",
      name: "Dr. Jill Trent Deck",
      heroId: "dr-jill-trent",
      cardIds: allCards
        .filter((card) => card.heroId === "dr-jill-trent")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-8",
      name: "Raptors Deck",
      heroId: "raptors",
      cardIds: allCards
        .filter((card) => card.heroId === "raptors")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-9",
      name: "Ms. Marvel Deck",
      heroId: "ms-marvel",
      cardIds: allCards
        .filter((card) => card.heroId === "ms-marvel")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-10",
      name: "Spider-Man Deck",
      heroId: "spider-man",
      cardIds: allCards
        .filter((card) => card.heroId === "spider-man")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-11",
      name: "Tomoe Gozen Deck",
      heroId: "tomoe-gozen",
      cardIds: allCards
        .filter((card) => card.heroId === "tomoe-gozen")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-12",
      name: "Winter Soldier Deck",
      heroId: "winter-soldier",
      cardIds: allCards
        .filter((card) => card.heroId === "winter-soldier")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-13",
      name: "Invisible Man Deck",
      heroId: "invisible-man",
      cardIds: allCards
        .filter((card) => card.heroId === "invisible-man")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-14",
      name: "Hamlet Deck",
      heroId: "hamlet",
      cardIds: allCards
        .filter((card) => card.heroId === "hamlet")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-15",
      name: "Oda Nobunaga Deck",
      heroId: "oda-nobunaga",
      cardIds: allCards
        .filter((card) => card.heroId === "oda-nobunaga")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-16",
      name: "Dracula Deck",
      heroId: "dracula",
      cardIds: allCards
        .filter((card) => card.heroId === "dracula")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-17",
      name: "Chupacabra Deck",
      heroId: "chupacabra",
      cardIds: allCards
        .filter((card) => card.heroId === "chupacabra")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-18",
      name: "Luke Cage Deck",
      heroId: "luke-cage",
      cardIds: allCards
        .filter((card) => card.heroId === "luke-cage")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-19",
      name: "She-Hulk Deck",
      heroId: "she-hulk",
      cardIds: allCards
        .filter((card) => card.heroId === "she-hulk")
        .map((card) => card.id),
      isTest: true,
    },
    {
      id: "test-deck-20",
      name: "Annie Christmas Deck",
      heroId: "annie-christmas",
      cardIds: allCards
        .filter((card) => card.heroId === "annie-christmas")
        .map((card) => card.id),
      isTest: true,
    },
  ];
}

export const testDecks = buildTestDecks();

export const customDecks = customHeroes.map((hero) => ({
  id: `custom-${hero.id}`,
  name: hero.name,
  heroId: hero.id,
  cardIds: allCards
    .filter((card) => card.heroId === hero.id)
    .map((card) => card.id),
  isCustom: true,
}));
