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

const both = (en, ua) => ({ en, ua });

export const events = [
  {
    id: "chest",
    icon: "lockedChest",
    weight: 1,
    title: both("Forgotten chest", "Забута скриня"),
    text: both(
      "A dusty chest sits by the road. The lock is rusted through.",
      "Біля дороги стоїть запилена скриня. Замок зовсім проржавів.",
    ),
    choices: [
      {
        label: both("Open the chest", "Відкрити скриню"),
        outcomes: [
          {
            w: 4,
            gold: 45,
            text: both(
              "Coins spill out onto your palm.",
              "Монети висипаються тобі в долоню.",
            ),
          },
          {
            w: 3,
            card: "any",
            text: both(
              "Beneath the dust lies a forgotten card.",
              "Під пилом лежить забута карта.",
            ),
          },
          {
            w: 2,
            gold: -20,
            text: both(
              "A trap! A hidden blade nicks your purse.",
              "Пастка! Прихований клинок розрізає гаманець.",
            ),
          },
        ],
      },
      {
        label: both("Leave it alone", "Залишити як є"),
        outcomes: [
          {
            w: 1,
            text: both(
              "Some things are better left shut.",
              "Дещо краще не відкривати.",
            ),
          },
        ],
      },
    ],
  },
  {
    id: "well",
    icon: "well",
    weight: 1,
    title: both("Wishing well", "Криниця бажань"),
    text: both(
      "Coins glitter at the bottom of an old stone well.",
      "На дні старої кам'яної криниці виблискують монети.",
    ),
    choices: [
      {
        label: both("Toss in a coin", "Кинути монету"),
        cost: 15,
        outcomes: [
          {
            w: 3,
            card: "any",
            text: both(
              "The water ripples and a card floats up.",
              "Вода йде колами, і на поверхню випливає карта.",
            ),
          },
          {
            w: 2,
            gold: 40,
            text: both(
              "The well answers with a shower of gold.",
              "Криниця відповідає дощем золота.",
            ),
          },
          {
            w: 2,
            text: both("Only silence answers.", "Відповіддю є лише тиша."),
          },
        ],
      },
      {
        label: both("Walk away", "Піти геть"),
        outcomes: [{ w: 1, text: both("You move on.", "Ти йдеш далі.") }],
      },
    ],
  },
  {
    id: "hermit",
    icon: "pointyHat",
    weight: 1,
    title: both("The old hermit", "Старий відлюдник"),
    text: both(
      "A hermit by a small fire waves you over. He has a long story and a longer memory.",
      "Відлюдник біля маленького вогнища кличе тебе. У нього довга історія й ще довша пам'ять.",
    ),
    choices: [
      {
        label: both("Listen to his story", "Вислухати його історію"),
        remove: true,
        text: both(
          "His tale makes you forget a habit.",
          "Його розповідь змушує забути одну звичку.",
        ),
      },
      {
        label: both("Share your meal", "Розділити трапезу"),
        outcomes: [
          {
            w: 1,
            card: "own",
            text: both(
              "He nods and teaches you a move you almost knew.",
              "Він киває й показує прийом, який ти майже знав.",
            ),
          },
        ],
      },
    ],
  },
  {
    id: "gambler",
    icon: "rollingDices",
    weight: 1,
    title: both("The gambler", "Картяр"),
    text: both(
      "A stranger rattles dice. Double or nothing, he says.",
      "Незнайомець торохтить кубиками. Подвоїти чи втратити, каже він.",
    ),
    choices: [
      {
        label: both("Roll the dice", "Кинути кості"),
        cost: 25,
        outcomes: [
          {
            w: 1,
            gold: 80,
            text: both(
              "Luck is on your side. The pot is yours.",
              "Удача на твоєму боці. Банк твій.",
            ),
          },
          {
            w: 1,
            text: both(
              "The dice betray you. He pockets your bet.",
              "Кості зраджують тебе. Він забирає ставку.",
            ),
          },
        ],
      },
      {
        label: both("Decline", "Відмовитись"),
        outcomes: [
          {
            w: 1,
            text: both("He shrugs and walks off.", "Він знизує плечима і йде."),
          },
        ],
      },
    ],
  },
  {
    id: "pawn",
    icon: "twoCoins",
    weight: 1,
    title: both("Pawnbroker", "Ломбард"),
    text: both(
      "A pawnbroker eyes your deck with interest.",
      "Лихвар із цікавістю розглядає твою колоду.",
    ),
    choices: [
      {
        label: both("Sell a card", "Продати карту"),
        remove: true,
        gold: 25,
        text: both("A fair price.", "Чесна ціна."),
      },
      {
        label: both("Decline", "Відмовитись"),
        outcomes: [{ w: 1, text: both("You move on.", "Ти йдеш далі.") }],
      },
    ],
  },
  {
    id: "library",
    icon: "openBook",
    weight: 1,
    title: both("Hidden library", "Прихована бібліотека"),
    text: both(
      "Shelves of forgotten tactics. You have time for one book.",
      "Полиці забутої тактики. У тебе є час лише на одну книгу.",
    ),
    choices: [
      {
        label: both("Study the tactics", "Вивчити тактики"),
        pick: 3,
      },
      {
        label: both("Take the books to sell", "Забрати книги на продаж"),
        outcomes: [
          { w: 1, gold: 25, text: both("A fair price.", "Чесна ціна.") },
        ],
      },
    ],
  },
  {
    id: "altar",
    icon: "pentacle",
    weight: 1,
    title: both("Dark altar", "Темний вівтар"),
    text: both(
      "The altar hungers. Candles lean toward your deck.",
      "Вівтар жадає. Свічки хилиться до твоєї колоди.",
    ),
    choices: [
      {
        label: both("Make an offering", "Принести жертву"),
        remove: true,
        gold: 35,
        text: both(
          "The altar pays in cold coin.",
          "Вівтар платить холодною монетою.",
        ),
      },
      {
        label: both("Leave", "Піти"),
        outcomes: [
          {
            w: 1,
            text: both("The candles flicker out.", "Свічки згасають."),
          },
        ],
      },
    ],
  },
  {
    id: "traveler",
    icon: "swapBag",
    weight: 1,
    title: both("Wounded traveler", "Поранений мандрівник"),
    text: both(
      "A traveler lies by the road and begs for help.",
      "Мандрівник лежить біля дороги й просить допомоги.",
    ),
    choices: [
      {
        label: both("Help him", "Допомогти йому"),
        outcomes: [
          {
            w: 3,
            card: "any",
            text: both(
              "He thanks you and presses a card into your hand.",
              "Він дякує й вкладає тобі в руку карту.",
            ),
          },
          {
            w: 2,
            gold: 30,
            text: both(
              "He leaves you a purse as thanks.",
              "На знак подяки він залишає тобі гаманець.",
            ),
          },
        ],
      },
      {
        label: both("Pass by", "Пройти повз"),
        outcomes: [{ w: 1, text: both("You pass by.", "Ти проходиш повз.") }],
      },
    ],
  },
  {
    id: "shrine",
    icon: "sun",
    weight: 1,
    title: both("Roadside shrine", "Придорожня капличка"),
    text: both(
      "A small shrine glows faintly in the dusk.",
      "Маленька капличка ледь світиться в сутінках.",
    ),
    choices: [
      {
        label: both("Pray", "Помолитися"),
        outcomes: [
          {
            w: 1,
            gold: 30,
            text: both(
              "Warmth fills you and coins appear at the altar.",
              "Тебе наповнює тепло, а біля вівтаря з'являються монети.",
            ),
          },
          {
            w: 1,
            card: "own",
            text: both(
              "A forgotten lesson returns to you.",
              "До тебе повертається забутий урок.",
            ),
          },
        ],
      },
      {
        label: both("Move on", "Іти далі"),
        outcomes: [{ w: 1, text: both("You move on.", "Ти йдеш далі.") }],
      },
    ],
  },
];

