const threeBans_fivePicks = [
  { type: "ban", p1: true },
  { type: "ban", p1: false },
  { type: "ban", p1: true },
  { type: "ban", p1: false },
  { type: "ban", p1: true },
  { type: "ban", p1: false },

  { type: "pick", p1: true },
  { type: "pick", p1: false },
  { type: "pick", p1: false },
  { type: "pick", p1: true },
  { type: "pick", p1: true },
  { type: "pick", p1: false },
  { type: "pick", p1: false },
  { type: "pick", p1: true },
  { type: "pick", p1: true },
  { type: "pick", p1: false },
];

const twoBans_fourPicks = [
  { type: "ban", p1: true },
  { type: "ban", p1: false },
  { type: "ban", p1: true },
  { type: "ban", p1: false },

  { type: "pick", p1: true },
  { type: "pick", p1: false },
  { type: "pick", p1: false },
  { type: "pick", p1: true },
  { type: "pick", p1: true },
  { type: "pick", p1: false },
  { type: "pick", p1: false },
  { type: "pick", p1: true },
];

export const banPresets = {
  three_bans_five_picks: {
    name: "3 bans / 5 picks",
    sequence: threeBans_fivePicks,
  },
  two_bans_four_picks: {
    name: "2 bans / 4 picks",
    sequence: twoBans_fourPicks,
  },
  ladder: {
    name: "Ladder",
    mode: "simultaneous",
    minHeroes: 2,
    sequence: [],
  },
};

export const MAX_BANS = 5;
export const MAX_PICKS = 6;
export const DEFAULT_BANS = 3;
export const DEFAULT_PICKS = 5;

export const PICK_ORDER_SNAKE = "snake";
export const PICK_ORDER_ALTERNATE = "alternate";
export const DEFAULT_PICK_ORDER = PICK_ORDER_SNAKE;

export function buildSequence(bans, picks, pickOrder = DEFAULT_PICK_ORDER) {
  const sequence = [];
  for (let i = 0; i < bans * 2; i++) {
    sequence.push({ type: "ban", p1: i % 2 === 0 });
  }
  for (let i = 0; i < picks * 2; i++) {
    const p1 =
      pickOrder === PICK_ORDER_ALTERNATE
        ? i % 2 === 0
        : i === 0 || Math.floor((i - 1) / 2) % 2 === 1;
    sequence.push({ type: "pick", p1 });
  }
  return sequence;
}

const LEGACY_COUNTS = {
  three_bans_five_picks: { bans: 3, picks: 5 },
  two_bans_four_picks: { bans: 2, picks: 4 },
};

const clampInt = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export const MODE_TURNS = "turns";
export const MODE_SIMULTANEOUS = "simultaneous";

export function getPresetMode(presetKey) {
  return banPresets[presetKey]?.mode || MODE_TURNS;
}

export const DEFAULT_BAN_PRESET = "ladder";

// Мінімальна кількість героїв, потрібна щоб схема взагалі могла завершитись
// (кожен бан і кожен пік — це окремий герой).
export function getRequiredHeroCount(presetKey) {
  const preset = banPresets[presetKey] || banPresets[DEFAULT_BAN_PRESET];
  return preset.minHeroes ?? preset.sequence.length;
}

// Власні формати користувача (зберігаються в localStorage окремо від драфту,
// тому "Рестарт" їх не чіпає). У сховищі лежить лише компактний опис,
// повний формат (з sequence) збирається тут.
export const CUSTOM_FORMATS_STORAGE_KEY = "unmatched_draft_custom_formats_v1";
export const CUSTOM_FORMAT_PREFIX = "custom_";

export const LADDER_KEY = "ladder";
export const CUSTOM_SCHEME_KEY = "custom";

// Потрібна кількість героїв для довільної схеми: кожен бан і кожен пік -
// окремий герой, у Ladder достатньо двох.
export function getRequiredHeroCountFor({ mode, bans, picks }) {
  if (mode === MODE_SIMULTANEOUS) return banPresets[LADDER_KEY].minHeroes;
  return (bans + picks) * 2;
}

