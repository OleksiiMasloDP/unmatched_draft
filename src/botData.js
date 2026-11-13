import base from "./botData.json";

export const BOT_DATA_KEY = "unmatched-bot-data";

export const typeDefaults = {
  attack: 5,
  defense: 5,
  versatile: 6,
  scheme: 5,
};

export const heroSettingKeys = [
  "style",
  "aggro",
  "heroFocus",
  "kidFear",
  "boostHand",
  "refill",
  "fatigue",
];

export const kidDefaults = { importance: 5, block: 0 };

const empty = () => ({
  version: 1,
  types: {},
  cards: {},
  sidekicks: {},
  heroes: {},
});

export const cardDefaults = {
  lean: 5,
  timing: 5,
  cancelCare: 0,
  who: 5,
  boostWill: 5,
};

const normalizeCards = (cards = {}) => {
  const out = {};
  for (const [id, entry] of Object.entries(cards)) {
    const next = { ...entry };
    if (next.hold && next.timing === undefined) next.timing = 0;
    if (next.fodder && next.boostWill === undefined) next.boostWill = 9;
    delete next.hold;
    delete next.fodder;
    out[id] = next;
  }
  return out;
};

const merge = (first, second) => ({
  version: 1,
  types: { ...first.types, ...second.types },
  cards: { ...first.cards, ...normalizeCards(second.cards) },
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
    lean: own.lean ?? cardDefaults.lean,
    timing: own.timing ?? cardDefaults.timing,
    cancelCare: own.cancelCare ?? cardDefaults.cancelCare,
    who: own.who ?? cardDefaults.who,
    boostWill: own.boostWill ?? cardDefaults.boostWill,
    hold: (own.timing ?? cardDefaults.timing) <= 1,
    fodder: (own.boostWill ?? cardDefaults.boostWill) >= 8,
  };
}

export function kidInfo(heroId, data = loadBotData()) {
  return { ...kidDefaults, ...(data.sidekicks[heroId] || {}) };
}

export function heroInfo(heroId, data = loadBotData()) {
  return data.heroes[heroId] || {};
}
