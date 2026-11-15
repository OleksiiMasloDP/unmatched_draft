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

export const useContexts = [
  "attack",
  "defense",
  "scheme",
  "boostAttack",
  "boostDefense",
  "boostManeuver",
];

export const kidDefaults = { importance: 5, block: 0 };

const empty = () => ({
  version: 1,
  types: {},
  cards: {},
  sidekicks: {},
  heroes: {},
  lessons: [],
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

const lessonKey = (lesson) =>
  lesson.kind === "use"
    ? [lesson.hero, lesson.title, lesson.card].join("|")
    : [lesson.hero, lesson.title, lesson.better, lesson.worse].sort().join("|");

const uniqueLessons = (list) => {
  const seen = new Map();
  for (const lesson of list) seen.set(lessonKey(lesson), lesson);
  return [...seen.values()];
};

const merge = (first, second) => ({
  version: 1,
  types: { ...first.types, ...second.types },
  cards: { ...first.cards, ...normalizeCards(second.cards) },
  sidekicks: { ...first.sidekicks, ...second.sidekicks },
  heroes: { ...first.heroes, ...second.heroes },
  lessons: uniqueLessons([...(first.lessons || []), ...(second.lessons || [])]),
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
    uses: Array.isArray(own.uses) ? own.uses : null,
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

function editStored(change) {
  let raw = {};
  try {
    raw = JSON.parse(localStorage.getItem(BOT_DATA_KEY) || "{}") || {};
  } catch {
    raw = {};
  }
  raw.version = 1;
  raw.lessons = uniqueLessons(change(raw.lessons || []));
  try {
    localStorage.setItem(BOT_DATA_KEY, JSON.stringify(raw, null, 2));
    return true;
  } catch {
    return false;
  }
}

export const addLessons = (items) => editStored((list) => [...list, ...items]);

export const removeLesson = (lesson) =>
  editStored((list) =>
    list.filter((item) => lessonKey(item) !== lessonKey(lesson)),
  );
