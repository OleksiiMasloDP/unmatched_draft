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
  "winter-soldier": { style: BOT_STYLES.PASS },
  "doctor-strange": { style: BOT_STYLES.PASS },
  "dr-jill-trent": { style: BOT_STYLES.PASS },
  "black-panther": { style: BOT_STYLES.PASS },
};
