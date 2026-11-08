const noSharedZones = (c) => !c.g.shared(c.me, c.foe);
const redRoomOn = (c) => c.g.redRoomOn(c.me);

const SECRETS_KEY = "a-magician-never-reveals-his-secrets";

// Ефект дозволяє c.me переглянути руку c.foe. Якщо в суперника є карта
// A Magician Never Reveals His Secrets, він може розкрити її й скасувати ефект.
// Повертає true, якщо ефект діє далі.
function* lookAtFoeHand(c) {
  const secret = c.g
    .handOf(c.foe)
    .find((id) => c.g.cardKey(id) === SECRETS_KEY);
  if (!secret) return true;
  const reveal = yield c.g.askConfirm(c.foe, "promptSecretsReveal");
  if (!reveal) return true;
  c.g.log("logSecretsCancel", {
    player: c.foe,
    card: "A Magician Never Reveals His Secrets",
    cardId: secret,
  });
  return false;
}

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

function* pickFoeFighter(c, targets, title = "promptAttackTarget") {
  if (!targets.length) return null;
  if (targets.length === 1) return targets[0];
  const spaces = targets.map((f) => c.g.fighterSpace(c.foe, f));
  const space = yield c.g.askSpace(c.me, title, spaces);
  return (
    targets.find((f) => c.g.fighterSpace(c.foe, f) === space) || targets[0]
  );
}

