export const TOKENS = {
  "rocket-pack": {
    map: "helicarrier",
    image: "images/tokens/pack.webp",
    kind: "scheme",
  },
  "laser-turret": {
    map: "helicarrier",
    image: "images/tokens/turret.webp",
    kind: "scheme",
  },
  "emp-pulse-array": {
    map: "helicarrier",
    image: "images/tokens/emp.webp",
    kind: "scheme",
  },
  "industrial-wrench": {
    map: "helicarrier",
    image: "images/tokens/wrench.webp",
    kind: "boost",
    value: 2,
  },
  "shield-blaster": {
    map: "helicarrier",
    image: "images/tokens/blaster.webp",
    kind: "boost",
    value: 2,
  },
  "reinforced-gloves": {
    map: "helicarrier",
    image: "images/tokens/gloves.webp",
    kind: "boost",
    value: 1,
  },
  "first-aid-kit": {
    map: "hells-kitchen",
    image: "images/tokens/kit.webp",
    kind: "scheme",
  },
  "map-token": {
    map: "hells-kitchen",
    image: "images/tokens/map.webp",
    kind: "scheme",
  },
  payphone: {
    map: "hells-kitchen",
    image: "images/tokens/payphone.webp",
    kind: "scheme",
  },
  "fire-hydrant": {
    map: "hells-kitchen",
    image: "images/tokens/hydrant.webp",
    kind: "boost",
    value: 2,
  },
  "manhole-cover": {
    map: "hells-kitchen",
    image: "images/tokens/manhole.webp",
    kind: "boost",
    value: 2,
  },
  mailbox: {
    map: "hells-kitchen",
    image: "images/tokens/mailbox.webp",
    kind: "boost",
    value: 1,
  },
  brazier: {
    map: "sanctum-sanctorum",
    image: "images/tokens/brazier.webp",
    kind: "scheme",
  },
  "daily-bugle": {
    map: "sanctum-sanctorum",
    image: "images/tokens/bugle.webp",
    kind: "scheme",
  },
  "astral-ring": {
    map: "sanctum-sanctorum",
    image: "images/tokens/ring.webp",
    kind: "scheme",
  },
  "dragon-fang": {
    map: "sanctum-sanctorum",
    image: "images/tokens/fang.webp",
    kind: "boost",
    value: 2,
  },
  "axe-of-angarruumus": {
    map: "sanctum-sanctorum",
    image: "images/tokens/angarruumus.webp",
    kind: "boost",
    value: 1,
  },
  "blacks-law-dictionary": {
    map: "sanctum-sanctorum",
    image: "images/tokens/dictionary.webp",
    kind: "boost",
    value: 1,
  },
  "helium-balloons": {
    map: "navy-pier",
    image: "images/ms_marvel.webp",
    kind: "scheme",
  },
  "xl-slushie": {
    map: "navy-pier",
    image: "images/spiderman.webp",
    kind: "scheme",
  },
  zazoom: {
    map: "navy-pier",
    image: "images/tomoe.webp",
    kind: "scheme",
  },
  "parking-meter": {
    map: "navy-pier",
    image: "images/winter_soldier.webp",
    kind: "boost",
    value: 2,
  },
  "snow-globe": {
    map: "navy-pier",
    image: "images/ms_marvel.webp",
    kind: "boost",
    value: 1,
  },
  "garbage-can-lid": {
    map: "navy-pier",
    image: "images/spiderman.webp",
    kind: "boost",
    value: 1,
  },
};

export const tokenIds = (kind, mapId) =>
  Object.keys(TOKENS).filter(
    (id) => TOKENS[id].kind === kind && TOKENS[id].map === mapId,
  );
