import { ROWS } from "./rogueData.js";

const pickType = (rng, row) => {
  const roll = rng();
  if (row === 0) return "fight";
  if (row === ROWS - 1) return "rest";
  if (roll < 0.46) return "fight";
  if (roll < 0.7) return "mystery";
  if (roll < 0.82 && row >= 3) return "rest";
  if (roll < 0.9 && row >= 2) return "shop";
  return "fight";
};

export function generateMap(rng) {
  const rows = [];
  for (let row = 0; row < ROWS; row += 1) {
    const count = row === 0 ? 3 : 3 + (rng() < 0.5 ? 1 : 0);
    rows.push(
      Array.from({ length: count }, (_, col) => {
        const type = pickType(rng, row);
        return {
          id: `${row}-${col}`,
          row,
          col,
          x: (col + 0.5) / count + (rng() - 0.5) * 0.08,
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
  const shopNode = rows[shopRow][Math.floor(rng() * rows[shopRow].length)];
  shopNode.type = "shop";
  shopNode.secret = null;

  for (let row = 0; row < rows.length - 1; row += 1) {
    const here = rows[row];
    const there = rows[row + 1];
    for (const node of here) {
      const near = there
        .filter((other) => Math.abs(other.x - node.x) <= 0.4)
        .map((other) => other.id);
      if (near.length) node.next = near.slice(0, 2);
      else {
        const closest = [...there].sort(
          (a, b) => Math.abs(a.x - node.x) - Math.abs(b.x - node.x),
        )[0];
        node.next = [closest.id];
      }
    }
    for (const target of there) {
      if (here.some((node) => node.next.includes(target.id))) continue;
      const closest = [...here].sort(
        (a, b) => Math.abs(a.x - target.x) - Math.abs(b.x - target.x),
      )[0];
      closest.next.push(target.id);
    }
  }
  return rows;
}
