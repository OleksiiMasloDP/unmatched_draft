import { ref, computed, watch, reactive } from "vue";
import { translations } from "../i18n.js";
import {
  formats,
  MODE_TURNS,
  MODE_SIMULTANEOUS,
  CUSTOM_FORMAT_PREFIX,
  buildCustomFormat,
  loadCustomFormats,
  persistCustomFormats,
} from "../draftFormats.js";

const lang = ref("en");
const search = ref("");
const sortMode = ref("elo");
const firstPicker = ref("player");
const currentFormat = ref("summer_of_legends_2026");
const DEFAULT_FORMAT = "all_heroes";

// Власні формати користувача (localStorage, окремий ключ — "Рестарт" їх не чіпає)
const customFormats = ref(loadCustomFormats());

// Вбудовані + власні формати в одному об'єкті { ключ: конфіг }
const availableFormats = computed(() => {
  const merged = { ...formats };
  for (const f of customFormats.value) merged[f.id] = f;
  return merged;
});
const showInfoPopover = ref(false);

const player = reactive({ color: "#4f7cff", bans: [], picks: [] });
const opponent = reactive({ color: "#ff4f6d", bans: [], picks: [] });

const characters = ref([]);
const history = ref([]);
const step = ref(0);
const maps = ref([]);
const currentStep = ref("characters");
const selectedMapId = ref(null);

const postBans = ref({ player: new Set(), opponent: new Set() });

// Режим simultaneous (ladder): обидва гравці одночасно обирають по двох героїв.
// Вибір живе окремо від player.picks/opponent.picks і потрапляє туди лише
// при переході до карт, щоб крок карт працював без змін.
const LADDER_PICKS = 2;
const ladderChoice = reactive({ player: [], opponent: [] });
const ladderSort = ref("average");

// Які списки матчапів розгорнуті. Ключ на кшталт "pool:12" або "player:12":
// кожна кнопка відкриває й закриває лише свій список.
const ladderExpandedKeys = ref([]);

// Орієнтовний вплив мапи на шанс перемоги (у відсоткових пунктах) за кожну
// "одиницю" переваги: улюблена мапа героя проти нейтральної = +1, проти
// небажаної = +2. У даних є лише favoredBy/disfavoredBy без відсотків, тому це
// евристика, яку за потреби можна підкрутити.
const LADDER_MAP_EFFECT = 5;

// Індекс матчапів у новому "плоскому" форматі: кожна пара зберігається один раз.
// Ключ — "ІмʼяA|ІмʼяB" в алфавітному порядку, значення — winrate персонажа A проти B.
const matchupIndex = new Map();

function buildMatchupIndex(matchupsArr) {
  matchupIndex.clear();
  for (const m of matchupsArr || []) {
    if (!m.a || !m.b) continue;

    const [a, b] = [m.a, m.b].sort();
    const key = `${a}|${b}`;

    const winrateA = m.a === a ? m.winrate_a : 100 - m.winrate_a;

    matchupIndex.set(key, winrateA);
  }
}

// Єдина точка доступу до матчапів. Замінює старе char.matchups?.[enemy.name].
// Повертає число (0-100) або null, якщо матчап невідомий.
function getWinrate(nameA, nameB) {
  if (!nameA || !nameB || nameA === nameB) return null;
  const [a, b] = [nameA, nameB].sort();
  const key = `${a}|${b}`;
  if (!matchupIndex.has(key)) return null;
  const winrateA = matchupIndex.get(key);
  if (winrateA === null || winrateA === undefined) return null;
  return nameA === a ? winrateA : 100 - winrateA;
}

const MAX_ELO = 2000;
const MIN_ELO = 1000;
const STORAGE_KEY = "unmatched_draft_state_v4";

// Масив для збереження ID обраних користувачем персонажів на сторінці карт
const selectedPreviewHeroIds = ref([]);

// Функція для очищення або скидання вибору (опціонально)
function clearPreviewHeroes() {
  selectedPreviewHeroIds.value = [];
}

// У старих збереженнях ladder вибір був одним героєм (обʼєкт або null)
function normalizeLadderPicks(saved) {
  if (Array.isArray(saved)) return saved.slice(0, LADDER_PICKS);
  return saved ? [saved] : [];
}

const activePlayerPicks = computed(() =>
  player.picks.filter((c) => !postBans.value.player.has(c.id)),
);

const activeOpponentPicks = computed(() =>
  opponent.picks.filter((c) => !postBans.value.opponent.has(c.id)),
);

