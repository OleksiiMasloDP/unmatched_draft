import { ROWS } from "./rogueData.js";

const pickType = (rng, row) => {
  const roll = rng();
  if (row === 0) return "fight";
  if (row === ROWS - 1) return "rest";
  if (roll < 0.4) return "fight";
  if (roll < 0.6) return "mystery";
  if (roll < 0.72 && row >= 3) return "rest";
  if (roll < 0.8 && row >= 2) return "shop";
  if (roll < 0.93 && row >= 3) return "elite";
  return "fight";
};

const LANES = 3;

const crosses = (edges, from, to) =>
  edges.some(([a, b]) => (a - from) * (b - to) < 0);

export function generateMap(rng) {
  const rows = [];
  for (let row = 0; row < ROWS; row += 1) {
    rows.push(
      Array.from({ length: LANES }, (_, col) => {
        const type = pickType(rng, row);
        return {
          id: `${row}-${col}`,
          row,
          col,
          x: (col + 0.5) / LANES,
          type,
          secret:
            type === "mystery"
              ? row >= 3 && rng() < 0.5
                ? "elite"
                : "event"
              : null,
          next: [],
        };
      }),
    );
  }
  rows.push([
    {
      id: `${ROWS}-0`,
      row: ROWS,
      col: 0,
      x: 0.5,
      type: "boss",
      secret: null,
      next: [],
    },
  ]);

  const shopRow = 4 + Math.floor(rng() * 3);
  const shopNode = rows[shopRow][Math.floor(rng() * LANES)];
  shopNode.type = "shop";
  shopNode.secret = null;

  for (let row = 0; row < ROWS - 1; row += 1) {
    const edges = [];
    for (let col = 0; col < LANES; col += 1) {
      const options = [col - 1, col, col + 1].filter(
        (lane) => lane >= 0 && lane < LANES,
      );
      let target = col;
      if (rng() > 0.55) {
        const side = options.filter((lane) => lane !== col);
        target = side[Math.floor(rng() * side.length)];
      }
      if (crosses(edges, col, target)) target = col;
      edges.push([col, target]);
    }
    for (let col = 0; col < LANES; col += 1) {
      if (rng() > 0.2) continue;
      const side = [col - 1, col + 1].filter(
        (lane) =>
          lane >= 0 &&
          lane < LANES &&
          !edges.some(([a, b]) => a === col && b === lane) &&
          !crosses(edges, col, lane),
      );
      if (side.length) edges.push([col, side[Math.floor(rng() * side.length)]]);
    }
    for (let col = 0; col < LANES; col += 1) {
      if (!edges.some(([, b]) => b === col)) edges.push([col, col]);
    }
    for (const [from, to] of edges) {
      const list = rows[row][from].next;
      const id = rows[row + 1][to].id;
      if (!list.includes(id)) list.push(id);
    }
  }
  for (const node of rows[ROWS - 1]) node.next = [rows[ROWS][0].id];
  return rows;
}
