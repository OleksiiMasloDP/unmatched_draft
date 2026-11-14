export const ROWS = 11;
export const BASE_DECK = 10;
export const MIN_DECK = 8;
export const HERO_CHOICES = 3;
export const REWARD_CHOICES = 3;
export const PACK_COUNT = 3;
export const PACK_SIZE = 3;
export const START_GOLD = 40;

export const nodeTypes = {
  fight: { icon: "crossedSwords", metal: "bronze", color: "#d9843f" },
  elite: { icon: "hornedSkull", metal: "ruby", color: "#ff5252" },
  mystery: { icon: "uncertainty", metal: "silver", color: "#b9a7ff" },
  rest: { icon: "campfire", metal: "bronze", color: "#ff9f43" },
  shop: { icon: "coins", metal: "gold", color: "#f6c945" },
  boss: { icon: "crownedSkull", metal: "gold", color: "#ff4d6d" },
};

export const themes = [
  {
    id: "damage",
    test: (card) =>
      /deal[s]? \d+ damage|lose[s]? \d+ health/i.test(card.text.en),
    icon: "swordWound",
    colors: ["#ff5f6d", "#ffc371"],
    name: { en: "Direct damage", ua: "Прямий урон" },
  },
  {
    id: "draw",
    test: (card) => /draw (\d+|a|until)|draw .* card/i.test(card.text.en),
    icon: "cardDraw",
    colors: ["#43cea2", "#185a9d"],
    name: { en: "Card draw", ua: "Добір карт" },
  },
  {
    id: "heal",
    test: (card) => /recover|heal/i.test(card.text.en),
    icon: "heartPlus",
    colors: ["#56ab2f", "#a8e063"],
    name: { en: "Recovery", ua: "Відновлення" },
  },
  {
    id: "move",
    test: (card) => /\bmove\b|\bplace\b|swap|push/i.test(card.text.en),
    icon: "footsteps",
    colors: ["#2193b0", "#6dd5ed"],
    name: { en: "Movement", ua: "Рух" },
  },
  {
    id: "control",
    test: (card) => /cancel|ignore|prevent|immune/i.test(card.text.en),
    icon: "padlock",
    colors: ["#7f7fd5", "#86a8e7"],
    name: { en: "Control", ua: "Контроль" },
  },
  {
    id: "intel",
    test: (card) => /discard|reveal|look at/i.test(card.text.en),
    icon: "crystalBall",
    colors: ["#b24592", "#f15f79"],
    name: { en: "Intel", ua: "Розвідка" },
  },
  {
    id: "power",
    test: (card) => (card.boost ?? 0) >= 3,
    icon: "boltSpellCast",
    colors: ["#f7971e", "#ffd200"],
    name: { en: "Boosts", ua: "Бусти" },
  },
  {
    id: "tempo",
    test: (card) => /gain 1 (free )?action|free action/i.test(card.text.en),
    icon: "hourglass",
    colors: ["#00c6ff", "#0072ff"],
    name: { en: "Tempo", ua: "Темп" },
  },
  {
    id: "fortress",
    test: (card) => card.type === "defense" || card.type === "versatile",
    icon: "castle",
    colors: ["#606c88", "#3f4c6b"],
    name: { en: "Fortress", ua: "Фортеця" },
  },
];

export const cardPrice = (card) =>
  20 + (card.value ?? 3) * 5 + (card.boost ?? 0) * 3;

export const removePrice = (used) => 35 + used * 15;

export { events, heroEvents } from "./rogueEvents.js";