const takenIds = computed(() => {
  return new Set(
    [...player.bans, ...player.picks, ...opponent.bans, ...opponent.picks].map(
      (c) => c.id,
    ),
  );
});

const filtered = computed(() => {
  const activeFormatConfig = availableFormats.value[currentFormat.value];
  if (!activeFormatConfig) return [];

  let arr = characters.value.filter(
    (c) =>
      isIdAllowedGlobal(c.id, activeFormatConfig.allowedHeroIds) &&
      !takenIds.value.has(c.id),
  );

  if (search.value) {
    arr = arr.filter((c) =>
      c.name.toLowerCase().includes(search.value.toLowerCase()),
    );
  }

  if (sortMode.value === "name") {
    return [...arr].sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...arr].sort((a, b) => {
    const scoreA = getPickPercent(a);
    const scoreB = getPickPercent(b);

    const valA = scoreA === "UNKNOWN" ? -1 : Number(scoreA) || 0;
    const valB = scoreB === "UNKNOWN" ? -1 : Number(scoreB) || 0;

    return valB - valA;
  });
});

// Повертає повний список взагалі всіх персонажів з бази даних
function getAllCharacters() {
  return characters.value || [];
}

const sequence = computed(() => {
  const isPlayerFirst = firstPicker.value === "player";
  const formatObj = availableFormats.value[currentFormat.value];
  const pattern = formatObj ? formatObj.sequence : [];
  return pattern.map((step) => ({
    type: step.type,
    player: isPlayerFirst
      ? step.p1
        ? "player"
        : "opponent"
      : step.p1
        ? "opponent"
        : "player",
  }));
});

const playerBansCount = computed(
  () =>
    sequence.value.filter(
      (step) => step.type === "ban" && step.player === "player",
    ).length,
);

const opponentBansCount = computed(
  () =>
    sequence.value.filter(
      (step) => step.type === "ban" && step.player === "opponent",
    ).length,
);

const current = computed(() => sequence.value[step.value] || null);

const formatMode = computed(
  () => availableFormats.value[currentFormat.value]?.mode ?? MODE_TURNS,
);
const isSimultaneous = computed(() => formatMode.value === MODE_SIMULTANEOUS);

// Герої, дозволені форматом (без урахування банів/пошуку)
const formatPool = computed(() => {
  const config = availableFormats.value[currentFormat.value];
  if (!config) return [];
  return characters.value.filter((c) =>
    isIdAllowedGlobal(c.id, config.allowedHeroIds),
  );
});

// Мапи, дозволені форматом (без урахування пошуку)
const formatMaps = computed(() => {
  const config = availableFormats.value[currentFormat.value];
  if (!config) return [];
  const allowed = config.allowedMapIds;
  if (!allowed || allowed.includes("all")) return maps.value;
  return maps.value.filter((map) => allowed.includes(map.id));
});

// Герої, яких обрали обидві сторони одночасно (вони скидаються)
const ladderMirrorIds = computed(() => {
  const theirs = new Set(ladderChoice.opponent.map((c) => c.id));
  return ladderChoice.player.filter((c) => theirs.has(c.id)).map((c) => c.id);
});

// empty | waiting (не всі обрані) | mirror (є однакові герої) | ready
const ladderStatus = computed(() => {
  const { player: mine, opponent: theirs } = ladderChoice;
  if (!mine.length && !theirs.length) return "empty";
  if (ladderMirrorIds.value.length) return "mirror";
  if (mine.length < LADDER_PICKS || theirs.length < LADDER_PICKS) {
    return "waiting";
  }
  return "ready";
});

const ladderEmptyOpponentSlots = computed(() =>
  Math.max(0, LADDER_PICKS - ladderChoice.opponent.length),
);

// 1 — герой улюблений на мапі, -1 — небажаний, 0 — нейтральний
function mapMark(map, charName) {
  if ((map.favoredBy || []).includes(charName)) return 1;
  if ((map.disfavoredBy || []).includes(charName)) return -1;
  return 0;
}

// Шанс героя mine проти героя theirs на мапі: базовий матчап (50, якщо даних
// немає) плюс поправка за мапу
function getLadderChance(mine, theirs, map) {
  const matchup = getWinrate(mine.name, theirs.name) ?? 50;
  const mapDelta =
    LADDER_MAP_EFFECT * (mapMark(map, mine.name) - mapMark(map, theirs.name));
  const chance = Math.max(1, Math.min(99, Math.round(matchup + mapDelta)));
  return { matchup, mapDelta, chance };
}

