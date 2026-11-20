export const ROWS = 11;
export const BASE_DECK = 10;
export const MIN_DECK = 8;
export const HERO_CHOICES = 3;
export const REWARD_CHOICES = 3;
export const PACK_COUNT = 3;
export const PACK_SIZE = 3;
export const START_GOLD = 40;

export const levels = [
  {
    id: 1,
    boss: "agent-venom",
    accent: "#ff4d8d",
    glow: "rgba(255, 77, 141, 0.22)",
    name: { en: "City Rampage", ua: "Міський розгром" },
    text: {
      en: "Neon signs flicker over a street gone wild. Overturned cars, shattered windows and something black and hungry watching from the rooftops. Fight your way to the end of the block.",
      ua: "Неонові вивіски мерехтять над вулицею, що збожеволіла. Перекинуті авто, розбиті вітрини й щось чорне та голодне, що стежить із дахів. Пробийся до кінця кварталу.",
    },
  },
  {
    id: 2,
    boss: "deadman-danny",
    accent: "#ff9a2e",
    glow: "rgba(255, 154, 46, 0.22)",
    name: { en: "Air Raid", ua: "Повітряний наліт" },
    text: {
      en: "Above the clouds the war is louder. Rocket trails, burning wings and a grinning pilot made of bones who sells fire by the pound. Burn faster, fly higher.",
      ua: "Над хмарами війна гучніша. Сліди ракет, палаючі крила й усміхнений пілот із кісток, що торгує вогнем на вагу. Гори швидше, лети вище.",
    },
  },
];

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
    name: { en: "Pings", ua: "Пінг" },
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
  {
    id: "strikes",
    test: (card) =>
      (card.type === "attack" || card.type === "versatile") &&
      (card.value ?? 0) >= 4,
    icon: "muscleUp",
    colors: ["#e52d27", "#b31217"],
    name: { en: "Heavy strikes", ua: "Сильні удари" },
  },
  {
    id: "bulwark",
    test: (card) => card.type === "defense",
    icon: "rock",
    colors: ["#2b5876", "#4e4376"],
    name: { en: "Full defense", ua: "Повна оборона" },
  },
  {
    id: "schemes",
    test: (card) => card.type === "scheme",
    icon: "scrollUnfurled",
    colors: ["#8e2de2", "#4a00e0"],
    name: { en: "Schemes", ua: "Схеми" },
  },
  {
    id: "attackers",
    test: (card) => card.type === "attack",
    icon: "crossedSwords",
    colors: ["#f857a6", "#ff5858"],
    name: { en: "Pure attacks", ua: "Чисті атаки" },
  },
  {
    id: "flex",
    test: (card) => card.type === "versatile",
    icon: "scales",
    colors: ["#b993d6", "#8ca6db"],
    name: { en: "Versatile", ua: "Універсали" },
  },
  {
    id: "sidekicks",
    test: (card) => card.kind === "sidekick",
    icon: "shakingHands",
    colors: ["#11998e", "#38ef7d"],
    name: { en: "Sidekick cards", ua: "Карти помічників" },
  },
  {
    id: "sabotage",
    test: (card) =>
      /(opponent|opposing player).{0,40}discard|discard.{0,30}(opponent|opposing)/i.test(
        card.text.en,
      ),
    icon: "robberHand",
    colors: ["#cb2d3e", "#ef473a"],
    name: { en: "Sabotage", ua: "Диверсії" },
  },
  {
    id: "rush",
    test: (card) => /^immediately/i.test(card.text.en),
    icon: "ninjaMask",
    colors: ["#373b44", "#4286f4"],
    name: { en: "Ambush", ua: "Засідка" },
  },
  {
    id: "clash",
    test: (card) => /during combat/i.test(card.text.en),
    icon: "rollingDices",
    colors: ["#fc4a1a", "#f7b733"],
    name: { en: "Clash tricks", ua: "Бойові трюки" },
  },
];

export const cardPrice = (card) =>
  20 + (card.value ?? 3) * 5 + (card.boost ?? 0) * 3;

export const removePrice = (used) => 35 + used * 15;

export { events, heroEvents } from "./rogueEvents.js";
