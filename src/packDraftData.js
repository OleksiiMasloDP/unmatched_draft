import {
  msMarvelCards,
  winterSoldierCards,
  spiderManCards,
  tomoeGozenCards,
} from "./packDraftCards.js";

export const PACK_DRAFT_CONFIG = {
  packSize: 12,
  packCount: 10,
  discardPerTurn: 1,
  deckSize: 30,
};

export const packDraftHeroes = [
  {
    id: "ms-marvel",
    name: "Ms. Marvel",
    hp: 14,
    move: 2,
    attack: "melee",
    image: "images/ms_marvel.webp",
    passive: {
      name: "Stretchy",
      text: {
        en: "At the start of your turn, you may move Ms. Marvel 1 space. She can also attack from up to 2 spaces away, ignoring zones.",
        ua: "На початку вашого ходу ви можете перемістити Ms. Marvel на 1 клітинку. Вона також може атакувати з відстані до 2 клітинок, ігноруючи зони.",
      },
    },
    sidekick: null,
    cards: msMarvelCards,
  },
  {
    id: "spider-man",
    name: "Spider-Man",
    hp: 15,
    move: 3,
    attack: "melee",
    image: "images/spiderman.webp",
    passive: {
      name: "Spidey-Sense",
      text: {
        en: "When an opponent attacks Spider-Man, they must tell you the printed value of their attack card before you play a defense card.",
        ua: "Коли суперник атакує Spider-Man, він має назвати вам надруковане значення своєї карти атаки до того, як ви зіграєте карту захисту.",
      },
    },
    sidekick: null,
    cards: spiderManCards,
  },
  {
    id: "tomoe-gozen",
    name: "Tomoe Gozen",
    hp: 14,
    move: 2,
    attack: "range",
    image: "images/tomoe.webp",
    passive: {
      name: "Attack of Opportunity",
      text: {
        en: "When an opposing hero leaves Tomoe Gozen's zone, deal 1 damage to that hero.",
        ua: "Коли ворожий герой залишає зону Tomoe Gozen, завдайте цьому герою 1 шкоди.",
      },
    },
    sidekick: null,
    cards: tomoeGozenCards,
  },
  {
    id: "winter-soldier",
    name: "Winter Soldier",
    hp: 15,
    move: 2,
    attack: "range",
    image: "images/winter_soldier.webp",
    passive: {
      name: "Brainwashed",
      text: {
        en: "Effects on Winter Soldier's cards cannot be canceled.",
        ua: "Ефекти на картах Winter Soldier не можна скасувати.",
      },
    },
    sidekick: null,
    cards: winterSoldierCards,
  },
];

const CARD_IMAGES = {
  "ms-marvel": {
    dir: "Ms. Marvel",
    files: {
      big_wind_up: "attack",
      easy_peasy: "versatile",
      embiggen: "versatile",
      fangirl: "attack",
      feint: "versatile",
      friends_and_family: "scheme",
      gyro_and_fries: "scheme",
      im_not_touching_you: "attack",
      momentous_shift: "versatile",
      shrink_shrink_shrink: "versatile",
      slingshot: "defense",
    },
  },
  "spider-man": {
    dir: "Spiderman",
    files: {
      counter_attack: "defense",
      disarming_shot: "attack",
      friendly_neighborhood_spider_man: "scheme",
      momentous_shift: "versatile",
      right_in_the_face: "versatile",
      snark: "versatile",
      spider_sense_tingling: "versatile",
      swinging_kick: "attack",
      thwip: "attack",
      wall_crawler: "versatile",
      web_shooters: "defense",
      with_great_power: "scheme",
    },
  },
  "tomoe-gozen": {
    dir: "Tomoe Gozen",
    files: {
      a_warriors_way: "attack",
      a_worthy_opponent: "versatile",
      deeds_of_valor: "defense",
      demon: "versatile",
      fearsome_strength: "attack",
      final_stand: "scheme",
      five_against_thousands: "attack",
      flash_of_steel: "versatile",
      lord_kisos_final_stand: "scheme",
      piercing_shot: "attack",
      refuse_to_retreat: "defense",
      skirmish: "versatile",
      witness_my_last_battle: "attack",
    },
  },
  "winter-soldier": {
    dir: "Winter Soldier",
    files: {
      a_boy_named_bucky: "scheme",
      bionic_arm: "attack",
      born_in_the_barracks: "versatile",
      complete_the_mission: "defense",
      feint: "versatile",
      manipulation: "scheme",
      marksman: "attack",
      programmed_to_kill: "attack",
      reflex_memories: "versatile",
      reprogram: "versatile",
      wily_fighting: "versatile",
      without_remorse: "attack",
    },
  },
};

const CARD_IMAGE_ALIASES = {
  "tomoe-gozen": { "confront any demon or god": "demon" },
};

const squash = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function cardImage(hero, name) {
  const entry = CARD_IMAGES[hero.id];
  if (!entry) return null;
  const alias = CARD_IMAGE_ALIASES[hero.id]?.[name.toLowerCase()];
  const file = Object.keys(entry.files).find(
    (item) => item === alias || squash(item) === squash(name),
  );
  if (!file) return null;
  return {
    image: encodeURI(`images/cards/${entry.dir}/${file}.webp`),
    type: entry.files[file],
  };
}

export function coverImage(heroId) {
  const entry = CARD_IMAGES[heroId];
  return entry ? encodeURI(`images/cards/${entry.dir}/cover.webp`) : null;
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function expandDeck(hero) {
  return hero.cards.flatMap(([quantity, name, value, boost, en, ua]) => {
    const art = cardImage(hero, name);
    return Array.from({ length: quantity }, (_, index) => ({
      id: `${hero.id}-${slug(name)}-${index + 1}`,
      key: slug(name),
      heroId: hero.id,
      kind: "hero",
      sidekick: null,
      name,
      type: value === null ? "scheme" : art?.type || null,
      value,
      boost,
      text: { en, ua },
      image: art?.image || null,
    }));
  });
}

export function buildAllCards() {
  return packDraftHeroes.flatMap(expandDeck);
}
