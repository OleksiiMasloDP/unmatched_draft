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

const IMAGE_BASE =
  "https://yptpnirqgfmxphjvsdjz.supabase.co/storage/v1/object/public/heroes/avatars/";

export const packDraftHeroes = [
  {
    id: "ms-marvel",
    name: "Ms. Marvel",
    hp: 14,
    move: 2,
    attack: "melee",
    image: IMAGE_BASE + "M61_bBineukElgyyqqSFu.webp",
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
    image: IMAGE_BASE + "u4Gps771423IMcUDwGtmU.webp",
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
    image: IMAGE_BASE + "-DwDeg2R2JA3DQDeTlT1K.webp",
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
    image: IMAGE_BASE + "d0g6G1igwbxZ5sgU4M7Kn.webp",
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

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function expandDeck(hero) {
  return hero.cards.flatMap(([quantity, name, value, boost, en, ua]) =>
    Array.from({ length: quantity }, (_, index) => ({
      id: `${hero.id}-${slug(name)}-${index + 1}`,
      key: slug(name),
      heroId: hero.id,
      kind: "hero",
      sidekick: null,
      name,
      type: value === null ? "scheme" : null,
      value,
      boost,
      text: { en, ua },
      image: null,
    })),
  );
}

export function buildAllCards() {
  return packDraftHeroes.flatMap(expandDeck);
}