// Загальні шанси команд: усі пари героїв, без урахування мапи
const ladderWinrate = computed(() => {
  const pWin = calculateTeamWinrate(ladderChoice.player, ladderChoice.opponent);
  return { player: pWin, opponent: 100 - pWin };
});

// Стратегія: суперник може зіграти будь-яким зі своїх героїв, тому для кожного
// мого героя на кожній мапі беремо середній і найгірший шанс проти обох.
// Рекомендація — герой із кращим середнім на своїй найкращій мапі.
const ladderStrategy = computed(() => {
  const mine = ladderChoice.player;
  const theirs = ladderChoice.opponent;
  const mapList = formatMaps.value;
  if (!mine.length || !theirs.length || !mapList.length) return null;

  const options = mine
    .map((hero) => {
      const perMap = mapList
        .map((map) => {
          const versus = theirs.map((enemy) => ({
            enemy,
            ...getLadderChance(hero, enemy, map),
          }));
          const chances = versus.map((v) => v.chance);
          return {
            map,
            versus,
            average: Math.round(
              chances.reduce((sum, c) => sum + c, 0) / chances.length,
            ),
            worst: Math.min(...chances),
          };
        })
        .sort(
          (a, b) =>
            b.average - a.average ||
            b.worst - a.worst ||
            a.map.name.localeCompare(b.map.name),
        );

      return { hero, best: perMap[0], topMaps: perMap.slice(0, 3) };
    })
    .sort(
      (a, b) =>
        b.best.average - a.best.average ||
        b.best.worst - a.best.worst ||
        a.hero.name.localeCompare(b.hero.name),
    );

  return { options, recommended: options[0] };
});

// Що показувати в колонках гравців: у ladder на кроці героїв це поточний
// вибір раунду, в інших випадках — звичайні піки
const displayPlayerPicks = computed(() =>
  isSimultaneous.value && currentStep.value === "characters"
    ? ladderChoice.player
    : player.picks,
);
const displayOpponentPicks = computed(() =>
  isSimultaneous.value && currentStep.value === "characters"
    ? ladderChoice.opponent
    : opponent.picks,
);

// Пост-бани мають сенс лише в покроковому форматі
const canPostBan = computed(() => !current.value && !isSimultaneous.value);

const turnColor = computed(() => {
  if (isSimultaneous.value && currentStep.value === "characters") {
    if (ladderStatus.value === "mirror") return "#ef4444";
    if (ladderStatus.value === "ready") return "#10b981";
    return player.color;
  }
  if (currentStep.value === "maps" || !current.value) return "#10b981";
  return current.value.player === "player" ? player.color : opponent.color;
});

const canProceedToMaps = computed(() => {
  return (
    !current.value &&
    player.picks.length > 0 &&
    opponent.picks.length > 0 &&
    postBans.value.player.size === 2 &&
    postBans.value.opponent.size === 2
  );
});

function isIdAllowedGlobal(id, allowedConfig) {
  if (allowedConfig === "all") return true;
  if (!Array.isArray(allowedConfig)) return false;
  if (allowedConfig.includes("all")) return true;

  const numericId = Number(id);

  for (const item of allowedConfig) {
    if (typeof item === "number" && item === numericId) return true;

    if (typeof item === "string" && item.includes("-")) {
      const parts = item.split("-");
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      if (
        !isNaN(start) &&
        !isNaN(end) &&
        numericId >= start &&
        numericId <= end
      )
        return true;
    }
  }
  return false;
}

