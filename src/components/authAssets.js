const base = import.meta.env.BASE_URL;

const cardFiles = [
  "Dracula/ambush",
  "Loki/fall_of_balder",
  "Black Panther/ancestral_insight",
  "Doctor Strange/eye_of_agamotto",
  "Blackbeard/avast_ye",
  "Luke Cage/commanding_impact",
  "Hamlet/blood_will_have_blood",
  "Oda Nobunaga/fire_and_flames",
  "Spiderman/counter_attack",
  "She-Hulk/green_energy",
  "Medusa/gaze_of_stone",
  "King Arthur/excalibur",
  "Sinbad/exploit",
  "Sinbad/voyage_home",
  "King Arthur/prophecy",
  "Medusa/winged_frenzy",
  "Dracula/beastform",
  "Loki/looking_for_trouble",
];

const portraitFiles = [
  "arthur",
  "medusa",
  "sinbad",
  "dracula",
  "loki",
  "black_panther",
  "doctor_strange",
  "luke_cage",
  "annie_christmas",
  "blackbeard",
  "chupacabra",
  "hamlet",
  "invisible_man",
  "krang",
  "donatello",
  "deadpool",
  "she_hulk",
  "sun_wukong",
];

export const cardUrls = cardFiles.map(
  (file) => `${base}images/cards/${file}.webp`,
);

export const portraitUrls = portraitFiles.map(
  (file) => `${base}images/${file}.webp`,
);

export const pick = (list, count, offset = 0) =>
  Array.from(
    { length: count },
    (_, index) => list[(index + offset) % list.length],
  );
