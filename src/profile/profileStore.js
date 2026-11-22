import { reactive, watch } from "vue";
import { user } from "../cloud/useAuth.js";
import { portraitUrls } from "../components/authAssets.js";

const prefix = "profile:";

export const heroKeys = portraitUrls.map((url) =>
  url.split("/").pop().replace(".webp", ""),
);

export const heroName = (key) =>
  key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const heroImage = (key) =>
  portraitUrls[Math.max(0, heroKeys.indexOf(key))];

export const frames = [
  { id: "iron", lvl: 1 },
  { id: "gold", lvl: 3 },
  { id: "flame", lvl: 6 },
  { id: "frost", lvl: 9 },
  { id: "emerald", lvl: 12 },
  { id: "royal", lvl: 16 },
];

export const banners = [
  { id: "dusk", lvl: 1 },
  { id: "ember", lvl: 1 },
  { id: "ocean", lvl: 4 },
  { id: "forest", lvl: 7 },
  { id: "void", lvl: 10 },
  { id: "gold", lvl: 14 },
];

export const titles = [
  { id: "newcomer", lvl: 1 },
  { id: "duelist", lvl: 3 },
  { id: "tactician", lvl: 6 },
  { id: "wanderer", lvl: 8 },
  { id: "warlord", lvl: 12 },
  { id: "legend", lvl: 18 },
];

const defaults = (account) => ({
  nick: account && account.email ? account.email.split("@")[0] : "Player",
  avatar: "sinbad",
  frame: "gold",
  banner: "dusk",
  title: "newcomer",
  bio: "",
  favHero: "sinbad",
  showcase: ["firstBlood", "voyager", "roguelike"],
  showStats: true,
  showHistory: true,
});

export const profile = reactive(defaults(null));

let loadedFor = null;

const read = (id) => {
  try {
    return JSON.parse(localStorage.getItem(prefix + id));
  } catch {
    return null;
  }
};

const load = (account) => {
  const base = defaults(account);
  const saved = account ? read(account.id) : null;
  loadedFor = account ? account.id : null;
  Object.assign(profile, base, saved || {});
};

watch(
  user,
  (account) => {
    load(account);
  },
  { immediate: true },
);

watch(
  profile,
  () => {
    if (!loadedFor) return;
    try {
      localStorage.setItem(prefix + loadedFor, JSON.stringify(profile));
    } catch {
      return;
    }
  },
  { deep: true },
);

const hash = (text) => {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
};

const rng = (seed) => {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const modes = ["bot", "roguelike", "online", "packDraft"];

export const buildHistory = (id) => {
  const random = rng(hash(`history${id}`));
  const now = Date.now();
  return Array.from({ length: 28 }, (_, index) => {
    const hero = heroKeys[Math.floor(random() * heroKeys.length)];
    let enemy = heroKeys[Math.floor(random() * heroKeys.length)];
    if (enemy === hero) enemy = heroKeys[(heroKeys.indexOf(hero) + 1) % 18];
    return {
      id: index,
      hero,
      enemy,
      mode: modes[Math.floor(random() * modes.length)],
      win: random() < 0.58,
      turns: 6 + Math.floor(random() * 14),
      hpLeft: Math.floor(random() * 12),
      at: now - index * (3600000 * (3 + Math.floor(random() * 20))),
    };
  });
};

const achievementDefs = [
  { id: "firstBlood", icon: "crossedSwords", rarity: "common", goal: 1 },
  { id: "tenWins", icon: "trophy", rarity: "common", goal: 10 },
  { id: "fiftyWins", icon: "laurels", rarity: "rare", goal: 50 },
  { id: "voyager", icon: "treasureMap", rarity: "common", goal: 3 },
  { id: "roguelike", icon: "campfire", rarity: "rare", goal: 5 },
  { id: "bossSlayer", icon: "crownedSkull", rarity: "epic", goal: 3 },
  { id: "streak", icon: "boltSpellCast", rarity: "rare", goal: 5 },
  { id: "allHeroes", icon: "ninjaMask", rarity: "epic", goal: 18 },
  { id: "rich", icon: "coinsPile", rarity: "rare", goal: 500 },
  { id: "flawless", icon: "heartPlus", rarity: "epic", goal: 1 },
  { id: "bookworm", icon: "bookPile", rarity: "common", goal: 20 },
  { id: "sidekick", icon: "shakingHands", rarity: "rare", goal: 25 },
  { id: "nightOwl", icon: "ghost", rarity: "common", goal: 10 },
  { id: "unmatched", icon: "castle", rarity: "legendary", goal: 100 },
];

export const buildAchievements = (id) => {
  const random = rng(hash(`ach${id}`));
  return achievementDefs.map((def) => {
    const progress = Math.min(def.goal, Math.floor(random() * def.goal * 1.15));
    return {
      ...def,
      progress,
      done: progress >= def.goal,
    };
  });
};

export const buildStats = (id) => {
  const history = buildHistory(id);
  const random = rng(hash(`stats${id}`));
  const games = 90 + Math.floor(random() * 120);
  const wins = Math.floor(games * (0.5 + random() * 0.15));
  const perHero = heroKeys
    .slice(0, 10)
    .map((hero) => {
      const played = 3 + Math.floor(random() * 28);
      return {
        hero,
        played,
        wins: Math.floor(played * (0.35 + random() * 0.5)),
      };
    })
    .sort((a, b) => b.played - a.played);
  const perMode = modes.map((mode) => {
    const played = 4 + Math.floor(random() * 60);
    return { mode, played, wins: Math.floor(played * (0.4 + random() * 0.4)) };
  });
  return {
    games,
    wins,
    losses: games - wins,
    bestStreak: 3 + Math.floor(random() * 9),
    curStreak: history.findIndex((entry) => !entry.win),
    runs: 5 + Math.floor(random() * 25),
    runsWon: 1 + Math.floor(random() * 6),
    hours: 12 + Math.floor(random() * 90),
    damage: 1800 + Math.floor(random() * 6000),
    perHero,
    perMode,
  };
};

export const levelOf = (stats, achievements) => {
  const xp =
    stats.wins * 40 +
    stats.losses * 15 +
    achievements.filter((item) => item.done).length * 120;
  let level = 1;
  let need = 200;
  let left = xp;
  while (left >= need) {
    left -= need;
    level += 1;
    need = 200 + level * 40;
  }
  return { level, xp: left, need, total: xp };
};