function getPickPercent(char) {
  // 1. Розраховуємо базовий рейтинг на основі ELO (від 0 до 100)
  const clamped = Math.max(MIN_ELO, Math.min(MAX_ELO, Number(char.elo) || 0));
  const baseEloRating = ((clamped - MIN_ELO) / (MAX_ELO - MIN_ELO)) * 100;

  const enemies = opponent?.picks || [];

  // Якщо супротивників взагалі ще не обрано — показуємо чистий рейтинг за ELO
  if (!enemies.length) return Math.round(baseEloRating);

  let totalWinrate = 0;
  let knownMatchupsCount = 0;
  let unknownMatchupsCount = 0;

  for (const e of enemies) {
    if (!e || !e.name) continue;

    const winrate = getWinrate(char.name, e.name);

    // Рахуємо кількість невідомих матчапів
    if (winrate === null) {
      unknownMatchupsCount++;
      continue;
    }

    totalWinrate += Number(winrate);
    knownMatchupsCount++;
  }

  // Якщо серед обраних ворогів немає жодного відомого матчапу:
  // Ми оцінюємо цей вибір як нейтральний (50%), але додаємо мікро-коригування за ELO,
  // щоб сильніший герой без даних був трохи вище за слабкого без даних.
  if (knownMatchupsCount === 0) {
    const unknownBase = 50; // База для невідомого матчапу — рівно 50%
    const eloCorrection = ((baseEloRating - 50) / 50) * 5; // максимум від -5% до +5%
    return Math.max(0, Math.min(100, Math.round(unknownBase + eloCorrection)));
  }

  // 2. Рахуємо середній вінрейт проти відомих ворогів
  let averageWinrate = totalWinrate / knownMatchupsCount;

  // Якщо частина матчапів відома, а частина — ні (наприклад, граємо проти 2 героїв, де 1 відомий, а 1 ні):
  // Ми маємо змішати відомий вінрейт з нейтральними 50% за невідомого героя, щоб врахувати ризик.
  if (unknownMatchupsCount > 0) {
    const totalSlots = knownMatchupsCount + unknownMatchupsCount;
    // Наприклад, якщо один відомий (60%), а другий ні (вважаємо як 50%): (60 + 50) / 2 = 55%
    averageWinrate = (totalWinrate + unknownMatchupsCount * 50) / totalSlots;
  }

  // Дуже м'який мікро-бонус за ELO: максимум від -1.5% до +1.5%
  // Потрібен лише для мікро-сортування героїв з однаковими матчапами
  const eloBonus = ((baseEloRating - 50) / 50) * 1.5;

  const dynamicScore = averageWinrate + eloBonus;

  return Math.max(0, Math.min(100, Math.round(dynamicScore)));
}

function calculateTeamWinrate(playerPicks, opponentPicks) {
  if (!playerPicks.length || !opponentPicks.length) return 50;
  let totalWinrate = 0,
    count = 0;
  for (const p of playerPicks) {
    for (const o of opponentPicks) {
      const winrate = getWinrate(p.name, o.name);
      totalWinrate += winrate === null ? 50 : winrate;
      count++;
    }
  }
  return count ? Math.round(totalWinrate / count) : 50;
}

const finalWinrate = computed(() => {
  const pWin = calculateTeamWinrate(
    activePlayerPicks.value,
    activeOpponentPicks.value,
  );
  return { player: pWin, opponent: 100 - pWin };
});

const banRecommendation = computed(() => {
  if (current.value || !player.picks.length || !opponent.picks.length)
    return null;

  const oppBansCount = postBans.value.opponent.size;
  const playerBansCount = postBans.value.player.size;
  const baseWinrate = calculateTeamWinrate(player.picks, opponent.picks);
  const currentLang = lang.value;

  if (oppBansCount === 0) {
    let maxBenefit = -999,
      candidates = [],
      bestWinrate = baseWinrate;
    for (const targetChar of opponent.picks) {
      const simOpp = opponent.picks.filter((c) => c.id !== targetChar.id);
      const simWin = calculateTeamWinrate(player.picks, simOpp);
      const benefit = simWin - baseWinrate;
      if (benefit > maxBenefit) {
        maxBenefit = benefit;
        candidates = [targetChar];
        bestWinrate = simWin;
      } else if (Math.abs(benefit - maxBenefit) < 0.01) {
        candidates.push(targetChar);
      }
    }
    if (candidates.length > 0) {
      const rawText =
        translations[currentLang]?.["recEnemyBanDesc"] || "recEnemyBanDesc";
      let formattedText = rawText
        .replace(
          "{names}",
          `<strong class="text-white">${candidates.map((c) => c.name).join(", ")}</strong>`,
        )
        .replace(
          "{newWinrate}",
          `<span class="rec-highlight">${bestWinrate}</span>`,
        )
        .replace(
          "{benefit}",
          `<span class="rec-highlight">${Math.max(0, Math.round(maxBenefit))}</span>`,
        );
      return {
        stage: "opponent",
        images: candidates.map((c) => c.image),
        formattedText,
      };
    }
  }

  if (playerBansCount === 1) {
    const currentActiveWinrate = calculateTeamWinrate(
      activePlayerPicks.value,
      activeOpponentPicks.value,
    );
    let maxBenefit = -999,
      candidates = [],
      bestWinrate = currentActiveWinrate;
    const remPlayer = player.picks.filter(
      (c) => !postBans.value.player.has(c.id),
    );
    for (const myChar of remPlayer) {
      const simPl = remPlayer.filter((c) => c.id !== myChar.id);
      const simWin = calculateTeamWinrate(simPl, activeOpponentPicks.value);
      const benefit = simWin - currentActiveWinrate;
      if (benefit > maxBenefit) {
        maxBenefit = benefit;
        candidates = [myChar];
        bestWinrate = simWin;
      } else if (Math.abs(benefit - maxBenefit) < 0.01) {
        candidates.push(myChar);
      }
    }
    if (candidates.length > 0) {
      const rawText =
        translations[currentLang]?.["recSelfBanDesc"] || "recSelfBanDesc";
      let formattedText = rawText
        .replace(
          "{names}",
          `<strong class="text-white">${candidates.map((c) => c.name).join(", ")}</strong>`,
        )
        .replace(
          "{newWinrate}",
          `<span class="rec-highlight">${bestWinrate}</span>`,
        )
        .replace(
          "{benefit}",
          `<span class="rec-highlight">${Math.max(0, Math.round(maxBenefit))}</span>`,
        );
      return {
        stage: "player",
        images: candidates.map((c) => c.image),
        formattedText,
      };
    }
  }
  return null;
});

