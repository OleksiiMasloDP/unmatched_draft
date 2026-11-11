export const ROWS = 11;
export const BASE_DECK = 15;
export const MIN_DECK = 10;
export const HERO_CHOICES = 3;
export const REWARD_CHOICES = 3;
export const PACK_COUNT = 3;
export const PACK_SIZE = 3;
export const START_GOLD = 40;

export const nodeTypes = {
  fight: { icon: "⚔️", color: "#d9534f" },
  mystery: { icon: "❓", color: "#9b6bff" },
  rest: { icon: "🔥", color: "#ff9f43" },
  shop: { icon: "💰", color: "#f6c945" },
  boss: { icon: "👑", color: "#ff4d6d" },
};

export const themes = [
  {
    id: "damage",
    test: (card) =>
      /deal[s]? \d+ damage|lose[s]? \d+ health/i.test(card.text.en),
    icon: "💥",
    colors: ["#ff5f6d", "#ffc371"],
    name: { en: "Direct damage", ua: "Прямий урон" },
  },
  {
    id: "draw",
    test: (card) => /draw (\d+|a|until)|draw .* card/i.test(card.text.en),
    icon: "📚",
    colors: ["#43cea2", "#185a9d"],
    name: { en: "Card draw", ua: "Добір карт" },
  },
  {
    id: "heal",
    test: (card) => /recover|heal/i.test(card.text.en),
    icon: "💚",
    colors: ["#56ab2f", "#a8e063"],
    name: { en: "Recovery", ua: "Відновлення" },
  },
  {
    id: "move",
    test: (card) => /\bmove\b|\bplace\b|swap|push/i.test(card.text.en),
    icon: "👣",
    colors: ["#2193b0", "#6dd5ed"],
    name: { en: "Movement", ua: "Рух" },
  },
  {
    id: "control",
    test: (card) => /cancel|ignore|prevent|immune/i.test(card.text.en),
    icon: "🛡️",
    colors: ["#7f7fd5", "#86a8e7"],
    name: { en: "Control", ua: "Контроль" },
  },
  {
    id: "intel",
    test: (card) => /discard|reveal|look at/i.test(card.text.en),
    icon: "👁️",
    colors: ["#b24592", "#f15f79"],
    name: { en: "Intel", ua: "Розвідка" },
  },
  {
    id: "power",
    test: (card) => (card.boost ?? 0) >= 3,
    icon: "⚡",
    colors: ["#f7971e", "#ffd200"],
    name: { en: "Boosts", ua: "Бусти" },
  },
  {
    id: "tempo",
    test: (card) => /gain 1 (free )?action|free action/i.test(card.text.en),
    icon: "⏱️",
    colors: ["#00c6ff", "#0072ff"],
    name: { en: "Tempo", ua: "Темп" },
  },
  {
    id: "fortress",
    test: (card) => card.type === "defense" || card.type === "versatile",
    icon: "🏰",
    colors: ["#606c88", "#3f4c6b"],
    name: { en: "Fortress", ua: "Фортеця" },
  },
];

export const cardPrice = (card) =>
  20 + (card.value ?? 3) * 5 + (card.boost ?? 0) * 3;

export const removePrice = (used) => 35 + used * 15;

export const events = [
  {
    id: "chest",
    icon: "🧰",
    title: { en: "Forgotten chest", ua: "Забута скриня" },
    text: {
      en: "A dusty chest sits by the road. The lock is rusted through.",
      ua: "Біля дороги стоїть запилена скриня. Замок зовсім проржавів.",
    },
    choices: [
      {
        label: {
          en: "Take the coins (+45 gold)",
          ua: "Забрати монети (+45 золота)",
        },
        effect: { gold: 45 },
        result: { en: "The coins are yours.", ua: "Монети твої." },
      },
      {
        label: { en: "Take a random card", ua: "Забрати випадкову карту" },
        effect: { card: 1 },
        result: { en: "You pull out a card.", ua: "Ти дістаєш карту." },
      },
    ],
  },
  {
    id: "forge",
    icon: "⚒️",
    title: { en: "Old forge", ua: "Стара кузня" },
    text: {
      en: "A smith offers to sharpen one of your cards for a fee.",
      ua: "Коваль пропонує загострити одну з твоїх карт за плату.",
    },
    choices: [
      {
        label: {
          en: "Pay 30 gold: upgrade a card",
          ua: "Заплатити 30: покращити карту",
        },
        cost: 30,
        effect: { upgrade: true },
      },
      {
        label: { en: "Walk away", ua: "Піти геть" },
        effect: {},
        result: { en: "You move on.", ua: "Ти йдеш далі." },
      },
    ],
  },
  {
    id: "library",
    icon: "📖",
    title: { en: "Hidden library", ua: "Прихована бібліотека" },
    text: {
      en: "Shelves of forgotten tactics. You have time for one book.",
      ua: "Полиці забутої тактики. У тебе є час лише на одну книгу.",
    },
    choices: [
      {
        label: { en: "Choose 1 of 3 cards", ua: "Обрати 1 з 3 карт" },
        effect: { pick: 3 },
      },
      {
        label: {
          en: "Sell a book (+25 gold)",
          ua: "Продати книгу (+25 золота)",
        },
        effect: { gold: 25 },
        result: { en: "A fair price.", ua: "Чесна ціна." },
      },
    ],
  },
  {
    id: "altar",
    icon: "🕯️",
    title: { en: "Dark altar", ua: "Темний вівтар" },
    text: {
      en: "The altar hungers for a card. In return it pays well.",
      ua: "Вівтар жадає карту. Натомість він добре платить.",
    },
    choices: [
      {
        label: {
          en: "Sacrifice a card (+35 gold)",
          ua: "Пожертвувати карту (+35 золота)",
        },
        effect: { remove: true, gold: 35 },
      },
      {
        label: { en: "Leave", ua: "Піти" },
        effect: {},
        result: { en: "The candles flicker out.", ua: "Свічки згасають." },
      },
    ],
  },
  {
    id: "gambler",
    icon: "🎲",
    title: { en: "The gambler", ua: "Картяр" },
    text: {
      en: "A stranger rattles dice. Double or nothing, he says.",
      ua: "Незнайомець торохтить кубиками. Подвоїти чи втратити, каже він.",
    },
    choices: [
      {
        label: {
          en: "Bet 25 gold (50% to win 80)",
          ua: "Поставити 25 (50% виграти 80)",
        },
        cost: 25,
        effect: { gamble: 80 },
      },
      {
        label: { en: "Decline", ua: "Відмовитись" },
        effect: {},
        result: {
          en: "He shrugs and walks off.",
          ua: "Він знизує плечима і йде.",
        },
      },
    ],
  },
  {
    id: "traveler",
    icon: "🧳",
    title: { en: "Wounded traveler", ua: "Поранений мандрівник" },
    text: {
      en: "A traveler begs for help. He promises a reward.",
      ua: "Мандрівник просить допомоги. Він обіцяє винагороду.",
    },
    choices: [
      {
        label: {
          en: "Help (-20 gold, get a card)",
          ua: "Допомогти (-20 золота, карта)",
        },
        cost: 20,
        effect: { card: 1 },
        result: {
          en: "He gives you a card as thanks.",
          ua: "Він дякує, віддаючи карту.",
        },
      },
      {
        label: { en: "Ignore", ua: "Ігнорувати" },
        effect: {},
        result: { en: "You pass by.", ua: "Ти проходиш повз." },
      },
    ],
  },
];
