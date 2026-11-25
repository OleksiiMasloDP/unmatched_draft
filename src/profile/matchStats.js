import { reactive, watch } from "vue";
import { user } from "../cloud/useAuth.js";
import { notifyChanged, registerSyncable } from "../cloud/sync.js";

const prefix = "matchstats:";
const STORE_KEY = "unmatched_matchstats";
const historyLimit = 60;

const empty = () => ({
  games: 0,
  wins: 0,
  losses: 0,
  dealt: 0,
  healed: 0,
  taken: 0,
  turns: 0,
  curStreak: 0,
  bestStreak: 0,
  onlineGames: 0,
  onlineWins: 0,
  flawless: 0,
  comebacks: 0,
  quickWins: 0,
  marathons: 0,
  night: 0,
  bestDealt: 0,
  bestHealed: 0,
  runs: 0,
  runsWon: 0,
  runWins: 0,
  perHero: {},
  perMode: {},
  history: [],
});

export const matchStats = reactive(empty());

let loadedFor = null;

const read = (id) => {
  try {
    const current = JSON.parse(localStorage.getItem(STORE_KEY));
    if (current && current.owner === id) return current;
    return JSON.parse(localStorage.getItem(prefix + id));
  } catch {
    return null;
  }
};

const listeners = new Set();

export const onStatsChange = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const loadFor = (account) => {
  loadedFor = account ? account.id : null;
  const saved = account ? read(account.id) : null;
  Object.assign(matchStats, empty(), saved || {});
  delete matchStats.owner;
  if (account && saved && !localStorage.getItem(STORE_KEY)) save();
};

watch(user, loadFor, { immediate: true });

registerSyncable({
  name: "matchStats",
  docKey: "matchStats",
  storageKey: STORE_KEY,
  toRemote: (raw) => (raw ? JSON.parse(raw) : null),
  fromRemote: (value) => (value == null ? null : JSON.stringify(value)),
  apply: () => loadFor(user.value),
});

function save() {
  if (!loadedFor) return;
  try {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ ...matchStats, owner: loadedFor }),
    );
  } catch {
    return;
  }
  notifyChanged("matchStats");
  listeners.forEach((listener) => listener());
}

export const heroKeyOf = (id) => String(id || "").replace(/-/g, "_");

const bump = (map, key, win) => {
  const row = map[key] || { played: 0, wins: 0 };
  row.played += 1;
  if (win) row.wins += 1;
  map[key] = row;
};

export function recordMatch(info) {
  if (!loadedFor) return false;
  const win = Boolean(info.win);
  const s = matchStats;
  s.games += 1;
  if (win) s.wins += 1;
  else s.losses += 1;
  s.dealt += info.dealt;
  s.healed += info.healed;
  s.taken += info.taken;
  s.turns += info.turns;
  s.curStreak = win ? s.curStreak + 1 : 0;
  s.bestStreak = Math.max(s.bestStreak, s.curStreak);
  s.bestDealt = Math.max(s.bestDealt, info.dealt);
  s.bestHealed = Math.max(s.bestHealed, info.healed);
  if (info.mode === "online") {
    s.onlineGames += 1;
    if (win) s.onlineWins += 1;
  }
  if (win && info.taken === 0) s.flawless += 1;
  if (win && info.hpLeft > 0 && info.hpLeft <= 2) s.comebacks += 1;
  if (win && info.turns <= 8) s.quickWins += 1;
  if (info.turns >= 25) s.marathons += 1;
  const hour = new Date().getHours();
  if (hour < 5) s.night += 1;
  bump(s.perHero, heroKeyOf(info.hero), win);
  bump(s.perMode, info.mode, win);
  s.history.unshift({
    id: Date.now(),
    hero: heroKeyOf(info.hero),
    enemy: heroKeyOf(info.enemy),
    mode: info.mode,
    win,
    turns: info.turns,
    hpLeft: info.hpLeft,
    foeHpLeft: info.foeHpLeft ?? null,
    map: info.map || "",
    first: typeof info.first === "boolean" ? info.first : null,
    dealt: info.dealt,
    healed: info.healed,
    at: Date.now(),
  });
  s.history.splice(historyLimit);
  save();
  return true;
}

export function recordRun({ hero, wins, victory }) {
  if (!loadedFor) return false;
  const s = matchStats;
  s.runs += 1;
  if (victory) s.runsWon += 1;
  s.runWins += wins || 0;
  bump(s.perMode, "roguelike", victory);
  s.history.unshift({
    id: Date.now(),
    hero: heroKeyOf(hero),
    enemy: "",
    mode: "roguelike",
    win: Boolean(victory),
    turns: wins || 0,
    hpLeft: 0,
    dealt: 0,
    healed: 0,
    at: Date.now(),
  });
  s.history.splice(historyLimit);
  save();
  return true;
}

export const resetStats = () => {
  Object.assign(matchStats, empty());
  save();
};
