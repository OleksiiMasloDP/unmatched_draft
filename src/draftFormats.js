const threeBans_fivePicks = [
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
  { type: "pick", p1: true },
  { type: "pick", p1: false },
];

export const formats = {
  test_format: {
    name: "Test Format",
    allowedHeroIds: ["all"],
    allowedMapIds: ["all"],
    sequence: threeBans_fivePicks,
  },
  summer_of_legends_2026: {
    name: "Summer of Legends 2026",
    allowedHeroIds: [
      3, 5, 7, 8, 9, 13, 18, 22, 23, 25, 27, 30, 31, 34, 35, 39, 41, 42, 43, 44,
      49, 52, 53, 54, 55, 59, 60, 61, 62, 64, 67, 68, 69, 70, 71, 72,
    ],
    allowedMapIds: [3, 4, 7, 8, 9, 10, 11, 12, 14, 15, 18, 25, 26, 30, 35],
    sequence: threeBans_fivePicks,
  },
};
