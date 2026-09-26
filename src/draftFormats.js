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

const twoBans_fourPicks = [
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
  all_heroes: {
    name: "All Heroes",
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
  fall_of_heroes_26: {
    name: "Fall of Heroes 2026",
    allowedHeroIds: [
      1, 3, 5, 7, 8, 14, 18, 21, 23, 27, 28, 30, 33, 38, 41, 42, 46, 47, 49, 53,
      54, 55, 58, 59, 62, 64, 65, 68, 69, 71,
    ],
    allowedMapIds: [3, 7, 13, 15, 16, 18, 19, 20, 21, 25, 26, 30, 32, 34, 35],
    sequence: twoBans_fourPicks,
  },
};
