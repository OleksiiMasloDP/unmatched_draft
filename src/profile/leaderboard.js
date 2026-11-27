import { ref, watch } from "vue";
import { authDemo, cloudEnabled, getClient } from "../cloud/client.js";
import { user } from "../cloud/useAuth.js";
import { matchStats, onStatsChange } from "./matchStats.js";
import { profile, heroKeys } from "./profileStore.js";
import { buildAchievements, levelOf } from "./achievements.js";
import { tabletop } from "./tabletop.js";
import { buildCard, buildStatsData } from "./publicProfile.js";

const TABLE = "leaderboard";
const COLUMNS = "user_id,nick,avatar,title,level,ach,stats,heroes";

const fromRow = (row) => ({
  id: row.user_id,
  nick: row.nick,
  avatar: row.avatar,
  title: row.title,
  level: row.level,
  ach: row.ach,
  stats: { ...summary(matchStats), ...row.stats },
  heroes: row.heroes || {},
  card: row.card || null,
});

const pct = (stats) =>
  stats.games >= 10 ? Math.round((stats.wins / stats.games) * 100) : 0;

export const categories = [
  { id: "wins", icon: "trophy", value: (r) => r.stats.wins },
  { id: "games", icon: "crossedSwords", value: (r) => r.stats.games },
  { id: "winrate", icon: "scales", value: (r) => pct(r.stats), suffix: "%" },
  { id: "dealt", icon: "swordWound", value: (r) => r.stats.dealt },
  { id: "healed", icon: "firstAidKit", value: (r) => r.stats.healed },
  { id: "bestStreak", icon: "boltSpellCast", value: (r) => r.stats.bestStreak },
  { id: "bestDealt", icon: "punch", value: (r) => r.stats.bestDealt },
  { id: "flawless", icon: "padlock", value: (r) => r.stats.flawless },
  { id: "onlineWins", icon: "shakingHands", value: (r) => r.stats.onlineWins },
  { id: "runsWon", icon: "campfire", value: (r) => r.stats.runsWon },
  { id: "achievements", icon: "laurels", value: (r) => r.ach },
  { id: "level", icon: "crownedSkull", value: (r) => r.level },
  {
    id: "hero",
    icon: "ninjaMask",
    value: (r, hero) => r.heroes?.[hero]?.wins || 0,
  },
];

const summary = (stats) => ({
  games: stats.games,
  wins: stats.wins,
  losses: stats.losses,
  dealt: stats.dealt,
  healed: stats.healed,
  bestStreak: stats.bestStreak,
  bestDealt: stats.bestDealt,
  bestHealed: stats.bestHealed,
  flawless: stats.flawless,
  onlineWins: stats.onlineWins,
  runsWon: stats.runsWon,
  runs: stats.runs,
});

export const ownRow = () => {
  if (!user.value) return null;
  const done = buildAchievements(matchStats);
  const lvl = levelOf(matchStats, done);
  const card = buildCard(
    profile,
    lvl,
    done.filter((item) => item.done).map((item) => item.id),
    buildStatsData(matchStats, tabletop.current),
  );
  return {
    card,
    id: user.value.id,
    nick: profile.nick || "Player",
    avatar: profile.avatar,
    title: profile.title,
    level: lvl.level,
    ach: done.filter((item) => item.done).length,
    stats: summary(matchStats),
    heroes: JSON.parse(JSON.stringify(matchStats.perHero)),
  };
};

const names = [
  "Kraken",
  "NightFox",
  "Valkyra",
  "IronMoth",
  "Sable",
  "Rook",
  "Marlowe",
  "Ember",
  "Quill",
  "Brandt",
  "Nyx",
  "Tatsu",
  "Odette",
  "Hex",
  "Mirage",
  "Bishop",
  "Cinder",
  "Lynx",
  "Orion",
  "Wraith",
  "Zephyr",
  "Pike",
  "Raven",
  "Dagger",
];