export const heroEvents = [
  {
    id: "help",
    weight: 2,
    title: both("{hero} blocks the road", "{hero} перегороджує шлях"),
    text: both(
      'A familiar fighter steps out of the shadows. "You look like you could use an ally," {hero} says.',
      "Знайомий боєць виходить із тіні. «Схоже, тобі стане в пригоді союзник», каже {hero}.",
    ),
    choices: [
      {
        label: both("Accept their help", "Прийняти допомогу"),
        outcomes: [
          {
            w: 1,
            card: "ally",
            text: both(
              "{hero} shares a trick and it joins your deck.",
              "{hero} ділиться прийомом, і він потрапляє до твоєї колоди.",
            ),
          },
        ],
      },
      {
        label: both("Refuse politely", "Ввічливо відмовитись"),
        outcomes: [
          {
            w: 1,
            card: "own",
            text: both(
              "You trust your own strength and rediscover a card of your own.",
              "Ти покладаєшся на власні сили й знаходиш карту зі свого арсеналу.",
            ),
          },
        ],
      },
    ],
  },
  {
    id: "train",
    weight: 1,
    title: both("{hero} offers to train", "{hero} пропонує тренування"),
    text: both(
      '{hero} spins a practice blade. "One round, no hard feelings."',
      "{hero} крутить тренувальний клинок. «Один раунд, без образ».",
    ),
    choices: [
      {
        label: both("Train together", "Потренуватись разом"),
        pickAlly: 3,
      },
      {
        label: both("Go on alone", "Іти далі самому"),
        outcomes: [
          {
            w: 1,
            gold: 25,
            text: both(
              "{hero} tips their hat and tosses you a purse.",
              "{hero} киває й кидає тобі гаманець.",
            ),
          },
        ],
      },
    ],
  },
  {
    id: "bargain",
    weight: 1,
    title: both("{hero} the trader", "{hero} торговець"),
    text: both(
      '{hero} lays out a few cards on a cloak. "Take one, if you can pay."',
      "{hero} розкладає кілька карт на плащі. «Бери одну, якщо маєш чим платити».",
    ),
    choices: [
      {
        label: both("Pay for a card", "Заплатити за карту"),
        cost: 30,
        pickAlly: 3,
      },
      {
        label: both("Haggle", "Поторгуватись"),
        outcomes: [
          {
            w: 1,
            card: "ally",
            text: both(
              "{hero} sighs and hands one over to be rid of you.",
              "{hero} зітхає й віддає одну, щоб позбутися тебе.",
            ),
          },
          {
            w: 1,
            gold: -15,
            text: both(
              "{hero} laughs and lightens your purse.",
              "{hero} сміється й полегшує твій гаманець.",
            ),
          },
        ],
      },
    ],
  },
];