export function buildCustomFormat(raw) {
  const key = raw.banPreset;
  const legacy = LEGACY_COUNTS[key];
  // Власна схема (бани/піки), стара схема за ключем або явні кількості;
  // усе інше (включно з невідомим ключем) - Ladder, як і раніше.
  const isTurns =
    key === CUSTOM_SCHEME_KEY ||
    Boolean(legacy) ||
    (raw.bans != null && key !== LADDER_KEY);
  const isLadder = !isTurns;

  const base = {
    id: raw.id,
    name: raw.name,
    isCustom: true,
    allowedHeroIds: Array.isArray(raw.allowedHeroIds) ? raw.allowedHeroIds : [],
    // Формати, збережені до появи вибору мап, не мають allowedMapIds => всі мапи
    allowedMapIds:
      Array.isArray(raw.allowedMapIds) && raw.allowedMapIds.length
        ? raw.allowedMapIds
        : ["all"],
  };

  if (isLadder) {
    return {
      ...base,
      banPreset: LADDER_KEY,
      mode: MODE_SIMULTANEOUS,
      sequence: banPresets[LADDER_KEY].sequence,
    };
  }

  const bans = clampInt(raw.bans ?? legacy?.bans, 0, MAX_BANS, DEFAULT_BANS);
  const picks = clampInt(
    raw.picks ?? legacy?.picks,
    1,
    MAX_PICKS,
    DEFAULT_PICKS,
  );
  const pickOrder =
    raw.pickOrder === PICK_ORDER_ALTERNATE
      ? PICK_ORDER_ALTERNATE
      : DEFAULT_PICK_ORDER;
  return {
    ...base,
    banPreset: CUSTOM_SCHEME_KEY,
    mode: MODE_TURNS,
    bans,
    picks,
    pickOrder,
    sequence: buildSequence(bans, picks, pickOrder),
  };
}

export function loadCustomFormats() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(CUSTOM_FORMATS_STORAGE_KEY) || "[]",
    );
    if (!Array.isArray(saved)) return [];
    return saved.filter((f) => f && f.id && f.name).map(buildCustomFormat);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function persistCustomFormats(list) {
  const compact = list.map((f) => ({
    id: f.id,
    name: f.name,
    banPreset: f.banPreset,
    bans: f.bans,
    picks: f.picks,
    pickOrder: f.pickOrder,
    allowedHeroIds: f.allowedHeroIds,
    allowedMapIds: f.allowedMapIds,
  }));
  localStorage.setItem(CUSTOM_FORMATS_STORAGE_KEY, JSON.stringify(compact));
}

export const formats = {
  all_heroes: {
    name: "All Heroes",
    allowedHeroIds: ["all"],
    allowedMapIds: ["all"],
    sequence: threeBans_fivePicks,
  },
  summer_of_legends_2026: {
    name: "Summer of Legends 2026",
    allowedHeroIds: [
      3, 5, 7, 8, 9, 13, 18, 22, 23, 25, 27, 30, 31, 34, 35, 39, 41, 42, 43, 44,
      49, 52, 53, 54, 55, 59, 60, 61, 62, 64, 67, 68, 69, 70, 71, 72,
    ],
    allowedMapIds: [3, 4, 7, 8, 9, 10, 11, 12, 14, 15, 18, 25, 26, 30, 35],
    sequence: threeBans_fivePicks,
  },
  fall_of_heroes_26: {
    name: "Fall of Heroes 2026",
    allowedHeroIds: [
      1, 3, 5, 7, 8, 14, 18, 21, 23, 27, 28, 30, 33, 38, 41, 42, 46, 47, 49, 53,
      54, 55, 58, 59, 62, 64, 65, 68, 69, 71,
    ],
    allowedMapIds: [3, 7, 13, 15, 16, 18, 19, 20, 21, 25, 26, 30, 32, 34, 35],
    sequence: twoBans_fourPicks,
  },
};
