const heroesPlayed = (s) => Object.keys(s.perHero).length;
const bestHero = (s) =>
  Math.max(0, ...Object.values(s.perHero).map((row) => row.wins));
const heroesWon = (s) =>
  Object.values(s.perHero).filter((row) => row.wins > 0).length;

export const achievementDefs = [
  {
    id: "firstBlood",
    icon: "crossedSwords",
    rarity: "common",
    goal: 1,
    v: (s) => s.wins,
  },
  {
    id: "tenWins",
    icon: "trophy",
    rarity: "common",
    goal: 10,
    v: (s) => s.wins,
  },
  {
    id: "fiftyWins",
    icon: "laurels",
    rarity: "rare",
    goal: 50,
    v: (s) => s.wins,
  },
  {
    id: "hundredWins",
    icon: "castle",
    rarity: "legendary",
    goal: 100,
    v: (s) => s.wins,
  },
  {
    id: "veteran",
    icon: "scrollUnfurled",
    rarity: "common",
    goal: 25,
    v: (s) => s.games,
  },
  {
    id: "marathoner",
    icon: "hourglass",
    rarity: "rare",
    goal: 150,
    v: (s) => s.games,
  },
  {
    id: "streak3",
    icon: "boltSpellCast",
    rarity: "common",
    goal: 3,
    v: (s) => s.bestStreak,
  },
  {
    id: "streak7",
    icon: "torch",
    rarity: "epic",
    goal: 7,
    v: (s) => s.bestStreak,
  },
  {
    id: "bruiser",
    icon: "punch",
    rarity: "common",
    goal: 100,
    v: (s) => s.dealt,
  },
  {
    id: "destroyer",
    icon: "swordWound",
    rarity: "rare",
    goal: 1000,
    v: (s) => s.dealt,
  },
  {
    id: "annihilator",
    icon: "skullCrossedBones",
    rarity: "epic",
    goal: 5000,
    v: (s) => s.dealt,
  },
  {
    id: "medic",
    icon: "firstAidKit",
    rarity: "common",
    goal: 40,
    v: (s) => s.healed,
  },
  {
    id: "healer",
    icon: "heartPlus",
    rarity: "rare",
    goal: 300,
    v: (s) => s.healed,
  },
  {
    id: "phoenix",
    icon: "sun",
    rarity: "epic",
    goal: 1000,
    v: (s) => s.healed,
  },
  {
    id: "bigHit",
    icon: "muscleUp",
    rarity: "rare",
    goal: 25,
    v: (s) => s.bestDealt,
  },
  {
    id: "bigHeal",
    icon: "waterDrop",
    rarity: "rare",
    goal: 15,
    v: (s) => s.bestHealed,
  },
  {
    id: "flawless",
    icon: "padlock",
    rarity: "epic",
    goal: 1,
    v: (s) => s.flawless,
  },
  {
    id: "comeback",
    icon: "ghost",
    rarity: "rare",
    goal: 3,
    v: (s) => s.comebacks,
  },
  {
    id: "quickWin",
    icon: "rollingDices",
    rarity: "rare",
    goal: 3,
    v: (s) => s.quickWins,
  },
  {
    id: "longGame",
    icon: "bookPile",
    rarity: "common",
    goal: 3,
    v: (s) => s.marathons,
  },
  {
    id: "nightOwl",
    icon: "candleFlame",
    rarity: "common",
    goal: 5,
    v: (s) => s.night,
  },
  {
    id: "explorer",
    icon: "treasureMap",
    rarity: "common",
    goal: 5,
    v: heroesPlayed,
  },
  {
    id: "collector",
    icon: "ninjaMask",
    rarity: "epic",
    goal: 12,
    v: heroesPlayed,
  },
  {
    id: "conqueror",
    icon: "crownedSkull",
    rarity: "legendary",
    goal: 10,
    v: heroesWon,
  },
  { id: "master", icon: "swordman", rarity: "rare", goal: 10, v: bestHero },
  {
    id: "onlineDebut",
    icon: "shakingHands",
    rarity: "common",
    goal: 1,
    v: (s) => s.onlineWins,
  },
  {
    id: "onlineStar",
    icon: "crystalBall",
    rarity: "epic",
    goal: 15,
    v: (s) => s.onlineWins,
  },
  {
    id: "firstRun",
    icon: "campfire",
    rarity: "common",
    goal: 1,
    v: (s) => s.runs,
  },
  {
    id: "runWinner",
    icon: "hornedSkull",
    rarity: "rare",
    goal: 1,
    v: (s) => s.runsWon,
  },
  {
    id: "runLegend",
    icon: "lockedChest",
    rarity: "epic",
    goal: 20,
    v: (s) => s.runWins,
  },
];

export const buildAchievements = (stats) =>
  achievementDefs.map((def) => {
    const progress = Math.min(def.goal, Math.floor(def.v(stats)));
    return {
      id: def.id,
      icon: def.icon,
      rarity: def.rarity,
      goal: def.goal,
      progress,
      done: progress >= def.goal,
    };
  });

export const xpWeights = {
  online: 1,
  bot: 1 / 50,
  packDraft: 1 / 25,
  roguelike: 1 / 25,
};

export const levelOf = (stats, achievements) => {
  const modes = Object.entries(stats.perMode || {});
  const played = modes.reduce(
    (sum, [mode, row]) =>
      sum +
      (row.wins * 40 + (row.played - row.wins) * 15) *
        (xpWeights[mode] ?? xpWeights.bot),
    0,
  );
  const xp = Math.round(
    played + achievements.filter((item) => item.done).length * 120,
  );
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
