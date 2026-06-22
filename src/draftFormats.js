const standardSequence = [
  { type: "ban", p1: true },
  { type: "ban", p1: false },
  { type: "ban", p1: true },
  { type: "ban", p1: false },
  { type: "ban", p1: true },
  { type: "ban", p1: false },
  { type: "pick", p1: true },
  { type: "pick", p1: false },
  { type: "pick", p1: false },
  { type: "pick", p1: true },
  { type: "pick", p1: true },
  { type: "pick", p1: false },
  { type: "pick", p1: false },
  { type: "pick", p1: true },
];

export const formats = {
  test_format: {
    name: "Test Format",
    allowedHeroIds: ["all"],
    allowedMapIds: ["all"],
    sequence: standardSequence,
  },
  summer_of_legends_2026: {
    name: "Summer of Legends 2026",
    allowedHeroIds: [8, 23, 27, 35],
    allowedMapIds: [1, 3, 6, 7, 10, 16, 21],
    sequence: standardSequence,
  },
};
