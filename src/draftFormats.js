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

// Усі доступні схеми банів/піків в одному місці.
// Щоб додати нову схему — опиши послідовність вище і додай її сюди:
// вона автоматично зʼявиться у редакторі власних форматів.
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

export function buildCustomFormat(raw) {
  const presetKey = banPresets[raw.banPreset]
    ? raw.banPreset
    : DEFAULT_BAN_PRESET;

  return {
    id: raw.id,
    name: raw.name,
    isCustom: true,
    banPreset: presetKey,
    mode: getPresetMode(presetKey),
    allowedHeroIds: Array.isArray(raw.allowedHeroIds) ? raw.allowedHeroIds : [],
    // Формати, збережені до появи вибору мап, не мають allowedMapIds => всі мапи
    allowedMapIds:
      Array.isArray(raw.allowedMapIds) && raw.allowedMapIds.length
        ? raw.allowedMapIds
        : ["all"],
    sequence: banPresets[presetKey].sequence,
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
