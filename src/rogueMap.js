import { ROWS } from "./rogueData.js";

export const LANES = 5;

const pickType = (rng, row) => {
  const roll = rng();
  if (row === 0) return "fight";
  if (row === ROWS - 1) return "rest";
  if (roll < 0.3) return "fight";
  if (roll < 0.55) return "mystery";
  if (roll < 0.7 && row >= 2) return "rest";
  if (roll < 0.78 && row >= 2) return "shop";
  if (roll < 0.92 && row >= 3) return "elite";
  return "fight";
};

const crosses = (edges, from, to) =>
  edges.some(([a, b]) => (a - from) * (b - to) < 0);

function attempt(rng) {
  const present = [];
  for (let row = 0; row < ROWS; row += 1) {
    const chance = row === 0 ? 0.75 : row === ROWS - 1 ? 0.7 : 0.78;
    present.push(Array.from({ length: LANES }, () => rng() < chance));
  }
  const out = present.map((row) => row.map(() => new Set()));
  for (let row = 0; row < ROWS - 1; row += 1) {
    const used = [];
    for (let col = 0; col < LANES; col += 1) {
      if (!present[row][col]) continue;
      const options = [col - 1, col, col + 1].filter(
        (lane) => lane >= 0 && lane < LANES && present[row + 1][lane],
      );
      if (!options.length) continue;
      const first =
        options.includes(col) && rng() < 0.5
          ? col
          : options[Math.floor(rng() * options.length)];
      const chosen = [first];
      for (const lane of options) {
        if (lane !== first && rng() < 0.42) chosen.push(lane);
      }
      for (const lane of chosen) {
        if (crosses(used, col, lane)) continue;
        used.push([col, lane]);
        out[row][col].add(lane);
      }
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < LANES; col += 1) {
        if (!present[row][col]) continue;
        const hasOut = row === ROWS - 1 || out[row][col].size > 0;
        const hasIn =
          row === 0 ||
          out[row - 1].some(
            (set, from) => present[row - 1][from] && set.has(col),
          );
        if (!hasOut || !hasIn) {
          present[row][col] = false;
          out[row][col].clear();
          changed = true;
        }
      }
    }
  }
  const counts = present.map((row) => row.filter(Boolean).length);
  if (counts.some((count) => count < 2)) return null;
  let splits = 0;
  for (let row = 0; row < ROWS - 1; row += 1) {
    for (let col = 0; col < LANES; col += 1) {
      if (present[row][col] && out[row][col].size > 1) splits += 1;
    }
  }
  if (splits < 7) return null;
  return { present, out };
}

export function generateMap(rng) {
  let layout = null;
  for (let i = 0; i < 80 && !layout; i += 1) layout = attempt(rng);
  if (!layout) {
    const present = Array.from({ length: ROWS }, () =>
      Array.from({ length: LANES }, () => true),
    );
    const out = present.map((row, r) =>
      row.map((_, col) =>
        r === ROWS - 1
          ? new Set()
          : new Set([col, col + 1 < LANES ? col + 1 : col]),
      ),
    );
    layout = { present, out };
  }
  const { present, out } = layout;
  const rows = [];
  for (let row = 0; row < ROWS; row += 1) {
    const list = [];
    for (let col = 0; col < LANES; col += 1) {
      if (!present[row][col]) continue;
      const type = pickType(rng, row);
      list.push({
        id: `${row}-${col}`,
        row,
        col,
        x: (col + 0.5) / LANES,
        type,
        secret:
          type === "mystery"
            ? row >= 3 && rng() < 0.3
              ? "elite"
              : "event"
            : null,
        next:
          row === ROWS - 1
            ? [`${ROWS}-0`]
            : [...out[row][col]].map((lane) => `${row + 1}-${lane}`),
      });
    }
    rows.push(list);
  }
  rows.push([
    {
      id: `${ROWS}-0`,
      row: ROWS,
      col: Math.floor(LANES / 2),
      x: 0.5,
      type: "boss",
      secret: null,
      next: [],
    },
  ]);
  const shopRow = 4 + Math.floor(rng() * 3);
  if (!rows.flat().some((node) => node.type === "shop")) {
    const candidates = rows[shopRow].filter((node) => node.type !== "boss");
    const node = candidates[Math.floor(rng() * candidates.length)];
    node.type = "shop";
    node.secret = null;
  }
  return rows;
}
