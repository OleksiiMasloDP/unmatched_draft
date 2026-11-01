const noSharedZones = (c) => !c.g.shared(c.me, c.foe);
const redRoomOn = (c) => c.g.redRoomOn(c.me);

function cancelOpponentCard(c) {
  const target = c.foe;
  const targetCard = c.combat.cards[target];
  if (!targetCard) return;
  if (
    c.g.hero(target).id === "winter-soldier" ||
    cardEffects[targetCard.key]?.uncancelable
  ) {
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
      if (move) yield* c.g.walk(c.me, c.foe, 3, "promptMoveFoe");
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
      yield* c.g.walk(c.foe, c.foe, 5, "promptRedRoomMove");
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
      yield* c.g.walk(c.me, c.foe, dealt, "promptMoveFoe");
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
      yield* c.g.walk(c.me, c.foe, 3, "promptMoveFoe");
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
      yield* c.g.walk(c.me, target, 2, "promptMoveFoe");
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
      yield* c.g.walk(c.me, c.me, 3, "promptMoveSpace");
      const choice = yield c.g.askChoice(c.me, "promptKisoChoice", [
        { value: "heal", label: "gameKisoHeal" },
        { value: "action", label: "gameKisoAction" },
      ]);
      if (choice === "heal") c.g.heal(c.me, 2);
      else c.g.gainAction(1);
    },
  },

  "cloak-of-levitation": {
    ignoreFoeValue: (c) => c.g.adjacent(c.me, c.foe),
  },

  "steadfast-disciple": {
    *after(c) {
      if (!c.g.adjacent(c.me, c.foe)) return;
      c.g.damage(c.foe, 1);
      c.g.draw(c.me, 1);
    },
  },

  "master-of-kamar-taj": {
    value: (c, value) => (c.g.sidekickAdjacent(c.me) ? 4 : value),
  },

  "bolts-of-balthakk": {
    blindBoost: () => 1,
    *after(c) {
      if (c.combat.won[c.me]) c.g.gainAction(1);
    },
  },

  "seven-suns-of-cinnibus": {
    blindBoost: () => 2,
    finalValue: (c, total) => (total > 7 ? 0 : total),
  },

  "the-mists-of-munnopor": {
    *immediate(c) {
      yield* c.g.mistsReplace(c.me, c.combat);
    },
  },

  "the-rings-of-raggadorr": {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const dealt = c.combat.taken[c.foe];
      if (dealt > 0) c.g.healFriendly(c.me, dealt);
    },
  },

  "the-winds-of-watoomb": {
    *after(c) {
      const busy = () => c.g.occupiedSpaces();
      const mine = c.g.spaceOf(c.me);
      const theirs = c.g.spaceOf(c.foe);
      const first = c.g
        .startSpaces()
        .filter((id) => !busy().includes(id) || id === mine);
      if (first.length) {
        const space = yield c.g.askSpace(c.foe, "promptWindsStrange", first);
        if (space) c.g.place(c.me, space);
      }
      const second = c.g
        .startSpaces()
        .filter(
          (id) =>
            id !== c.g.spaceOf(c.me) && (!busy().includes(id) || id === theirs),
        );
      if (second.length) {
        const space = yield c.g.askSpace(c.me, "promptWindsFoe", second);
        if (space) c.g.place(c.foe, space);
      }
      c.g.shuffleDeck(c.me);
      c.g.shuffleDeck(c.foe);
    },
  },

  "eye-of-agamotto": {
    *scheme(c) {
      c.g.shuffleHandIntoDeck(c.me);
      c.g.draw(c.me, 5);
      c.g.gainAction(1);
    },
  },

  "no-really-i-m-a-doctor": {
    *scheme(c) {
      if (!c.g.handSize(c.me)) return;
      const ids = yield c.g.askCards(
        c.me,
        "promptRevealToTop",
        c.g.handOf(c.me),
        { min: 1, max: 1 },
      );
      const amount = c.g.cardBoost(ids[0]);
      c.g.putOnDeckTop(c.me, ids[0]);
      const fighters = ["hero", ...c.g.adjacentSidekicks(c.me)];
      let who = "hero";
      if (fighters.length > 1) {
        const spaces = fighters.map((f) => c.g.fighterSpace(c.me, f));
        const space = yield c.g.askSpace(c.me, "promptHealWho", spaces);
        who =
          fighters.find((f) => c.g.fighterSpace(c.me, f) === space) || "hero";
      }
      c.g.heal(c.me, amount, who);
    },
  },

  "avast-ye": {
    *immediate(c) {
      const paid = yield* c.g.ransom(c.me, 1, c.combat);
      if (!paid && c.g.handSize(c.foe)) c.g.discardRandom(c.foe, 1);
    },
    *after(c) {
      const paid = yield* c.g.ransom(c.me, 1, c.combat);
      if (paid) return;
      for (const fighter of c.g.foeFightersInZone(c.me)) {
        c.g.damage(c.foe, 1, fighter);
      }
    },
  },

  "give-no-quarter": {
    value: (c, value) => (c.g.otherFriendAdjacentToFoe(c.me) ? 5 : value),
    *after(c) {
      const paid = yield* c.g.ransom(c.me, 1, c.combat);
      if (!paid) c.g.gainAction(1);
    },
  },

  "light-the-fuse": {
    *after(c) {
      yield* c.g.walk(c.me, c.me, 2, "promptMoveSidekick");
      for (const { owner, fighter } of c.g.adjacentFightersOf(c.me)) {
        c.g.damage(owner, 1, fighter);
      }
    },
  },

  "a-brace-of-primed-pistols": {
    *after(c) {
      const paid = yield* c.g.ransom(c.me, 2, c.combat);
      if (paid) return;
      const targets = c.g.foeFightersInZone(c.me);
      if (!targets.length) return;
      let target = targets[0];
      if (targets.length > 1) {
        const spaces = targets.map((f) => c.g.fighterSpace(c.foe, f));
        const space = yield c.g.askSpace(c.me, "promptAttackTarget", spaces);
        target =
          targets.find((f) => c.g.fighterSpace(c.foe, f) === space) || target;
      }
      c.g.damage(c.foe, 3, target);
    },
  },

  "queen-annes-revenge": {
    uncancelable: true,
    value: (c, value) =>
      Math.max(0, value - 2 * (c.combat.ransomPaid[c.me] || 0)),
  },

  parley: {
    *immediate(c) {
      const paid = yield* c.g.ransom(c.me, 2, c.combat);
      if (!paid) cancelOpponentCard(c);
    },
  },

  "fearsome-and-calculating": {
    *immediate(c) {
      const paid = yield* c.g.ransom(c.me, 1, c.combat);
      if (paid || !c.g.handSize(c.foe)) return;
      const ids = yield c.g.askCards(
        c.me,
        "promptChooseFoeDiscard",
        c.g.handOf(c.foe),
        { min: 1, max: 1 },
      );
      c.g.discardFromHand(c.foe, ids[0]);
    },
  },

  "show-a-leg": {
    *after(c) {
      const options = c.g.summonSpaces(c.me, true);
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptSummon", options);
      if (space) c.g.summon(c.me, space);
    },
  },

  "no-prey-no-pay": {
    canBoost: () => true,
    *after(c) {
      if (c.combat.won[c.me]) c.g.draw(c.me, 1);
    },
  },

  "intimidating-visage": {
    *after(c) {
      if (c.g.adjacentToFoe(c.me)) c.g.heal(c.me, 2, "hero");
    },
  },

  plunder: {
    *scheme(c) {
      yield* c.g.moveAll(c.me, 3, true);
      c.g.stealCoin(c.me);
    },
  },

  "scourge-of-the-seven-seas": {
    *scheme(c) {
      if (!(yield* c.g.ransom(c.me, 1, null))) c.g.heal(c.me, 2, "hero");
      if (!(yield* c.g.ransom(c.me, 1, null))) {
        const options = c.g.summonSpaces(c.me, false);
        if (options.length) {
          const space = yield c.g.askSpace(c.me, "promptSummon", options);
          if (space) c.g.summon(c.me, space);
        }
      }
      if (!(yield* c.g.ransom(c.me, 1, null))) c.g.gainAction(1);
    },
  },
};
