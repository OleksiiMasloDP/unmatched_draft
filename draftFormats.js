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
    allowedIds: ["all"],
    sequence: standardSequence,
  },
  summer_of_legends_2026: {
    name: "Summer of Legends 2026",
    allowedIds: [8, 23, 27, 35],
    sequence: standardSequence,
  },
};