export const cardEffects = {
  "analyze-and-adjust": {
    *after(c) {
      c.g.storeInSuit(c.me, c.foe, 1);
    },
  },

  "ancestral-insight": {
    *after(c) {
      if (c.combat.won[c.me]) c.g.storeInSuit(c.me, c.foe, 1);
    },
  },

  "anti-metal-claws": {
    value: (c, value) => value + (c.combat.cards[c.foe]?.boost || 0),
    canBoost: () => true,
  },

  "cat-like-reflexes": {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const choice = yield c.g.askChoice(c.me, "promptMoveWho", [
        { value: "mine", label: "gameMoveMine" },
        { value: "foe", label: "gameMoveFoe" },
      ]);
      if (choice === "foe") {
        yield* c.g.walk(c.me, c.foe, 3, "promptMoveFoe");
        return;
      }
      const fighter = c.g.fighterOf(c.me);
      yield* c.g.walk(
        c.me,
        c.me,
        3,
        fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
        { fighter },
      );
    },
  },

  evade: {
    *after(c) {
      c.g.draw(c.me, 1);
    },
  },

  "microweave-mesh": {
    canBoost: () => true,
  },

  "nanotriage-processor": {
    *after(c) {
      const shuri = c.g.fighterOf(c.me);
      c.g.heal(c.me, 1, shuri);
      if (shuri !== "hero" && c.g.sameZone(c.me, "hero", shuri)) {
        c.g.heal(c.me, 1, "hero");
      }
    },
  },

  regroup: {
    *after(c) {
      c.g.draw(c.me, c.combat.won[c.me] ? 2 : 1);
    },
  },

  "stalking-panther": {
    *scheme(c) {
      yield* c.g.moveAll(c.me, 3, true);
      c.g.gainAction(1);
    },
  },

  "tactical-remote-scanning": {
    *scheme(c) {
      c.g.storeInSuit(c.me, c.foe, 2);
    },
  },

  "vibranium-shockwave": {
    canBoost: () => true,
  },

  "wakanda-forever": {
    canBoost: () => true,
    maxBoosts: () => 2,
  },

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
      for (const { owner, fighter } of c.g.adjacentFightersOf(c.me)) {
        if (owner === c.foe) c.g.damage(owner, 1, fighter);
      }
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
      if (
        c.combat.won[c.foe] &&
        c.g.handSize(c.foe) &&
        (yield* lookAtFoeHand(c))
      ) {
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

  "queen-anne-s-revenge": {
    uncancelable: true,
    *immediate(c) {
      while (yield* c.g.ransom(c.me, 1, c.combat, "promptRansomQar")) {
        if (c.combat.ransomPaid[c.me] * 2 >= 7) break;
      }
    },
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
      if (!(yield* lookAtFoeHand(c))) return;
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

  // ---------------------------------------------------------------- Houdini
  "vanishing-act": {
    *after(c) {
      const choice = yield c.g.askChoice(c.me, "promptMoveWho", [
        { value: "mine", label: "gameMoveMine" },
        { value: "foe", label: "gameMoveFoe" },
      ]);
      if (choice === "foe") {
        yield* c.g.walk(c.me, c.foe, 3, "promptMoveFoe", { through: true });
        return;
      }
      const fighter = c.g.fighterOf(c.me);
      yield* c.g.walk(
        c.me,
        c.me,
        3,
        fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
        { through: true, fighter },
      );
    },
  },

  "the-big-reveal": {
    canBoost: () => true,
    maxBoosts: () => 2,
    *after(c) {
      const used = c.combat.boostLists[c.me].filter((id) =>
        c.g.discardOf(c.me).includes(id),
      );
      if (!used.length) return;
      const ids = yield c.g.askCards(c.me, "promptReturnBoosted", used, {
        min: 1,
        max: 1,
      });
      if (ids.length) c.g.returnFromDiscard(c.me, ids[0]);
    },
  },

  "smoke-and-mirrors": {
    *immediate(c) {
      if (!c.g.canSwapWithSidekick(c.me)) return;
      const ok = yield c.g.askConfirm(c.me, "promptSmokeSwap");
      if (ok) c.g.swapWithSidekick(c.me, c.combat);
    },
  },

  "sleight-of-hand": {
    *boosted(c) {
      c.g.draw(c.me, 1);
    },
    *immediate(c) {
      yield* c.g.swapPlayedCard(c.me, c.combat);
    },
  },

  "set-the-stage": {
    *scheme(c) {
      c.g.draw(c.me, 3);
      if (!c.g.handSize(c.me)) return;
      const ids = yield c.g.askCards(c.me, "promptPutOnTop", c.g.handOf(c.me), {
        min: 1,
        max: 1,
      });
      if (ids.length) c.g.putOnDeckTop(c.me, ids[0]);
    },
    *boosted(c) {
      if (!c.g.handSize(c.foe)) return;
      if (!(yield* lookAtFoeHand(c))) return;
      const ids = yield c.g.askCards(
        c.me,
        "promptChooseFoeDiscard",
        c.g.handOf(c.foe),
        { min: 1, max: 1 },
      );
      if (ids.length) c.g.discardFromHand(c.foe, ids[0]);
    },
  },

  misdirection: {
    *boosted(c) {
      yield* c.g.damageAny(c.me, 2);
    },
    *immediate(c) {
      cancelOpponentCard(c);
    },
  },

  "grand-escape": {
    canBoost: () => true,
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const options = c.g.anySpaces();
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptPlaceAny", options);
      if (space) c.g.place(c.me, space);
    },
  },

  flourish: {
    canBoost: () => true,
    *boosted(c) {
      c.g.draw(c.me, 1);
    },
  },

  "an-illusion-of-my-own-design": {
    canBoost: () => true,
    *immediate(c) {
      yield* c.g.offerBoost(c.foe, c.combat);
    },
  },

  "all-part-of-the-show": {
    uncancelable: true,
    rescue: true,
    *boosted(c) {
      if (c.g.hero(c.me).id === "harry-houdini") c.g.heal(c.me, 2, "hero");
    },
    *after(c) {
      if (!c.g.rescueFighter(c.me, 4)) return;
      const options = c.g.anySpaces();
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptPlaceAny", options);
      if (space) c.g.place(c.me, space);
    },
  },

  "a-magician-never-reveals-his-secrets": {
    *scheme(c) {
      c.g.draw(c.me, 2);
      c.g.gainAction(1);
    },
  },

  "for-my-next-trick": {
    *after(c) {
      yield* c.g.moveOne(c.me, 1);
      c.g.draw(c.me, 1);
      c.g.gainAction(1);
    },
  },

  "and-the-beautiful-bess": {
    *boosted(c) {
      if (c.g.isTurnOf(c.me)) c.g.gainAction(1);
    },
  },
  // ------------------------------------------------------------ Wyatt Earp
  "you-just-gonna-stand-there-and-bleed": {},

  "i-have-two-guns-one-for-each-of-you": {
    *after(c) {
      const played = c.combat.cards[c.foe];
      if (!played || !played.value) return;
      const used = c.combat.fighters[c.foe];
      const targets = c.g.foeFightersInZone(c.me).filter((f) => f !== used);
      const target = yield* pickFoeFighter(c, targets);
      if (target) c.g.damage(c.foe, played.value, target);
    },
  },

  "second-shot": {
    canBoost: () => true,
  },

  "fan-the-hammer": {
    *after(c) {
      if (c.g.fighterDefeated(c.foe, c.combat.fighters[c.foe])) {
        c.combat.returnToHand[c.me] = true;
      }
    },
  },

  "you-re-a-daisy-if-you-do": {
    *after(c) {
      c.g.draw(c.me, 2);
    },
  },

  "a-marshal-and-an-outlaw": {
    *after(c) {
      if (c.combat.defender === c.me) {
        c.g.draw(c.me, 1);
        return;
      }
      if (!c.g.handSize(c.foe)) return;
      const ids = yield c.g.askCards(
        c.foe,
        "promptDiscardOne",
        c.g.handOf(c.foe),
        { min: 1, max: 1 },
      );
      c.g.discardFromHand(c.foe, ids[0]);
    },
  },

  "i-m-your-huckleberry": {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const target = yield* pickFoeFighter(c, c.g.foeFightersInZone(c.me));
      if (target) c.g.damage(c.foe, 1, target);
    },
  },

  "gunfight-at-the-o-k-corral": {
    *after(c) {
      yield* c.g.damageAny(c.me, 1, "promptDamageOne");
      yield* c.g.damageAny(c.foe, 1, "promptDamageOne");
      yield* c.g.damageAny(c.me, 1, "promptDamageOne");
      yield* c.g.damageAny(c.foe, 1, "promptDamageOne");
    },
  },

  "better-swear-me-in": {
    *immediate(c) {
      cancelOpponentCard(c);
    },
    *after(c) {
      const top = c.g.peekTop(c.foe);
      if (!top) return;
      c.g.logRevealTop(c.me, top);
      const ids = yield c.g.askCards(c.me, "promptSwearBottom", [top], {
        min: 0,
        max: 1,
        skip: "gameKeepOnTop",
      });
      if (ids.length) c.g.topToBottom(c.foe);
    },
  },

  "bring-em-to-justice": {
    *immediate(c) {
      const top = c.g.peekTop(c.foe);
      if (!top) return;
      c.g.logRevealTop(c.me, top);
      c.combat.justice = c.combat.justice || {};
      c.combat.justice[c.me] = 2 * c.g.cardBoost(top);
    },
    value: (c, value) => value + (c.combat.justice?.[c.me] || 0),
  },

  "in-vino-veritas": {
    *scheme(c) {
      c.g.drawUntil(c.me, 4);
      c.g.gainAttackAction(null);
    },
  },

  "you-die-first": {
    *scheme(c) {
      const targets = c.g.foeFighterIds(c.me);
      const target = yield* pickFoeFighter(c, targets, "promptMoveFoeFighter");
      if (!target) return;
      c.g.setFighter(c.foe, target);
      yield* c.g.walk(c.me, c.foe, 1, "promptMoveFoe", { fighter: target });
      c.g.setFighter(c.foe, "hero");
      c.g.gainAttackAction(target);
    },
  },
  // ------------------------------------------------------------ Robin Hood
  "a-hunter-s-eye": {},

  "highway-robbery": {
    *immediate(c) {
      cancelOpponentCard(c);
    },
    ignoreFoeValue: () => true,
  },

  ambush: {
    *immediate(c) {
      const hand = c.g.handOf(c.foe);
      if (!hand.length) return;
      const id = hand[Math.floor(Math.random() * hand.length)];
      c.g.discardFromHand(c.foe, id);
      c.combat.ambush = c.combat.ambush || {};
      c.combat.ambush[c.me] = c.g.cardBoost(id);
    },
    value: (c, value) => value + (c.combat.ambush?.[c.me] || 0),
  },

  disengage: {
    *after(c) {
      const fighter = c.g.fighterOf(c.me);
      if (c.g.fighterDefeated(c.me, fighter)) return;
      const options = c.g.zoneSpaces(c.me);
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptPlaceZone", options);
      if (space) c.g.place(c.me, space);
    },
  },

  "pack-hunters": {
    *after(c) {
      const foeFighter = c.g.fighterOf(c.foe);
      if (!c.combat.won[c.me] || c.g.fighterDefeated(c.foe, foeFighter)) return;
      const n = c.g.packNearFoe(c.me);
      if (n > 0) c.g.damage(c.foe, n, foeFighter);
    },
  },

  "clever-girl": {
    *after(c) {
      if (c.g.packNearFoe(c.me) > 0) c.g.gainAction(1);
    },
  },

  "they-remember": {
    *after(c) {
      c.g.gainAction(1);
    },
  },

  "eaten-alive": {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const targets = c.g
        .adjacentFightersOf(c.me)
        .filter(
          (item) =>
            item.owner === c.foe && !c.g.fighterDefeated(c.foe, item.fighter),
        )
        .map((item) => item.fighter);
      const target = yield* pickFoeFighter(c, targets, "promptDamageOne");
      if (target) c.g.damage(c.foe, 1, target);
    },
  },

  decoy: {
    *immediate(c) {
      const current = c.g.fighterOf(c.me);
      const others = c.g
        .friends(c.me)
        .filter(
          (fighter) =>
            fighter !== current && !c.g.fighterDefeated(c.me, fighter),
        );
      if (!others.length) return;
      let chosen = others[0];
      if (others.length > 1) {
        const picked = yield c.g.askSpace(
          c.me,
          "promptChooseRaptor",
          others.map((fighter) => c.g.fighterSpace(c.me, fighter)),
        );
        chosen =
          others.find(
            (fighter) => c.g.fighterSpace(c.me, fighter) === picked,
          ) || chosen;
      }
      const home = c.g.fighterSpace(c.me, chosen);
      const near = c.g.freeSpacesNearFoe(c.me);
      if (!near.length) return;
      const space = yield c.g.askSpace(c.me, "promptPlaceRaptor", [
        home,
        ...near,
      ]);
      if (space && space !== home) c.g.placeFighter(c.me, chosen, space);
    },
  },

  "working-things-out": {
    *scheme(c) {
      yield* c.g.moveAll(c.me, 3, true);
      c.g.gainAction(1);
    },
  },

  "coordinated-attack-pattern": {
    *scheme(c) {
      const fighters = c.g.friends(c.me);
      let chosen = fighters[0];
      if (fighters.length > 1) {
        const picked = yield c.g.askSpace(
          c.me,
          "promptChooseRaptor",
          fighters.map((fighter) => c.g.fighterSpace(c.me, fighter)),
        );
        chosen =
          fighters.find(
            (fighter) => c.g.fighterSpace(c.me, fighter) === picked,
          ) || chosen;
      }
      for (const fighter of fighters) {
        if (fighter === chosen) continue;
        const home = c.g.fighterSpace(c.me, fighter);
        const options = c.g.zoneSpacesFor(c.me, chosen);
        if (!options.length) continue;
        const space = yield c.g.askSpace(c.me, "promptPlaceRaptor", [
          home,
          ...options,
        ]);
        if (space && space !== home) c.g.placeFighter(c.me, fighter, space);
      }
    },
  },

  "defenders-of-sherwood": {
    *after(c) {
      c.g.draw(c.me, 1);
      if (!c.g.hasDefeatedKid(c.me)) return;
      const options = c.g.reviveSpaces(c.me);
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptReviveKid", options);
      c.g.reviveKid(c.me, space || options[0]);
    },
  },

  "steal-from-the-rich": {
    *scheme(c) {
      c.g.draw(c.me, 1);
      let paid = false;
      if (c.g.handSize(c.foe)) {
        paid = yield c.g.askConfirm(c.foe, "promptStealDiscard");
      }
      if (paid) {
        const ids = yield c.g.askCards(
          c.foe,
          "promptDiscardOne",
          c.g.handOf(c.foe),
          { min: 1, max: 1 },
        );
        c.g.discardFromHand(c.foe, ids[0]);
      } else {
        c.g.draw(c.me, 1);
      }
    },
  },
  // -------------------------------------------------------- Dr. Jill Trent
  "energizing-spray": {
    *after(c) {
      c.g.gainAction(1);
    },
  },

  "battle-of-wits": {
    *after(c) {
      const mine = c.g.peekTop(c.me);
      const theirs = c.g.peekTop(c.foe);
      if (mine) c.g.logRevealOwn(c.me, mine);
      if (theirs) c.g.logRevealTop(c.me, theirs);
      if (!mine) return;
      const foeBoost = theirs ? c.g.cardBoost(theirs) : 0;
      if (c.g.cardBoost(mine) > foeBoost) c.g.damage(c.foe, 3);
    },
  },

  "ace-fighter": {
    *after(c) {
      c.g.draw(c.me, 1);
    },
  },

  "gyroscopic-jetpack": {
    *after(c) {
      const fighter = c.combat.fighters[c.me];
      yield* c.g.walk(
        c.me,
        c.me,
        2,
        fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
        { through: true, fighter },
      );
    },
  },

  "utility-belt": {
    *after(c) {
      const pick = yield c.g.askChoice(c.me, "promptUtilityBelt", [
        { value: "heal", label: "gameBelt_heal" },
        { value: "move", label: "gameBelt_move" },
        { value: "draw", label: "gameBelt_draw" },
      ]);
      if (pick === "heal") c.g.heal(c.me, 1, "hero");
      else if (pick === "draw") c.g.draw(c.me, 1);
      else {
        const previous = c.combat.fighters[c.me];
        c.g.setFighter(c.me, "hero");
        yield* c.g.walk(c.me, c.me, 1, "promptMoveSpace", {
          fighter: "hero",
        });
        c.g.setFighter(c.me, previous);
      }
    },
  },

  "insightful-deduction": {
    *after(c) {
      const top = c.g.topCards(c.foe, 3);
      if (!top.length) return;
      for (const id of top) c.g.logRevealTop(c.me, id);
      const [bottom] = yield c.g.askCards(c.me, "promptDeductionBottom", top, {
        min: 1,
        max: 1,
      });
      const rest = top.filter((id) => id !== bottom);
      const order = [];
      while (rest.length > 1) {
        const [first] = yield c.g.askCards(c.me, "promptDeductionTop", rest, {
          min: 1,
          max: 1,
        });
        order.push(first);
        rest.splice(rest.indexOf(first), 1);
      }
      order.push(...rest);
      c.g.reorderTop(c.foe, top.length, bottom, order);
    },
  },

  "sisters-in-arms": { uncancelable: true },

  "stasis-diffuser": {
    lockFoeValue: () => true,
  },

  "laser-pen": {
    *after(c) {
      c.g.damage(c.foe, 1);
    },
  },

  "caught-red-handed": {
    *after(c) {
      const count = Math.min(c.combat.won[c.me] ? 2 : 1, c.g.handSize(c.foe));
      for (let i = 0; i < count; i++) {
        const [id] = yield c.g.askCards(
          c.foe,
          "promptDiscardOne",
          c.g.handOf(c.foe),
          { min: 1, max: 1 },
        );
        c.g.discardFromHand(c.foe, id);
      }
    },
  },

  "indestructible-cloth": {
    *immediate(c) {
      c.g.setImmune(c.me);
    },
  },

  hypnotist: {
    *immediate(c) {
      if (c.g.gadgetOf(c.me) === "hypnoray") cancelOpponentCard(c);
    },
  },

  "helpful-assistant": {
    *scheme(c) {
      const pool = c.g
        .discardOf(c.me)
        .filter((id) => c.g.cardKind(id) === "hero");
      if (pool.length) {
        const ids = yield c.g.askCards(c.me, "promptHelpfulAssistant", pool, {
          min: 0,
          max: 3,
          skip: "gameSkip",
        });
        if (ids.length) c.g.shuffleIntoDeck(c.me, ids);
      }
      c.g.draw(c.me, 1);
    },
  },
};
