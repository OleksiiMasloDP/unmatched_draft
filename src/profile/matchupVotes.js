import { reactive } from "vue";

const KEY = "matchupVotes_v2";

export const presets = [
  { label: "+++", pct: 80 },
  { label: "++", pct: 68 },
  { label: "+", pct: 58 },
  { label: "=", pct: 50 },
  { label: "-", pct: 42 },
  { label: "--", pct: 32 },
  { label: "---", pct: 20 },
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

export const pairKey = (x, y) => [x, y].sort().join("|");

export const hasVote = (x, y) => pairKey(x, y) in votes;

export const castVote = (nameA, nameB, pct) => {
  votes[pairKey(nameA, nameB)] = nameA < nameB ? pct : 100 - pct;
  save();
};

export const undoVote = (nameA, nameB) => {
  delete votes[pairKey(nameA, nameB)];
  save();
};

export const clearVotes = () => {
  Object.keys(votes).forEach((key) => delete votes[key]);
  save();
};

export const exportRows = () =>
  Object.entries(votes)
    .map(([key, pct]) => {
      const [a, b] = key.split("|");
      return { a, b, winrate_a: pct };
    })
    .sort((x, y) => x.a.localeCompare(y.a) || x.b.localeCompare(y.b));
