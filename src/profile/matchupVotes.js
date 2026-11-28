import { reactive } from "vue";
import { cloudEnabled, authDemo, getClient } from "../cloud/client.js";
import { user } from "../cloud/useAuth.js";

const KEY = "matchupVotes_v1";

export const scales = [
  { score: 3, label: "+++", pct: 75 },
  { score: 2, label: "++", pct: 65 },
  { score: 1, label: "+", pct: 57 },
  { score: 0, label: "=", pct: 50 },
  { score: -1, label: "-", pct: 43 },
  { score: -2, label: "--", pct: 35 },
  { score: -3, label: "---", pct: 25 },
];

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};

export const votes = reactive(read());

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(votes));
  } catch {
    return;
  }
};

export const pairKey = (x, y) => {
  const [a, b] = [x, y].sort();
  return `${a}|${b}`;
};

export const hasVote = (x, y) => pairKey(x, y) in votes;

const toRow = (key, entry) => {
  const [a, b] = key.split("|");
  return { a, b, score: entry.s };
};

const usable = () => cloudEnabled && !authDemo && user.value;

export const syncVotes = async () => {
  if (!usable()) return false;
  const rows = Object.entries(votes)
    .filter(([, entry]) => !entry.synced || entry.synced !== user.value.id)
    .map(([key, entry]) => ({
      user_id: user.value.id,
      ...toRow(key, entry),
    }));
  if (!rows.length) return true;
  try {
    const client = await getClient();
    const { error } = await client
      .from("matchup_votes")
      .upsert(rows, { onConflict: "user_id,a,b" });
    if (error) return false;
    Object.values(votes).forEach((entry) => {
      entry.synced = user.value.id;
    });
    save();
    return true;
  } catch {
    return false;
  }
};

export const castVote = (nameA, nameB, score) => {
  const flip = nameA > nameB;
  votes[pairKey(nameA, nameB)] = { s: flip ? -score : score, synced: "" };
  save();
  syncVotes();
};

export const undoVote = (nameA, nameB) => {
  delete votes[pairKey(nameA, nameB)];
  save();
};

export const localExport = () =>
  Object.entries(votes).map(([key, entry]) => {
    const [a, b] = key.split("|");
    const scale = scales.find((item) => item.score === entry.s);
    return { a, b, winrate_a: scale ? scale.pct : 50, votes: 1 };
  });

export const cloudExport = async () => {
  if (!cloudEnabled || authDemo) return null;
  try {
    const client = await getClient();
    const { data, error } = await client
      .from("matchup_vote_stats")
      .select("a,b,votes,winrate_a")
      .order("a");
    return error ? null : data;
  } catch {
    return null;
  }
};
