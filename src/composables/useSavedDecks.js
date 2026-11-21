import { ref } from "vue";
import { getCard, getHero } from "../gameDecks.js";
import { notifyChanged, registerSyncable } from "../cloud/sync.js";

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

registerSyncable({
  name: "decks",
  docKey: "decks",
  storageKey: STORAGE_KEY,
  toRemote: (raw) => (raw ? JSON.parse(raw) : null),
  fromRemote: (value) => JSON.stringify(Array.isArray(value) ? value : []),
  apply: () => {
    savedDecks.value = load();
  },
  merge: (local, remote) => {
    const byId = new Map();
    for (const item of Array.isArray(local) ? local : [])
      byId.set(item.id, item);
    for (const item of Array.isArray(remote) ? remote : [])
      byId.set(item.id, item);
    return [...byId.values()];
  },
});

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDecks.value));
    notifyChanged("decks");
  } catch {
    return;
  }
}

export function useSavedDecks() {
  function saveDeck({ name, heroId, cardIds, draftId, player }) {
    if (draftId && player) {
      const existing = savedDecks.value.find(
        (deck) => deck.draftId === draftId && deck.player === player,
      );
      if (existing) return existing.id;
    }
    const deck = {
      id: `deck_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim() || getHero(heroId).name,
      heroId,
      cardIds: [...cardIds],
      ...(draftId && player ? { draftId, player } : {}),
    };
    savedDecks.value = [...savedDecks.value, deck];
    persist();
    return deck.id;
  }

  function deleteDeck(id) {
    savedDecks.value = savedDecks.value.filter((deck) => deck.id !== id);
    persist();
  }

  function renameDeck(id, name) {
    const clean = String(name || "").trim();
    if (!clean) return;
    savedDecks.value = savedDecks.value.map((deck) =>
      deck.id === id ? { ...deck, name: clean } : deck,
    );
    persist();
  }

  return { savedDecks, saveDeck, deleteDeck, renameDeck };
}