const filteredMaps = computed(() => {
  let list = [...(maps.value || [])];

  // 1. ФІЛЬТРАЦІЯ ЗА ФОРМАТОМ ТУРНІРУ
  // Припускаємо, що currentFormatKey.value зберігає рядок-ключ (наприклад, 'summer_of_legends_2026')
  const activeFormat = availableFormats.value[currentFormat.value];

  if (activeFormat && activeFormat.allowedMapIds) {
    const allowedIds = activeFormat.allowedMapIds;

    // Якщо в масиві немає значення "all", тоді жорстко фільтруємо за ID
    if (!allowedIds.includes("all")) {
      list = list.filter((map) => allowedIds.includes(map.id));
    }
  }

  // 2. РОЗРАХУНОК ДИНАМІЧНОГО РЕЙТИНГУ
  list = list.map((map) => {
    const favoredBy = map.favoredBy || [];
    const disfavoredBy = map.disfavoredBy || [];
    let score = 50;

    for (const char of activePlayerPicks.value) {
      if (favoredBy.includes(char.name)) score += 25;
      if (disfavoredBy.includes(char.name)) score -= 25;
    }
    for (const char of activeOpponentPicks.value) {
      if (disfavoredBy.includes(char.name)) score += 25;
      if (favoredBy.includes(char.name)) score -= 25;
    }
    return { ...map, dynamicRating: Math.max(0, Math.min(100, score)) };
  });

  // 3. ФІЛЬТРАЦІЯ ЗА ПОШУКОМ
  const query = search.value.toLowerCase().trim();
  if (query)
    list = list.filter((map) => map.name.toLowerCase().includes(query));

  // 4. СОРТУВАННЯ
  list.sort((a, b) => {
    if (sortMode.value === "name") return a.name.localeCompare(b.name);
    if (b.dynamicRating === a.dynamicRating)
      return (b.pickPercent || 0) - (a.pickPercent || 0);
    return b.dynamicRating - a.dynamicRating;
  });

  return list;
});

