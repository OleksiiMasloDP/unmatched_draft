const both = (en, ua) => ({ en, ua });

const out = (w, en, ua, extra = {}) => ({ w, ...extra, text: both(en, ua) });

const nothing = (en, ua) => out(1, en, ua);

const leave = (en, ua) => ({
  icon: "footsteps",
  label: both("Leave", "Піти"),
  outcomes: [nothing(en, ua)],
});

export const events = [
  {
    id: "chest",
    icon: "lockedChest",
    tint: "#c98a2b",
    weight: 1,
    title: both("Forgotten chest", "Забута скриня"),
    text: both(
      "A dusty chest sits by the road. The lock is rusted through, and something inside shifts when the wind blows.",
      "Біля дороги стоїть запилена скриня. Замок зовсім проржавів, і щось усередині ворушиться, коли дує вітер.",
    ),
    choices: [
      {
        icon: "crowbar",
        label: both("Pry it open with force", "Зламати її силою"),
        outcomes: [
          out(
            4,
            "Coins spill out onto your palm.",
            "Монети висипаються тобі в долоню.",
            { gold: 45 },
          ),
          out(
            3,
            "Beneath the dust lies a forgotten card.",
            "Під пилом лежить забута карта.",
            { card: "any" },
          ),
          out(
            2,
            "A trap! A hidden blade nicks your purse.",
            "Пастка! Прихований клинок розрізає гаманець.",
            { gold: -20 },
          ),
        ],
      },
      {
        icon: "lockpicks",
        label: both("Pick the lock carefully", "Обережно відімкнути замок"),
        cost: 10,
        outcomes: [
          out(
            4,
            "The lock clicks open without a sound. Inside, a tidy sum.",
            "Замок тихо клацає. Усередині охайна сума.",
            { gold: 40 },
          ),
          out(
            3,
            "Between the coins, a card wrapped in oilcloth.",
            "Поміж монет лежить карта, загорнута в промаслену тканину.",
            { card: "any" },
          ),
          out(
            1,
            "The chest was empty all along.",
            "Скриня була порожньою від самого початку.",
          ),
        ],
      },
      {
        icon: "rock",
        label: both("Smash it with a rock", "Розбити її каменем"),
        outcomes: [
          out(
            2,
            "The lid splinters and a heavy purse rolls out.",
            "Віко тріщить, і назовні викочується важкий гаманець.",
            { gold: 70 },
          ),
          out(
            3,
            "The noise draws bandits. You flee, leaving coins behind.",
            "Галас привертає розбійників. Ти тікаєш, лишаючи монети.",
            { gold: -30 },
          ),
        ],
      },
      leave("Some things are better left shut.", "Дещо краще не відкривати."),
    ],
  },
  {
    id: "well",
    icon: "well",
    tint: "#3b9bd6",
    weight: 1,
    title: both("Wishing well", "Криниця бажань"),
    text: both(
      "Coins glitter at the bottom of an old stone well. The water hums faintly, as if listening.",
      "На дні старої кам'яної криниці виблискують монети. Вода ледь чутно гуде, наче дослухається.",
    ),
    choices: [
      {
        icon: "coins",
        label: both(
          "Toss in a coin and wish",
          "Кинути монету й загадати бажання",
        ),
        cost: 15,
        outcomes: [
          out(
            3,
            "The well answers with a forgotten card.",
            "Криниця відповідає забутою картою.",
            { card: "any" },
          ),
          out(
            2,
            "A rain of coins splashes back up.",
            "Назад вилітає дощ монет.",
            { gold: 40 },
          ),
          out(2, "Only ripples answer.", "Відповідають лише кола на воді."),
        ],
      },
      {
        icon: "waterDrop",
        label: both("Drink the water", "Випити води"),
        outcomes: [
          out(
            2,
            "Old lessons surface in your mind.",
            "У пам'яті спливають давні уроки.",
            { card: "own" },
          ),
          out(
            2,
            "The water is foul. You pay a healer on the way.",
            "Вода гнила. По дорозі доводиться платити цілителю.",
            { gold: -10 },
          ),
          out(
            1,
            "It tastes of stone. Nothing more.",
            "Смак каменю. І більше нічого.",
          ),
        ],
      },
      {
        icon: "magnifyingGlass",
        label: both("Fish for the coins", "Виловити монети"),
        outcomes: [
          out(
            3,
            "You hook a handful of old coins.",
            "Ти зачіпляєш жменю старих монет.",
            { gold: 25 },
          ),
          out(
            2,
            "The rope snaps and takes your purse with it.",
            "Мотузка рветься й забирає твій гаманець.",
            { gold: -15 },
          ),
          out(
            1,
            "Something shiny turns out to be a card.",
            "Те, що блищало, виявляється картою.",
            { card: "any" },
          ),
        ],
      },
      leave(
        "The well goes quiet behind you.",
        "Криниця затихає за твоєю спиною.",
      ),
    ],
  },
  {
    id: "hermit",
    icon: "pointyHat",
    tint: "#8a6bd1",
    weight: 1,
    title: both("The old hermit", "Старий відлюдник"),
    text: both(
      "A hermit waves you over to his fire. He claims he can lighten any burden, for the right price.",
      "Відлюдник махає тобі від свого багаття. Каже, що може полегшити будь-яку ношу за належну ціну.",
    ),
    choices: [
      {
        icon: "monkFace",
        label: both("Listen to his story", "Вислухати його історію"),
        remove: true,
        gold: 0,
        text: both(
          "His tale makes one of your habits seem pointless. You let it go.",
          "Його розповідь робить одну з твоїх звичок безглуздою. Ти відпускаєш її.",
        ),
      },
      {
        icon: "bread",
        label: both("Share your meal", "Розділити з ним трапезу"),
        outcomes: [
          out(
            1,
            "He rewards your kindness with a lesson of your own.",
            "Він віддячує за доброту уроком із твого власного арсеналу.",
            { card: "own" },
          ),
        ],
      },
      {
        icon: "treasureMap",
        label: both("Ask for his old map", "Попросити його стару мапу"),
        cost: 10,
        outcomes: [
          out(
            2,
            "The map leads to a forgotten stash.",
            "Мапа веде до забутого сховку.",
            { gold: 45 },
          ),
          out(
            1,
            "In the margin, a card has been sketched. You copy it.",
            "На полях намальована карта. Ти змальовуєш її.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "robberMask",
        label: both("Rob him", "Пограбувати його"),
        outcomes: [
          out(
            2,
            "He is not as poor as he looks.",
            "Він не такий бідний, як здається.",
            { gold: 50 },
          ),
          out(
            2,
            "He is not as helpless as he looks, either.",
            "І не такий безпорадний, як здається.",
            { gold: -25 },
          ),
        ],
      },
      leave(
        "The hermit waves you off with a smile.",
        "Відлюдник проводжає тебе усмішкою.",
      ),
    ],
  },
  {
    id: "gambler",
    icon: "rollingDices",
    tint: "#d6453b",
    weight: 1,
    title: both("The gambler", "Картяр"),
    text: both(
      "A stranger rattles dice in a leather cup. Double or nothing, he says, and his smile never reaches his eyes.",
      "Незнайомець торохтить кубиками в шкіряному стакані. Подвоїти чи втратити, каже він, і усмішка не сягає його очей.",
    ),
    choices: [
      {
        icon: "rollingDices",
        label: both("Roll the dice", "Кинути кості"),
        cost: 25,
        outcomes: [
          out(
            1,
            "Luck is on your side. The pot is yours.",
            "Удача на твоєму боці. Банк твій.",
            { gold: 80 },
          ),
          out(
            1,
            "The dice betray you. He pockets your bet.",
            "Кості зраджують тебе. Він забирає ставку.",
          ),
        ],
      },
      {
        icon: "diceSixFacesFour",
        label: both("Bet big", "Поставити по-крупному"),
        cost: 50,
        outcomes: [
          out(
            1,
            "Triple six! He pays up, grumbling.",
            "Три шістки! Він платить, бурмочучи.",
            { gold: 170 },
          ),
          out(
            2,
            "Snake eyes. Your stake is gone.",
            "Дві одиниці. Твоя ставка зникла.",
          ),
        ],
      },
      {
        icon: "cardPlay",
        label: both("Play a hand of cards", "Зіграти партію в карти"),
        cost: 10,
        outcomes: [
          out(
            2,
            "A small win, and he even shows you a trick.",
            "Невеликий виграш, а він ще й показує фокус.",
            { gold: 30 },
          ),
          out(
            1,
            "He loses on purpose and slips you a card.",
            "Він програє навмисно й підсовує тобі карту.",
            { card: "any" },
          ),
          out(
            2,
            "You lose a few coins and learn nothing.",
            "Ти втрачаєш кілька монет, нічого не навчившись.",
          ),
        ],
      },
      {
        icon: "robberHand",
        label: both("Cheat him", "Обдурити його"),
        outcomes: [
          out(
            1,
            "He never notices. Easy money.",
            "Він навіть не помічає. Легкі гроші.",
            { gold: 60 },
          ),
          out(
            1,
            "He catches your sleeve and takes his due.",
            "Він хапає тебе за рукав і бере своє.",
            { gold: -30 },
          ),
        ],
      },
      leave("He shrugs and walks off.", "Він знизує плечима і йде."),
    ],
  },
  {
    id: "pawn",
    icon: "twoCoins",
    tint: "#d9a520",
    weight: 1,
    title: both("The pawnbroker", "Ломбардник"),
    text: both(
      "A cluttered stall promises fair prices for anything you carry. The pawnbroker eyes your deck.",
      "Захаращений прилавок обіцяє чесні ціни за все, що ти несеш. Ломбардник оглядає твою колоду.",
    ),
    choices: [
      {
        icon: "twoCoins",
        label: both("Sell a card", "Продати карту"),
        remove: true,
        gold: 25,
        text: both("A fair price, as promised.", "Чесна ціна, як і обіцяли."),
      },
      {
        icon: "scales",
        label: both("Haggle for more", "Поторгуватись за більше"),
        outcomes: [
          out(
            2,
            "He grumbles, but the price rises.",
            "Він бурчить, але ціна зростає.",
            { gold: 40 },
          ),
          out(
            2,
            "He throws up his hands and offers nothing.",
            "Він розводить руками й не пропонує нічого.",
          ),
        ],
      },
      {
        icon: "scrollUnfurled",
        label: both("Buy a rumor", "Купити чутку"),
        cost: 20,
        outcomes: [
          out(
            2,
            "The rumor points you to a forgotten card.",
            "Чутка вказує на забуту карту.",
            { card: "any" },
          ),
          out(
            1,
            "The rumor was worth every coin, and then some.",
            "Чутка варта кожної монети, і навіть більше.",
            { gold: 35 },
          ),
        ],
      },
      {
        icon: "robberMask",
        label: both("Rob the till", "Пограбувати касу"),
        outcomes: [
          out(
            1,
            "You are out the door before he looks up.",
            "Ти за дверима, перш ніж він підводить очі.",
            { gold: 45 },
          ),
          out(
            2,
            "His guard is faster than he looks.",
            "Його охоронець швидший, ніж здається.",
            { gold: -30 },
          ),
        ],
      },
      leave(
        "He goes back to counting coins.",
        "Він повертається до рахунку монет.",
      ),
    ],
  },
  {
    id: "library",
    icon: "openBook",
    tint: "#4aa88c",
    weight: 1,
    title: both("Ruined library", "Зруйнована бібліотека"),
    text: both(
      "Half a library survived the fire. Between charred shelves, a few tomes still smell of ink.",
      "Половина бібліотеки пережила пожежу. Поміж обгорілих полиць кілька томів досі пахнуть чорнилом.",
    ),
    choices: [
      {
        icon: "bookPile",
        label: both("Skim the shelves", "Переглянути полиці"),
        pick: 2,
      },
      {
        icon: "openBook",
        label: both("Study carefully", "Уважно вивчати"),
        cost: 25,
        pick: 3,
      },
      {
        icon: "bookshelf",
        label: both("Search for a hidden tome", "Шукати прихований том"),
        outcomes: [
          out(
            2,
            "Behind a false shelf, a single pristine volume.",
            "За фальшивою полицею лежить єдиний бездоганний том.",
            { card: "any" },
          ),
          out(1, "Only ash and mice.", "Лише попіл і миші."),
        ],
      },
      {
        icon: "coins",
        label: both("Take the books to sell", "Забрати книги на продаж"),
        outcomes: [out(1, "A fair price.", "Чесна ціна.", { gold: 25 })],
      },
      leave("The ash settles behind you.", "Попіл осідає за твоєю спиною."),
    ],
  },
  {
    id: "altar",
    icon: "pentacle",
    tint: "#a31f4d",
    weight: 1,
    title: both("Dark altar", "Темний вівтар"),
    text: both(
      "The altar hungers. Candles lean toward your deck, and the shadows between them are far too patient.",
      "Вівтар жадає. Свічки хилиться до твоєї колоди, а тіні між ними занадто терплячі.",
    ),
    choices: [
      {
        icon: "pentacle",
        label: both("Make an offering", "Принести жертву"),
        remove: true,
        gold: 35,
        text: both(
          "The altar pays in cold coin.",
          "Вівтар платить холодною монетою.",
        ),
      },
      {
        icon: "candleFlame",
        label: both("Pray at the altar", "Помолитися біля вівтаря"),
        outcomes: [
          out(
            2,
            "Something answers, and a lesson of yours returns.",
            "Щось відповідає, і до тебе повертається твій урок.",
            { card: "own" },
          ),
          out(
            1,
            "The candles gutter. You leave a coin in apology.",
            "Свічки гаснуть. Ти залишаєш монету на вибачення.",
            { gold: -15 },
          ),
        ],
      },
      {
        icon: "coins",
        label: both("Offer a coin", "Покласти монету"),
        cost: 20,
        outcomes: [
          out(
            2,
            "The flames flare in thanks and reveal a card.",
            "Полум'я спалахує на знак подяки й відкриває карту.",
            { card: "any" },
          ),
          out(
            1,
            "The coin vanishes. Nothing else happens.",
            "Монета зникає. Більше нічого.",
          ),
        ],
      },
      {
        icon: "skullStaff",
        label: both("Desecrate it", "Осквернити його"),
        outcomes: [
          out(
            2,
            "You pry loose a gem from the altar.",
            "Ти видираєш з вівтаря коштовний камінь.",
            { gold: 50 },
          ),
          out(2, "The shadows take their due.", "Тіні беруть своє.", {
            gold: -30,
          }),
        ],
      },
      leave("The candles burn on without you.", "Свічки горять далі без тебе."),
    ],
  },
  {
    id: "traveler",
    icon: "swapBag",
    tint: "#6aa84f",
    weight: 1,
    title: both("Stranded traveler", "Мандрівник у скруті"),
    text: both(
      "A cart lies overturned in the ditch. Its owner waves you down, wheels spinning uselessly.",
      "У кюветі лежить перекинутий віз. Його власник махає тобі, а колеса даремно крутяться.",
    ),
    choices: [
      {
        icon: "swapBag",
        label: both("Help him", "Допомогти йому"),
        outcomes: [
          out(
            3,
            "He rewards you with a card from his satchel.",
            "Він віддячує картою зі своєї сумки.",
            { card: "any" },
          ),
          out(
            2,
            "He presses a purse into your hand.",
            "Він вкладає тобі в руку гаманець.",
            { gold: 30 },
          ),
        ],
      },
      {
        icon: "knapsack",
        label: both("Buy from his wares", "Купити щось із його товару"),
        cost: 20,
        pick: 2,
      },
      {
        icon: "horseHead",
        label: both("Escort him to town", "Супроводити його до міста"),
        outcomes: [
          out(
            2,
            "The road is quiet and the pay is good.",
            "Дорога спокійна, а плата добра.",
            { gold: 40 },
          ),
          out(
            1,
            "In town he introduces you to a card dealer.",
            "У місті він знайомить тебе з торговцем картами.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "robberHand",
        label: both(
          "Rob him while he is down",
          "Пограбувати, поки він безпорадний",
        ),
        outcomes: [
          out(1, "Cheap, but it works.", "Підло, але працює.", { gold: 35 }),
          out(1, "His dog has other ideas.", "У його пса інші плани.", {
            gold: -20,
          }),
        ],
      },
      leave(
        "You pass by. The wheels keep spinning.",
        "Ти проходиш повз. Колеса далі крутяться.",
      ),
    ],
  },
  {
    id: "shrine",
    icon: "sun",
    tint: "#f0b429",
    weight: 1,
    title: both("Roadside shrine", "Придорожня капличка"),
    text: both(
      "A weathered shrine to a forgotten sun god. Fresh flowers lie before it, though no one is in sight.",
      "Вивітрена капличка забутого бога сонця. Перед нею лежать свіжі квіти, хоча нікого не видно.",
    ),
    choices: [
      {
        icon: "sun",
        label: both("Pray", "Помолитися"),
        outcomes: [
          out(
            1,
            "Warmth settles in your chest, and coins glint in the grass.",
            "У грудях розливається тепло, а в траві блищать монети.",
            { gold: 30 },
          ),
          out(
            1,
            "A forgotten lesson returns to you.",
            "До тебе повертається забутий урок.",
            { card: "own" },
          ),
        ],
      },
      {
        icon: "candleFlame",
        label: both("Light a candle", "Запалити свічку"),
        cost: 10,
        outcomes: [
          out(
            2,
            "The flame burns bright and shows you a card.",
            "Полум'я горить яскраво й показує тобі карту.",
            { card: "own" },
          ),
          out(1, "The candle is kind to you.", "Свічка прихильна до тебе.", {
            gold: 20,
          }),
        ],
      },
      {
        icon: "hourglass",
        label: both("Meditate until dusk", "Медитувати до смерку"),
        outcomes: [
          out(
            1,
            "Hours pass. You rise with a clear mind and a clear lesson.",
            "Минають години. Ти встаєш зі світлою головою й чітким уроком.",
            { card: "own" },
          ),
          out(
            1,
            "You wake to find your purse lighter.",
            "Ти прокидаєшся з легшим гаманцем.",
            { gold: -10 },
          ),
        ],
      },
      {
        icon: "coinsPile",
        label: both("Take the offerings", "Забрати підношення"),
        outcomes: [
          out(2, "The offerings are generous.", "Підношення щедрі.", {
            gold: 40,
          }),
          out(
            1,
            "The sun scorches your hand. You drop everything.",
            "Сонце обпікає руку. Ти кидаєш усе.",
            { gold: -25 },
          ),
        ],
      },
      leave("The flowers sway as you go.", "Квіти хитаються, коли ти йдеш."),
    ],
  },
];

export const heroEvents = [
  {
    id: "help",
    tint: "#4a7bd6",
    weight: 2,
    title: both("{hero} blocks the road", "{hero} перегороджує шлях"),
    text: both(
      'A familiar fighter steps out of the shadows. "You look like you could use an ally," {hero} says.',
      "Знайомий боєць виходить із тіні. «Схоже, тобі стане в пригоді союзник», каже {hero}.",
    ),
    choices: [
      {
        icon: "shakingHands",
        label: both("Accept their help", "Прийняти допомогу"),
        outcomes: [
          out(
            1,
            "{hero} shares a trick and it joins your deck.",
            "{hero} ділиться прийомом, і він потрапляє до твоєї колоди.",
            { card: "ally" },
          ),
        ],
      },
      {
        icon: "swordman",
        label: both("Refuse politely", "Ввічливо відмовитись"),
        outcomes: [
          out(
            1,
            "You trust your own strength and rediscover a card of your own.",
            "Ти покладаєшся на власні сили й знаходиш карту зі свого арсеналу.",
            { card: "own" },
          ),
        ],
      },
      {
        icon: "crossedSwords",
        label: both(
          "Challenge them to a friendly spar",
          "Запропонувати дружній спаринг",
        ),
        outcomes: [
          out(
            1,
            "{hero} grins, loses on purpose, and hands you a card.",
            "{hero} усміхається, програє навмисно й віддає тобі карту.",
            { card: "ally" },
          ),
          out(
            1,
            "{hero} wins and collects the stake.",
            "{hero} перемагає й забирає ставку.",
            { gold: -15 },
          ),
        ],
      },
      {
        icon: "scrollUnfurled",
        label: both("Ask for advice", "Попросити поради"),
        outcomes: [
          out(
            1,
            "Good advice is worth coin, and {hero} pays you for yours.",
            "Добра порада варта монет, і {hero} платить тобі за твою.",
            { gold: 25 },
          ),
          out(
            1,
            "The advice turns out to be a card.",
            "Порада виявляється картою.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "ninjaMask",
        label: both("Slip past unseen", "Прослизнути непоміченим"),
        outcomes: [
          out(1, "{hero} never turns around.", "{hero} навіть не обертається."),
        ],
      },
    ],
  },
  {
    id: "train",
    tint: "#d6743b",
    weight: 1,
    title: both("{hero} offers to train", "{hero} пропонує тренування"),
    text: both(
      '{hero} spins a practice blade. "One round, no hard feelings."',
      "{hero} крутить тренувальний клинок. «Один раунд, без образ».",
    ),
    choices: [
      {
        icon: "muscleUp",
        label: both("Train together", "Потренуватись разом"),
        pickAlly: 3,
      },
      {
        icon: "punch",
        label: both("Spar hard", "Битися всерйоз"),
        outcomes: [
          out(
            2,
            "You hold your ground, and {hero} teaches you a finishing move.",
            "Ти тримаєшся, і {hero} навчає тебе завершальному прийому.",
            { card: "ally" },
          ),
          out(
            1,
            "You pay for the lesson in bruises and coin.",
            "Ти платиш за урок синцями й монетами.",
            { gold: -20 },
          ),
        ],
      },
      {
        icon: "swordman",
        label: both("Practice on your own", "Тренуватись самому"),
        outcomes: [
          out(
            1,
            "You drill alone until a forgotten lesson returns.",
            "Ти тренуєшся наодинці, доки не повертається забутий урок.",
            { card: "own" },
          ),
          out(
            1,
            "{hero} watches, impressed, and tosses you a purse.",
            "{hero} дивиться із захватом і кидає тобі гаманець.",
            { gold: 25 },
          ),
        ],
      },
      {
        icon: "footsteps",
        label: both("Go on alone", "Іти далі самому"),
        outcomes: [
          out(
            1,
            "{hero} tips their hat and tosses you a purse.",
            "{hero} киває й кидає тобі гаманець.",
            { gold: 25 },
          ),
        ],
      },
    ],
  },
  {
    id: "bargain",
    tint: "#c9a227",
    weight: 1,
    title: both("{hero} the trader", "{hero} торговець"),
    text: both(
      '{hero} lays out a few cards on a cloak. "Take one, if you can pay."',
      "{hero} розкладає кілька карт на плащі. «Бери одну, якщо маєш чим платити».",
    ),
    choices: [
      {
        icon: "coinsPile",
        label: both("Pay for a card", "Заплатити за карту"),
        cost: 30,
        pickAlly: 3,
      },
      {
        icon: "scales",
        label: both("Haggle", "Поторгуватись"),
        outcomes: [
          out(
            1,
            "{hero} sighs and hands one over to be rid of you.",
            "{hero} зітхає й віддає одну, щоб позбутися тебе.",
            { card: "ally" },
          ),
          out(
            1,
            "{hero} laughs and lightens your purse.",
            "{hero} сміється й полегшує твій гаманець.",
            { gold: -15 },
          ),
        ],
      },
      {
        icon: "knapsack",
        label: both("Buy the whole kit", "Купити весь набір"),
        cost: 60,
        pickAlly: 5,
      },
      {
        icon: "robberHand",
        label: both("Try to snatch a card", "Спробувати поцупити карту"),
        outcomes: [
          out(
            1,
            "Your fingers are quicker than {hero}'s eyes.",
            "Твої пальці швидші за очі {hero}.",
            { card: "ally" },
          ),
          out(
            2,
            "{hero} catches your wrist and charges you for the trouble.",
            "{hero} хапає тебе за зап'ясток і виставляє рахунок за клопіт.",
            { gold: -40 },
          ),
        ],
      },
      {
        icon: "footsteps",
        label: both("Walk away", "Піти геть"),
        outcomes: [
          out(
            1,
            "{hero} shrugs and packs the cards away.",
            "{hero} знизує плечима й ховає карти.",
          ),
        ],
      },
    ],
  },
];
