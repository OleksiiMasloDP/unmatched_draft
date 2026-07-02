import { ref, computed, watch } from "vue";
import { translations } from "../i18n.js";
import { formats } from "../draftFormats.js";

const lang = ref("en");
const search = ref("");
const sortMode = ref("elo");
const firstPicker = ref("player");
const currentFormat = ref("test_format");
const availableFormats = ref(formats);
const showInfoPopover = ref(false);

const player = ref({ color: "#4f7cff", bans: [], picks: [] });
const opponent = ref({ color: "#ff4f6d", bans: [], picks: [] });

const characters = ref([]);
const history = ref([]);
const step = ref(0);
const maps = ref([]);
const currentStep = ref("characters");
const selectedMapId = ref(null);

const postBans = ref({ player: new Set(), opponent: new Set() });

const MAX_ELO = 1600;
const MIN_ELO = 1300;
const STORAGE_KEY = "unmatched_draft_state_v4";

const activePlayerPicks = computed(() =>
  player.value.picks.filter((c) => !postBans.value.player.has(c.id)),
);

const activeOpponentPicks = computed(() =>
  opponent.value.picks.filter((c) => !postBans.value.opponent.has(c.id)),
);

const takenIds = computed(() => {
  return new Set(
    [
      ...player.value.bans,
      ...player.value.picks,
      ...opponent.value.bans,
      ...opponent.value.picks,
    ].map((c) => c.id),
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
  if (sortMode.value === "name")
    return arr.sort((a, b) => a.name.localeCompare(b.name));
  return arr.sort((a, b) => getPickPercentGlobal(b) - getPickPercentGlobal(a));
});

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

const currentTurnText = computed(() => {
  if (currentStep.value === "maps")
    return lang.value === "ua" ? "Фаза вибору карти" : "Map Selection Phase";
  if (!current.value)
    return translations[lang.value]?.["matrixReady"] || "matrixReady";
  const targetName =
    current.value.player === "player"
      ? translations[lang.value]?.["teamYou"] || "teamYou"
      : translations[lang.value]?.["teamOpponent"] || "teamOpponent";
  const selectingText = translations[lang.value]?.["selecting"] || "selecting";
  return `${targetName} ${selectingText} ${current.value.type}...`;
});

const turnColor = computed(() => {
  if (currentStep.value === "maps" || !current.value) return "#10b981";
  return current.value.player === "player"
    ? player.value.color
    : opponent.value.color;
});

const canProceedToMaps = computed(() => {
  return (
    !current.value &&
    player.value.picks.length > 0 &&
    opponent.value.picks.length > 0 &&
    postBans.value.player.size === 2 &&
    postBans.value.opponent.size === 2
  );
});

function isIdAllowedGlobal(id, allowedConfig) {
  if (allowedConfig === "all") return true;
  if (!Array.isArray(allowedConfig)) return false;
  if (allowedConfig.includes("all")) return true;
  for (const item of allowedConfig) {
    if (typeof item === "number" && item === id) return true;
    if (typeof item === "string" && item.includes("-")) {
      const parts = item.split("-");
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      if (!isNaN(start) && !isNaN(end) && id >= start && id <= end) return true;
    }
  }
  return false;
}

function getPickPercentGlobal(char) {
  const clamped = Math.max(MIN_ELO, Math.min(MAX_ELO, char.elo));
  const base = ((clamped - MIN_ELO) / (MAX_ELO - MIN_ELO)) * 100;
  const enemies = opponent.value.picks;
  if (!enemies.length) return Math.round(base);
  let total = 0,
    count = 0;
  for (const e of enemies) {
    const mu = char.matchups?.[e.name];
    if (!mu) continue;
    total += mu.winrate - 50;
    count++;
  }
  const avg = count ? total / count : 0;
  return Math.max(0, Math.min(100, Math.round(base + avg * 1.5)));
}

function calculateTeamWinrate(playerPicks, opponentPicks) {
  if (!playerPicks.length || !opponentPicks.length) return 50;
  let totalWinrate = 0,
    count = 0;
  for (const p of playerPicks) {
    for (const o of opponentPicks) {
      if (p.matchups?.[o.name]) {
        totalWinrate += p.matchups[o.name].winrate;
        count++;
      }
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
  if (
    current.value ||
    !player.value.picks.length ||
    !opponent.value.picks.length
  )
    return null;

  const oppBansCount = postBans.value.opponent.size;
  const playerBansCount = postBans.value.player.size;
  const baseWinrate = calculateTeamWinrate(
    player.value.picks,
    opponent.value.picks,
  );
  const currentLang = lang.value;

  if (oppBansCount === 0) {
    let maxBenefit = -999,
      candidates = [],
      bestWinrate = baseWinrate;
    for (const targetChar of opponent.value.picks) {
      const simOpp = opponent.value.picks.filter((c) => c.id !== targetChar.id);
      const simWin = calculateTeamWinrate(player.value.picks, simOpp);
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
    const remPlayer = player.value.picks.filter(
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

  const query = search.value.toLowerCase().trim();
  if (query)
    list = list.filter((map) => map.name.toLowerCase().includes(query));

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
    playerPicks: player.value.picks,
    playerBans: player.value.bans,
    opponentPicks: opponent.value.picks,
    opponentBans: opponent.value.bans,
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
    characters.value = await res.json();
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
      playerPicks: player.value.picks,
      playerBans: player.value.bans,
      opponentPicks: opponent.value.picks,
      opponentBans: opponent.value.bans,
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
      player.value.picks = state.playerPicks || [];
      player.value.bans = state.playerBans || [];
      opponent.value.picks = state.opponentPicks || [];
      opponent.value.bans = state.opponentBans || [];
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
    player.value.bans = [];
    player.value.picks = [];
    opponent.value.bans = [];
    opponent.value.picks = [];
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
    const target =
      current.value.player === "player" ? player.value : opponent.value;
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
    const target = last.player === "player" ? player.value : opponent.value;
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

  function getMatchupText(char, enemy) {
    const mu = char.matchups?.[enemy.name];
    if (!mu) return "";

    const typeText = t(`matchups.${mu.type}`) || mu.type;
    return `vs ${enemy.name}: ${mu.winrate}% (${typeText})`;
  }

  function getMapGroups(map) {
    const favoredBy = map.favoredBy || [];
    const disfavoredBy = map.disfavoredBy || [];
    const goodFor = [];
    const badFor = [];

    for (const char of activePlayerPicks.value) {
      if (favoredBy.includes(char.name))
        goodFor.push({ image: char.image, name: char.name, side: "player" });
      if (disfavoredBy.includes(char.name))
        badFor.push({ image: char.image, name: char.name, side: "player" });
    }
    for (const char of activeOpponentPicks.value) {
      if (favoredBy.includes(char.name))
        goodFor.push({ image: char.image, name: char.name, side: "opponent" });
      if (disfavoredBy.includes(char.name))
        badFor.push({ image: char.image, name: char.name, side: "opponent" });
    }
    return { goodFor, badFor };
  }

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
    getPickPercent: getPickPercentGlobal,
    getPercentClass,
    getMatchupText,
    getMapGroups,
    proceedToMaps,
  };
}
