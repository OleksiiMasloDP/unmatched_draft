import {
  msMarvelCards,
  winterSoldierCards,
  spiderManCards,
  tomoeGozenCards,
  doctorStrangeCards,
  blackbeardCards,
  blackPantherCards,
  houdiniCards,
  wyattEarpCards,
  robinHoodCards,
  jillTrentCards,
  raptorsCards,
} from "./packDraftCards.js";

import { customHeroes } from "./customHeroes.js";

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
  {
    id: "doctor-strange",
    name: "Doctor Strange",
    hp: 14,
    move: 2,
    attack: "range",
    image: "images/doctor_strange.webp",
    passive: {
      name: "Dark Pact",
      text: {
        en: "After each combat, if Doctor Strange played a card, you may deal 1 damage to him. If you do, put that card on the bottom of your deck and draw 1 card.",
        ua: "Після кожного бою, якщо Doctor Strange зіграв карту, ви можете завдати йому 1 шкоди. Якщо так, покладіть цю карту на низ колоди та візьміть 1 карту.",
      },
    },
    sidekick: {
      name: "Wong",
      hp: 6,
      attack: "range",
      image: "images/wong.webp",
    },
    cards: doctorStrangeCards,
  },
  {
    id: "blackbeard",
    name: "Blackbeard",
    hp: 13,
    move: 2,
    attack: "range",
    image: "images/blackbeard.webp",
    passive: {
      name: "Privateer Turned Pirate",
      text: {
        en: "Start the game with 1 doubloon in the treasury, you have the other 2. At the start of your turn, you may pay 1 doubloon to gain 1 action. When Blackbeard takes combat damage, pay 1 doubloon. Opponents can pay a ransom from the treasury to ignore effects marked with 🪙.",
        ua: "Починайте гру з 1 дублоном у скарбниці, інші 2 у вас. На початку вашого ходу ви можете сплатити 1 дублон, щоб отримати 1 дію. Коли Blackbeard отримує бойову шкоду, сплатіть 1 дублон. Суперники можуть сплатити викуп зі скарбниці, щоб проігнорувати ефекти з 🪙.",
      },
    },
    sidekick: {
      name: "Sea Dog",
      hp: 1,
      attack: "melee",
      image: "images/seadog.webp",
      summon: true,
      count: 2,
      start: 2,
    },
    cards: blackbeardCards,
  },
  {
    id: "black-panther",
    name: "Black Panther",
    hp: 14,
    move: 2,
    attack: "melee",
    image: "images/black_panther.webp",
    passive: {
      name: "Vibranium Suit",
      text: {
        en: "Whenever you BOOST, draw 1 card. Cards stored in your Vibranium Suit can only be used to BOOST.",
        ua: "Щоразу, коли ви робите БУСТ, беріть 1 карту. Карти, що лежать у вашому Віброніумному костюмі, можна використовувати лише для БУСТУ.",
      },
    },
    sidekick: {
      name: "Shuri",
      hp: 6,
      attack: "range",
      image: "images/shuri.webp",
    },
    cards: blackPantherCards,
  },
  {
    id: "dr-jill-trent",
    name: "Dr. Jill Trent",
    hp: 13,
    move: 2,
    attack: "melee",
    image: "images/jill_trent.webp",
    passive: {
      name: "Gadgetology",
      text: {
        en: "At the start of your turn, activate one of your gadgets. Whenever Jill Trent attacks, resolve the active gadget's effect. Hypnoray Blaster: during combat, if your card's printed value is lower than your opponent's, reveal the top card of your opponent's deck and increase the value of your attack by its BOOST value. Ultrabiotic Tonic: after combat, if your card's printed value is higher than your opponent's, Jill Trent recovers 1 health.",
        ua: "На початку вашого ходу активуйте один зі своїх гаджетів. Щоразу, коли Jill Trent атакує, застосуйте ефект активного гаджета. Hypnoray Blaster: під час бою, якщо надруковане значення вашої карти менше, ніж у супротивника, розкрийте верхню карту його колоди й збільште значення атаки на її значення БУСТУ. Ultrabiotic Tonic: після бою, якщо надруковане значення вашої карти більше, ніж у супротивника, Jill Trent відновлює 1 здоров'я.",
      },
    },
    sidekick: {
      name: "Daisy",
      hp: 6,
      attack: "melee",
      image: "images/daisy.webp",
    },
    cards: jillTrentCards,
  },
  {
    id: "robin-hood",
    name: "Robin Hood",
    hp: 13,
    move: 2,
    attack: "range",
    image: "images/robin_hood.webp",
    passive: {
      name: "Special Ability",
      text: {
        en: "After you attack, you may move your attacking fighter up to 2 spaces.",
        ua: "Після вашої атаки ви можете перемістити бійця, що атакував, до 2 клітинок.",
      },
    },
    sidekick: {
      name: "Outlaws",
      hp: 1,
      attack: "melee",
      image: "images/outlaws.webp",
      count: 4,
    },
    cards: robinHoodCards,
  },
  {
    id: "wyatt-earp",
    name: "Wyatt Earp",
    hp: 15,
    move: 2,
    attack: "range",
    image: "images/wyatt_earp.webp",
    passive: {
      name: "Showdown",
      text: {
        en: "After you attack and win combat, choose one effect. You cannot choose the same effect twice in a turn. Draw 1 card. Gain 1 free action to attack. Move your fighter up to 1 space.",
        ua: "Після того як ви атакували й виграли бій, оберіть один ефект. Не можна обирати той самий ефект двічі за хід. Візьміть 1 карту. Отримайте 1 вільну дію атаки. Перемістіть вашого бійця до 1 клітинки.",
      },
    },
    sidekick: {
      name: "Doc Holliday",
      hp: 8,
      attack: "range",
      image: "images/doc_holliday.webp",
    },
    cards: wyattEarpCards,
  },
  {
    id: "raptors",
    name: "Raptors",
    hp: 7,
    move: 3,
    attack: "melee",
    team: true,
    image: "images/raptors.webp",
    passive: {
      name: "Pack Tactics",
      text: {
        en: "Raptors add 1 to the value of their attack cards for each of your other Raptors adjacent to the defender. You lose only when all three Raptors are defeated.",
        ua: "Raptors додають 1 до значення своїх карт атаки за кожного вашого іншого Raptor, що стоїть поруч із захисником. Ви програєте лише тоді, коли переможено всіх трьох Raptors.",
      },
    },
    sidekick: {
      name: "Raptor",
      hp: 7,
      attack: "melee",
      image: "images/delta.webp",
      images: ["images/delta.webp", "images/charlie.webp"],
      count: 2,
    },
    cards: raptorsCards,
  },
  {
    id: "harry-houdini",
    name: "Harry Houdini",
    hp: 14,
    move: 2,
    attack: "melee",
    image: "images/houdini.webp",
    passive: {
      name: "Escape Artist",
      text: {
        en: "When you take the maneuver action and BOOST, you may place Houdini in any space instead of moving. (Bess moves as normal.)",
        ua: "Коли ви виконуєте дію маневру та робите БУСТ, ви можете поставити Houdini на будь-яку клітинку замість руху. (Bess рухається як зазвичай.)",
      },
    },
    sidekick: {
      name: "Bess",
      hp: 5,
      attack: "melee",
      image: "images/bess.webp",
    },
    cards: houdiniCards,
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
  "doctor-strange": {
    dir: "Doctor Strange",
    files: {
      bolts_of_balthakk: "attack",
      eye_of_agamotto: "scheme",
      cloak_of_levitation: "versatile",
      feint: "versatile",
      master_of_kamar_taj: "versatile",
      seven_suns_of_cinnibus: "versatile",
      steadfast_disciple: "versatile",
      the_mists_of_munnopor: "defense",
      the_rings_of_raggadorr: "attack",
      the_winds_of_watoomb: "attack",
      no_really_im_a_doctor: "scheme",
    },
  },
  blackbeard: {
    dir: "Blackbeard",
    files: {
      avast_ye: "attack",
      fearsome_and_calculating: "versatile",
      plunder: "scheme",
      scourge_of_the_seven_seas: "scheme",
      a_brace_of_primed_pistols: "attack",
      give_no_quarter: "attack",
      intimidating_visage: "defense",
      light_the_fuse: "attack",
      no_prey_no_pay: "versatile",
      parley: "versatile",
      queen_annes_revenge: "versatile",
      show_a_leg: "versatile",
    },
  },
  "harry-houdini": {
    dir: "Harry Houdini",
    cover: false,
    files: {
      the_big_reveal: "attack",
      sleight_of_hand: "attack",
      misdirection: "defense",
      set_the_stage: "scheme",
      a_magician_never_reveals_his_secrets: "scheme",
      all_part_of_the_show: "defense",
      an_illusion_of_my_own_design: "attack",
      and_the_beautiful_bess: "versatile",
      flourish: "attack",
      for_my_next_trick: "attack",
      grand_escape: "defense",
      smoke_and_mirrors: "versatile",
      vanishing_act: "versatile",
    },
  },
  "wyatt-earp": {
    dir: "Wyatt Earp",
    cover: false,
    files: {
      a_marshal_and_an_outlaw: "versatile",
      you_just_gonna_stand_there_and_bleed: "attack",
      youre_a_daisy: "versatile",
      better_swear_me_in: "versatile",
      bring_em_to_justice: "defense",
      fan_the_hammer: "attack",
      gunfight_at_the_ok_corral: "versatile",
      i_have_two_guns_one_for_each_of_you: "attack",
      im_your_huckleberry: "versatile",
      in_vino_veritas: "scheme",
      second_shot: "attack",
      you_die_first: "scheme",
    },
  },
  "black-panther": {
    dir: "Black Panther",
    cover: false,
    files: {
      analyze_and_adjust: "attack",
      ancestral_insight: "versatile",
      anti_metal_claws: "versatile",
      cat_like_reflexes: "versatile",
      evade: "defense",
      feint: "versatile",
      nanotriage_processor: "versatile",
      regroup: "versatile",
      stalking_panther: "scheme",
      tactical_remote_scanning: "scheme",
      wakanda_forever: "versatile",
      vibranium_shockwave: "attack",
      microweave_mesh: "defense",
    },
  },
  "robin-hood": {
    dir: "Robin Hood",
    files: {
      a_hunters_eye: "attack",
      ambush: "attack",
      defenders_of_sherwood: "defense",
      disarming_shot: "attack",
      feint: "versatile",
      highway_robbery: "attack",
      piercing_shot: "attack",
      snark: "versatile",
      regroup: "versatile",
      steal_from_the_rich: "scheme",
      wily_fighting: "versatile",
    },
  },
  "dr-jill-trent": {
    dir: "Dr. Jill Trent",
    files: {
      ace_fighter: "versatile",
      battle_of_wits: "attack",
      caught_redhanded: "versatile",
      energizing_spray: "attack",
      gyroscopic_jetpack: "versatile",
      helpful_assistant: "scheme",
      hypnotist: "defense",
      indestructible_cloth: "defense",
      insightful_deduction: "versatile",
      laser_pen: "versatile",
      sisters_in_arms: "versatile",
      stasis_diffuser: "versatile",
      utility_belt: "versatile",
    },
  },
  raptors: {
    dir: "Raptors",
    files: {
      ambush: "attack",
      clever_girl: "attack",
      coordinated_attack_pattern: "scheme",
      decoy: "defense",
      disengage: "attack",
      helpful_assistant: "scheme",
      hypnotist: "defense",
      eaten_alive: "versatile",
      eviscerate: "attack",
      feint: "versatile",
      pack_hunters: "attack",
      they_remember: "attack",
      working_things_out: "scheme",
    },
  },
};

