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
};
