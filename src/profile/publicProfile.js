const heroRows = (map) =>
  Object.entries(map || {})
    .map(([key, row]) => ({ key, played: row.played, wins: row.wins }))
    .sort((a, b) => b.played - a.played);

const kindData = (kind) => ({
  games: kind.games,
  wins: kind.wins,
  losses: kind.losses,
  dealt: kind.dealt,
  heroes: heroRows(kind.perHero),
});

const modeData = (stats, mode) => {
  const row = (stats.perMode || {})[mode] || { played: 0, wins: 0 };
  return {
    played: row.played,
    wins: row.wins,
    heroes: heroRows((stats.modeHeroes || {})[mode]),
  };
};

export const buildStatsData = (stats, league) => ({
  players: kindData(stats.kinds.players),
  bots: kindData(stats.kinds.bots),
  modes: {
    ...kindData(stats.kinds.modes),
    runs: stats.runs,
    runsWon: stats.runsWon,
    sub: {
      packDraft: modeData(stats, "packDraft"),
      roguelike: modeData(stats, "roguelike"),
    },
  },
  league: league
    ? {
        username: league.username,
        rating: league.rating,
        deviation: league.deviation,
        ratedMatches: league.ratedMatches,
        importedAt: league.importedAt,
        fighters: league.fighters,
      }
    : null,
});

export const buildCard = (profile, level, done, data) => ({
  bio: profile.bio,
  frame: profile.frame,
  banner: profile.banner,
  favHero: profile.favHero,
  cardFrame: profile.cardFrame,
  cardEffect: profile.cardEffect,
  cardArt: profile.cardArt,
  showcase: profile.showcase,
  leaguePrimary: profile.leaguePrimary,
  leagueMerge: profile.leagueMerge,
  level,
  done,
  data: profile.showStats ? data : null,
});

export const leagueTotals = (league) =>
  league
    ? league.fighters.reduce(
        (sum, row) => ({
          games: sum.games + row.games,
          wins: sum.wins + row.wins,
          losses: sum.losses + row.losses,
        }),
        { games: 0, wins: 0, losses: 0 },
      )
    : { games: 0, wins: 0, losses: 0 };

export const mainTotals = (data, primary, merge) => {
  const own = {
    games: data.players.games + data.bots.games + data.modes.games,
    wins: data.players.wins + data.bots.wins + data.modes.wins,
  };
  const league = leagueTotals(data.league);
  if (primary && data.league) return league;
  if (merge && data.league)
    return { games: own.games + league.games, wins: own.wins + league.wins };
  return own;
};