CARD_IMAGES["agent-venom"] = {
  dir: "Agent Venom",
  cover: false,
  files: {
    scare_tactics: "attack",
    savage: "attack",
    good_enough_for_us: "versatile",
    multi_gun: "versatile",
    spider_sense_tingling: "versatile",
    a_totally_sane_thing_to_do: "versatile",
    grasping_tendrils: "versatile",
    locked_and_loaded: "versatile",
    complete_the_mission: "defense",
    lethal_protector: "defense",
    improvise_to_neutralise: "scheme",
  },
};

const CARD_IMAGE_ALIASES = {
  "tomoe-gozen": { "confront any demon or god": "demon" },
  blackbeard: { "queen anne's revenge": "queen_annes_revenge" },
  "wyatt-earp": { "you're a daisy if you do": "youre_a_daisy" },
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
  if (!entry || entry.cover === false) return null;
  if (typeof entry.cover === "string") return encodeURI(entry.cover);
  return encodeURI(`images/cards/${entry.dir}/cover.webp`);
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function expandDeck(hero) {
  return hero.cards.flatMap(
    ([quantity, name, value, boost, en, ua, kind = "hero", cardType]) => {
      const art = cardImage(hero, name);
      return Array.from({ length: quantity }, (_, index) => ({
        id: `${hero.id}-${slug(name)}-${index + 1}`,
        key: slug(name),
        heroId: hero.id,
        kind,
        sidekick: kind === "sidekick" ? hero.sidekick.name : null,
        name,
        type: value === null ? "scheme" : art?.type || cardType || null,
        value,
        boost,
        text: { en, ua },
        image: art?.image || null,
      }));
    },
  );
}

export function buildAllCards() {
  return packDraftHeroes.flatMap(expandDeck);
}

export const everyHero = [...packDraftHeroes, ...customHeroes];

export function buildCustomCards() {
  return customHeroes.flatMap(expandDeck);
}