const rngOf = (seed) => {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const demoCard = (index, stats, heroes, level) => ({
  bio: "",
  frame: "gold",
  banner: "dusk",
  favHero: heroKeys[index % heroKeys.length],
  cardFrame: "hazard",
  cardEffect: "shine",
  cardArt: "hero",
  showcase: [],
  leaguePrimary: false,
  leagueMerge: false,
  level: { level, xp: 80, need: 200 + level * 40 },
  done: [],
  data: {
    players: {
      games: stats.games,
      wins: stats.wins,
      losses: stats.losses,
      dealt: stats.dealt,
      heroes: Object.entries(heroes).map(([key, row]) => ({
        key,
        played: row.played,
        wins: row.wins,
      })),
    },
    bots: { games: 0, wins: 0, losses: 0, dealt: 0, heroes: [] },
    modes: {
      games: 0,
      wins: 0,
      losses: 0,
      dealt: 0,
      heroes: [],
      runs: stats.runs,
      runsWon: stats.runsWon,
      sub: {
        packDraft: { played: 0, wins: 0, heroes: [] },
        roguelike: { played: 0, wins: 0, heroes: [] },
      },
    },
    league: null,
  },
});

const demoRows = () =>
  names.map((nick, index) => {
    const random = rngOf(index * 7919 + 13);
    const games = 12 + Math.floor(random() * 260);
    const wins = Math.floor(games * (0.3 + random() * 0.45));
    const heroes = {};
    let left = games;
    heroKeys.slice(0, 12).forEach((hero) => {
      const played = Math.min(left, Math.floor(random() * (games / 4)));
      left -= played;
      if (played)
        heroes[hero] = { played, wins: Math.floor(played * random()) };
    });
    const stats = {
      games,
      wins,
      losses: games - wins,
      dealt: Math.floor(games * (9 + random() * 14)),
      healed: Math.floor(games * (2 + random() * 9)),
      bestStreak: 2 + Math.floor(random() * 11),
      bestDealt: 12 + Math.floor(random() * 30),
      bestHealed: 6 + Math.floor(random() * 16),
      flawless: Math.floor(random() * 9),
      onlineWins: Math.floor(wins * random() * 0.6),
      runsWon: Math.floor(random() * 12),
      runs: 10 + Math.floor(random() * 30),
    };
    return {
      id: `demo-${index}`,
      nick,
      avatar: heroKeys[index % heroKeys.length],
      title: "duelist",
      level: 1 + Math.floor(wins / 8),
      ach: Math.min(30, Math.floor(wins / 5)),
      stats,
      heroes,
      card: demoCard(index, stats, heroes, 1 + Math.floor(wins / 8)),
    };
  });

export const board = ref([]);
export const boardState = ref("idle");

export async function loadBoard() {
  boardState.value = "loading";
  const mine = ownRow();
  if (authDemo || !cloudEnabled) {
    board.value = [...demoRows(), ...(mine ? [mine] : [])];
    boardState.value = "ready";
    return;
  }
  try {
    const client = await getClient();
    const { data, error } = await client
      .from(TABLE)
      .select(`${COLUMNS},card`)
      .order("level", { ascending: false })
      .limit(500);
    let list = data;
    if (error) {
      const retry = await client
        .from(TABLE)
        .select(COLUMNS)
        .order("level", { ascending: false })
        .limit(500);
      if (retry.error) throw retry.error;
      list = retry.data;
    }
    const rows = list.map(fromRow);
    const others = mine ? rows.filter((row) => row.id !== mine.id) : rows;
    board.value = mine && mine.stats.games ? [...others, mine] : others;
    boardState.value = "ready";
  } catch {
    board.value = mine && mine.stats.games ? [mine] : [];
    boardState.value = "error";
  }
}

let pushTimer = null;

async function pushNow() {
  const row = ownRow();
  if (!row || !row.stats.games || authDemo || !cloudEnabled) return;
  try {
    const client = await getClient();
    const record = {
      user_id: row.id,
      nick: row.nick,
      avatar: row.avatar,
      title: row.title,
      level: row.level,
      ach: row.ach,
      stats: row.stats,
      heroes: row.heroes,
      updated_at: new Date().toISOString(),
    };
    const { error } = await client
      .from(TABLE)
      .upsert({ ...record, card: row.card });
    if (error) await client.from(TABLE).upsert(record);
  } catch {
    return;
  }
}

const schedulePush = () => {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 2000);
};

onStatsChange(schedulePush);

export async function loadPlayer(id) {
  const mine = ownRow();
  if (mine && mine.id === id) return mine;
  if (authDemo || !cloudEnabled) {
    return demoRows().find((row) => row.id === id) || null;
  }
  try {
    const client = await getClient();
    let result = await client
      .from(TABLE)
      .select(`${COLUMNS},card`)
      .eq("user_id", id)
      .maybeSingle();
    if (result.error)
      result = await client
        .from(TABLE)
        .select(COLUMNS)
        .eq("user_id", id)
        .maybeSingle();
    return result.data ? fromRow(result.data) : null;
  } catch {
    return null;
  }
}
watch(
  () => (user.value ? JSON.stringify(ownRow()) : ""),
  (value) => {
    if (value) schedulePush();
  },
);
