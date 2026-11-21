import { BOT_STYLES } from "./botStyles";

export const botProfiles = {
  blackbeard: {
    aggro: 0.8,
    thrifty: true,
    keep: ["fearsome-and-calculating", "plunder", "intimidating-visage"],
    boostHand: 3,
  },
  "tomoe-gozen": {
    aggro: 1.2,
    heroFocus: 5,
    bait: true,
    contain: true,
    keep: ["witness-my-last-battle", "lord-kisos-final-stand"],
    boostHand: 3,
  },
  "wyatt-earp": {
    aggro: 1.5,
    keep: ["youre-a-daisy-if-you-do"],
    keepInHand: ["youre-a-daisy-if-you-do"],
    boostHand: 2,
  },
  "harry-houdini": {
    style: BOT_STYLES.PRESSURE,
    aggro: 1.2,
    kidFear: 1,
    keep: ["the-big-reveal", "misdirection", "set-the-stage"],
    boostHand: 3,
  },
  raptors: { style: BOT_STYLES.PRESSURE },
  "invisible-man": {
    style: BOT_STYLES.PRESSURE,
    keep: ["vanish", "impossible-to-see"],
    boostHand: 3,
  },
  hamlet: {
    style: BOT_STYLES.PRESSURE,
    keep: ["the-ghost", "method-in-the-madness"],
    boostHand: 3,
  },
  "oda-nobunaga": {
    style: BOT_STYLES.PRESSURE,
    keep: ["reinforce", "demon-king-of-the-sixth-heaven"],
    boostHand: 3,
  },
  dracula: {
    style: BOT_STYLES.PRESSURE,
    keep: ["mistform", "prey-upon"],
    boostHand: 3,
  },
  chupacabra: {
    style: BOT_STYLES.PRESSURE,
    keep: ["traveler-of-the-night", "natural-toughness"],
    boostHand: 3,
  },
  "luke-cage": {
    style: BOT_STYLES.PRESSURE,
    keep: ["trash-talk", "skin-like-titanium"],
    boostHand: 3,
  },
  "she-hulk": {
    style: BOT_STYLES.PRESSURE,
    keep: ["double-jeopardy", "the-defense-rests"],
    boostHand: 3,
  },
  "annie-christmas": {
    style: BOT_STYLES.PRESSURE,
    keep: ["a-few-more-pearls", "mississippi-queen"],
    boostHand: 3,
  },
  "deadman-danny": {
    style: BOT_STYLES.PRESSURE,
    keep: ["fairfax-guarantee", "feint"],
    boostHand: 3,
  },
  "king-arthur": {
    style: BOT_STYLES.PRESSURE,
    keep: ["excalibur", "the-holy-grail"],
    boostHand: 3,
  },
  "winter-soldier": { style: BOT_STYLES.PASS },
  "doctor-strange": { style: BOT_STYLES.PASS },
  "dr-jill-trent": { style: BOT_STYLES.PASS },
  "black-panther": { style: BOT_STYLES.PASS },
};
