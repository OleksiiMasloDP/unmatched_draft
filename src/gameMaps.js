const SPACES = [
  ["L1", 92, 205, ["blue"]],
  ["L2", 100, 357, ["blue"]],
  ["L3", 91, 509, ["blue"]],
  ["L4", 187, 626, ["blue", "dark"]],
  ["L5", 274, 347, ["tan", "blue"]],
  ["A1", 189, 91, ["green", "blue"]],
  ["A2", 349, 79, ["green"]],
  ["A3", 505, 81, ["green"]],
  ["A4", 664, 80, ["green", "tan"]],
  ["A5", 920, 89, ["grey"]],
  ["A6", 1129, 76, ["teal"]],
  ["C1", 410, 235, ["green", "tan"]],
  ["C2", 639, 253, ["green", "tan"]],
  ["C3", 527, 373, ["green", "tan"]],
  ["C4", 415, 490, ["tan"]],
  ["C5", 351, 657, ["dark"]],
  ["C6", 523, 656, ["tan", "dark"]],
  ["C7", 839, 436, ["green", "grey"]],
  ["C8", 736, 657, ["grey", "dark"]],
  ["C9", 917, 650, ["grey"]],
  ["B1", 1250, 185, ["teal"]],
  ["B2", 1075, 236, ["teal", "grey"]],
  ["B3", 1256, 349, ["teal"]],
  ["B4", 1108, 422, ["teal", "grey"]],
  ["B5", 1250, 542, ["teal"]],
  ["B6", 1096, 609, ["teal", "grey"]],
];

const LINKS = [
  ["L1", "A1"],
  ["L1", "L2"],
  ["L2", "L3"],
  ["L3", "L4"],
  ["A1", "A2"],
  ["A2", "A3"],
  ["A3", "A4"],
  ["A4", "A5"],
  ["A5", "A6"],
  ["A2", "C1"],
  ["A3", "C1"],
  ["A4", "C2"],
  ["C1", "L5"],
  ["C1", "C3"],
  ["C2", "C3"],
  ["C2", "C7"],
  ["L5", "L2"],
  ["L5", "C3"],
  ["L5", "C4"],
  ["C3", "C4"],
  ["C4", "C6"],
  ["C5", "C6"],
  ["C5", "L4"],
  ["C6", "C8"],
  ["C8", "C9"],
  ["C8", "C7"],
  ["C9", "C7"],
  ["C9", "B6"],
  ["A5", "B2"],
  ["A6", "B2"],
  ["A6", "B1"],
  ["B2", "B1"],
  ["B2", "B4"],
  ["B1", "B3"],
  ["B4", "B3"],
  ["B4", "B6"],
  ["B3", "B5"],
  ["B6", "B5"],
];

function build() {
  const spaces = SPACES.map(([id, x, y, zones]) => ({
    id,
    x,
    y,
    zones,
    links: [],
  }));
  const byId = new Map(spaces.map((space) => [space.id, space]));
  for (const [a, b] of LINKS) {
    byId.get(a).links.push(b);
    byId.get(b).links.push(a);
  }

  return {
    id: "t-rex-paddock",
    name: "T. Rex Paddock",
    image: "maps/trex_paddock.webp",
    width: 1337,
    height: 742,
    radius: 64,
    spaces,
    starts: { p1: "L1", p2: "B3" },
  };
}

export const tRexPaddock = build();
