import { ref, computed, watch, reactive } from "vue";
import { translations } from "../i18n.js";
import { formats } from "../draftFormats.js";

const lang = ref("en");
const search = ref("");
const sortMode = ref("elo");
const firstPicker = ref("player");
const currentFormat = ref("summer_of_legends_2026");
const availableFormats = ref(formats);
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

// Індекс матчапів у новому "плоскому" форматі: кожна пара зберігається один раз.
// Ключ — "ІмʼяA|ІмʼяB" в алфавітному порядку, значення — winrate персонажа A проти B.
const matchupIndex = new Map();

function buildMatchupIndex(matchupsArr) {
  matchupIndex.clear();
  for (const m of matchupsArr || []) {
    matchupIndex.set(`${m.a}|${m.b}`, m.winrate_a);
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

const current = computed(() => sequence.value[step.value] || null);

const turnColor = computed(() => {
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
  const activeFormat = formats[currentFormat.value];

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
      currentFormat.value = state.currentFormat || "test_format";
      step.value = state.step || 0;
      player.picks = state.playerPicks || [];
      player.bans = state.playerBans || [];
      opponent.picks = state.opponentPicks || [];
      opponent.bans = state.opponentBans || [];
      history.value = state.history || [];
      postBans.value.player = new Set(state.postBansPlayer || []);
      postBans.value.opponent = new Set(state.postBansOpponent || []);
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
    if (current.value) return;
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
    else if (winrate >= 46) return "NEUTRAL";
    else if (winrate <= 25) return "HARD_WEAK";
    else if (winrate <= 35) return "WEAK";
    else if (winrate <= 45) return "DISFAVORED";
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
  };
}
