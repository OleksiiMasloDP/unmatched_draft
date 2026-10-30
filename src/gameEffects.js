const noSharedZones = (c) => !c.g.shared(c.me, c.foe);
const redRoomOn = (c) => c.g.redRoomOn(c.me);

function cancelOpponentCard(c) {
  const target = c.foe;
  const targetCard = c.combat.cards[target];
  if (!targetCard) return;
  if (c.g.hero(target).id === "winter-soldier") {
    c.g.log("logCantCancel", { card: targetCard.name });
    return;
  }
  c.combat.canceled[target] = true;
  c.g.log("logCancel", { card: targetCard.name });
}

function* placeInZone(c) {
  const options = c.g.zoneSpaces(c.me);
  if (!options.length) return;
  const space = yield c.g.askSpace(c.me, "promptPlaceZone", options);
  if (space) c.g.place(c.me, space);
}

export const cardEffects = {
  "big-wind-up": {
    canBoost: noSharedZones,
  },

  "easy-peasy": {
    *after(c) {
      c.g.draw(c.me, 1);
      if (c.g.handSize(c.me) >= 4 && c.g.adjacent(c.me, c.foe)) {
        c.g.damage(c.foe, 1);
      }
    },
  },

  embiggen: {
    value: (c, value) =>
      c.g.zoneCount(c.me) > c.g.zoneCount(c.foe) ? 6 : value,
  },

  "friends-and-family": {
    *scheme(c) {
      c.g.draw(c.me, 2);
      if (c.g.actionsLeft() >= 1) {
        const ok = yield c.g.askConfirm(c.me, "promptDrawUp");
        if (ok) {
          c.g.spendAction();
          c.g.drawUntil(c.me, 7);
        }
      }
    },
  },

  "gyro-and-fries": {
    *scheme(c) {
      c.g.heal(c.me, 2);
      if (c.g.handSize(c.me) >= 4) c.g.gainAction(1);
    },
  },

  "i-m-not-touching-you": {
    *after(c) {
      if (noSharedZones(c)) c.g.draw(c.me, 2);
    },
  },

  "shrink-shrink-shrink": {
    *after(c) {
      let discard = true;
      let move = true;
      if (!noSharedZones(c)) {
        const choice = yield c.g.askChoice(c.me, "promptShrinkChoice", [
          { value: "discard", label: "gameShrinkDiscard" },
          { value: "move", label: "gameShrinkMove" },
        ]);
        discard = choice === "discard";
        move = choice === "move";
      }
      if (discard && c.g.handSize(c.foe)) {
        const ids = yield c.g.askCards(
          c.foe,
          "promptDiscardOne",
          c.g.handOf(c.foe),
          { min: 1, max: 1 },
        );
        c.g.discardFromHand(c.foe, ids[0]);
      }
      if (move) {
        const options = c.g.reach(c.foe, 3);
        if (options.length) {
          const space = yield c.g.askSpace(c.me, "promptMoveFoe", options);
          if (space) c.g.place(c.foe, space);
        }
      }
    },
  },

  slingshot: {
    *after(c) {
      const options = c.g.zoneSpaces(c.me);
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptPlaceZone", options);
      if (space) c.g.place(c.me, space);
    },
  },

  fangirl: {
    value: (c) => c.g.handSize(c.me),
  },

  feint: {
    *immediate(c) {
      cancelOpponentCard(c);
    },
  },

  "momentous-shift": {
    value: (c, value) => (c.g.movedThisTurn(c.me) ? 5 : value),
  },

  "a-boy-named-bucky": {
    *scheme(c) {
      c.g.ignoreRedRoom(c.me);
      c.g.gainAction(1);
    },
  },

  "bionic-arm": {
    value: (c, value) => (c.g.adjacent(c.me, c.foe) ? 6 : value),
    *after(c) {
      if (!redRoomOn(c)) return;
      const options = c.g.reach(c.foe, 5);
      if (!options.length) return;
      const space = yield c.g.askSpace(c.foe, "promptRedRoomMove", options);
      if (space) c.g.place(c.foe, space);
    },
  },

  "complete-the-mission": {
    canBoost: () => true,
    *after(c) {
      const taken = c.combat.taken[c.me];
      if (taken > 0) c.g.damage(c.foe, taken);
    },
  },

  manipulation: {
    *scheme(c) {
      c.g.drawUntil(c.me, 5);
      if (!redRoomOn(c)) return;
      const ok = yield c.g.askConfirm(c.foe, "promptMayDraw5");
      if (ok) c.g.drawUntil(c.foe, 5);
    },
  },

  marksman: {
    value: (c, value) => value + Math.max(0, c.g.distance(c.me, c.foe) - 1),
  },

  "programmed-to-kill": {
    *after(c) {
      if (redRoomOn(c) && c.combat.won[c.me]) c.g.damage(c.me, 2);
    },
  },

  "reflex-memories": {
    *after(c) {
      if (!redRoomOn(c)) return;
      c.g.discardRandom(c.me, 2);
      c.g.draw(c.me, 2);
    },
  },

  reprogram: {
    *after(c) {
      const pile = c.g.discardOf(c.me);
      if (!pile.length) return;
      const count = Math.min(3, pile.length);
      const ids = yield c.g.askCards(c.me, "promptReprogram", pile, {
        min: count,
        max: count,
      });
      c.g.shuffleIntoDeck(c.me, ids);
    },
  },

  "wily-fighting": {
    *after(c) {
      if (c.g.adjacent(c.me, c.foe)) c.g.damage(c.foe, 1);
    },
  },

  "without-remorse": {
    *after(c) {
      if (!redRoomOn(c)) return;
      const ok = yield c.g.askConfirm(c.foe, "promptMayDraw1");
      if (ok) c.g.draw(c.foe, 1);
    },
  },

  "born-in-the-barracks": {
    *after(c) {
      if (c.combat.won[c.me]) c.g.heal(c.me, 2);
    },
  },

  "friendly-neighborhood-spider-man": {
    *scheme(c) {
      c.g.heal(c.me, 3);
      yield* placeInZone(c);
    },
  },

  "counter-attack": {
    *after(c) {
      if (c.combat.values[c.foe] >= 4) c.g.damage(c.foe, 2);
    },
  },

  "disarming-shot": {
    *after(c) {
      const dealt = c.combat.taken[c.foe];
      if (dealt > 0) c.g.draw(c.me, dealt);
    },
  },

  "web-shooters": {
    damageCap: () => 2,
  },

  "right-in-the-face": {
    *immediate(c) {
      c.g.blockDraw(c.foe);
    },
  },

  "spider-sense-tingling": {
    *after(c) {
      if (c.combat.values[c.foe] >= 4) c.g.draw(c.me, 2);
    },
  },

  "swinging-kick": {
    *after(c) {
      const dealt = c.combat.taken[c.foe];
      if (dealt <= 0) return;
      const options = c.g.reach(c.foe, dealt);
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptMoveFoe", options);
      if (space) c.g.place(c.foe, space);
    },
  },

  thwip: {
    *after(c) {
      if (c.combat.won[c.me]) yield* placeInZone(c);
    },
  },

  "wall-crawler": {
    *after(c) {
      yield* placeInZone(c);
    },
  },

  "with-great-power": {
    *scheme(c) {
      c.g.addAttackBonus(c.me, 1);
      c.g.draw(c.me, 1);
      c.g.gainAction(1);
    },
  },

  snark: {
    *after(c) {
      if (c.g.adjacent(c.me, c.foe)) c.g.draw(c.me, 1);
    },
  },

  "fearsome-strength": {
    *immediate(c) {
      if (!c.g.adjacent(c.me, c.foe)) return;
      const ok = yield c.g.askConfirm(c.me, "promptSwap");
      if (ok) c.g.swapPlaces();
    },
    *after(c) {
      if (c.g.adjacent(c.me, c.foe)) c.g.damage(c.foe, 1);
    },
  },

  "witness-my-last-battle": {
    faceUp: true,
    canAttack: (c) => c.g.adjacent(c.me, c.foe),
    *after(c) {
      c.g.endTurnNow();
    },
  },

  "five-against-thousands": {
    *after(c) {
      if (!c.g.adjacent(c.me, c.foe) || !c.g.handSize(c.me)) return;
      const ok = yield c.g.askConfirm(c.me, "promptFiveAgainst");
      if (!ok) return;
      const ids = yield c.g.askCards(
        c.me,
        "promptDiscardOne",
        c.g.handOf(c.me),
        { min: 1, max: 1 },
      );
      c.g.discardFromHand(c.me, ids[0]);
      c.combat.returnToHand[c.me] = true;
    },
  },

  "a-warrior-s-way": {
    *after(c) {
      const options = c.g.reach(c.foe, 3);
      if (options.length) {
        const space = yield c.g.askSpace(c.me, "promptMoveFoe", options);
        if (space) c.g.place(c.foe, space);
      }
      const near = c.g.adjacentSpaces(c.me);
      if (near.length) {
        const space = yield c.g.askSpace(c.me, "promptPlaceAdjacent", near);
        if (space) c.g.place(c.me, space);
      }
    },
  },

  "piercing-shot": {
    *after(c) {
      c.g.draw(c.me, 2);
    },
  },

  "confront-any-demon-or-god": {
    *after(c) {
      c.g.draw(c.me, 1);
      if (c.combat.won[c.foe] && c.g.handSize(c.foe)) {
        const ids = yield c.g.askCards(
          c.me,
          "promptConfrontPick",
          c.g.handOf(c.foe),
          { min: 1, max: 1 },
        );
        c.g.discardFromHand(c.foe, ids[0]);
      }
    },
  },

  "a-worthy-opponent": {
    value: () => 5,
  },

  "flash-of-steel": {
    *immediate(c) {
      cancelOpponentCard(c);
    },
    *after(c) {
      if (c.g.adjacent(c.me, c.foe)) c.g.damage(c.foe, 1);
    },
  },

  skirmish: {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const who = yield c.g.askChoice(c.me, "promptSkirmishWho", [
        { value: "me", label: "gameSkirmishMe" },
        { value: "foe", label: "gameSkirmishFoe" },
      ]);
      const target = who === "me" ? c.me : c.foe;
      const options = c.g.reach(target, 2);
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptMoveFoe", options);
      if (space) c.g.place(target, space);
    },
  },

  "refuse-to-retreat": {
    *immediate(c) {
      c.g.pin(c.me);
    },
    *after(c) {
      if (!c.g.adjacent(c.me, c.foe) || !c.g.handSize(c.foe)) return;
      const ids = yield c.g.askCards(
        c.foe,
        "promptDiscardOne",
        c.g.handOf(c.foe),
        { min: 1, max: 1 },
      );
      c.g.discardFromHand(c.foe, ids[0]);
    },
  },

  "deeds-of-valor": {
    damageCap: () => 2,
  },

  "lord-kiso-s-final-stand": {
    *scheme(c) {
      const options = c.g.reach(c.me, 3);
      if (options.length) {
        const space = yield c.g.askSpace(c.me, "promptMoveSpace", options);
        if (space) c.g.place(c.me, space);
      }
      const choice = yield c.g.askChoice(c.me, "promptKisoChoice", [
        { value: "heal", label: "gameKisoHeal" },
        { value: "action", label: "gameKisoAction" },
      ]);
      if (choice === "heal") c.g.heal(c.me, 2);
      else c.g.gainAction(1);
    },
  },
};
