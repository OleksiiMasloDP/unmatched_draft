import { heroImage, profile } from "./profileStore";
import { buildAchievements } from "./achievements";
import { empty } from "./matchStats";
import { mainTotals } from "./publicProfile";
import { ownRow } from "./leaderboard";

const metals = {
  common: "bronze",
  rare: "silver",
  epic: "ruby",
  legendary: "gold",
};
const defs = buildAchievements(empty());

const fromRow = (row, titles, own) => {
  const card = row.card;
  const data = card && card.data;
  const totals = data
    ? mainTotals(data, card.leaguePrimary, card.leagueMerge)
    : { games: row.stats.games, wins: row.stats.wins };
  const ava =
    own && profile.avatarImg ? profile.avatarImg : heroImage(row.avatar);
  const heroArt = heroImage(card ? card.favHero : row.avatar);
  let art = heroArt;
  if (own && card) {
    if (card.cardArt === "avatar") art = ava;
    else if (card.cardArt === "banner" && profile.bannerImg)
      art = profile.bannerImg;
  }
  return {
    nick: row.nick,
    title: titles[row.title] || "",
    art,
    avatar: ava,
    frame: card ? card.cardFrame : "hazard",
    effect: card ? card.cardEffect : "shine",
    avatarFrame: card ? card.frame : "gold",
    level: card ? card.level : { level: row.level, xp: 0, need: 100 },
    games: totals.games,
    winrate: Math.round((totals.wins / Math.max(1, totals.games)) * 100),
    badges: (card ? card.showcase : [])
      .map((id) => defs.find((item) => item.id === id))
      .filter(Boolean)
      .map((item) => ({
        id: item.id,
        icon: item.icon,
        metal: metals[item.rarity],
      })),
  };
};

export const ownSeatCard = (titles) => {
  const row = ownRow();
  return row ? fromRow(row, titles, true) : null;
};

export const rowSeatCard = (row, titles) => fromRow(row, titles, false);

export const plainSeatCard = (nick, title, image) => ({
  nick,
  title,
  art: image,
  avatar: image,
  frame: "hazard",
  effect: "shine",
  avatarFrame: "iron",
  level: { level: 1, xp: 0, need: 100 },
  games: 0,
  winrate: 0,
  badges: [],
});
