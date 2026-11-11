import base from "./botData.json";

export const BOT_DATA_KEY = "unmatched-bot-data";

export const typeDefaults = {
  attack: 5,
  defense: 5,
  versatile: 6,
  scheme: 5,
};

export const kidDefaults = { importance: 5, block: 0 };

const empty = () => ({
  version: 1,
  types: {},
  cards: {},
  sidekicks: {},
  heroes: {},
});

const merge = (first, second) => ({
  version: 1,
  types: { ...first.types, ...second.types },
  cards: { ...first.cards, ...second.cards },
  sidekicks: { ...first.sidekicks, ...second.sidekicks },
  heroes: { ...first.heroes, ...second.heroes },
});

export function readStored() {
  try {
    const raw = localStorage.getItem(BOT_DATA_KEY);
    return raw ? merge(empty(), JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function loadBotData() {
  return merge(merge(empty(), base), readStored() || empty());
}

export const cardId = (card) => `${card.heroId}:${card.key}`;

export function cardInfo(card, data = loadBotData()) {
  const own = data.cards[cardId(card)] || {};
  const fallback = data.types[card.type] ?? typeDefaults[card.type] ?? 5;
  return {
    importance: own.importance ?? fallback,
    hold: Boolean(own.hold),
    fodder: Boolean(own.fodder),
  };
}

export function kidInfo(heroId, data = loadBotData()) {
  return { ...kidDefaults, ...(data.sidekicks[heroId] || {}) };
}

export function heroInfo(heroId, data = loadBotData()) {
  return data.heroes[heroId] || {};
}
