export const TOKENS = {
  "rocket-pack": {
    map: "helicarrier",
    image: "images/ms_marvel.webp",
    kind: "scheme",
  },
  "laser-turret": {
    map: "helicarrier",
    image: "images/spiderman.webp",
    kind: "scheme",
  },
  "emp-pulse-array": {
    map: "helicarrier",
    image: "images/tomoe.webp",
    kind: "scheme",
  },
  "industrial-wrench": {
    map: "helicarrier",
    image: "images/winter_soldier.webp",
    kind: "boost",
    value: 2,
  },
  "shield-blaster": {
    map: "helicarrier",
    image: "images/ms_marvel.webp",
    kind: "boost",
    value: 2,
  },
  "reinforced-gloves": {
    map: "helicarrier",
    image: "images/spiderman.webp",
    kind: "boost",
    value: 1,
  },
  "first-aid-kit": {
    map: "hells-kitchen",
    image: "images/ms_marvel.webp",
    kind: "scheme",
  },
  "map-token": {
    map: "hells-kitchen",
    image: "images/spiderman.webp",
    kind: "scheme",
  },
  payphone: {
    map: "hells-kitchen",
    image: "images/tomoe.webp",
    kind: "scheme",
  },
  "fire-hydrant": {
    map: "hells-kitchen",
    image: "images/winter_soldier.webp",
    kind: "boost",
    value: 2,
  },
  "manhole-cover": {
    map: "hells-kitchen",
    image: "images/ms_marvel.webp",
    kind: "boost",
    value: 2,
  },
  mailbox: {
    map: "hells-kitchen",
    image: "images/spiderman.webp",
    kind: "boost",
    value: 1,
  },
  brazier: {
    map: "sanctum-sanctorum",
    image: "images/ms_marvel.webp",
    kind: "scheme",
  },
  "daily-bugle": {
    map: "sanctum-sanctorum",
    image: "images/spiderman.webp",
    kind: "scheme",
  },
  "astral-ring": {
    map: "sanctum-sanctorum",
    image: "images/tomoe.webp",
    kind: "scheme",
  },
  "dragon-fang": {
    map: "sanctum-sanctorum",
    image: "images/winter_soldier.webp",
    kind: "boost",
    value: 2,
  },
  "axe-of-angarruumus": {
    map: "sanctum-sanctorum",
    image: "images/ms_marvel.webp",
    kind: "boost",
    value: 1,
  },
  "blacks-law-dictionary": {
    map: "sanctum-sanctorum",
    image: "images/spiderman.webp",
    kind: "boost",
    value: 1,
  },
};

export const tokenIds = (kind, mapId) =>
  Object.keys(TOKENS).filter(
    (id) => TOKENS[id].kind === kind && TOKENS[id].map === mapId,
  );