watch([lang, sortMode, currentStep, selectedMapId], () => {
  const state = {
    lang: lang.value,
    sortMode: sortMode.value,
    firstPicker: firstPicker.value,
    currentFormat: currentFormat.value,
    step: step.value,
    playerPicks: player.picks,
    playerBans: player.bans,
    opponentPicks: opponent.picks,
    opponentBans: opponent.bans,
    history: history.value,
    postBansPlayer: Array.from(postBans.value.player),
    postBansOpponent: Array.from(postBans.value.opponent),
    ladderPlayer: ladderChoice.player,
    ladderOpponent: ladderChoice.opponent,
    currentStep: currentStep.value,
    selectedMapId: selectedMapId.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});

export function useDraftState() {
  function t(key) {
    return (
      key.split(".").reduce((obj, i) => obj?.[i], translations[lang.value]) ||
      key
    );
  }

  const loadChars = async () => {
    const res = await fetch("characters.json");
    const data = await res.json();
    characters.value = data.characters;
    buildMatchupIndex(data.matchups);
  };

  const loadMaps = async () => {
    const res = await fetch("maps.json");
    maps.value = await res.json();
  };

  function saveToStorage() {
    const state = {
      lang: lang.value,
      sortMode: sortMode.value,
      firstPicker: firstPicker.value,
      currentFormat: currentFormat.value,
      step: step.value,
      playerPicks: player.picks,
      playerBans: player.bans,
      opponentPicks: opponent.picks,
      opponentBans: opponent.bans,
      history: history.value,
      postBansPlayer: Array.from(postBans.value.player),
      postBansOpponent: Array.from(postBans.value.opponent),
      ladderPlayer: ladderChoice.player,
      ladderOpponent: ladderChoice.opponent,
      currentStep: currentStep.value,
      selectedMapId: selectedMapId.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadFromStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const state = JSON.parse(saved);
      lang.value = state.lang || "en";
      sortMode.value = state.sortMode || "elo";
      firstPicker.value = state.firstPicker || "player";
      currentFormat.value = availableFormats.value[state.currentFormat]
        ? state.currentFormat
        : DEFAULT_FORMAT;
      step.value = state.step || 0;
      player.picks = state.playerPicks || [];
      player.bans = state.playerBans || [];
      opponent.picks = state.opponentPicks || [];
      opponent.bans = state.opponentBans || [];
      history.value = state.history || [];
      postBans.value.player = new Set(state.postBansPlayer || []);
      postBans.value.opponent = new Set(state.postBansOpponent || []);
      ladderChoice.player = normalizeLadderPicks(state.ladderPlayer);
      ladderChoice.opponent = normalizeLadderPicks(state.ladderOpponent);
      currentStep.value = state.currentStep || "characters";
      selectedMapId.value = state.selectedMapId || null;
    } catch (e) {
      console.error(e);
    }
  }

  function resetAll() {
    player.bans = [];
    player.picks = [];
    opponent.bans = [];
    opponent.picks = [];
    history.value = [];
    step.value = 0;
    postBans.value.player.clear();
    postBans.value.opponent.clear();
    ladderChoice.player = [];
    ladderChoice.opponent = [];
    ladderExpandedKeys.value = [];
    showInfoPopover.value = false;
    currentStep.value = "characters";
    selectedMapId.value = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  function proceedToMaps() {
    search.value = "";
    currentStep.value = "maps";
    saveToStorage();
  }

  function pick(char) {
    if (!current.value) return;
    const target = current.value.player === "player" ? player : opponent;
    if (current.value.type === "ban") target.bans.push(char);
    else target.picks.push(char);
    history.value.push({
      char,
      player: current.value.player,
      type: current.value.type,
    });
    step.value++;
    saveToStorage();
  }

  function undo() {
    const last = history.value.pop();
    if (!last) return;
    step.value--;
    const target = last.player === "player" ? player : opponent;
    const arr = last.type === "ban" ? target.bans : target.picks;
    arr.pop();
    postBans.value.player.clear();
    postBans.value.opponent.clear();
    saveToStorage();
  }

  function togglePostBan(side, id) {
    if (!canPostBan.value) return;
    const set = postBans.value[side];
    if (set.has(id)) set.delete(id);
    else if (set.size < 2) set.add(id);
    saveToStorage();
  }

  // Для сторінки "Матчапи персонажів": повертає карти, де charAName грає
  // краще за charBName (charA у favoredBy і/або charB у disfavoredBy),
  // відсортовані від найкращих до найгірших.
  function getBestMapsForMatchup(charAName, charBName) {
    if (!charAName || !charBName) return [];

    const scoreOnMap = (map, charName) => {
      const favoredBy = map.favoredBy || [];
      const disfavoredBy = map.disfavoredBy || [];
      if (favoredBy.includes(charName)) return 1;
      if (disfavoredBy.includes(charName)) return -1;
      return 0;
    };

    return (maps.value || [])
      .map((map) => ({
        ...map,
        matchupDiff: scoreOnMap(map, charAName) - scoreOnMap(map, charBName),
      }))
      .filter((map) => map.matchupDiff > 0)
      .sort((a, b) => b.matchupDiff - a.matchupDiff);
  }

  // Створює новий власний формат або оновлює існуючий (якщо передано id).
  // Повертає id збереженого формату.
  function saveCustomFormat(data) {
    const id = data.id || `${CUSTOM_FORMAT_PREFIX}${Date.now().toString(36)}`;
    const format = buildCustomFormat({ ...data, id });

    const idx = customFormats.value.findIndex((f) => f.id === id);
    if (idx === -1) customFormats.value.push(format);
    else customFormats.value[idx] = format;

    persistCustomFormats(customFormats.value);
    return id;
  }

  function getCustomFormat(id) {
    return customFormats.value.find((f) => f.id === id) || null;
  }

  function deleteCustomFormat(id) {
    customFormats.value = customFormats.value.filter((f) => f.id !== id);
    persistCustomFormats(customFormats.value);

    // Якщо видалили формат, у якому зараз іде драфт — його пул героїв і схема
    // зникли, тому повертаємось до формату за замовчуванням з чистим драфтом.
    if (currentFormat.value === id) {
      resetAll();
      currentFormat.value = DEFAULT_FORMAT;
      saveToStorage();
    }
  }

  // --- Ladder (simultaneous) -------------------------------------------------

  // Герой гравця: клік по карточці обирає, повторний клік знімає.
  // Більше за LADDER_PICKS обрати не можна.
  function toggleLadderPlayer(char) {
    if (!isSimultaneous.value || !char) return;
    const list = ladderChoice.player;
    const idx = list.findIndex((c) => c.id === char.id);
    if (idx !== -1) list.splice(idx, 1);
    else if (list.length < LADDER_PICKS) list.push(char);
    saveToStorage();
  }

  // Герой опонента: додаємо через слоти з плюсиком
  function addLadderOpponent(char) {
    if (!isSimultaneous.value || !char) return;
    const list = ladderChoice.opponent;
    if (list.length >= LADDER_PICKS || list.some((c) => c.id === char.id)) {
      return;
    }
    list.push(char);
    saveToStorage();
  }

  function removeLadderChoice(side, charId) {
    const list = ladderChoice[side];
    const idx = list.findIndex((c) => c.id === charId);
    if (idx === -1) return;
    list.splice(idx, 1);
    // Прибраний герой більше не має відкритого списку в колонці
    ladderExpandedKeys.value = ladderExpandedKeys.value.filter(
      (key) => key !== `${side}:${charId}`,
    );
    saveToStorage();
  }

  // Розгорнути/згорнути список матчапів лише в однієї картки
  function toggleLadderExpanded(key) {
    const keys = ladderExpandedKeys.value;
    ladderExpandedKeys.value = keys.includes(key)
      ? keys.filter((k) => k !== key)
      : [...keys, key];
  }

  // "Загроза" для ladder: герой, який у середньому бʼє вже обраних мною героїв
  // (>= 53%). Та сама логіка, що й getThreatData у звичайному драфті, але
  // рахується від ladderChoice.player і не діє на тих, кого я вже обрав.
  function getLadderThreat(char) {
    const data = { isThreat: false, targets: [] };
    const mine = ladderChoice.player;
    if (!mine.length || mine.some((c) => c.id === char.id)) return data;

    let total = 0;
    let count = 0;
    for (const myChar of mine) {
      const winrate = getWinrate(char.name, myChar.name);
      if (winrate === null) continue;

      total += winrate;
      count++;
      if (winrate >= 53) data.targets.push({ name: myChar.name, winrate });
    }

    data.isThreat = count > 0 && total / count >= 53;
    data.targets.sort((a, b) => b.winrate - a.winrate);
    return data;
  }

  // Усі герої обрані й не збігаються => фіксуємо їх як піки й переходимо до карт
  function proceedLadderToMaps() {
    if (ladderStatus.value !== "ready") return false;
    player.picks = [...ladderChoice.player];
    opponent.picks = [...ladderChoice.opponent];
    postBans.value.player.clear();
    postBans.value.opponent.clear();
    saveToStorage();
    return true;
  }

  // Статистика героя проти всього пулу формату. Дзеркало не враховуємо
  // (воно скидається), матчапи без даних у середньому рахуємо як 50%.
  function getLadderStats(char) {
    let sum = 0;
    let total = 0;
    let worst = null;

    for (const enemy of formatPool.value) {
      if (enemy.id === char.id) continue;

      total++;
      const winrate = getWinrate(char.name, enemy.name);
      if (winrate === null) {
        sum += 50;
        continue;
      }

      sum += winrate;
      if (!worst || winrate < worst.winrate) {
        worst = { name: enemy.name, winrate };
      }
    }

    return { average: total ? Math.round(sum / total) : 50, worst };
  }

  function selectMap(mapId) {
    selectedMapId.value = mapId;
    saveToStorage();
  }

  function getPercentClass(p) {
    if (p >= 75) return "green";
    if (p >= 50) return "yellow";
    if (p >= 30) return "orange";
    return "red";
  }

  function getMatchupTypeByWinrate(winrate) {
    if (winrate === undefined || winrate === null) return "UNKNOWN";

    if (winrate >= 80) return "HARD_COUNTER";
    else if (winrate >= 70) return "COUNTER";
    else if (winrate >= 58) return "FAVORED";
    else if (winrate >= 43) return "NEUTRAL";
    else if (winrate >= 31) return "DISFAVORED";
    else if (winrate >= 21) return "WEAK";
    else return "HARD_WEAK";
  }

  function getMapGroups(map, options = {}) {
    const isPreview = options.isPreview || false;

    const favoredBy = map.favoredBy || [];
    const disfavoredBy = map.disfavoredBy || [];
    const neutralTo = map.neutralTo || [];

    const goodFor = [];
    const badFor = [];
    const neutralFor = [];

    // Внутрішній помічник, щоб не дублювати логіку перевірок у циклах
    const processCharacter = (char, sideName) => {
      // ЯКЩО це прев'ю і користувач обрав якихось героїв,
      // пропускаємо всіх, хто не входить у список обраних
      if (isPreview && selectedPreviewHeroIds.value.length > 0) {
        if (!selectedPreviewHeroIds.value.includes(char.id)) return;
      }

      if (favoredBy.includes(char.name)) {
        goodFor.push({ image: char.image, name: char.name, side: sideName });
      } else if (disfavoredBy.includes(char.name)) {
        badFor.push({ image: char.image, name: char.name, side: sideName });
      } else {
        // У режимі прев'ю додаємо лише тих, хто явно прописаний як нейтральний для карти
        // У режимі драфту додаємо всіх інших персонажів, як і було раніше
        if (!isPreview || neutralTo.includes(char.name)) {
          neutralFor.push({
            image: char.image,
            name: char.name,
            side: sideName,
          });
        }
      }
    };

    if (isPreview) {
      // РЕЖИМ ПРЕВ'Ю: перебираємо абсолютно всіх персонажів без жодних фільтрів
      const charsSource = getAllCharacters();
      for (const char of charsSource) {
        processCharacter(char, "preview");
      }
    } else {
      // РЕЖИМ ДРАФТУ: перебираємо лише активні піки гравців
      for (const char of activePlayerPicks.value) {
        processCharacter(char, "player");
      }
      for (const char of activeOpponentPicks.value) {
        processCharacter(char, "opponent");
      }
    }

    return { goodFor, badFor, neutralFor };
  }

  const currentTurnText = computed(() => {
    if (currentStep.value === "maps") {
      return t("phaseMapSelection");
    }

    if (isSimultaneous.value) {
      return t(`ladderStatus_${ladderStatus.value}`);
    }

    if (!current.value) {
      return t("matrixReady");
    }

    const target = current.value.player === "player" ? "Player" : "Opponent";

    const actionType =
      current.value.type.charAt(0).toUpperCase() + current.value.type.slice(1);

    const translationKey = `turn${target}${actionType}`;

    return t(translationKey);
  });

  return {
    lang,
    search,
    sortMode,
    firstPicker,
    currentFormat,
    availableFormats,
    customFormats,
    isSimultaneous,
    formatPool,
    ladderChoice,
    ladderStatus,
    ladderMirrorIds,
    ladderEmptyOpponentSlots,
    ladderSort,
    ladderExpandedKeys,
    ladderWinrate,
    ladderStrategy,
    displayPlayerPicks,
    displayOpponentPicks,
    canPostBan,
    toggleLadderPlayer,
    addLadderOpponent,
    removeLadderChoice,
    toggleLadderExpanded,
    proceedLadderToMaps,
    getLadderStats,
    getLadderThreat,
    saveCustomFormat,
    getCustomFormat,
    deleteCustomFormat,
    showInfoPopover,
    player,
    opponent,
    characters,
    history,
    step,
    maps,
    currentStep,
    selectedMapId,
    postBans,
    activePlayerPicks,
    activeOpponentPicks,
    filtered,
    current,
    currentTurnText,
    turnColor,
    canProceedToMaps,
    filteredMaps,
    finalWinrate,
    banRecommendation,
    t,
    loadChars,
    loadMaps,
    saveToStorage,
    loadFromStorage,
    resetAll,
    pick,
    undo,
    togglePostBan,
    selectMap,
    getPickPercent,
    getPercentClass,
    getWinrate,
    getMatchupTypeByWinrate,
    getMapGroups,
    getBestMapsForMatchup,
    proceedToMaps,
    getAllCharacters,
    maps,
    selectedPreviewHeroIds,
    playerBansCount,
    opponentBansCount,
  };
}
