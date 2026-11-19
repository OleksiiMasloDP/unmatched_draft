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
    ],
  },
  {
    id: "blackbeard",
    icon: "treasureMap",
    tint: "#2f7f9d",
    weight: 1,
    title: both("Buried pirate loot", "Закопана здобич пірата"),
    text: both(
      "A tattered map is nailed to a driftwood post. An X marks the spot, and a skull is scratched beside it: Edward Teach never shared his plunder willingly.",
      "До дошки з викинутого морем дерева прибито потріпану карту. Хрестик позначає місце, а поруч видряпано череп: Едвард Тіч ніколи не ділився здобиччю охоче.",
    ),
    choices: [
      {
        icon: "crowbar",
        label: both("Dig where the X is", "Копати там, де хрестик"),
        outcomes: [
          out(
            3,
            "Your shovel rings on a chest full of doubloons.",
            "Лопата дзвенить об скриню, повну дублонів.",
            { gold: 65 },
          ),
          out(
            2,
            "Only a rusty cutlass, but it teaches you a trick.",
            "Лише іржава шабля, та вона підказує прийом.",
            { card: "any" },
          ),
          out(
            2,
            "The hole is already empty. Teach was here first.",
            "Яма вже порожня. Тіч побував тут першим.",
          ),
        ],
      },
      {
        icon: "magnifyingGlass",
        label: both("Read the map carefully", "Уважно вивчити карту"),
        cost: 10,
        outcomes: [
          out(
            3,
            "The real spot is two paces left. A fat purse waits there.",
            "Справжнє місце за два кроки ліворуч. Там чекає важкий гаманець.",
            { gold: 60 },
          ),
          out(
            2,
            "Under the false X lies a booby-trapped chest. You defuse it and find a card.",
            "Під фальшивим хрестиком схована скриня з пасткою. Ти знешкоджуєш її й знаходиш карту.",
            { card: "any" },
          ),
        ],
      },
    ],
  },
  {
    id: "excalibur",
    icon: "swordman",
    tint: "#8c9db5",
    weight: 1,
    title: both("The sword in the stone", "Меч у камені"),
    text: both(
      "A sword is buried to the hilt in a mossy stone. Legend says only the true king of Britain can pull it free.",
      "Меч увійшов у вкритий мохом камінь по самий руків'я. За легендою, витягти його може лише істинний король Британії.",
    ),
    choices: [
      {
        icon: "muscleUp",
        label: both("Pull with all your strength", "Тягти з усієї сили"),
        outcomes: [
          out(
            1,
            "The stone yields! A royal technique flows into your deck.",
            "Камінь піддається! Королівський прийом вливається у твою колоду.",
            { card: "any" },
          ),
          out(
            3,
            "Not a budge. A passing knight laughs and you pay for the show.",
            "Ані руш. Лицар, що проїжджав повз, регоче, і ти платиш за видовище.",
            { gold: -15 },
          ),
        ],
      },
      {
        icon: "scrollUnfurled",
        label: both("Read the inscription", "Прочитати напис"),
        outcomes: [
          out(
            2,
            "The words are a lesson in humility. It sticks with you.",
            "Слова виявляються уроком смирення. Він залишається з тобою.",
            { card: "own" },
          ),
          out(
            2,
            "A priest pays you to copy the inscription.",
            "Священник платить тобі за копію напису.",
            { gold: 25 },
          ),
        ],
      },
    ],
  },
  {
    id: "pandora",
    icon: "lockedChest",
    tint: "#b06bd1",
    weight: 1,
    title: both("The jar that stays shut", "Глек, що має лишатися закритим"),
    text: both(
      "A sealed clay jar hums on a flat rock. A tiny voice inside whispers that something good is left at the very bottom.",
      "Запечатаний глиняний глек гуде на пласкому камені. Тихенький голос усередині шепоче, що на дні лишилося щось добре.",
    ),
    choices: [
      {
        icon: "key",
        label: both("Break the seal", "Зламати печатку"),
        outcomes: [
          out(
            2,
            "Troubles swarm out and chew your purse, but Hope stays: a card.",
            "Лиха виривається назовні й гризе гаманець, та Надія залишається: це карта.",
            { gold: -20, card: "any" },
          ),
          out(
            2,
            "Only Hope was left inside, and it pays well.",
            "Усередині лишилася лише Надія, і вона щедро платить.",
            { gold: 40 },
          ),
          out(
            1,
            "The jar is empty. Whatever lived here is already out.",
            "Глек порожній. Те, що тут жило, вже на волі.",
          ),
        ],
      },
      {
        icon: "padlock",
        label: both("Reseal it and sell it", "Запечатати й продати"),
        outcomes: [
          out(
            1,
            "A collector pays handsomely for a jar nobody dares open.",
            "Колекціонер щедро платить за глек, який ніхто не наважується відкрити.",
            { gold: 30 },
          ),
        ],
      },
    ],
  },
  {
    id: "peaches",
    icon: "sun",
    tint: "#e98f6b",
    weight: 1,
    title: both("Peaches of immortality", "Персики безсмертя"),
    text: both(
      "An orchard of golden peaches sways above the clouds. A monkey in golden armor has already raided it once, and the guards remember.",
      "Сад золотих персиків гойдається над хмарами. Мавпа в золотих обладунках уже обносила його одного разу, і охоронці це пам'ятають.",
    ),
    choices: [
      {
        icon: "bread",
        label: both("Eat a fallen peach", "З'їсти впалий персик"),
        outcomes: [
          out(
            3,
            "Warmth and clarity flood you. An old move feels new again.",
            "Тепло й ясність заливають тебе. Старий прийом знов здається новим.",
            { card: "own" },
          ),
          out(
            1,
            "It was overripe. A healer charges you for the cramps.",
            "Він був перестиглий. Цілитель бере гроші за біль у животі.",
            { gold: -10 },
          ),
        ],
      },
      {
        icon: "robberHand",
        label: both("Steal a basketful", "Поцупити кошик"),
        outcomes: [
          out(
            2,
            "You slip away and sell them to a very grateful monk.",
            "Ти тікаєш і продаєш їх дуже вдячному ченцеві.",
            { gold: 55 },
          ),
          out(
            2,
            "The guards catch you and you pay the fine in coins.",
            "Охоронці ловлять тебе, і ти сплачуєш штраф монетами.",
            { gold: -25 },
          ),
        ],
      },
    ],
  },
  {
    id: "houdini",
    icon: "padlock",
    tint: "#c9a227",
    weight: 1,
    title: both("The great escape", "Велика втеча"),
    text: both(
      "A crowd gathers around a man in chains hanging over a river. The man grins: he has never failed to escape, and neither will he today.",
      "Натовп збирається навколо чоловіка в ланцюгах, що висить над річкою. Чоловік усміхається: він ще ніколи не провалював втечу, не провалить і сьогодні.",
    ),
    choices: [
      {
        icon: "coins",
        label: both("Bet he escapes", "Поставити на втечу"),
        cost: 20,
        outcomes: [
          out(
            4,
            "He emerges before the count of ten. The bookies pay out.",
            "Він виринає ще до десяти. Букмекери платять.",
            { gold: 55 },
          ),
          out(
            1,
            "He surfaces five minutes late, soaked and furious. You lose the bet.",
            "Він випливає на п'ять хвилин пізніше, мокрий і розлючений. Ставка програна.",
          ),
        ],
      },
      {
        icon: "lockpicks",
        label: both("Ask him to teach you", "Попросити навчити"),
        cost: 15,
        outcomes: [
          out(
            1,
            "A magician never tells, but he lets you watch. You copy a trick.",
            "Чарівник ніколи не розкриває секретів, та дозволяє дивитись. Ти копіюєш прийом.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "robberMask",
        label: both("Pick the crowd's pockets", "Обшукати кишені в натовпі"),
        outcomes: [
          out(
            2,
            "Everyone is watching the river. Easy pickings.",
            "Усі дивляться на річку. Легка здобич.",
            { gold: 35 },
          ),
          out(
            1,
            "The escape artist spots you mid-trick and fines you from the stage.",
            "Ілюзіоніст помічає тебе просто посеред фокуса й штрафує зі сцени.",
            { gold: -20 },
          ),
        ],
      },
    ],
  },
  {
    id: "sherwood",
    icon: "swordman",
    tint: "#4f9a4a",
    weight: 1,
    title: both("The Sherwood contest", "Змагання в Шервуді"),
    text: both(
      "Targets line a clearing under the old oaks. A silver arrow is the prize, and a hooded archer in green is the man to beat.",
      "Мішені стоять у лісовому проламі під старими дубами. Нагорода — срібна стріла, а лучник у зеленому каптурі — той, кого треба перемогти.",
    ),
    choices: [
      {
        icon: "crossedSwords",
        label: both("Enter the contest", "Узяти участь"),
        cost: 10,
        outcomes: [
          out(
            2,
            "A bullseye! The silver arrow and the purse are yours.",
            "Влучання в яблучко! Срібна стріла й гаманець твої.",
            { gold: 50 },
          ),
          out(
            2,
            "Second place, but the archer teaches you how to split an arrow.",
            "Друге місце, зате лучник показує, як розколоти стрілу.",
            { card: "any" },
          ),
          out(
            1,
            "Your arrow lands in the mud. The crowd roars.",
            "Твоя стріла падає в багнюку. Натовп ревить.",
          ),
        ],
      },
      {
        icon: "coins",
        label: both("Bet on the archer", "Поставити на лучника"),
        cost: 15,
        outcomes: [
          out(
            4,
            "Of course he wins. The bet pays double.",
            "Звісно, він перемагає. Ставка приносить подвійну виплату.",
            { gold: 35 },
          ),
          out(
            1,
            "A strong gust of wind throws his shot. You lose.",
            "Сильний порив вітру збиває його постріл. Ти програєш.",
          ),
        ],
      },
    ],
  },
  {
    id: "jekyll",
    icon: "candleFlame",
    tint: "#6fae5a",
    weight: 1,
    title: both("A flask of green liquid", "Колба зі смарагдовою рідиною"),
    text: both(
      "In a dim laboratory, a flask bubbles on its own. A note in neat handwriting reads: the doctor accepts no responsibility for his other self.",
      "У темній лабораторії колба булькоче сама по собі. Записка охайним почерком: лікар не відповідає за свою другу особистість.",
    ),
    choices: [
      {
        icon: "waterDrop",
        label: both("Drink it", "Випити"),
        outcomes: [
          out(
            2,
            "Strength surges through you. Something savage settles into your deck.",
            "Тебе пронизує сила. Щось дике оселяється у твоїй колоді.",
            { card: "any" },
          ),
          out(
            2,
            "You wake up in an alley with an empty purse.",
            "Ти прокидаєшся в провулку з порожнім гаманцем.",
            { gold: -30 },
          ),
        ],
      },
      {
        icon: "magnifyingGlass",
        label: both("Study the notes", "Вивчити записи"),
        outcomes: [
          out(
            2,
            "The notes are brilliant. You adapt a method of your own.",
            "Записи геніальні. Ти адаптуєш власний метод.",
            { card: "own" },
          ),
          out(
            1,
            "A colleague of the doctor pays you for the research.",
            "Колега лікаря платить тобі за дослідження.",
            { gold: 30 },
          ),
        ],
      },
    ],
  },
  {
    id: "dracula",
    icon: "castle",
    tint: "#a3253a",
    weight: 1,
    title: both("An invitation from the castle", "Запрошення із замку"),
    text: both(
      "A black carriage waits at the crossroads. A pale count's seal glows on the invitation, and the horses do not breathe.",
      "На роздоріжжі чекає чорна карета. На запрошенні мерехтить печатка блідого графа, а коні не дихають.",
    ),
    choices: [
      {
        icon: "castle",
        label: both("Dine with the Count", "Повечеряти з графом"),
        outcomes: [
          out(
            2,
            "He is a gracious host. A gift from his ancient collection follows.",
            "Він люб'язний господар. Слідує подарунок із його давньої колекції.",
            { card: "any" },
          ),
          out(
            2,
            "The meal is fine, but the bill is paid in blood and coin.",
            "Вечеря чудова, але рахунок оплачується кров'ю та монетами.",
            { gold: -25 },
          ),
        ],
      },
      {
        icon: "robberHand",
        label: both("Raid the crypt", "Обшукати склеп"),
        outcomes: [
          out(
            2,
            "Old tombs hold old riches.",
            "Старі гробниці ховають старі скарби.",
            { gold: 50 },
          ),
          out(
            1,
            "The crypt wakes. You flee and drop half your coins.",
            "Склеп прокидається. Ти тікаєш і губиш половину монет.",
            { gold: -30 },
          ),
        ],
      },
    ],
  },
  {
    id: "alice",
    icon: "uncertainty",
    tint: "#e07bb5",
    weight: 1,
    title: both("The grinning cat", "Усміхнений кіт"),
    text: both(
      "A striped grin hangs in the air above a branch. The cat purrs: answer my riddle, or don't, it makes no difference to me.",
      "Смугаста усмішка висить у повітрі над гілкою. Кіт муркоче: відповідай на мою загадку, чи ні, мені однаково.",
    ),
    choices: [
      {
        icon: "crystalBall",
        label: both("Answer the riddle", "Відповісти на загадку"),
        outcomes: [
          out(
            2,
            "Correct, or so he claims. A card appears in your pocket.",
            "Правильно, принаймні так він каже. У кишені з'являється карта.",
            { card: "any" },
          ),
          out(
            2,
            "Wrong, but he is amused and drops a few coins.",
            "Неправильно, але його це розважає, і він скидає кілька монет.",
            { gold: 20 },
          ),
          out(
            1,
            "The cat vanishes, leaving only the smile.",
            "Кіт зникає, лишивши тільки усмішку.",
          ),
        ],
      },
      {
        icon: "footsteps",
        label: both("Ask for directions", "Спитати дорогу"),
        outcomes: [
          out(
            1,
            "He points every way at once. You get lost and pay a guide.",
            "Він показує одразу в усі боки. Ти блукаєш і платиш провідникові.",
            { gold: -10 },
          ),
          out(
            1,
            "He points up. A card is stuck in the branch.",
            "Він показує вгору. У гілці застрягла карта.",
            { card: "any" },
          ),
        ],
      },
    ],
  },
  {
    id: "genie",
    icon: "candleFlame",
    tint: "#3bb5c9",
    weight: 1,
    title: both("The lamp in the sand", "Лампа в піску"),
    text: both(
      "A dented brass lamp pokes out of the dune. When you rub the sand away, a bored voice sighs: three wishes, but read the fine print.",
      "З бархана стирчить помята мідна лампа. Коли ти змітаєш пісок, нудний голос зітхає: три бажання, та читай дрібний шрифт.",
    ),
    choices: [
      {
        icon: "twoCoins",
        label: both("Wish for riches", "Побажати багатства"),
        outcomes: [
          out(
            3,
            "Gold rains down. The spirit smirks: you didn't say whose.",
            "Золото сиплеться дощем. Дух пирхає: ти не уточнив, чиє.",
            { gold: 45 },
          ),
          out(
            1,
            "The spirit grants it literally: one gold coin.",
            "Дух виконує буквально: одна золота монета.",
            { gold: 1 },
          ),
        ],
      },
      {
        icon: "cardRandom",
        label: both("Wish for knowledge", "Побажати знань"),
        outcomes: [
          out(
            3,
            "A technique unfolds in your mind, complete and clear.",
            "Прийом розгортається в голові повністю й чітко.",
            { card: "any" },
          ),
          out(
            1,
            "You now know everything about the lamp. Nothing else.",
            "Тепер ти знаєш усе про лампу. І нічого більше.",
          ),
        ],
      },
      {
        icon: "rollingDices",
        label: both("Wish for more wishes", "Побажати більше бажань"),
        outcomes: [
          out(
            1,
            "The spirit sighs and throws you a card to shut you up.",
            "Дух зітхає й кидає тобі карту, щоб ти замовк.",
            { card: "any" },
          ),
          out(
            2,
            "He vanishes into the lamp, taking a tip from your purse.",
            "Він зникає в лампі, прихопивши чайові з твого гаманця.",
            { gold: -15 },
          ),
        ],
      },
    ],
  },
  {
    id: "loki",
    icon: "ghost",
    tint: "#2e9d62",
    weight: 1,
    title: both("A trickster's offer", "Пропозиція трикстера"),
    text: both(
      "A stranger with a green smile sits on your road. He spreads his hands: a small wager, nothing you cannot afford to lose.",
      "На твоїй дорозі сидить незнайомець із зеленою усмішкою. Він розводить руками: невеличке парі, нічого, що ти не зміг би дозволити собі втратити.",
    ),
    choices: [
      {
        icon: "scales",
        label: both("Accept the wager", "Прийняти парі"),
        cost: 20,
        outcomes: [
          out(
            1,
            "For once, the god of lies keeps his word. Double your stake.",
            "Цього разу бог брехні тримає слово. Подвійна ставка.",
            { gold: 60 },
          ),
          out(
            1,
            "He wins and pockets your coins with a bow.",
            "Він виграє й ховає твої монети з уклоном.",
          ),
          out(
            1,
            "He wins, but pays out in a stolen card.",
            "Він виграє, але платить краденою картою.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "ninjaMask",
        label: both("Outwit him", "Перехитрити його"),
        outcomes: [
          out(
            1,
            "You spot the trick first. He applauds and hands over a card.",
            "Ти помічаєш фокус першим. Він аплодує й віддає карту.",
            { card: "own" },
          ),
          out(
            2,
            "He was one step ahead and your purse is lighter.",
            "Він випередив тебе на крок, і гаманець полегшав.",
            { gold: -15 },
          ),
        ],
      },
    ],
  },
  {
    id: "raptors",
    icon: "skullCrossedBones",
    tint: "#d98a2b",
    weight: 1,
    title: both("Rustling in the ferns", "Шерех у папороті"),
    text: both(
      "The ferns tremble. A pack of raptors tracks you in silence, closing the circle with the patience of old hunters.",
      "Папороть тремтить. Зграя раптори безгучно вистежує тебе, змикаючи коло з терпінням старих мисливців.",
    ),
    choices: [
      {
        icon: "bread",
        label: both("Throw them your rations", "Кинути їм припаси"),
        cost: 10,
        outcomes: [
          out(
            3,
            "They squabble over the meat. You slip away unhurt.",
            "Вони сваряться за м'ясо. Ти непомітно втікаєш неушкодженим.",
          ),
          out(
            1,
            "One of them drops a shiny card they were guarding.",
            "Один із них упускає блискучу карту, яку охороняв.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "torch",
        label: both("Drive them off with fire", "Прогнати вогнем"),
        outcomes: [
          out(
            2,
            "The torch holds them back. You find their stash.",
            "Смолоскип стримує їх. Ти знаходиш їхній сховок.",
            { gold: 40 },
          ),
          out(
            2,
            "They circle and strike. You escape but lose coins.",
            "Вони кружляють і б'ють. Ти втікаєш, але губиш монети.",
            { gold: -25 },
          ),
        ],
      },
    ],
  },
  {
    id: "medusa",
    icon: "skullStaff",
    tint: "#6c8a55",
    weight: 1,
    title: both("The garden of statues", "Сад статуй"),
    text: both(
      "A courtyard crowded with stone warriors, each frozen mid-scream. Something hisses overhead. The serpent-haired queen never forgets a face.",
      "Двір, заповнений кам'яними воїнами, кожен завмер посеред крику. Згори чути сичання. Королева зі зміями замість волосся ніколи не забуває облич.",
    ),
    choices: [
      {
        icon: "robberHand",
        label: both("Loot the statues", "Обшукати статуї"),
        outcomes: [
          out(
            2,
            "Stone warriors still carry their purses.",
            "Кам'яні воїни досі носять свої гаманці.",
            { gold: 50 },
          ),
          out(
            2,
            "A hiss! You shut your eyes and flee, dropping coins.",
            "Сичання! Ти заплющуєш очі й тікаєш, розсипаючи монети.",
            { gold: -30 },
          ),
        ],
      },
      {
        icon: "magnifyingGlass",
        label: both(
          "Use a polished shield as a mirror",
          "Скористатися щитом як дзеркалом",
        ),
        outcomes: [
          out(
            2,
            "You watch her in the reflection and learn how she moves.",
            "Ти стежиш за нею в відблиску й вчишся її рухам.",
            { card: "any" },
          ),
          out(
            1,
            "The shield is too dull. You back out slowly.",
            "Щит надто тьмяний. Ти повільно відступаєш.",
          ),
        ],
      },
    ],
  },
  {
    id: "wakanda",
    icon: "key",
    tint: "#7b5cc4",
    weight: 1,
    title: both("A shard of vibranium", "Уламок вібраніуму"),
    text: both(
      "A quiet trader unwraps a cloth. Inside lies a shard of metal that hums softly and swallows the light, the pride of a hidden kingdom.",
      "Тихий торговець розгортає тканину. Усередині лежить уламок металу, що тихо гуде й поглинає світло, — гордість прихованого королівства.",
    ),
    choices: [
      {
        icon: "coins",
        label: both("Buy the shard", "Купити уламок"),
        cost: 30,
        outcomes: [
          out(
            3,
            "A smith turns it into something remarkable for your deck.",
            "Коваль перетворює його на дещо чудове для твоєї колоди.",
            { card: "any" },
          ),
          out(
            1,
            "A fake. The trader is already gone.",
            "Підробка. Торговця вже немає.",
          ),
        ],
      },
      {
        icon: "shakingHands",
        label: both("Trade a story for it", "Обміняти на історію"),
        outcomes: [
          out(
            2,
            "He loves your tale and pays for it in silver.",
            "Йому подобається твоя оповідь, і він платить за неї сріблом.",
            { gold: 25 },
          ),
          out(
            2,
            "He listens politely and says nothing.",
            "Він чемно слухає й нічого не каже.",
          ),
        ],
      },
    ],
  },
  {
    id: "strange",
    icon: "boltSpellCast",
    tint: "#d07a2b",
    weight: 1,
    title: both("The mirror dimension", "Дзеркальний вимір"),
    text: both(
      "The street folds like a paper fan. A sorcerer's mirror dimension spills across the road and for a moment you can see every path at once.",
      "Вулиця складається, наче паперове віяло. Дзеркальний вимір чародія розливається по дорозі, і на мить ти бачиш усі шляхи одразу.",
    ),
    choices: [
      {
        icon: "crystalBall",
        label: both("Step inside", "Увійти"),
        outcomes: [
          out(
            2,
            "You glimpse a better version of your own deck.",
            "Ти бачиш кращу версію власної колоди.",
            { card: "own" },
          ),
          out(
            2,
            "You step out with a card that was not yours yesterday.",
            "Ти виходиш із картою, якої вчора в тебе не було.",
            { card: "any" },
          ),
          out(
            1,
            "Time folds back. You are minus a few coins.",
            "Час згортається назад. Ти лишаєшся без кількох монет.",
            { gold: -15 },
          ),
        ],
      },
      {
        icon: "hourglass",
        label: both(
          "Sell a glimpse of the future",
          "Продати проблиск майбутнього",
        ),
        outcomes: [
          out(
            1,
            "A nervous merchant pays well for tomorrow's prices.",
            "Знервований купець добре платить за завтрашні ціни.",
            { gold: 35 },
          ),
        ],
      },
    ],
  },
  {
    id: "mead",
    icon: "bread",
    tint: "#c9852b",
    weight: 1,
    title: both("The mead hall", "Медова зала"),
    text: both(
      "Torches roar in a long timber hall. A giant of a man bellows over the din: he welcomes anyone who is brave, or thirsty.",
      "У довгій дерев'яній залі ревуть смолоскипи. Велетень гукає крізь гамір: він вітає кожного, хто відважний чи спраглий.",
    ),
    choices: [
      {
        icon: "punch",
        label: both("Arm-wrestle the giant", "Поборотися на руках із велетнем"),
        outcomes: [
          out(
            1,
            "Impossible, but he is a good sport. A reward follows.",
            "Неможливо, та він добрий суперник. Слідує нагорода.",
            { gold: 45 },
          ),
          out(
            3,
            "He wins in a blink. The hall cheers, and you buy the round.",
            "Він перемагає миттю. Зала вітає, а ти купуєш чарку для всіх.",
            { gold: -15 },
          ),
        ],
      },
      {
        icon: "bread",
        label: both("Feast with the warriors", "Бенкетувати з воїнами"),
        cost: 10,
        outcomes: [
          out(
            3,
            "Between toasts, an old warrior shows you a move.",
            "Поміж тостами старий воїн показує тобі прийом.",
            { card: "any" },
          ),
          out(
            1,
            "You wake up with no memory and a fine hangover.",
            "Ти прокидаєшся без спогадів і з чудовим похміллям.",
          ),
        ],
      },
    ],
  },
  {
    id: "invisible",
    icon: "ghost",
    tint: "#8fa3b8",
    weight: 1,
    title: both("Footprints in the mud", "Сліди в багнюці"),
    text: both(
      "Footprints appear in the mud one by one, with no one making them. Bandages and a pair of dark goggles lie by a fogbound inn. Someone is very much here.",
      "Сліди з'являються в багнюці один за одним, а того, хто їх лишає, не видно. Біля оповитого туманом заїзду лежать бинти й темні окуляри. Хтось тут неодмінно є.",
    ),
    choices: [
      {
        icon: "magnifyingGlass",
        label: both(
          "Throw flour and expose him",
          "Кинути борошно й викрити його",
        ),
        outcomes: [
          out(
            2,
            "A white outline gasps and drops his stolen purse.",
            "Біла постать охає й випускає вкрадений гаманець.",
            { gold: 45 },
          ),
          out(
            2,
            "He bolts, sneezing, and your pockets are lighter by the time you look.",
            "Він тікає, чхаючи, а твої кишені вже легші, коли ти оглядаєшся.",
            { gold: -20 },
          ),
        ],
      },
      {
        icon: "shakingHands",
        label: both("Offer him a deal", "Запропонувати угоду"),
        cost: 20,
        outcomes: [
          out(
            3,
            "A voice from nowhere whispers a trick of vanishing.",
            "Голос нізвідки шепоче прийом зникання.",
            { card: "any" },
          ),
          out(
            1,
            "The voice takes your coin and says nothing more.",
            "Голос бере монету й більше нічого не каже.",
          ),
        ],
      },
      {
        icon: "ninjaMask",
        label: both("Follow the footprints", "Піти за слідами"),
        outcomes: [
          out(
            2,
            "They lead to a cellar stuffed with loot.",
            "Вони ведуть до погреба, повного здобичі.",
            { gold: 55 },
          ),
          out(
            1,
            "They lead in circles, then he laughs right behind you.",
            "Вони водять колами, а потім він сміється прямо за твоєю спиною.",
            { gold: -25 },
          ),
          out(
            1,
            "They end at a notebook of strange formulas.",
            "Вони закінчуються біля зошита з дивними формулами.",
            { card: "own" },
          ),
        ],
      },
    ],
  },
  {
    id: "hamlet",
    icon: "skullStaff",
    tint: "#5a5f86",
    weight: 1,
    title: both("To be, or not to be", "Бути чи не бути"),
    text: both(
      "A pale youth stands in a graveyard, a skull in his hand, speaking to it as if to an old friend. Two courtiers hover behind him, nodding at everything.",
      "Блідий юнак стоїть на цвинтарі з черепом у руці й говорить до нього, наче до давнього друга. Двоє придворних тінями ходять позаду й кивають на кожне слово.",
    ),
    choices: [
      {
        icon: "crowbar",
        label: both("Dig a grave for him", "Допомогти могильникам"),
        outcomes: [
          out(
            3,
            "The gravedigger pays you for a day of honest work.",
            "Могильник платить тобі за день чесної праці.",
            { gold: 35 },
          ),
          out(
            1,
            "You turn up a buried purse. The skull would not mind.",
            "Ти відкопуєш закопаний гаманець. Череп не заперечив би.",
            { gold: 60 },
          ),
        ],
      },
      {
        icon: "scrollUnfurled",
        label: both("Perform his play", "Зіграти в його виставі"),
        cost: 10,
        outcomes: [
          out(
            2,
            "The play catches the conscience of the court. The youth rewards you.",
            "Вистава зачіпає сумління двору. Юнак винагороджує тебе.",
            { card: "any" },
          ),
          out(
            2,
            "The audience boos you off the stage and demands coin back.",
            "Глядачі освистують тебе й вимагають гроші назад.",
            { gold: -20 },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both("Answer his question", "Відповісти на його питання"),
        remove: true,
        gold: 15,
        text: both(
          "You say: not to be, at least not what you were. A burden slips away and he tips you for it.",
          "Ти кажеш: не бути, принаймні тим, ким був. Тягар спадає, і він дає тобі на чай.",
        ),
      },
      {
        icon: "swordman",
        label: both(
          "Draw steel on the courtiers",
          "Оголити меч проти придворних",
        ),
        outcomes: [
          out(
            2,
            "They scatter and leave their purses in the dust.",
            "Вони розбігаються, лишаючи гаманці в пилюці.",
            { gold: 40 },
          ),
          out(
            1,
            "The youth calls it madness. Method in it, though, and you learn a lesson.",
            "Юнак називає це божевіллям. Хоч і системним, і ти вивчаєш урок.",
            { card: "any" },
          ),
        ],
      },
    ],
  },
  {
    id: "raptors-nest",
    icon: "hornedSkull",
    tint: "#b8863a",
    weight: 1,
    title: both("The abandoned nest", "Покинуте гніздо"),
    text: both(
      "A nest of leaf and bone sits among the roots, a few speckled eggs still warm. The pack is out hunting, but not for long.",
      "Гніздо з листя й кісток лежить між корінням, кілька рябих яєць іще теплі. Зграя вийшла на полювання, та ненадовго.",
    ),
    choices: [
      {
        icon: "robberHand",
        label: both("Steal an egg", "Поцупити яйце"),
        outcomes: [
          out(
            2,
            "A collector pays a fortune for it.",
            "Колекціонер платить за нього цілий статок.",
            { gold: 80 },
          ),
          out(
            2,
            "The pack returns while you are running. You drop your purse.",
            "Зграя повертається, поки ти біжиш. Ти губиш гаманець.",
            { gold: -35 },
          ),
        ],
      },
      {
        icon: "magnifyingGlass",
        label: both(
          "Study their hunting trail",
          "Вивчити їхній мисливський слід",
        ),
        outcomes: [
          out(
            3,
            "Coordinated, patient, merciless. You learn from it.",
            "Злагоджено, терпляче, нещадно. Ти вчишся в них.",
            { card: "any" },
          ),
          out(
            1,
            "You find only old bones and nothing more.",
            "Ти знаходиш лише старі кістки.",
          ),
        ],
      },
      {
        icon: "torch",
        label: both("Set a trap and wait", "Поставити пастку й чекати"),
        cost: 15,
        outcomes: [
          out(
            2,
            "Two raptors fall in. Their hide is worth a lot.",
            "Двоє раптори потрапляють у пастку. Їхня шкура коштує чимало.",
            { gold: 70 },
          ),
          out(
            1,
            "They sniff the trap and wait for you instead.",
            "Вони винюхують пастку й натомість чекають на тебе.",
            { gold: -20 },
          ),
        ],
      },
    ],
  },
  {
    id: "msmarvel",
    icon: "muscleUp",
    tint: "#d6453b",
    weight: 1,
    title: both("The runaway cart", "Віз, що втік"),
    text: both(
      "A cart loaded with barrels careers down the hill toward a market square. A teenage girl in a battered scarf is already sprinting toward it.",
      "Віз із бочками мчить схилом до ринкової площі. Дівчина-підліток у пошарпаному шарфі вже біжить до нього.",
    ),
    choices: [
      {
        icon: "muscleUp",
        label: both(
          "Stretch out and grab the reins",
          "Дотягнутися й схопити віжки",
        ),
        outcomes: [
          out(
            3,
            "The market cheers and the merchants tip generously.",
            "Ринок аплодує, а купці щедро дякують.",
            { gold: 50 },
          ),
          out(
            1,
            "You catch it, but a barrel breaks and you pay the damage.",
            "Ти зупиняєш віз, але бочка трощиться, і ти платиш за збитки.",
            { gold: -20 },
          ),
        ],
      },
      {
        icon: "shakingHands",
        label: both("Help her steer", "Допомогти їй правити возом"),
        outcomes: [
          out(
            1,
            "Together you save the day. She shows you a trick.",
            "Разом ви рятуєте всіх. Вона показує тобі прийом.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "coinsPile",
        label: both("Loot the spilled cargo", "Зібрати розсипаний вантаж"),
        outcomes: [
          out(
            2,
            "Spilled goods and nobody watching.",
            "Розсипаний крам, і ніхто не дивиться.",
            { gold: 35 },
          ),
          out(
            1,
            "She sees you and turns very large indeed.",
            "Вона помічає тебе й стає дуже великою.",
            { gold: -25 },
          ),
        ],
      },
    ],
  },
  {
    id: "spiderman",
    icon: "uncertainty",
    tint: "#c4383f",
    weight: 1,
    title: both("Threads between rooftops", "Павутиння між дахами"),
    text: both(
      "Sticky threads stretch between two rooftops, and a purse dangles in the middle. Somewhere above, a masked figure chuckles and cracks a joke.",
      "Липкі нитки тягнуться між двома дахами, а посередині теліпається гаманець. Десь угорі масковий силует сміється й жартує.",
    ),
    choices: [
      {
        icon: "crowbar",
        label: both("Climb up and take it", "Видертися й забрати"),
        outcomes: [
          out(
            2,
            "You balance across and snatch the purse.",
            "Ти балансуєш і вихоплюєш гаманець.",
            { gold: 45 },
          ),
          out(
            2,
            "Your sense tingles too late. You fall into a haystack, poorer.",
            "Чуття спрацьовує запізно. Ти падаєш у сіно, бідніший.",
            { gold: -20 },
          ),
        ],
      },
      {
        icon: "rollingDices",
        label: both("Bet on a dare", "Закластися на сміливість"),
        cost: 15,
        outcomes: [
          out(
            2,
            "He swings by and pays you for the win.",
            "Він пролітає повз і платить за твою перемогу.",
            { gold: 50 },
          ),
          out(
            1,
            "He lets you pick a move from his bag of tricks.",
            "Він дає тобі обрати прийом зі своєї скарбнички.",
            { card: "any" },
          ),
          out(1, "Wall-crawling beats you.", "Лазіння стінами перемагає тебе."),
        ],
      },
    ],
  },
  {
    id: "tomoe",
    icon: "swordman",
    tint: "#b34a5c",
    weight: 1,
    title: both("The bridge duel", "Двобій на мосту"),
    text: both(
      "A woman in ornate armor stands motionless on a narrow bridge, a naginata at her side. She nods: nobody crosses without a duel.",
      "Жінка в розкішному обладунку нерухомо стоїть на вузькому мосту з нагінатою біля ноги. Вона киває: ніхто не перейде без двобою.",
    ),
    choices: [
      {
        icon: "crossedSwords",
        label: both("Accept the duel", "Прийняти двобій"),
        outcomes: [
          out(
            2,
            "You hold your own. She bows and gives you a card.",
            "Ти тримаєшся гідно. Вона вклоняється й віддає карту.",
            { card: "any" },
          ),
          out(
            2,
            "She wins in three strokes and takes a toll.",
            "Вона перемагає трьома ударами й бере мито.",
            { gold: -25 },
          ),
        ],
      },
      {
        icon: "coins",
        label: both("Pay the toll", "Заплатити мито"),
        cost: 20,
        outcomes: [
          out(
            1,
            "She respects an honest traveler and lets you pass.",
            "Вона шанує чесних мандрівників і пропускає тебе.",
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both("Meditate on the bridge", "Помедитувати на мосту"),
        remove: true,
        gold: 0,
        text: both(
          "Stillness wins where force fails. You let go of something unnecessary.",
          "Спокій перемагає там, де безсила сила. Ти відпускаєш щось зайве.",
        ),
      },
    ],
  },
  {
    id: "soldier",
    icon: "padlock",
    tint: "#6b7b8c",
    weight: 1,
    title: both("The frozen vault", "Крижане сховище"),
    text: both(
      "A cryo vault sits half-buried in snow, its glass cracked. A man with a metal arm stares at you, as if trying to remember who you are.",
      "Кріосховище напівзаметене снігом, скло потріскане. Чоловік із металевою рукою дивиться на тебе, ніби намагається згадати, хто ти.",
    ),
    choices: [
      {
        icon: "shakingHands",
        label: both("Offer him a hand", "Простягнути йому руку"),
        outcomes: [
          out(
            2,
            "He remembers a lesson and passes it on.",
            "Він згадує урок і передає його тобі.",
            { card: "any" },
          ),
          out(
            2,
            "He remembers the wrong thing and your purse takes the blow.",
            "Він згадує не те, і гаманець приймає удар.",
            { gold: -25 },
          ),
        ],
      },
      {
        icon: "lockpicks",
        label: both("Crack open the vault", "Зламати сховище"),
        outcomes: [
          out(
            3,
            "Old Soviet coins, worth a surprising amount.",
            "Старі радянські монети, що коштують на диво багато.",
            { gold: 50 },
          ),
          out(1, "Only ice and dust.", "Лише лід і пил."),
        ],
      },
      {
        icon: "monkFace",
        label: both("Help him forget", "Допомогти йому забути"),
        remove: true,
        gold: 20,
        text: both(
          "Some memories are better lost. He pays you for the kindness.",
          "Деякі спогади краще забути. Він платить тобі за доброту.",
        ),
      },
    ],
  },
  {
    id: "jill",
    icon: "crystalBall",
    tint: "#9b6bc4",
    weight: 1,
    title: both("The doctor's clinic", "Клініка доктора"),
    text: both(
      'A small clinic smells of tinctures and old books. A calm woman in a white coat sets a swinging pendulum between you. "Look closely," she says.',
      "У невеликій клініці пахне настоянками та старими книжками. Спокійна жінка в білому халаті розгойдує між вами маятник. «Дивись уважно», каже вона.",
    ),
    choices: [
      {
        icon: "crystalBall",
        label: both("Submit to hypnosis", "Піддатися гіпнозу"),
        outcomes: [
          out(
            2,
            "You remember a forgotten technique.",
            "Ти згадуєш забутий прийом.",
            { card: "own" },
          ),
          out(
            2,
            "You wake up wondering where your money went.",
            "Ти прокидаєшся й дивуєшся, куди поділися гроші.",
            { gold: -20 },
          ),
        ],
      },
      {
        icon: "firstAidKit",
        label: both("Buy a tonic", "Купити тонік"),
        cost: 25,
        outcomes: [
          out(
            2,
            "The tonic works wonders. She adds a free lesson.",
            "Тонік творить дива. Вона додає безкоштовний урок.",
            { card: "any" },
          ),
          out(
            1,
            "It tastes terrible and does nothing.",
            "Смак жахливий, а користі жодної.",
          ),
        ],
      },
      {
        icon: "bookPile",
        label: both("Browse her notes", "Погортати її нотатки"),
        pick: 2,
      },
    ],
  },
  {
    id: "wyatt",
    icon: "rollingDices",
    tint: "#b0823a",
    weight: 1,
    title: both("High noon", "Опівдні"),
    text: both(
      "The town is empty at noon, save for a lawman leaning on a rail and a stranger at the other end of the street. The lawman tips his hat to you.",
      "Опівдні містечко порожнє, лише шериф спирається на поруччя, а на іншому кінці вулиці стоїть незнайомець. Шериф киває тобі.",
    ),
    choices: [
      {
        icon: "crossedSwords",
        label: both("Stand with the marshal", "Стати поруч із шерифом"),
        outcomes: [
          out(
            3,
            "The outlaw backs down. The marshal shares the bounty.",
            "Вигнанець відступає. Шериф ділиться нагородою.",
            { gold: 50 },
          ),
          out(
            1,
            "Shots ring out and you duck behind a barrel. A card lands at your feet.",
            "Лунають постріли, і ти ховаєшся за бочку. Біля ніг падає карта.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "coins",
        label: both("Bet on the outlaw", "Поставити на розбійника"),
        cost: 20,
        outcomes: [
          out(
            1,
            "Against all odds, he draws first. The saloon pays you.",
            "Всупереч шансам, він стріляє першим. Салун платить тобі.",
            { gold: 90 },
          ),
          out(
            3,
            "The lawman is faster. You lose the bet.",
            "Шериф швидший. Ставка програна.",
          ),
        ],
      },
      {
        icon: "robberMask",
        label: both("Raid the empty saloon", "Обшукати порожній салун"),
        outcomes: [
          out(
            2,
            "The till is open and the bartender is gone.",
            "Каса відчинена, бармена немає.",
            { gold: 40 },
          ),
          out(
            1,
            "The marshal catches you with a hand in the till.",
            "Шериф ловить тебе з рукою в касі.",
            { gold: -30 },
          ),
        ],
      },
    ],
  },
  {
    id: "venom",
    icon: "hornedSkull",
    tint: "#3a8f5a",
    weight: 1,
    title: both("A whispering shadow", "Шепіт у тіні"),
    text: both(
      'A soldier crouches in an alley, arguing with something in his own shadow. Black tendrils curl at his collar. "Quiet," he mutters. "It likes you."',
      "Солдат сидить навпочіпки в завулку й сперечається з чимось у власній тіні. Чорні щупальця звиваються біля його коміра. «Тихо», бурмоче він. «Ти йому подобаєшся».",
    ),
    choices: [
      {
        icon: "shakingHands",
        label: both(
          "Let it bond with you",
          "Дозволити йому з'єднатися з тобою",
        ),
        outcomes: [
          out(
            2,
            "A hungry power fills you, and a card appears in your hand.",
            "Голодна сила наповнює тебе, і в руці з'являється карта.",
            { card: "any" },
          ),
          out(
            2,
            "It takes more than it gives. Your purse is lighter.",
            "Воно бере більше, ніж дає. Гаманець легшає.",
            { gold: -30 },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both(
          "Make it feed on your doubts",
          "Дати йому поживитися сумнівами",
        ),
        remove: true,
        gold: 0,
        text: both(
          "The shadow devours a burden and goes quiet.",
          "Тінь пожирає тягар і затихає.",
        ),
      },
      {
        icon: "coins",
        label: both("Sell him supplies", "Продати йому припаси"),
        outcomes: [
          out(
            3,
            "He pays double. The symbiote loves chocolate.",
            "Він платить удвічі. Симбіот обожнює шоколад.",
            { gold: 35 },
          ),
          out(
            1,
            "He forgets to pay, and the shadow growls.",
            "Він забуває заплатити, і тінь гарчить.",
          ),
        ],
      },
    ],
  },
  {
    id: "spiderman_snapshot",
    icon: "laurels",
    tint: "#c4383f",
    weight: 1,
    title: both("Photo for the front page", "Фото на першу шпальту"),
    text: both(
      "A masked man in a red and blue suit drops down in front of you, swinging a camera on a strap. 'Hey! Perfect timing! Stand still and let me snap your portrait for the city paper, my editor pays a fortune for fresh legends!'",
      "Чоловік у червоно-синьому костюмі й масці падає перед вами, розгойдуючи камеру на ремінці. «Гей! Ідеальний момент! Стій смирно і дай я зроблю твій портрет для міської газети, мій редактор платить шалені гроші за свіжі легенди!»",
    ),
    choices: [
      {
        icon: "magnifyingGlass",
        label: both(
          "Strike a heroic pose for the shot",
          "Прийняти героїчну позу для знімка",
        ),
        outcomes: [
          out(
            2,
            "The shot turns out epic. The editor prints it on the front page, and you get a generous cut.",
            "Знімок виходить епічним. Редактор друкує його на першій шпальті, і ти отримуєш щедру частку.",
            { gold: 60 },
          ),
          out(
            1,
            "A sudden explosion ruins the frame, and your pose looks ridiculous. You leave empty-handed, fuming.",
            "Раптовий вибух псує кадр, а твоя поза виглядає безглуздо. Ти йдеш ні з чим і лютуєш.",
            { gold: -20 },
          ),
        ],
      },
      {
        icon: "rollingDices",
        label: both(
          "Ask for a selfie together (learn acrobatics)",
          "Зробити спільне селфі (навчишся акробатики)",
        ),
        cost: 15,
        outcomes: [
          out(
            2,
            "While dangling from a web, he teaches you a slick combat trick. You add a maneuver to your hand.",
            "Поки ви висите на павутині, він вчить тебе спритному бойовому прийому. Ти додаєш маневр у руку.",
            { card: "any" },
          ),
          out(
            1,
            "You slip from the ledge during the shot and crash hard. That hurt!",
            "Ти зриваєшся з карнизу під час зйомки і боляче падеш. Це було боляче!",
            { health: -3 },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both(
          "Offer an exclusive interview about your scars",
          "Запропонувати ексклюзивне інтерв'ю про свої шрами",
        ),
        remove: true,
        gold: 10,
        text: both(
          "You tell him a grim story of your past battles. He listens, stops joking for a moment, and shares a rare card from his stash.",
          "Ти розповідаєш йому похмуру історію твоїх минулих битв. Він слухає, на мить перестає жартувати і віддає рідкісну карту зі своєї схованки.",
        ),
      },
      {
        icon: "coins",
        label: both(
          "Demand payment upfront for the photoshoot",
          "Вимагати плату наперед за зйомку",
        ),
        outcomes: [
          out(
            1,
            "He laughs, tosses a heavy coin pouch, and snaps a quick shot before swinging away.",
            "Він сміється, кидає важкий гаманець з монетами і робить швидкий кадр, перш ніж злетіти геть.",
            { gold: 45 },
          ),
          out(
            2,
            "He calls you a diva, refuses to pay, and webs your boots to the pavement. You waste precious time freeing yourself.",
            "Він називає тебе дівою, відмовляється платити і приліплює твої черевики до асфальту. Ти втрачаєш дорогоцінний час, вивільняючись.",
            { health: -3 },
          ),
        ],
      },
    ],
  },

  {
    id: "invisible_tavern_cards",
    icon: "rollingDices",
    tint: "#8fa3b8",
    weight: 1,
    title: both("Cheater at the table", "Шулер за столом"),
    text: both(
      "You are playing high-stakes cards in a smoky tavern—there is a 100-gold pot on the table, half of it yours. Hand after hand goes to your opponent, who reads every bluff with uncanny precision. Out of the corner of your eye, you see cigar smoke curling around an empty space behind your shoulder. Someone invisible is peeking at your hand and signaling your rival.",
      "Ви граєте в карти в прокуреній таверні на великий банк — на кону 100 золотих, половина з яких ваші. Роздача за роздачею йде супернику, який читає кожен блеф із моторошною точністю. Краєм ока ви помічаєте, як дим сигари огинає порожнечу за вашим плечем. Хтось невидимий заглядає у ваші карти й подає знаки противнику.",
    ),
    choices: [
      {
        icon: "uncertainty",
        label: both(
          "Play blind and go all-in on a bluff",
          "Зіграти наосліп і піти ва-банк на блефі",
        ),
        outcomes: [
          out(
            2,
            "You swap your cards at the last second without looking. Your opponent trusts the ghost's false signal and loses the entire pot!",
            "Ти міняєш карти в останню секунду не дивлячись. Суперник вірить хибному знаку привида й програє весь банк!",
            { gold: 100 },
          ),
          out(
            1,
            "Your blind hand turns out to be worthless garbage. You lose your entire stake in the pot.",
            "Твоя карта наосліп виявляється повним сміттям. Ти втрачаєш усю свою частку банку.",
            { gold: -50 },
          ),
        ],
      },
      {
        icon: "swordman",
        label: both(
          "Flip the table and strike into thin air behind you",
          "Перекинути стіл і вдарити в порожнечу за спиною",
        ),
        outcomes: [
          out(
            2,
            "Your fist connects squarely with Griffin's jaw! In the ensuing brawl, you grab your stake back along with your rival's coin purse.",
            "Твій кулак точно знаходить щелепу Гріффіна! У бійці, що почалася, ти забираєш свою ставку й прихоплюєш гаманець суперника.",
            { gold: 65 },
          ),
          out(
            1,
            "You swing at empty air, the invisible man trips you, and the tavern bouncers throw you out bruised and lighter.",
            "Ти б'єш у повітря, невидимка підставляє підніжку, а викидайли таверни вишвирюють тебе на вулицю в синцях і без грошей.",
            { health: -3, gold: -35 },
          ),
        ],
      },
      {
        icon: "coins",
        label: both(
          "Quietly bribe the 'ghost' mid-hand",
          "Непомітно перекупити «привида» під час роздачі",
        ),
        cost: 30,
        outcomes: [
          out(
            2,
            "An unseen hand pockets your coins. Moments later, a voice whispers your rival's hand and shares a dirty combat trick.",
            "Невидима рука забирає монети. За мить голос шепоче тобі комбінацію суперника й ділиться брудним бойовим прийомом.",
            { card: "any", gold: 80 },
          ),
          out(
            1,
            "Griffin takes your 30-gold bribe and still sells you out. You lose both the bribe and your entire 50-gold stake in the pot!",
            "Гріффін бере твій хабар у 30 монет, але все одно здає тебе. Ти втрачаєш і хабар, і всю свою ставку в 50 золотих!",
            { gold: -50 },
          ),
        ],
      },
      {
        icon: "ninjaMask",
        label: both(
          "Fold calmly and corner him outside",
          "Спокійно скинути карти й притиснути його на виході",
        ),
        outcomes: [
          out(
            1,
            "You forfeit your 50-gold stake to walk away cleanly, then pin Griffin to the alley wall outside. Terrified, he hands over a secret technique to save his skin.",
            "Ти віддаєш свою ставку в 50 золотих, щоб спокійно вийти з гри, а надворі притискаєш Гріффіна до стіни провулка. Наляканий, він віддає таємний прийом, аби врятувати шкуру.",
            { gold: -50, card: "any" },
          ),
        ],
      },
    ],
  },

  {
    id: "hamlet_poison_cup",
    icon: "waterDrop",
    tint: "#5a5f86",
    weight: 1,
    title: both("Poison in the cup", "Отрута в кубку"),
    text: both(
      "A pale youth swirls a heavy silver goblet, eyeing you with a bitter smile. 'One of these cups is poisoned, and the other is pure wine. Care to test your fate, or shall we find another way to settle our dispute?'",
      "Блідий юнак крутить у руках важкий срібний кубок, дивлячись на тебе з гіркою посмішкою. «Один із цих кубків отруєний, а в іншому — чисте вино. Ризикнеш перевірити свою долю, чи пошукаємо інший спосіб вирішити суперечку?»",
    ),
    choices: [
      {
        icon: "rollingDices",
        label: both(
          "Risk drinking from a cup for a mental jolt",
          "Ризикнути випити з кубка заради ментальної встряски",
        ),
        outcomes: [
          out(
            2,
            "It was pure, aged wine! The rich taste clears your mind and sharpens your tactical focus, adding a maneuver to your hand.",
            "Це було чисте витримане вино! Напій освіжає розум і загострює тактичний фокус, додаючи маневр у руку.",
            { card: "any" },
          ),
          out(
            1,
            "Bad luck. The drink burns your throat, leaving you sick and weak.",
            "Невдача. Напій обпалює горло, залишаючи тебе хворим і виснаженим.",
            { health: -3 },
          ),
        ],
      },
      {
        icon: "coins",
        label: both(
          "Pay the youth to avoid the deadly game",
          "Заплатити юнаку, щоб уникнути смертельної гри",
        ),
        cost: 20,
        outcomes: [
          out(
            1,
            "He laughs, tosses the cups aside, and casually throws a tactical scroll your way.",
            "Він сміється, відкидає кубки вбік і недбало кидає тобі тактичний сувій.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both(
          "Toast to the fallen and pour the wine out",
          "Запропонувати тост за павших і вилити вино в землю",
        ),
        remove: true,
        gold: 5,
        text: both(
          "You refuse the deadly game and pour the wine out as a tribute. The dark thoughts of betrayal leave your mind, and The youth nods in respect, leaving a small coin.",
          "Ти відмовляєшся від смертельної гри й виливаєш вино на землю на згадку про полеглих. Похмурі думки покидають твою голову, а юнак кидає монету на знак поваги.",
        ),
      },
      {
        icon: "crossedSwords",
        label: both(
          "Knock the goblet out of his hands",
          "Різко вибити кубок із його рук",
        ),
        outcomes: [
          out(
            2,
            "The youth blinks in surprise, then smiles bitterly. He respects your fierce independence and tosses you a rare card from his sleeve.",
            "Блідий юнак здивовано кліпає, а потім гірко посміхається. Він поважає твою зухвалість і кидає рідкісну карту зі свого рукава.",
            { card: "any" },
          ),
          out(
            1,
            "He reacts instantly, deflecting your strike and grazing you with a hidden blade. 'Too impulsive,' he whispers.",
            "Він реагує миттєво, відбиваючи твій удар і дряпаючи прихованим лезом. «Занадто імпульсивно», шепоче він.",
            { health: -3 },
          ),
        ],
      },
    ],
  },

  {
    id: "hamlet_broken_mirror",
    icon: "crystalBall",
    tint: "#5a5f86",
    weight: 1,
    title: both("The shattered mirror", "Розбите дзеркало"),
    text: both(
      "In a derelict hall of the castle, a pale youth stands before a massive, cracked mirror. Shards reflect distorted versions of possible futures. 'Which face is the true one?' he whispers, gesturing for you to look.",
      "У напівзруйнованій залі замку блідий юнак стоїть перед велетенським тріснутим дзеркалом. Уламки відображають спотворені версії можливих майбутніх подій. «Яке обличчя справжнє?» — шепоче він, жестом запрошуючи тебе зазирнути.",
    ),
    choices: [
      {
        icon: "magnifyingGlass",
        label: both(
          "Peer into the cracks for insight",
          "Вдивитися в тріщини в пошуках прозріння",
        ),
        outcomes: [
          out(
            2,
            "Your gaze pierces through the illusion. You catch a glimpse of the enemy's next move and secure a tactical advantage in your hand.",
            "Твій погляд пробиває ілюзію. Ти вловлюєш наступний хід ворога й отримуєш тактичну перевагу в руку.",
            { card: "any" },
          ),
          out(
            1,
            "The shards pulse with blinding light, burning your eyes and filling your head with agonizing echoes.",
            "Уламки спалахують сліпучим світлом, випалюючи очі й наповнюючи голову болісними відлуннями.",
            { health: -3 },
          ),
        ],
      },
      {
        icon: "coins",
        label: both(
          "Pay the youth for advice against the illusion",
          "Заплатити юнаку за пораду проти ілюзії",
        ),
        cost: 15,
        outcomes: [
          out(
            1,
            "He mutters a short incantation and shatters the nearest fragment, handing you a card forged in the reflection.",
            "Він бурмоче коротке заклинання й розбиває найближчий осколок, віддаючи тобі карту, загартовану у віддзеркаленні.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "swordman",
        label: both(
          "Shatter the mirror with a punch",
          "Розбити дзеркало ударом кулака",
        ),
        outcomes: [
          out(
            2,
            "Glass shatters everywhere. Amidst the falling dust, a forgotten artifact drops into your palm.",
            "Скло розлітається скрізь. Серед пилу, що падає, у твою долоню падає забутий артефакт.",
            { card: "any" },
          ),
          out(
            1,
            "A jagged splinter slices deep into your knuckles. Blood drips onto the cold floor.",
            "Гострий осколок глибоко врізається в кісточки пальців. Кров капає на холодну підлогу.",
            { health: -3 },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both(
          "Turn away and walk past illusions",
          "Відкинути ілюзії й піти геть із холодною головою",
        ),
        remove: true,
        gold: 10,
        text: both(
          "You step back from the glass, refusing to let illusions dictate your path. A heavy psychological weight vanishes, and the youth tosses you a coin for your sanity.",
          "Ти відступаєш від скла, відмовляючись дозволяти ілюзіям керувати твоїм шляхом. Важкий психологічний тягар зникає, а юнак кидає монету за твій здоровий глузд.",
        ),
      },
    ],
  },

  {
    id: "raptors_alpha_stare",
    icon: "hornedSkull",
    tint: "#b8863a",
    weight: 1,
    title: both("A muzzle in the dark", "Морда в темряві"),
    text: both(
      "Stepping around a thick cluster of ferns, you freeze. Inches from your face, a scarred raptor snout emerges from the shadows. Yellow, unblinking eyes lock onto yours, and razor-sharp jaws click softly, sizing you up for the kill.",
      "Обходячи густі зарості папороті, ти завмираєш. За кілька дюймів від твого обличчя з тіні виринає шрамована морда раптора. Жовті, немигаючі очі впинаються в твої, а гострі як бритва щелепи тихо клацають, приміряючись до удару.",
    ),
    choices: [
      {
        icon: "crossedSwords",
        label: both(
          "Strike preemptively before it leaps",
          "Вдарити першим, не чекаючи стрибка",
        ),
        outcomes: [
          out(
            2,
            "Your preemptive strike catches the beast off guard! It screeches and leaps back, dropping a sharp tooth that you quickly pocket as a tactical trophy.",
            "Твій випереджувальний удар застає хижака зненацька! Він верещить і відстрибує назад, залишаючи гострий кіготь, який ти швидко ховаєш як тактичний трофей.",
            { card: "any" },
          ),
          out(
            1,
            "Too slow! Its heavy paw slams into your chest, tearing deep into your flesh before you manage to shove it away.",
            "Занадто повільно! Його важка лапа б'є тобі в груди, глибоко врізаючись у плоть, перш ніж ти встигаєш відштовхнути звіра.",
            { health: -3 },
          ),
        ],
      },
      {
        icon: "uncertainty",
        label: both(
          "Freeze and stare down the alpha",
          "Завмерти й витримати погляд альфи",
        ),
        outcomes: [
          out(
            2,
            "You don't flinch. Impressed by your cold nerve, the alpha turns and slips into the brush, leaving you with absolute clarity of the pack's movements.",
            "Ти не кліпаєш. Вражений твоїм крижаним спокоєм, альфа розвертається і зникає в кущах, залишаючи тобі кристальну ясність маневрів зграї в руку.",
            { card: "any" },
          ),
          out(
            1,
            "The beast reads your fear instantly. It lunges forward, sinking its teeth into your arm before you break free and bolt.",
            "Звір миттєво читає твій страх. Він кидається вперед, встромляючи зуби тобі в руку, перш ніж ти вириваєшся й тікаєш.",
            { health: -3 },
          ),
        ],
      },
      {
        icon: "coins",
        label: both(
          "Toss a chunk of provisions to distract it",
          "Кинути шматок припасів, щоб відвернути хижака",
        ),
        cost: 15,
        outcomes: [
          out(
            1,
            "You toss a chunk of meat directly into the brush. While the beast tears into it, you read its movements and secure a tactical advantage in your hand.",
            "Ти кидаєш шматок м'яса просто в кущі. Поки звір розриває його, ти зчитуєш його рухи й отримуєш тактичну перевагу в руку.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both(
          "Back away slowly and study its graceful retreat",
          "Повільно позадкувати й простежити за його відступом",
        ),
        remove: true,
        gold: 10,
        text: both(
          "You refuse to panic, backing away inch by inch while watching the beast's lethal grace. The primal terror leaves your mind, and you let go of a burden you no longer need.",
          "Ти відмовляєшся піддаватися паніці, відступаючи дюйм за дюймом і спостерігаючи за смертоносною грацією звіра. Первісний страх покидає голову, і ти позбуваєшся зайвого тягаря.",
        ),
      },
    ],
  },
];

export const heroEvents = [
  {
    id: "shehulk_court",
    hero: "she-hulk",
    icon: "scales",
    tint: "#5aa63c",
    weight: 1,
    title: both("Court is in session", "Засідання суду"),
    text: both(
      "In a half-ruined hall, a tall green woman in a sharp suit sits behind the judge's bench with a stack of files and a very calm smile. You are the defendant, apparently. The charge: trespassing on a road that nobody owns.",
      "У напівзруйнованій залі за суддівським столом сидить висока зелена жінка в бездоганному костюмі зі стосом справ і дуже спокійною усмішкою. Підсудний, схоже, ти. Звинувачення: прохід дорогою, яка нікому не належить.",
    ),
    choices: [
      {
        icon: "scrollUnfurled",
        label: both("Defend yourself", "Захищатися самому"),
        outcomes: [
          out(
            2,
            "Your speech is so clumsy that she takes pity on you, dismisses the case and slides a card across the bench.",
            "Твоя промова така незграбна, що вона жаліє тебе, закриває справу й підсуває через стіл карту.",
            { card: "ally" },
          ),
          out(
            2,
            "She dismantles every argument, one calm sentence at a time. The fine is steep.",
            "Вона розбирає кожен аргумент по одному спокійному реченню. Штраф кусається.",
            { gold: -30 },
          ),
        ],
      },
      {
        icon: "shakingHands",
        label: both("Settle out of court", "Домовитися без суду"),
        cost: 25,
        outcomes: [
          out(
            3,
            "The paperwork vanishes. She also hands you a trick from her own briefcase as a courtesy.",
            "Папери зникають. Із ввічливості вона ще й дає тобі прийом зі свого портфеля.",
            { card: "ally" },
          ),
          out(
            1,
            "She pockets the money and recommends a better lawyer next time.",
            "Вона ховає гроші й радить наступного разу взяти кращого адвоката.",
          ),
        ],
      },
      {
        icon: "muscleUp",
        label: both("Object loudly", "Голосно заперечити"),
        outcomes: [
          out(
            2,
            "The judge's patience snaps. A green fist cracks the bench in half, and the bailiff pays you hush money to leave.",
            "Терпіння судді увірвалося. Зелений кулак розколює стіл навпіл, і пристав платить тобі, щоб ти мовчав і пішов.",
            { gold: 40 },
          ),
          out(
            2,
            "Contempt of court. You spend a night in a cell, thinking about your life choices.",
            "Неповага до суду. Ніч у камері, і час подумати про свої вибори.",
            { health: -4 },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both("Plead guilty to old sins", "Зізнатися в давніх гріхах"),
        remove: true,
        gold: 0,
        text: both(
          "She strikes your oldest bad habit from the record. Case closed, and your deck is lighter.",
          "Вона викреслює твою найстаршу погану звичку з протоколу. Справу закрито, а колода легша.",
        ),
      },
    ],
  },
  {
    id: "lukecage_wall",
    hero: "luke-cage",
    icon: "punch",
    tint: "#d6a21f",
    weight: 1,
    title: both("The man bullets can't stop", "Людина, яку не беруть кулі"),
    text: both(
      "A broad-shouldered man in a bright yellow shirt leans on a brick wall pitted with bullet holes. A gang of thugs is emptying magazines into his chest, and he looks mostly annoyed about the shirt.",
      "Широкоплечий чоловік у яскраво-жовтій сорочці стоїть, спершись на цегляну стіну, всіяну слідами куль. Банда бандитів розстрілює в нього обойми, і найбільше його, здається, турбує сорочка.",
    ),
    choices: [
      {
        icon: "crossedSwords",
        label: both("Join the brawl", "Вступити в бійку"),
        outcomes: [
          out(
            3,
            "Back to back, you clear the alley. He teaches you how to take a hit properly.",
            "Спина до спини, ви розчищаєте завулок. Він показує, як правильно приймати удар.",
            { card: "ally" },
          ),
          out(
            2,
            "You take a few punches meant for him. At least the thugs' pockets are full.",
            "Ти ловиш кілька ударів, призначених йому. Зате кишені бандитів не порожні.",
            { health: -3, gold: 35 },
          ),
        ],
      },
      {
        icon: "punch",
        label: both("Test his skin with a punch", "Перевірити шкіру ударом"),
        outcomes: [
          out(
            1,
            "It feels like punching a bank vault. He laughs, and you walk away with a sore hand and a good story.",
            "Наче б'єш по дверях сейфа. Він сміється, а ти йдеш із побитою рукою й гарною історією.",
            { health: -2 },
          ),
          out(
            2,
            "He lets you take one clean swing, then pays you for the entertainment.",
            "Він дає тобі один чистий замах, а тоді платить за видовище.",
            { gold: 25 },
          ),
        ],
      },
      {
        icon: "coins",
        label: both("Ask who pays him", "Запитати, хто йому платить"),
        cost: 15,
        outcomes: [
          out(
            2,
            '"Whoever\'s offering the most," he says, and writes the name of a hiring desk on your palm.',
            "«Той, хто дає найбільше», каже він і пише на твоїй долоні адресу, де наймають.",
            { card: "any" },
          ),
          out(
            1,
            'He shrugs. "Pay first, talk later." You are lighter and none the wiser.',
            "Він знизує плечима. «Спершу плати, потім говори». Ти легший на гаманець і не мудрішій.",
          ),
        ],
      },
      {
        icon: "firstAidKit",
        label: both("Patch him up anyway", "Все одно перев'язати його"),
        outcomes: [
          out(
            1,
            "There is nothing to patch. He thanks you for the thought and offers a lift to the next town.",
            "Перев'язувати нічого. Він дякує за турботу й підвозить до наступного міста.",
            { health: 4 },
          ),
        ],
      },
    ],
  },
  {
    id: "annie_riverboat",
    hero: "annie-christmas",
    icon: "rollingDices",
    tint: "#b8434a",
    weight: 1,
    title: both("Poker on the paddle steamer", "Покер на колісному пароплаві"),
    text: both(
      "A paddle steamer rocks at the dock, lanterns swinging. At the main table a towering woman with a string of pearls and a cold stare deals cards with one hand and keeps the other on a very large pot. A chair stands empty across from her.",
      "До причалу гойдається колісний пароплав, гойдаються ліхтарі. За головним столом висока жінка з ниткою перлів і холодним поглядом роздає карти однією рукою, а другу тримає на дуже великому банку. Навпроти неї вільний стілець.",
    ),
    choices: [
      {
        icon: "rollingDices",
        label: both("Sit down and play", "Сісти за стіл"),
        cost: 20,
        outcomes: [
          out(
            2,
            "You bluff through three rounds and clear the table. She slides the pot over with a respectful nod.",
            "Ти блефуєш три раунди й забираєш банк. Вона підсуває його з повагою в погляді.",
            { gold: 80 },
          ),
          out(
            2,
            "The fourth card is a trap. She wins the hand and keeps the pearl she took from your sleeve.",
            "Четверта карта була пасткою. Вона виграє роздачу й залишає собі перлину, яку витягла з твого рукава.",
          ),
        ],
      },
      {
        icon: "robberHand",
        label: both("Cheat from the shadows", "Шахраювати з тіні"),
        outcomes: [
          out(
            2,
            "You swap one card and nobody notices. Nobody except the dealer, who respects it enough to pay you off.",
            "Ти підміняєш одну карту, і ніхто не помічає. Крім дилерки, яка поважає таку майстерність і платить, щоб ти мовчав.",
            { gold: 50 },
          ),
          out(
            2,
            "A giant hand lifts you by the collar and drops you into the river.",
            "Величезна рука підіймає тебе за комір і кидає в річку.",
            { health: -3, gold: -20 },
          ),
        ],
      },
      {
        icon: "waterDrop",
        label: both("Ask about the river", "Розпитати про річку"),
        outcomes: [
          out(
            2,
            "She tells a tall tale of a rope, a monster and a bet she never lost. By the end she is teaching you one of her own tricks.",
            "Вона розповідає неймовірну історію про канат, чудовисько й парі, яке вона ніколи не програвала. Під кінець навчає тебе одному зі своїх прийомів.",
            { card: "ally" },
          ),
          out(
            1,
            "She laughs at your questions and sells you a drink instead.",
            "Вона сміється з твоїх питань і замість відповіді продає напій.",
            { gold: -10 },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both("Walk the gangplank at dawn", "Зійти трапом на світанку"),
        remove: true,
        gold: 15,
        text: both(
          "You leave a bad habit on the table, and she quietly pays you the small change.",
          "Ти залишаєш за столом погану звичку, а вона мовчки віддає тобі дрібні гроші.",
        ),
      },
    ],
  },
  {
    id: "oda_tea",
    hero: "oda-nobunaga",
    icon: "torch",
    tint: "#b32d2d",
    weight: 1,
    title: both("Tea before the fire", "Чай перед пожежею"),
    text: both(
      "A castle burns on the hill behind a warlord in a horned demon helmet. He kneels in a pavilion and prepares tea with perfect calm, while his guards wait in silence in two straight lines. He gestures to the empty mat opposite.",
      "Позаду воєначальника в шоломі з рогами демона на пагорбі горить замок. Він стоїть навколішки в павільйоні й спокійно готує чай, а охоронці мовчки чекають двома рівними шеренгами. Він показує на порожню циновку навпроти.",
    ),
    choices: [
      {
        icon: "bread",
        label: both("Drink the tea", "Випити чаю"),
        outcomes: [
          out(
            3,
            "He asks one question about your last battle, listens, and answers it with a lesson in patience.",
            "Він ставить одне питання про твою останню битву, слухає й відповідає уроком терпіння.",
            { card: "ally" },
          ),
          out(
            1,
            "The tea is bitter. So is his silence. You leave steadier than you came.",
            "Чай гіркий. Мовчання теж. Ти йдеш твердішим, ніж прийшов.",
            { health: 3 },
          ),
        ],
      },
      {
        icon: "swordman",
        label: both("Challenge the guards", "Викликати охоронців"),
        outcomes: [
          out(
            2,
            "Two guards fall in formation against you. You win with luck and a sprained wrist, and he tosses you a purse of silver.",
            "Двоє охоронців шикуються проти тебе. Ти виграєш завдяки везінню й розтягнутому зап'ястку, а він кидає тобі гаманець зі сріблом.",
            { gold: 45, health: -2 },
          ),
          out(
            2,
            "The guards never break their line. You learn about flanking the hard way.",
            "Охоронці не порушують строю ні на мить. Урок про оточення ти засвоюєш болісно.",
            { health: -4 },
          ),
        ],
      },
      {
        icon: "scrollUnfurled",
        label: both("Offer a plan for the siege", "Запропонувати план облоги"),
        cost: 10,
        outcomes: [
          out(
            2,
            "He studies your sketch, nods once and pays for the idea in coin.",
            "Він вивчає твій малюнок, киває і платить за ідею золотом.",
            { gold: 55 },
          ),
          out(
            2,
            "He studies your sketch, smiles faintly and hands you a better one.",
            "Він вивчає твій малюнок, ледь усміхається й віддає тобі кращий.",
            { card: "any" },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both("Let the old castle burn", "Дати старому замку згоріти"),
        remove: true,
        gold: 0,
        text: both(
          "You watch the flames and let go of what you no longer need. He pours you a second cup.",
          "Ти дивишся на полум'я й відпускаєш те, що вже не потрібне. Він наливає тобі другу чашку.",
        ),
      },
    ],
  },
  {
    id: "chupacabra_pen",
    hero: "chupacabra",
    icon: "hornedSkull",
    tint: "#7a3fa0",
    weight: 1,
    title: both("Empty goat pens", "Порожні загони для кіз"),
    text: both(
      "A farmer shows you three goat pens drained of every animal without a single drop of blood on the ground. In the dust there are long clawed tracks, and on the barn roof something spined and red-eyed is watching you both.",
      "Фермер показує тобі три порожні загони, де зникла вся худоба, а на землі жодної краплі крові. У пилюці довгі сліди з кігтями, а на даху стодоли за вами обома стежить щось із шипами й червоними очима.",
    ),
    choices: [
      {
        icon: "torch",
        label: both("Hunt it with the farmer", "Піти на полювання з фермером"),
        outcomes: [
          out(
            2,
            "You corner the creature in the barn. It wriggles out with half your supplies, but the farmer pays for the effort.",
            "Ви заганяєте істоту в кут стодоли. Вона вислизає з половиною твоїх припасів, але фермер платить за старання.",
            { gold: 35 },
          ),
          out(
            2,
            "It leaps from the dark. You wake up bandaged in the farmhouse, with a strange new trick in your head.",
            "Воно вистрибує з темряви. Ти приходиш до тями перев'язаним у хаті, а в голові з'являється дивний новий прийом.",
            { health: -4, card: "ally" },
          ),
        ],
      },
      {
        icon: "bread",
        label: both("Leave it a goat", "Залишити йому козу"),
        cost: 15,
        outcomes: [
          out(
            3,
            "A red-eyed shape takes the goat and, a few moments later, leaves something shiny in return.",
            "Червоноока тінь забирає козу й за кілька митей лишає на її місці щось блискуче.",
            { card: "ally" },
          ),
          out(
            1,
            "The goat vanishes. Nothing else happens. Somewhere a satisfied belch.",
            "Коза зникає. Більше нічого. Десь чути задоволене гикання.",
          ),
        ],
      },
      {
        icon: "magnifyingGlass",
        label: both("Follow the tracks alone", "Піти за слідами самому"),
        outcomes: [
          out(
            2,
            "The tracks lead to a cave stuffed with stolen trinkets and one very guilty goat.",
            "Сліди ведуть до печери, повної вкраденого дріб'язку та однієї дуже винної кози.",
            { gold: 50 },
          ),
          out(
            1,
            "The tracks lead in a circle. You finish the walk exactly where you started, and lighter.",
            "Сліди ведуть колом. Ти повертаєшся туди, звідки почав, і з легшим гаманцем.",
            { gold: -20 },
          ),
          out(
            1,
            "Under a rock you find a notebook of crude hunting tricks.",
            "Під каменем лежить зошит із грубими мисливськими прийомами.",
            { card: "own" },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both("Face your fear", "Подивитись страху в очі"),
        remove: true,
        gold: 10,
        text: both(
          "You stare into the red eyes without blinking. The creature blinks first and slinks away, and a burden leaves with it.",
          "Ти дивишся в червоні очі й не кліпаєш. Істота кліпає першою й тікає, а разом із нею іде тягар.",
        ),
      },
    ],
  },
  {
    id: "danny_wreck",
    hero: "deadman-danny",
    icon: "hornedSkull",
    tint: "#e0592a",
    weight: 1,
    title: both("A lifetime warranty", "Довічна гарантія"),
    text: both(
      'A scorched wreck of a spaceship smokes at the roadside. On its hood sits a grinning salesman in a burnt suit and a rocket pack, waving a stack of papers. "Barely used! One careful owner! Lifetime warranty, and trust me, I am a lifetime."',
      "На узбіччі димить обгорілий уламок космічного корабля. На капоті сидить усміхнений торговець у підпаленому костюмі з реактивним ранцем і махає стосом паперів. «Майже новий! Один дбайливий власник! Довічна гарантія, а я, повір, безсмертний».",
    ),
    choices: [
      {
        icon: "shakingHands",
        label: both("Buy the ship", "Купити корабель"),
        cost: 40,
        outcomes: [
          out(
            2,
            "It starts on the third try and leaves a trail of fire. In the glovebox you find a manual with a very useful page.",
            "Він заводиться з третього разу й залишає вогняний слід. У бардачку лежить інструкція з дуже корисною сторінкою.",
            { card: "ally" },
          ),
          out(
            2,
            "The engine explodes before you finish signing. The warranty, he says cheerfully, does not cover that.",
            "Двигун вибухає, ще до того як ти підписав папери. Гарантія, весело каже він, такого не покриває.",
            { health: -5 },
          ),
        ],
      },
      {
        icon: "rollingDices",
        label: both("Haggle the price down", "Збити ціну"),
        outcomes: [
          out(
            2,
            "He sighs, throws in a fire extinguisher and a card from his coat pocket to be rid of you.",
            "Він зітхає, докладає вогнегасник і карту з кишені пальта, аби позбутися тебе.",
            { card: "any" },
          ),
          out(
            2,
            "He haggles better than you. You leave with a signed receipt for nothing and a lighter purse.",
            "Він торгується краще за тебе. Ти йдеш із підписаною квитанцією ні за що й легшим гаманцем.",
            { gold: -25 },
          ),
        ],
      },
      {
        icon: "robberHand",
        label: both("Strip the wreck for parts", "Розібрати уламок на деталі"),
        outcomes: [
          out(
            3,
            "Under the scorched plating you find a pouch of fuel coupons worth real coin.",
            "Під обгорілою обшивкою ти знаходиш мішечок купонів на паливо, які коштують справжніх грошей.",
            { gold: 45 },
          ),
          out(
            1,
            "A hidden fuel tank ignites. The salesman applauds your commitment.",
            "Прихований паливний бак спалахує. Торговець аплодує твоїй відданості справі.",
            { health: -3 },
          ),
        ],
      },
      {
        icon: "monkFace",
        label: both("Void the old warranty", "Анулювати стару гарантію"),
        remove: true,
        gold: 0,
        text: both(
          'He stamps a card as "void" with a flourish and it burns out of your deck in a puff of smoke.',
          "Він урочисто ставить штамп «анульовано» на карті, і та згоряє з колоди хмаринкою диму.",
        ),
      },
    ],
  },
  {
    id: "dracula_crypt",
    hero: "dracula",
    icon: "candleFlame",
    tint: "#8d1f33",
    weight: 1,
    title: both("The crypt of mirrors", "Склеп дзеркал"),
    text: both(
      "Every wall of the crypt is a mirror, and none of them shows you a reflection. Instead a pale figure in a high collar stands among them, and he is very pleased to have company.",
      "Усі стіни склепу вкриті дзеркалами, і жодне не відбиває тебе. Натомість між ними стоїть блідий чоловік у високому комірі, дуже задоволений гостем.",
    ),
    choices: [
      {
        icon: "magnifyingGlass",
        label: both("Study the mirrors", "Роздивитися дзеркала"),
        outcomes: [
          out(
            2,
            "You find the one mirror that is only a window. Behind it lies a forgotten cache.",
            "Ти знаходиш єдине дзеркало, що насправді вікно. За ним лежить забутий схрон.",
            { gold: 45 },
          ),
          out(
            2,
            "A reflection that is not yours reaches out and takes something from your pocket.",
            "Відображення, яке не твоє, простягає руку й забирає щось із твоєї кишені.",
            { gold: -25 },
          ),
        ],
      },
      {
        icon: "pentacle",
        label: both("Shatter one on purpose", "Розбити одне навмисно"),
        outcomes: [
          out(
            2,
            "The shards whisper a lesson as they fall. You leave knowing a trick you did not know before.",
            "Уламки шепочуть урок, поки падають. Ти йдеш, знаючи прийом, якого не знав.",
            { card: "ally" },
          ),
          out(
            2,
            "Seven years of bad luck arrive in about seven seconds.",
            "Сім років нещастя приходять приблизно за сім секунд.",
            { health: -4 },
          ),
        ],
      },
      {
        icon: "shakingHands",
        label: both("Accept his hospitality", "Прийняти його гостинність"),
        outcomes: [
          out(
            3,
            "He pours something dark into a very old glass. You wake up refreshed and slightly suspicious.",
            "Він наливає щось темне в дуже старий келих. Прокидаєшся бадьорим і трохи підозріливим.",
            { health: 5 },
          ),
          out(
            1,
            "The glass is empty, and so, afterwards, is your purse.",
            "Келих порожній, і після цього твій гаманець теж.",
            { gold: -30 },
          ),
        ],
      },
    ],
  },
  {
    id: "dracula_feast",
    hero: "dracula",
    icon: "bread",
    tint: "#a3253a",
    weight: 1,
    title: both("A very pale dinner", "Дуже бліда вечеря"),
    text: both(
      "A long table is laid in a ruined hall. Candles burn, the wine is thick and red, and at the head sits an elegant figure who does not seem to eat anything himself. A place has been set for you, though you were not expected.",
      "У зруйнованій залі накрито довгий стіл. Горять свічки, вино густе й червоне, а на чолі сидить елегантна постать, яка, здається, нічого не їсть. Для тебе поставлено прибор, хоч тебе й не чекали.",
    ),
    choices: [
      {
        icon: "bread",
        label: both("Eat and drink", "Їсти й пити"),
        outcomes: [
          out(
            3,
            "The food is wonderful and the company is disturbingly charming. You leave warm and well rested.",
            "Їжа чудова, а товариство тривожно чарівне. Ти йдеш ситим і відпочилим.",
            { health: 6 },
          ),
          out(
            1,
            "You wake up in a corridor with a headache and a lighter purse.",
            "Ти прокидаєшся в коридорі з головним болем і легшим гаманцем.",
            { gold: -20, health: -2 },
          ),
        ],
      },
      {
        icon: "scrollUnfurled",
        label: both("Trade stories", "Помінятися історіями"),
        outcomes: [
          out(
            2,
            "He has seen four centuries of fights and shares one move with a shrug.",
            "Він бачив чотири століття боїв і знизує плечима, ділячись одним прийомом.",
            { card: "ally" },
          ),
          out(
            2,
            "He finds your story dull and pays you to stop.",
            "Він вважає твою історію нудною й платить, щоб ти замовк.",
            { gold: 30 },
          ),
        ],
      },
      {
        icon: "hornedSkull",
        label: both("Refuse the invitation", "Відмовитися"),
        outcomes: [
          out(
            2,
            "The doors close behind you. In the courtyard lies a coin purse someone dropped in a hurry.",
            "Двері зачиняються за тобою. У дворі лежить гаманець, який хтось упустив у поспіху.",
            { gold: 25 },
          ),
          out(
            2,
            "The figure is offended. The night gets a great deal longer.",
            "Постать ображена. Ніч стає значно довшою.",
            { health: -3 },
          ),
        ],
      },
    ],
  },
  {
    id: "annie_lagniappe",
    hero: "annie-christmas",
    icon: "coins",
    tint: "#c9892a",
    weight: 1,
    title: both("Something extra on the house", "Щось додому від господині"),
    text: both(
      "In the middle of a loud river market a huge woman with a string of pearls is selling spiced food and giving away a little extra to everybody. She waves you over as if you were an old friend.",
      "Серед гамірного річкового ринку величезна жінка з ниткою перлів продає гостру їжу й кожному додає дещо зверху. Вона махає тобі, ніби старому знайомому.",
    ),
    choices: [
      {
        icon: "bread",
        label: both("Buy a plate", "Купити порцію"),
        cost: 15,
        outcomes: [
          out(
            3,
            "She piles the plate high and adds a little extra for free. You eat like a king.",
            "Вона накладає гору їжі й додає зверху безкоштовно. Ти їси як король.",
            { health: 5 },
          ),
          out(
            1,
            "It is much hotter than it looked. You pay for the milk afterwards.",
            "Це набагато гостріше, ніж здавалося. Потім платиш за молоко.",
            { gold: -10 },
          ),
        ],
      },
      {
        icon: "rollingDices",
        label: both("Bet on the dice game", "Поставити на кості"),
        outcomes: [
          out(
            2,
            "Beginner's luck is real, and she grudgingly admits it.",
            "Щастя новачка існує, і вона неохоче це визнає.",
            { gold: 60 },
          ),
          out(
            2,
            "The dice are suspiciously friendly to her. You walk away lighter.",
            "Кості підозріло прихильні до неї. Ти йдеш легшим.",
            { gold: -30 },
          ),
        ],
      },
      {
        icon: "shakingHands",
        label: both("Ask for work", "Попросити роботу"),
        outcomes: [
          out(
            2,
            "She puts you on the crate-lifting crew for an afternoon and teaches you how to hold your ground.",
            "Вона ставить тебе на ящики на день і вчить стояти на своєму.",
            { card: "ally" },
          ),
          out(
            2,
            "You carry crates until sunset. The pay is honest and small.",
            "Ти носиш ящики до заходу сонця. Платня чесна й невелика.",
            { gold: 25 },
          ),
        ],
      },
    ],
  },
  {
    id: "annie_bayou",
    hero: "annie-christmas",
    icon: "waterDrop",
    tint: "#2f7d6a",
    weight: 1,
    title: both("Lights over the bayou", "Вогні над болотом"),
    text: both(
      "Green lights bob over black water, and somewhere a long way off someone is humming. A flat boat waits at the shore with a lantern and a very long pole, but its owner is nowhere in sight.",
      "Зелені вогники погойдуються над чорною водою, а десь далеко хтось наспівує. На березі чекає плоский човен із ліхтарем і довгим жердиною, але господаря не видно.",
    ),
    choices: [
      {
        icon: "footsteps",
        label: both("Follow the lights", "Піти за вогнями"),
        outcomes: [
          out(
            2,
            "The lights lead to a hollow tree with a stash of old river coins inside.",
            "Вогні ведуть до дуплистого дерева, де лежить схрон старих річкових монет.",
            { gold: 50 },
          ),
          out(
            2,
            "The lights lead into mud up to your knees, and something laughs.",
            "Вогні заводять у багнюку по коліна, і щось сміється.",
            { health: -3 },
          ),
        ],
      },
      {
        icon: "swordman",
        label: both("Take the boat", "Взяти човен"),
        outcomes: [
          out(
            2,
            "You pole across and meet a ferryman who owes the owner a favour. He pays you in knowledge.",
            "Ти переправляєшся й зустрічаєш перевізника, що винен господарю послугу. Він платить знанням.",
            { card: "ally" },
          ),
          out(
            2,
            "The owner turns out to be very large and very angry. You pay for the boat.",
            "Господар виявляється дуже великим і дуже розлюченим. Ти платиш за човен.",
            { gold: -25 },
          ),
        ],
      },
      {
        icon: "torch",
        label: both("Wait for morning", "Дочекатися ранку"),
        outcomes: [
          out(
            3,
            "Dawn burns off the mist, and you rest as well as the mosquitoes allow.",
            "Світанок розганяє туман, і ти відпочиваєш, наскільки дозволяють комарі.",
            { health: 3 },
          ),
          out(
            1,
            "The mosquitoes allow nothing.",
            "Комарі не дозволяють нічого.",
            {},
          ),
        ],
      },
    ],
  },
  {
    id: "oda_gunsmith",
    hero: "oda-nobunaga",
    icon: "crossedSwords",
    tint: "#a82a2a",
    weight: 1,
    title: both("Rows of matchlocks", "Ряди ґнотових рушниць"),
    text: both(
      "On a muddy field, three long rows of musketeers kneel behind wooden fences. A grim commander in a black cloak walks along them, checking every barrel. He looks at you and at your weapons and does not seem impressed.",
      "На розкислому полі три довгі шеренги мушкетерів стоять навколішки за дерев'яними загорожами. Похмурий командир у чорному плащі обходить їх, перевіряючи кожен ствол. Він дивиться на тебе й на твою зброю і, здається, не вражений.",
    ),
    choices: [
      {
        icon: "swordman",
        label: both("Offer a duel", "Запропонувати двобій"),
        outcomes: [
          out(
            2,
            "He declines the duel and gives you a lesson in why it was a bad idea.",
            "Він відмовляється від двобою й дає урок, чому це була погана ідея.",
            { card: "ally" },
          ),
          out(
            2,
            "One volley kicks up the mud at your feet. You decide to withdraw.",
            "Один залп здіймає багнюку біля твоїх ніг. Ти вирішуєш відступити.",
            { health: -3 },
          ),
        ],
      },
      {
        icon: "coinsPile",
        label: both("Sell him supplies", "Продати йому припаси"),
        outcomes: [
          out(
            3,
            "He pays in full and on time. That is rarer than it sounds.",
            "Він платить повністю й вчасно. Це рідкість.",
            { gold: 45 },
          ),
          out(
            1,
            "He pays in full, minus a fee for being late.",
            "Він платить повністю, мінус штраф за запізнення.",
            { gold: 15 },
          ),
        ],
      },
      {
        icon: "scrollUnfurled",
        label: both("Ask about the formation", "Розпитати про шеренги"),
        outcomes: [
          out(
            2,
            "He explains how rows trade places so that the line never stops. You take careful notes.",
            "Він пояснює, як шеренги міняються місцями, щоб лінія не переривалася. Ти старанно записуєш.",
            { card: "ally" },
          ),
          out(
            2,
            "He tells you to stop wasting his time and leave.",
            "Він велить не гаяти його час і йти.",
            {},
          ),
        ],
      },
    ],
  },
  {
    id: "oda_gate",
    hero: "oda-nobunaga",
    icon: "torch",
    tint: "#c0392b",
    weight: 1,
    title: both("The gate that burns", "Брама, що горить"),
    text: both(
      "A tall wooden gate stands wrapped in flames, and the road leads straight through it. Beside the gate a stern figure in red armour and a horned helmet watches you without blinking. He seems to be waiting to see what you do.",
      "Висока дерев'яна брама стоїть охоплена полум'ям, і дорога веде прямо крізь неї. Поруч суворий воїн у червоних обладунках і рогатому шоломі дивиться на тебе, не кліпаючи. Здається, він чекає, що ти зробиш.",
    ),
    choices: [
      {
        icon: "muscleUp",
        label: both("Run straight through", "Пробігти крізь вогонь"),
        outcomes: [
          out(
            2,
            "The flames only lick your cloak. The watcher nods, and throws you a coin.",
            "Полум'я лише лиже твій плащ. Воїн киває й кидає тобі монету.",
            { gold: 35 },
          ),
          out(
            2,
            "You are not as fast as you thought.",
            "Ти не такий швидкий, як думав.",
            { health: -5 },
          ),
        ],
      },
      {
        icon: "hourglass",
        label: both("Wait for it to burn down", "Дочекатися, поки вигорить"),
        outcomes: [
          out(
            3,
            "By morning only embers remain, and the watcher is gone. He left a note in the ashes.",
            "До ранку лишаються лише жарини, а воїн зник. У попелі він залишив записку.",
            { card: "ally" },
          ),
          out(
            1,
            "By morning it has burned down, and the road has been taken by someone else.",
            "До ранку вона вигоряє, а дорогу вже зайняв хтось інший.",
            {},
          ),
        ],
      },
      {
        icon: "waterDrop",
        label: both("Douse the flames", "Загасити вогонь"),
        outcomes: [
          out(
            2,
            "A bucket chain, a lot of shouting, and finally some respect from the watcher.",
            "Ланцюжок відер, багато крику й нарешті трохи поваги від воїна.",
            { health: 3 },
          ),
          out(
            2,
            "The water is the wrong kind. The flames flare up.",
            "Вода не тієї якості. Полум'я спалахує сильніше.",
            { health: -3, gold: -10 },
          ),
        ],
      },
    ],
  },
  {
    id: "chupacabra_roof",
    hero: "chupacabra",
    icon: "ghost",
    tint: "#6a2a2a",
    weight: 1,
    title: both("Something on the rooftop", "Щось на даху"),
    text: both(
      "A farm lies silent under the moon. Something crouches on the barn roof, spined and thin, with eyes like two hot coins. It watches you, and does not blink.",
      "Ферма мовчить під місяцем. На даху клуні сидить щось худе й шипасте з очима, як дві розпечені монети. Воно дивиться на тебе й не кліпає.",
    ),
    choices: [
      {
        icon: "torch",
        label: both("Hold up a lantern", "Підняти ліхтар"),
        outcomes: [
          out(
            2,
            "The creature flinches from the light and scrambles away, dropping something shiny.",
            "Створіння відсахується від світла й тікає, впускаючи щось блискуче.",
            { gold: 35 },
          ),
          out(
            2,
            "The creature isn't scared of lanterns. It takes the lantern.",
            "Створіння не боїться ліхтарів. Воно забирає ліхтар.",
            { gold: -15 },
          ),
        ],
      },
      {
        icon: "bread",
        label: both("Leave out some meat", "Залишити шматок м'яса"),
        outcomes: [
          out(
            3,
            "It eats, studies you for a long while, and then lets you pass. It shows you a trick on the way out.",
            "Воно їсть, довго вивчає тебе й пропускає. Дорогою показує прийом.",
            { card: "ally" },
          ),
          out(
            1,
            "The meat is gone, and it is still looking at you.",
            "М'ясо зникло, а воно все ще дивиться на тебе.",
            {},
          ),
        ],
      },
      {
        icon: "crowbar",
        label: both(
          "Climb up and confront it",
          "Залізти й зустрітися лицем до лиця",
        ),
        outcomes: [
          out(
            1,
            "You are faster than expected. The creature vanishes, leaving its nest of shiny things behind.",
            "Ти швидший, ніж чекалося. Створіння зникає, залишивши гніздо з блискучими речами.",
            { gold: 60 },
          ),
          out(
            3,
            "It is faster than you expected. You get down the hard way.",
            "Воно швидше, ніж ти очікував. Спускаєшся по-важкому.",
            { health: -5 },
          ),
        ],
      },
    ],
  },
  {
    id: "chupacabra_market",
    hero: "chupacabra",
    icon: "uncertainty",
    tint: "#7a3d2a",
    weight: 1,
    title: both("Rumours at the night market", "Чутки на нічному ринку"),
    text: both(
      "Under flickering lamps a night market sells everything from salt to nightmares. Every second stall whispers about the same thing: a thin shape that drains goats. A stooped woman at a stall of charms nods at you.",
      "Під мерехтливими лампами нічний ринок продає все від солі до жахіть. Кожна друга ятка шепоче про одне: худа тінь, яка висушує кіз. Згорблена жінка біля ятки з оберегами киває тобі.",
    ),
    choices: [
      {
        icon: "coins",
        label: both("Buy a charm", "Купити оберіг"),
        cost: 20,
        outcomes: [
          out(
            3,
            "The charm hums warmly in your pocket. You feel safer already.",
            "Оберіг тепло гуде в кишені. Тобі вже спокійніше.",
            { health: 4 },
          ),
          out(
            1,
            "It is just a painted stone. A lovely painted stone.",
            "Це просто розфарбований камінь. Гарний розфарбований камінь.",
            {},
          ),
        ],
      },
      {
        icon: "magnifyingGlass",
        label: both(
          "Ask where it was last seen",
          "Спитати, де його бачили востаннє",
        ),
        outcomes: [
          out(
            2,
            "A trader sells you a map to a place the creature avoids. It saves you a long night.",
            "Торговець продає мапу до місця, яке створіння обходить. Це рятує від довгої ночі.",
            { gold: 20 },
          ),
          out(
            2,
            "The trader's information cost more than it was worth.",
            "Інформація торговця коштує більше, ніж варта.",
            { gold: -20 },
          ),
        ],
      },
      {
        icon: "ninjaMask",
        label: both("Offer to hunt it", "Запропонувати вполювати"),
        outcomes: [
          out(
            2,
            "You come back at dawn with scratches and a reward from the village.",
            "Ти повертаєшся на світанку з подряпинами та нагородою від села.",
            { gold: 50, health: -2 },
          ),
          out(
            2,
            "You come back at dawn with scratches, and a lesson in respect.",
            "Ти повертаєшся на світанку з подряпинами й уроком поваги.",
            { card: "ally", health: -2 },
          ),
        ],
      },
    ],
  },
  {
    id: "shehulk_gala",
    hero: "she-hulk",
    icon: "scales",
    tint: "#4f9d3a",
    weight: 1,
    title: both("A gala with a lawsuit", "Гала зі судовим позовом"),
    text: both(
      "A glittering charity gala fills a marble hall. At the centre of the crowd a tall green woman in an evening gown is serving papers to a man who clearly did not expect any. She notices you and raises a glass.",
      "Виблискуюча благодійна гала заповнює мармурову залу. Посеред натовпу висока зелена жінка у вечірній сукні вручає документи чоловікові, який явно їх не чекав. Вона помічає тебе й піднімає келих.",
    ),
    choices: [
      {
        icon: "scrollUnfurled",
        label: both("Volunteer as a witness", "Стати свідком"),
        outcomes: [
          out(
            2,
            "Your testimony wins the case. She pays you a witness fee and a professional compliment.",
            "Твої свідчення виграють справу. Вона платить за свідчення й робить професійний комплімент.",
            { gold: 45 },
          ),
          out(
            2,
            "The other side's lawyer takes your testimony apart with a smile.",
            "Адвокат супротивника з усмішкою розбирає твої свідчення.",
            { gold: -20 },
          ),
        ],
      },
      {
        icon: "bread",
        label: both("Raid the buffet", "Накинутися на фуршет"),
        outcomes: [
          out(
            3,
            "The buffet is excellent, and everyone is too busy to notice you.",
            "Фуршет чудовий, а всі надто зайняті, щоб помітити тебе.",
            { health: 4 },
          ),
          out(
            1,
            "A waiter notices, and the bill is not small.",
            "Офіціант помічає, і рахунок немалий.",
            { gold: -15 },
          ),
        ],
      },
      {
        icon: "muscleUp",
        label: both("Break up a brawl", "Розборонити бійку"),
        outcomes: [
          out(
            2,
            "A fight breaks out near the buffet. She watches you step in, and pays you back in advice.",
            "Біля фуршету спалахує бійка. Вона дивиться, як ти втручаєшся, і платить порадою.",
            { card: "ally" },
          ),
          out(
            2,
            "You step between two angry men. They both punch you.",
            "Ти стаєш між двома розлюченими чоловіками. Обидва б'ють тебе.",
            { health: -4 },
          ),
        ],
      },
    ],
  },
  {
    id: "shehulk_storm",
    hero: "she-hulk",
    icon: "punch",
    tint: "#3f8c2c",
    weight: 1,
    title: both("A green storm downtown", "Зелена буря в центрі міста"),
    text: both(
      "A street lies half wrecked, with a crashed truck and a crowd of onlookers. A towering green woman in torn clothes stands in the middle with a lamp post over her shoulder, panting. She looks like she is about to lose her temper completely.",
      "Вулиця напівзруйнована: розбита вантажівка й натовп роззяв. Посеред стоїть велетенська зелена жінка в подертому одязі з ліхтарним стовпом на плечі й важко дихає. Здається, вона ось-ось остаточно втратить самовладання.",
    ),
    choices: [
      {
        icon: "shakingHands",
        label: both("Calm her down", "Заспокоїти її"),
        outcomes: [
          out(
            2,
            "You talk her down, and she's grateful. She lifts the truck off the road and gives you a reward.",
            "Ти заспокоюєш її, і вона вдячна. Вона піднімає вантажівку з дороги й дає тобі нагороду.",
            { gold: 40 },
          ),
          out(
            2,
            "Talking turns out to be the wrong tool. A lamp post whistles past your ear.",
            "Розмова виявляється не тим інструментом. Ліхтарний стовп свистить повз вухо.",
            { health: -3 },
          ),
        ],
      },
      {
        icon: "knapsack",
        label: both("Loot the wreck", "Обшукати уламки"),
        outcomes: [
          out(
            2,
            "The truck's cargo is mostly intact. You carry away what you can.",
            "Вантаж вантажівки здебільшого цілий. Ти забираєш, що можеш.",
            { gold: 55 },
          ),
          out(
            2,
            "A crowd of onlookers is less friendly than you expected.",
            "Натовп роззяв менш привітний, ніж ти очікував.",
            { gold: -15, health: -2 },
          ),
        ],
      },
      {
        icon: "punch",
        label: both("Spar with her", "Позмагатися з нею"),
        outcomes: [
          out(
            2,
            "She takes the match seriously and then shows you her favourite counter.",
            "Вона сприймає поєдинок серйозно, а потім показує свій улюблений контрприйом.",
            { card: "ally" },
          ),
          out(
            2,
            "The match lasts about two seconds.",
            "Поєдинок триває секунди дві.",
            { health: -5 },
          ),
        ],
      },
    ],
  },
  {
    id: "lukecage_barber",
    hero: "luke-cage",
    icon: "monkFace",
    tint: "#e0b020",
    weight: 1,
    title: both("The barbershop on the corner", "Перукарня на розі"),
    text: both(
      "A busy barbershop on the corner has a line out of the door. Inside, a huge bald man in a yellow shirt sits in a chair with perfectly calm authority while three barbers argue about the ball game. Everyone falls quiet when you walk in.",
      "У жвавої перукарні на розі черга аж за двері. Усередині величезний лисий чоловік у жовтій сорочці сидить у кріслі з цілком спокійною владою, поки троє перукарів сперечаються про матч. Усі змовкають, коли ти заходиш.",
    ),
    choices: [
      {
        icon: "bread",
        label: both("Wait your turn", "Дочекатися своєї черги"),
        outcomes: [
          out(
            3,
            "After a long wait you get a trim and the best gossip on the block.",
            "Після довгого очікування ти отримуєш стрижку й найкращі плітки кварталу.",
            { health: 3 },
          ),
          out(
            1,
            "After a long wait the barbershop closes.",
            "Після довгого очікування перукарня зачиняється.",
            {},
          ),
        ],
      },
      {
        icon: "robberHand",
        label: both("Skip the line", "Пройти без черги"),
        outcomes: [
          out(
            1,
            "Nobody objects. The big man just looks at you over the top of his newspaper.",
            "Ніхто не заперечує. Великий чоловік лише дивиться на тебе поверх газети.",
            { gold: 10 },
          ),
          out(
            3,
            "The big man puts down the newspaper. The conversation that follows is short.",
            "Великий чоловік кладе газету. Розмова, що за цим слідує, коротка.",
            { health: -4, gold: -15 },
          ),
        ],
      },
      {
        icon: "scrollUnfurled",
        label: both("Listen to the neighbourhood", "Послухати квартал"),
        outcomes: [
          out(
            2,
            "Someone mentions a job that pays well, and someone else tells you how to survive it.",
            "Хтось згадує добре оплачувану роботу, а хтось інший розповідає, як її пережити.",
            { card: "ally" },
          ),
          out(
            2,
            "The neighbourhood talks about nothing but the game. You tip the barber for the show.",
            "Квартал говорить лише про матч. Ти даєш перукареві чайові за виставу.",
            { gold: -10 },
          ),
        ],
      },
    ],
  },
  {
    id: "lukecage_bounty",
    hero: "luke-cage",
    icon: "coinsPile",
    tint: "#d6a21f",
    weight: 1,
    title: both("A job for hire", "Робота за гроші"),
    text: both(
      "A nervous shopkeeper stands outside a shuttered store with a handful of crumpled bills. A group of men in matching jackets has been leaning on him for weeks. He looks at your gear, then at you, and asks how much you charge.",
      "Знервований крамар стоїть біля зачиненої крамниці з жменею зім'ятих купюр. Група чоловіків в однакових куртках тисне на нього вже кілька тижнів. Він дивиться на твоє спорядження, потім на тебе й питає, скільки ти береш.",
    ),
    choices: [
      {
        icon: "crossedSwords",
        label: both("Take the job", "Взяти роботу"),
        outcomes: [
          out(
            2,
            "The men in jackets leave the neighbourhood by the end of the afternoon. The shopkeeper pays, and then pays again.",
            "Чоловіки в куртках залишають квартал до кінця дня. Крамар платить, а потім платить ще раз.",
            { gold: 65, health: -2 },
          ),
          out(
            2,
            "They hit harder than you expected, and the shopkeeper's money does not cover the dentist.",
            "Вони б'ють сильніше, ніж ти очікував, і грошей крамаря не вистачає на стоматолога.",
            { health: -6, gold: 20 },
          ),
        ],
      },
      {
        icon: "shakingHands",
        label: both("Do it for free", "Зробити безкоштовно"),
        outcomes: [
          out(
            2,
            "The shopkeeper is grateful, and the neighbourhood remembers. A friend returns the favour later.",
            "Крамар вдячний, а квартал пам'ятає. Друг повертає послугу пізніше.",
            { card: "ally" },
          ),
          out(
            2,
            "The shopkeeper is grateful and has nothing else to give but food.",
            "Крамар вдячний і не має нічого, крім їжі.",
            { health: 3 },
          ),
        ],
      },
      {
        icon: "footsteps",
        label: both("Say it isn't your fight", "Сказати, що це не твоя справа"),
        outcomes: [
          out(
            2,
            "The shopkeeper sighs and offers you a drink for the road.",
            "Крамар зітхає й пропонує напій на дорогу.",
            { health: 1 },
          ),
          out(
            2,
            "The shopkeeper says nothing, but the street does.",
            "Крамар мовчить, але вулиця говорить.",
            { gold: -10 },
          ),
        ],
      },
    ],
  },
];

export const eventArts = {
  chest: "Blackbeard/plunder",
  well: "The Genie/three_wishes",
  hermit: "Doctor Strange/master_of_kamar_taj",
  gambler: "Annie Christmas/the_turn_and_the_river",
  pawn: "Luke Cage/get_paid",
  library: "Doctor Strange/eye_of_agamotto",
  altar: "Dracula/baptism_of_blood",
  traveler: "Chupacabra/traveler_of_the_night",
  shrine: "Oda Nobunaga/sun_and_moon",
  blackbeard: "Blackbeard/scourge_of_the_seven_seas",
  excalibur: "Tomoe Gozen/flash_of_steel",
  pandora: "Pandora/heras_curiosity",
  peaches: "Sun Wukong/72_transformations",
  houdini: "Harry Houdini/grand_escape",
  sherwood: "Robin Hood/piercing_shot",
  jekyll: "Dr. Jill Trent/stasis_diffuser",
  dracula: "Dracula/look_into_my_eyes",
  alice: "Black Panther/cat_like_reflexes",
  genie: "The Genie/careful_what_you_wish_for",
  loki: "Loki/looking_for_trouble",
  raptors: "Raptors/ambush",
  medusa: "Luke Cage/still_standing",
  wakanda: "Black Panther/vibranium_shockwave",
  strange: "Doctor Strange/the_rings_of_raggadorr",
  mead: "Loki/fall_of_balder",
  invisible: "Invisible Man/impossible_to_see",
  hamlet: "Hamlet/to_sleep_perchance_to_dream",
  "raptors-nest": "Raptors/they_remember",
  msmarvel: "Donatello/party_wagon",
  spiderman: "Spiderman/thwip",
  tomoe: "Tomoe Gozen/a_worthy_opponent",
  soldier: "Winter Soldier/born_in_the_barracks",
  jill: "Dr. Jill Trent/utility_belt",
  wyatt: "Wyatt Earp/gunfight_at_the_ok_corral",
  venom: "Agent Venom/grasping_tendrils",
  spiderman_snapshot: "Spiderman/friendly_neighborhood_spider_man",
  invisible_tavern_cards: "Invisible Man/lurking",
  hamlet_poison_cup: "Hamlet/uncertain_doom",
  hamlet_broken_mirror: "Hamlet/method_in_the_madness",
  raptors_alpha_stare: "Raptors/clever_girl",
  shehulk_court: "She-Hulk/lady_justice",
  lukecage_wall: "Luke Cage/power_man",
  annie_riverboat: "Annie Christmas/mississippi_queen",
  oda_tea: "Oda Nobunaga/patience_and_strategy",
  dracula_crypt: "Dracula/mistform",
  dracula_feast: "Dracula/thirst_for_sustenance",
  annie_lagniappe: "Annie Christmas/lagniappe",
  annie_bayou: "Annie Christmas/long_shot",
  oda_gunsmith: "Oda Nobunaga/lightning_and_thunder",
  oda_gate: "Oda Nobunaga/fire_and_flames",
  chupacabra_roof: "Chupacabra/ambush",
  chupacabra_market: "Chupacabra/unsettle",
  shehulk_gala: "She-Hulk/jennifer_walters_esq",
  shehulk_storm: "She-Hulk/the_savage_she_hulk",
  lukecage_barber: "Luke Cage/trash_talk",
  lukecage_bounty: "Luke Cage/hero_for_hire",
  chupacabra_pen: "Chupacabra/feeding",
};
