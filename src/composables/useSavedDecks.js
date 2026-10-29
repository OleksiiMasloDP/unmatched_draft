import { ref } from "vue";
import { getCard, getHero } from "../gameDecks.js";

const STORAGE_KEY = "unmatched_saved_decks_v1";

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved)) return [];
    return saved
      .map((deck) => ({
        ...deck,
        cardIds: (deck.cardIds || []).filter((id) => getCard(id)),
      }))
      .filter((deck) => deck.id && getHero(deck.heroId) && deck.cardIds.length);
  } catch {
    return [];
  }
}

const savedDecks = ref(load());

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDecks.value));
  } catch {
    return;
  }
}

export function useSavedDecks() {
  function saveDeck({ name, heroId, cardIds }) {
    const deck = {
      id: `deck_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || getHero(heroId).name,
      heroId,
      cardIds: [...cardIds],
    };
    savedDecks.value = [...savedDecks.value, deck];
    persist();
    return deck.id;
  }

  function deleteDeck(id) {
    savedDecks.value = savedDecks.value.filter((deck) => deck.id !== id);
    persist();
  }

  return { savedDecks, saveDeck, deleteDeck };
}
