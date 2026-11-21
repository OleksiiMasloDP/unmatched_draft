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

const voyageCount = (c) =>
  c.g.discardOf(c.me).filter((id) => c.g.cardKey(id).startsWith("voyage"))
    .length;

const voyageValue = (c, value) => value + voyageCount(c);

function* sinbadMove(c, steps) {
  yield* c.g.walk(c.me, c.me, steps, "promptMoveSpace", { fighter: "hero" });
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
    value: (c, value) =>
      c.g.movedThisTurn(c.me, c.combat.fighters[c.me]) ? 5 : value,
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

  "scare-tactics": {
    *after(c) {
      const ok = yield c.g.askConfirm(c.me, "promptScareTactics");
      if (!ok) return;
      c.g.damage(c.me, 2);
      c.g.discardRandom(c.foe, 1);
    },
  },

  savage: {
    *after(c) {
      const ok = yield c.g.askConfirm(c.me, "promptSavage");
      if (!ok) return;
      c.g.damage(c.me, 2);
      yield* c.g.walk(c.me, c.me, 3, "promptMoveSpace", { fighter: "hero" });
    },
  },

  "good-enough-for-us": {
    *after(c) {
      const ok = yield c.g.askConfirm(c.me, "promptGoodEnough");
      if (!ok) return;
      c.g.draw(c.me, 2);
      c.g.damage(c.me, 2);
    },
  },

  "multi-gun": {
    *after(c) {
      const all = [
        { value: "move", label: "gameVenomMove" },
        { value: "damage", label: "gameVenomDamage" },
        { value: "draw", label: "gameVenomDraw" },
      ];
      const first = yield c.g.askChoice(c.me, "promptVenomFirst", all);
      const second = yield c.g.askChoice(
        c.me,
        "promptVenomSecond",
        all.filter((item) => item.value !== first),
      );
      const picked = [first, second];
      if (picked.includes("move")) {
        yield* c.g.walk(c.me, c.me, 1, "promptMoveSpace", { fighter: "hero" });
      }
      if (picked.includes("damage") && c.g.adjacent(c.me, c.foe)) {
        c.g.damage(c.foe, 1);
      }
      if (picked.includes("draw")) c.g.draw(c.me, 1);
    },
  },

  "spider-sense-tingling": {
    *after(c) {
      if ((c.combat.values[c.foe] ?? 0) >= 4) c.g.draw(c.me, 2);
    },
  },

  "a-totally-sane-thing-to-do": {
    *after(c) {
      const ok = yield c.g.askConfirm(c.me, "promptTotallySane");
      if (!ok) return;
      c.g.damage(c.me, 2);
      c.g.damage(c.foe, 2);
    },
  },

  "grasping-tendrils": {
    *immediate(c) {
      c.g.pin(c.foe);
    },
    *after(c) {
      if (c.g.isTurnOf(c.me)) c.g.gainAction(1);
    },
  },

  "locked-and-loaded": {
    *after(c) {
      const deck = c.g.deckOf(c.me);
      if (!deck.length) return;
      const ids = yield c.g.askCards(c.me, "promptSearchDeck", deck, {
        min: 0,
        max: 1,
      });
      if (ids.length) c.g.searchDeck(c.me, ids[0]);
      else c.g.shuffleDeck(c.me);
    },
  },

  "lethal-protector": {
    *after(c) {
      if ((c.combat.taken[c.me] ?? 0) >= 2) c.g.discardTop(c.foe, 2);
    },
  },

  "improvise-to-neutralise": {
    *scheme(c) {
      const hand = c.g.handOf(c.foe);
      const count = Math.min(2, hand.length);
      if (count) {
        const ids = yield c.g.askCards(c.foe, "promptDiscardTwo", hand, {
          min: count,
          max: count,
        });
        for (const id of ids) c.g.discardFromHand(c.foe, id);
      }
      const pile = c.g.discardOf(c.foe);
      const back = Math.min(2, pile.length);
      if (back) {
        const ids = yield c.g.askCards(c.me, "promptShuffleBack", pile, {
          min: back,
          max: back,
        });
        c.g.shuffleIntoDeck(c.foe, ids);
      }
      if (c.g.handSize(c.foe) >= 2) c.g.gainAction(1);
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
      const near = c.g.isHeroFighter(c.foe, c.combat.fighters[c.foe])
        ? c.g.adjacentSpaces(c.me)
        : [];
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
    value: (c, value) =>
      c.g.isHeroFighter(c.foe, c.combat.fighters[c.foe]) ? 5 : value,
  },

  "flash-of-steel": {
    *immediate(c) {
      if (c.g.isHeroFighter(c.foe, c.combat.fighters[c.foe])) {
        cancelOpponentCard(c);
      }
    },
    *after(c) {
      if (c.g.adjacent(c.me, c.foe)) c.g.damage(c.foe, 1);
    },
  },

  "commanding-impact": {
    *after(c) {
      c.g.draw(c.me, 1);
    },
  },

  "by-fortune-and-fate": {
    *after(c) {
      c.g.draw(c.me, 2);
    },
  },

  "voyage-to-the-cannibals-with-the-root-of-madness": {
    value: voyageValue,
    *after(c) {
      yield* sinbadMove(c, 2);
    },
  },

  "voyage-to-the-creature-with-eyes-like-coals-of-fire": {
    value: voyageValue,
    *after(c) {
      c.g.discardRandom(c.foe, 1);
    },
  },

  "voyage-to-the-city-of-the-king-of-serendib": {
    value: voyageValue,
    *after(c) {
      c.g.draw(c.me, 1);
    },
  },

  "voyage-to-the-valley-of-the-giant-snakes": {
    value: voyageValue,
    *after(c) {
      if (!c.g.handSize(c.foe)) return;
      if (!(yield* lookAtFoeHand(c))) return;
      yield c.g.askCards(c.me, "promptLookHand", c.g.handOf(c.foe), {
        min: 0,
        max: 0,
        skip: "gameLookDone",
      });
    },
  },

  "voyage-home": {
    value: voyageValue,
    *after(c) {
      for (const id of c.g.discardOf(c.me)) {
        if (c.g.cardKey(id).startsWith("voyage")) c.g.takeFromDiscard(c.me, id);
      }
    },
  },

  "voyage-to-the-city-of-the-man-eating-apes": {
    value: voyageValue,
    *after(c) {
      c.g.damage(c.foe, 2, c.combat.fighters[c.foe]);
    },
  },

  "voyage-to-the-island-that-was-a-whale": {
    value: voyageValue,
    *after(c) {
      c.g.heal(c.me, 2, "hero");
    },
  },

  "leap-away": {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const who = yield c.g.askChoice(c.me, "promptSkirmishWho", [
        { value: "me", label: "gameSkirmishMe" },
        { value: "foe", label: "gameSkirmishFoe" },
      ]);
      const target = who === "me" ? c.me : c.foe;
      yield* c.g.walk(c.me, target, 4, "promptMoveFoe");
    },
  },

  "toil-and-danger": {
    *after(c) {
      yield* sinbadMove(c, 3);
    },
  },

  "riches-beyond-compare": {
    *scheme(c) {
      c.g.draw(c.me, 3);
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
    ignoreFoeCard: (c) => c.g.adjacent(c.me, c.foe),
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
      c.g.heal(c.me, 2, "hero");
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
      c.g.noteDiscard(c.foe, id);
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

  // --------------------------------------------------------- Invisible Man
  "surprise-attack": {
    *immediate(c) {
      cancelOpponentCard(c);
    },
    *after(c) {
      if (!c.g.heroOnFog(c.me)) return;
      const from = c.g.spaceOf(c.me);
      const others = c.g.fogSpaces().filter((id) => id !== from);
      yield* c.g.moveFog(c.me, Infinity, others);
    },
  },

  "emerge-from-mist": {
    value: (c, value) => (c.g.startedOnFog(c.me) ? 5 : value),
  },

  "slip-away": {
    *after(c) {
      const fog = c.g.fogSpaces();
      if (!fog.length) return;
      const free = c.g.freeSpaces().filter((id) => !fog.includes(id));
      if (!free.length) return;
      let from = fog[0];
      if (fog.length > 1) {
        from = (yield c.g.askSpace(c.me, "promptFogPick", fog)) || fog[0];
      }
      const to = yield c.g.askSpace(c.me, "promptFogTo", free);
      if (!to) return;
      const others = fog.filter((id) => id !== from);
      yield* c.g.moveFog(c.me, Infinity, others, to);
      c.g.place(c.me, to);
    },
  },

  confound: {
    *after(c) {
      const hand = c.g.handOf(c.foe);
      if (hand.length) {
        const ids = yield c.g.askCards(c.foe, "promptConfound", hand, {
          min: 0,
          max: 1,
          skip: "gameSkip",
        });
        if (ids.length) {
          c.g.discardFromHand(c.foe, ids[0]);
          return;
        }
      }
      for (const from of [...c.g.fogSpaces()]) {
        const free = c.g
          .allSpaces()
          .filter((id) => id !== from && !c.g.fogSpaces().includes(id));
        if (!free.length) continue;
        const to = yield c.g.askSpace(c.me, "promptFogTo", free);
        if (to) {
          const others = c.g.fogSpaces().filter((id) => id !== from);
          yield* c.g.moveFog(c.me, Infinity, others, to);
        }
      }
    },
  },

  "dreaming-of-revenge": {
    *after(c) {
      if (!c.g.heroOnFog(c.me)) return;
      for (const fighter of c.g.foeFightersOnFog(c.me)) {
        c.g.damage(c.foe, 1, fighter);
      }
    },
  },

  "impossible-to-see": {
    ignoreFoeValue: () => true,
  },

  "covert-preparation": {
    *after(c) {
      c.g.draw(c.me, 1);
      const moved = yield* c.g.moveFog(c.me, 2);
      yield* c.g.moveFog(c.foe, 2, moved ? [moved] : []);
    },
  },

  "into-thin-air": {
    *after(c) {
      yield* c.g.walk(c.me, c.me, 1, "promptMoveSpace");
      yield* c.g.moveFog(c.foe, 3);
    },
  },

  "coded-notes": {
    *after(c) {
      c.g.draw(c.me, 3);
      const hand = c.g.handOf(c.me);
      if (!hand.length) return;
      const count = Math.min(2, hand.length);
      const ids = yield c.g.askCards(c.me, "promptCodedNotes", hand, {
        min: count,
        max: count,
        skip: "gameSkip",
      });
      for (const id of [...ids].reverse()) c.g.putOnDeckTop(c.me, id);
    },
  },

  lurking: {
    *after(c) {
      c.g.draw(c.me, 1);
      const here = c.g.spaceOf(c.me);
      const spaces = c.g
        .fogSpaces()
        .filter((id) => id !== here && c.g.freeSpaces().includes(id));
      const choices = [];
      if (spaces.length) {
        choices.push({ value: "move", label: "gameLurkingMove" });
      }
      if (c.g.fogSpaces().length) {
        choices.push({ value: "fog", label: "gameLurkingFog" });
      }
      if (!choices.length) return;
      const pick =
        choices.length === 1
          ? choices[0].value
          : yield c.g.askChoice(c.me, "promptLurking", choices);
      if (pick === "move") {
        const to = yield c.g.askSpace(c.me, "promptMoveSpace", spaces);
        if (to) c.g.place(c.me, to);
      } else {
        yield* c.g.moveFog(c.me, 2);
      }
    },
  },

  "rolling-fog": {
    *scheme(c) {
      yield* c.g.moveFog(c.me);
      c.g.gainAction(1);
    },
  },

  "step-lightly": {
    *scheme(c) {
      const amount = c.g.heroOnFog(c.me) ? 3 : 1;
      const targets = c.g
        .adjacentFightersOf(c.me)
        .filter(
          (item) =>
            item.owner === c.foe && !c.g.fighterDefeated(c.foe, item.fighter),
        )
        .map((item) => item.fighter);
      const target = yield* pickFoeFighter(c, targets, "promptDamageOne");
      if (target) c.g.damage(c.foe, amount, target);
      yield* c.g.moveFog(c.foe, 2);
    },
  },

  vanish: {
    *scheme(c) {
      c.g.heal(c.me, 1, "hero");
      c.g.hideHero(c.me);
      if (c.g.isFirstAction()) c.g.endTurnNow();
    },
  },

  "reign-of-terror": {
    *scheme(c) {
      if (!c.g.heroOnFog(c.me)) return;
      const targets = c.g
        .foeFighterIds(c.me)
        .filter((fighter) => !c.g.fighterDefeated(c.foe, fighter));
      const target = yield* pickFoeFighter(c, targets, "promptDamageOne");
      if (target) c.g.damage(c.foe, 2, target);
    },
  },

  // ------------------------------------------------------------------ Hamlet
  "to-sleep-perchance-to-dream": {
    *after(c) {
      if (c.combat.won[c.me]) {
        const dealt = c.combat.taken[c.foe];
        if (dealt > 0) yield* c.g.walk(c.me, c.foe, dealt, "promptMoveFoe");
      } else if (c.combat.won[c.foe]) {
        c.g.heal(c.me, 1, "hero");
      }
    },
  },

  "uncertain-doom": {
    ignoreFoeValue: (c) => c.combat.cards[c.foe]?.type === "versatile",
  },

  "cruel-to-be-kind": {
    canBoost: () => true,
  },

  "the-play-s-the-thing": {
    *after(c) {
      c.g.discardRandom(c.foe, 1);
      if (c.combat.won[c.me]) c.g.heal(c.me, c.card.boost, "hero");
    },
  },

  "the-readiness-is-all": {
    *after(c) {
      const options = [c.me, c.foe].filter(
        (player) => !c.g.fighterDefeated(player, c.combat.fighters[player]),
      );
      if (!options.length) return;
      let target = options[0];
      if (options.length > 1) {
        const pick = yield c.g.askChoice(c.me, "promptReadiness", [
          { value: c.me, label: "gameReadinessMine" },
          { value: c.foe, label: "gameReadinessFoe" },
        ]);
        target = pick === c.foe ? c.foe : c.me;
      }
      const free = c.g.freeSpaces();
      if (!free.length) return;
      const space = yield c.g.askSpace(c.me, "promptPlaceAny", free);
      if (!space) return;
      const saved = c.g.fighterOf(target);
      c.g.setFighter(target, c.combat.fighters[target]);
      c.g.place(target, space);
      c.g.setFighter(target, saved);
      c.g.pin(target, c.combat.fighters[target]);
    },
  },

  "blood-will-have-blood": {
    *after(c) {
      if (!c.g.hurtThisTurn(c.me)) return;
      c.g.damage(c.foe, 1, c.combat.fighters[c.foe]);
    },
  },

  "outrageous-fortune": {
    *immediate(c) {
      const id = c.g.discardTopId(c.me);
      c.combat.fortune ??= {};
      c.combat.fortune[c.me] = id;
    },
    value: (c, value) => {
      const id = c.combat.fortune?.[c.me];
      return id ? value + c.g.cardBoost(id) : value;
    },
    *after(c) {
      const id = c.combat.fortune?.[c.me];
      if (id && c.combat.won[c.foe]) c.g.returnFromDiscard(c.me, id);
    },
  },

  "nothing-either-good-or-bad": {
    *after(c) {
      if (c.combat.cards[c.foe]?.type !== "versatile") return;
      c.g.damage(c.foe, 2, c.combat.fighters[c.foe]);
    },
  },

  "the-rest-is-silence": {
    endsTurn: true,
    *after(c) {
      c.g.endTurnNow();
    },
  },

  "maddening-insight": {
    value: (c) => c.g.handSize(c.me),
    *after(c) {
      if (!c.combat.won[c.me] || !c.g.handSize(c.foe)) return;
      const ids = yield c.g.askCards(
        c.foe,
        "promptDiscardOne",
        c.g.handOf(c.foe),
        { min: 1, max: 1 },
      );
      c.g.discardFromHand(c.foe, ids[0]);
    },
  },

  "the-ghost": {
    *scheme(c) {
      const choice = yield c.g.askChoice(c.me, "promptGhost", [
        { value: "heal", label: "gameGhostHeal" },
        { value: "place", label: "gameGhostPlace" },
      ]);
      if (choice === "heal") {
        c.g.heal(c.me, 2, "hero");
        return;
      }
      c.g.setFighter(c.me, "hero");
      yield* placeInZone(c);
      c.g.gainAction(1);
    },
  },

  "method-in-the-madness": {
    *scheme(c) {
      const hand = c.g.handOf(c.me);
      if (hand.length) {
        const ids = yield c.g.askCards(c.me, "promptMethod", hand, {
          min: 0,
          max: hand.length,
          skip: "gameSkip",
        });
        for (const id of ids) c.g.putOnDeckBottom(c.me, id);
        if (ids.length) c.g.draw(c.me, ids.length);
      }
      c.g.gainAction(1);
    },
  },

  "student-of-war": {
    *after(c) {
      const dealt = c.combat.taken[c.foe];
      if (dealt > 0) c.g.draw(c.me, dealt);
    },
  },

  "lightning-and-thunder": {
    *immediate(c) {
      if (c.g.isFlanked(c.foe, c.combat.fighters[c.foe])) {
        cancelOpponentCard(c);
      }
    },
    *after(c) {
      const fighter = c.g.fighterOf(c.me);
      yield* c.g.walk(
        c.me,
        c.me,
        2,
        fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
        { fighter },
      );
    },
  },

  "fire-and-flames": {
    value: (c, value) =>
      c.g.isFlanked(c.foe, c.combat.fighters[c.foe]) ? 5 : value,
  },

  "sun-and-moon": {
    ignoreFoeValue: (c) => c.g.isFlanked(c.foe, c.combat.fighters[c.foe]),
  },

  "battle-maneuvers": {
    *after(c) {
      c.g.draw(c.me, 1);
      const saved = c.g.fighterOf(c.me);
      for (const fighter of c.g.fightersOf(c.me)) {
        c.g.setFighter(c.me, fighter);
        yield* c.g.walk(
          c.me,
          c.me,
          2,
          fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
          { fighter },
        );
      }
      c.g.setFighter(c.me, saved);
    },
  },

  "patience-and-strategy": {
    *after(c) {
      if (c.g.isFlanked(c.foe, c.combat.fighters[c.foe])) {
        c.g.heal(c.me, 2, c.combat.fighters[c.me]);
      }
    },
  },

  pragmatism: {
    *immediate(c) {
      cancelOpponentCard(c);
    },
  },

  "spring-the-trap": {
    *immediate(c) {
      yield* c.g.swapWithAdjacentFriend(c.me, c.combat);
    },
    *after(c) {
      c.g.damage(c.foe, 1, c.combat.fighters[c.foe]);
    },
  },

  reinforce: {
    *scheme(c) {
      const all = [
        { value: "heal", label: "gameReinforceHeal" },
        { value: "draw", label: "gameReinforceDraw" },
        { value: "action", label: "gameReinforceAction" },
      ];
      const first = yield c.g.askChoice(c.me, "promptReinforce", all);
      const second = yield c.g.askChoice(
        c.me,
        "promptReinforce",
        all.filter((item) => item.value !== first),
      );
      for (const pick of [first, second]) {
        if (pick === "heal") {
          for (const fighter of c.g.fightersOf(c.me)) {
            c.g.heal(c.me, 1, fighter);
          }
        } else if (pick === "draw") {
          c.g.draw(c.me, 2);
        } else if (pick === "action") {
          c.g.gainAction(1);
        }
      }
    },
  },

  "demon-king-of-the-sixth-heaven": {
    *scheme(c) {
      for (const fighter of c.g.fightersOf(c.foe)) {
        if (c.g.isFlanked(c.foe, fighter)) c.g.damage(c.foe, 2, fighter);
      }
    },
  },

  beastform: {
    *immediate(c) {
      const hand = c.g.handOf(c.me);
      if (!hand.length) return;
      const ids = yield c.g.askCards(c.me, "promptBeastform", hand, {
        min: 0,
        max: hand.length,
        skip: "gameSkip",
      });
      for (const id of ids) {
        c.g.discardFromHand(c.me, id);
        c.g.noteDiscard(c.me, id);
      }
      c.combat.beast = c.combat.beast || {};
      c.combat.beast[c.me] = ids.length;
    },
    value: (c, value) => value + (c.combat.beast?.[c.me] || 0),
  },

  "thirst-for-sustenance": {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const foeFighter = c.combat.fighters[c.foe];
      if (c.g.fighterDefeated(c.foe, foeFighter)) return;
      const options = c.g.freeSpacesAdjacentTo(c.foe, foeFighter);
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptPlaceAny", options);
      if (space) c.g.placeFighter(c.me, "hero", space);
    },
  },

  "feeding-frenzy": {
    value: (c, value) =>
      value + c.g.sidekicksNearFighter(c.me, c.foe, c.combat.fighters[c.foe]),
  },

  exploit: {
    *after(c) {
      c.g.draw(c.me, 1);
    },
  },

  dash: {
    *after(c) {
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

  "do-my-bidding": {
    *immediate(c) {
      yield* c.g.forceFoeCard(c.me, c.combat);
    },
  },

  "look-into-my-eyes": {
    value: (c, value) => value + (c.combat.cards[c.foe]?.boost || 0),
  },

  "prey-upon": {
    *scheme(c) {
      for (const target of c.g.adjacentFightersTo(c.me)) {
        if (target.owner !== c.foe) continue;
        c.g.damage(c.foe, 1, target.fighter);
        c.g.heal(c.me, 1, "hero");
      }
    },
  },

  mistform: {
    *scheme(c) {
      const options = c.g.freeSpaces();
      if (options.length) {
        const space = yield c.g.askSpace(c.me, "promptPlaceAny", options);
        if (space) c.g.placeFighter(c.me, "hero", space);
      }
      c.g.gainAction(1);
    },
  },

  "baptism-of-blood": {
    *scheme(c) {
      c.g.heal(c.me, 2, "hero");
      if (!c.g.hasDefeatedKid(c.me)) return;
      const options = c.g.reviveSpaces(c.me);
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptReviveKid", options);
      c.g.reviveKid(c.me, space || options[0]);
    },
  },

  "ravening-seduction": {
    *scheme(c) {
      const all = [];
      for (const owner of [c.me, c.foe]) {
        for (const fighter of c.g.fightersOf(owner)) {
          all.push({ owner, fighter });
        }
      }
      let target = all[0];
      if (all.length > 1) {
        const space = yield c.g.askSpace(
          c.me,
          "promptMoveAnyFighter",
          all.map((item) => c.g.fighterSpace(item.owner, item.fighter)),
        );
        target =
          all.find(
            (item) => c.g.fighterSpace(item.owner, item.fighter) === space,
          ) || target;
      }
      const saved = c.g.fighterOf(target.owner);
      c.g.setFighter(target.owner, target.fighter);
      yield* c.g.walk(
        c.me,
        target.owner,
        2,
        target.owner === c.me
          ? target.fighter === "hero"
            ? "promptMoveSpace"
            : "promptMoveSidekick"
          : "promptMoveFoe",
        { fighter: target.fighter },
      );
      c.g.setFighter(target.owner, saved);
      const links = c.g.linksOf(target.owner, target.fighter);
      const sisters = c.g
        .fightersOf(c.me)
        .filter(
          (fighter) =>
            fighter !== "hero" &&
            !(target.owner === c.me && fighter === target.fighter) &&
            links.includes(c.g.fighterSpace(c.me, fighter)),
        ).length;
      if (sisters) c.g.damage(target.owner, sisters, target.fighter);
    },
  },

  "blood-in-the-air": {
    canBoost: (c) => c.g.wonCombatThisTurn(c.me),
  },

  feeding: {
    *after(c) {
      if (c.g.heroHp(c.me) > 7) return;
      c.g.gainAction(1);
      c.g.heal(c.me, 1, "hero");
    },
  },

  "the-more-they-struggle": {
    value: (c) => (c.combat.cards[c.foe]?.value || 0) * 2,
  },

  "wounded-beast": {
    value: (c, value) => (c.g.heroHp(c.me) <= 7 ? 5 : value),
  },

  "ravenous-lunge": {
    *after(c) {
      c.g.heal(c.me, c.combat.won[c.me] ? 2 : 1, "hero");
    },
  },

  "tooth-and-tail": {
    *after(c) {
      const targets = c.g
        .adjacentFightersTo(c.me)
        .filter((item) => !c.g.fighterDefeated(item.owner, item.fighter));
      const chosen = [];
      const pool = [...targets];
      while (chosen.length < 2 && pool.length) {
        let pick = pool[0];
        if (pool.length > 1 && targets.length > 2) {
          const space = yield c.g.askSpace(
            c.me,
            "promptTooth",
            pool.map((item) => c.g.fighterSpace(item.owner, item.fighter)),
          );
          pick =
            pool.find(
              (item) => c.g.fighterSpace(item.owner, item.fighter) === space,
            ) || pick;
        }
        pool.splice(pool.indexOf(pick), 1);
        chosen.push(pick);
      }
      let healed = 0;
      for (const item of chosen) {
        c.g.damage(item.owner, 1, item.fighter);
        healed += 1;
      }
      if (healed) c.g.heal(c.me, healed, "hero");
    },
  },

  "natural-toughness": {
    *after(c) {
      if (c.combat.won[c.foe]) c.combat.returnToHand[c.me] = true;
    },
  },

  "traveler-of-the-night": {
    *scheme(c) {
      yield* c.g.walk(c.me, c.me, 4, "promptMoveSpace", { through: true });
      c.g.gainAction(1);
    },
  },

  unsettle: {
    *scheme(c) {
      if (!c.g.foeInHeroZone(c.me)) return;
      let count = 1;
      if (c.g.heroHp(c.me) > 2 && c.g.handSize(c.foe) > 1) {
        const ok = yield c.g.askConfirm(c.me, "promptUnsettle");
        if (ok) {
          c.g.damage(c.me, 2, "hero");
          count = 2;
        }
      }
      for (let i = 0; i < count && c.g.handSize(c.foe); i++) {
        const ids = yield c.g.askCards(
          c.foe,
          "promptDiscardOne",
          c.g.handOf(c.foe),
          { min: 1, max: 1 },
        );
        c.g.discardFromHand(c.foe, ids[0]);
      }
    },
  },

  "sweet-christmas": {},

  "commanding-impact": {
    *after(c) {
      c.g.draw(c.me, 1);
    },
  },

  "get-paid": {
    *after(c) {
      if (c.combat.won[c.me]) c.g.draw(c.me, 2);
    },
  },

  "still-standing": {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const pile = c.g.discardOf(c.me);
      if (!pile.length) return;
      const count = Math.min(2, pile.length);
      const ids = yield c.g.askCards(c.me, "promptStillStanding", pile, {
        min: count,
        max: count,
      });
      c.g.shuffleIntoDeck(c.me, ids);
    },
  },

  "hero-for-hire": {
    canBoost: () => true,
  },

  pushback: {
    *after(c) {
      const fighter = c.combat.fighters[c.foe];
      if (c.g.fighterDefeated(c.foe, fighter)) return;
      yield* c.g.walk(c.me, c.foe, 3, "promptMoveFoe", { fighter });
    },
  },

  "daughter-of-the-dragon": {
    value: (c, value) => {
      const mine = c.combat.fighters[c.me];
      const near = c.g
        .linksOf(c.foe, c.combat.fighters[c.foe])
        .includes(c.g.fighterSpace(c.me, mine));
      return near ? 6 : value;
    },
  },

  regroup: {
    *after(c) {
      c.g.draw(c.me, c.combat.won[c.me] ? 2 : 1);
    },
  },

  "trash-talk": {
    *immediate(c) {
      cancelOpponentCard(c);
    },
    *after(c) {
      if (c.combat.won[c.me]) c.g.endTurnNow();
    },
  },

  "power-man": {
    *after(c) {
      const fighter = c.combat.fighters[c.foe];
      if (c.g.fighterDefeated(c.foe, fighter)) return;
      const trail = [];
      yield* c.g.walk(c.me, c.foe, 3, "promptMoveFoe", {
        through: true,
        fighter,
        trail,
      });
      const hit = c.g
        .fightersOf(c.foe)
        .filter(
          (other) =>
            other !== fighter && trail.includes(c.g.fighterSpace(c.foe, other)),
        );
      for (const other of [fighter, ...hit]) c.g.damage(c.foe, 1, other);
    },
  },

  "got-my-back": {
    *immediate(c) {
      yield* c.g.swapWithHeroFighter(c.me, c.combat);
    },
  },

  "skin-like-titanium": {
    *after(c) {
      if (!c.combat.won[c.foe]) return;
      const taken = c.combat.taken[c.me];
      if (taken > 0) c.g.damage(c.foe, taken, c.combat.fighters[c.foe]);
    },
  },

  "where-s-my-money": {
    *scheme(c) {
      const options = c.g.nearestFoeAdjacentSpaces(c.me);
      if (options.length) {
        const space = yield c.g.askSpace(c.me, "promptPlaceAny", options);
        if (space) c.g.placeFighter(c.me, "hero", space);
      }
      c.g.gainAction(1);
    },
  },

  "omega-level-threat": {
    *after(c) {
      if (c.combat.taken[c.foe] >= 2) c.g.discardRandom(c.foe, 2);
    },
  },

  sensational: {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const pile = c.g.discardOf(c.me);
      if (!pile.length) return;
      const ids = yield c.g.askCards(c.me, "promptSensational", pile, {
        min: 0,
        max: 1,
        skip: "gameSkip",
      });
      if (ids.length) c.g.shuffleIntoDeck(c.me, ids);
    },
  },

  "the-savage-she-hulk": {
    *immediate(c) {
      if (!c.g.hasRegularAction()) return;
      const ok = yield c.g.askConfirm(c.me, "promptSavage");
      if (!ok || !c.g.spendRegularAction()) return;
      c.combat.savage = c.combat.savage || {};
      c.combat.savage[c.me] = true;
    },
    value: (c, value) => (c.combat.savage?.[c.me] ? 9 : value),
  },

  "green-energy": {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      for (const target of c.g.adjacentFightersTo(c.me)) {
        c.g.damage(target.owner, 1, target.fighter);
      }
    },
  },

  "nerve-cluster-strike": {
    *immediate(c) {
      const foeFighter = c.combat.fighters[c.foe];
      const near = c.g
        .adjacentFightersTo(c.me)
        .some((item) => item.owner === c.foe && item.fighter === foeFighter);
      if (near) c.g.pin(c.foe, foeFighter);
    },
  },

  legalese: {
    *after(c) {
      const chooser = c.combat.won[c.me] ? c.foe : c.me;
      const pick = yield c.g.askChoice(chooser, "promptLegalese", [
        { value: "draw", label: "gameLegaleseDraw" },
        { value: "discard", label: "gameLegaleseDiscard" },
      ]);
      if (pick === "discard") {
        for (const player of [c.me, c.foe]) {
          if (!c.g.handSize(player)) continue;
          const ids = yield c.g.askCards(
            player,
            "promptDiscardOne",
            c.g.handOf(player),
            { min: 1, max: 1 },
          );
          c.g.discardFromHand(player, ids[0]);
        }
      } else {
        c.g.draw(c.me, 1);
        c.g.draw(c.foe, 1);
      }
    },
  },

  "cease-and-desist": {
    *immediate(c) {
      cancelOpponentCard(c);
    },
    value: (c, value) => (c.combat.attacker === c.me ? 4 : value),
  },

  "the-defense-rests": {
    *after(c) {
      const taken = c.combat.taken[c.me];
      if (taken > 0) c.g.draw(c.me, taken);
    },
  },

  "lady-justice": {
    *immediate(c) {
      const id = c.g.discardTopId(c.foe);
      c.combat.justice = c.combat.justice || {};
      c.combat.justice[c.me] = id ? c.g.cardBoost(id) * 2 : 0;
    },
    value: (c, value) => value + (c.combat.justice?.[c.me] || 0),
  },

  "jennifer-walters-esq": {
    *scheme(c) {
      const mine = c.g.spaceOf(c.me);
      const busy = c.g.occupiedSpaces();
      const options = c.g
        .startSpaces()
        .filter((id) => id === mine || !busy.includes(id));
      if (options.length) {
        const space = yield c.g.askSpace(c.me, "promptPlaceStart", options);
        if (space) c.g.placeFighter(c.me, "hero", space);
      }
      c.g.draw(c.me, 1);
      c.g.gainAction(1);
    },
  },

  "leap-toward": {
    *scheme(c) {
      yield* c.g.walk(c.me, c.me, 4, "promptMoveSpace", { through: true });
      const near = c.g
        .adjacentFightersTo(c.me)
        .some((item) => item.owner === c.foe);
      if (near) c.g.gainAction(1);
    },
  },

  "double-jeopardy": {
    *scheme(c) {
      c.g.draw(c.me, 2);
      c.g.heal(c.me, 2, "hero");
    },
  },

  lagniappe: {
    *immediate(c) {
      const max = Math.min(2, c.g.heroHp(c.me) - 1);
      if (max < 1) return;
      const choices = [{ value: "0", label: "gameLagniappe0" }];
      for (let n = 1; n <= max; n++) {
        choices.push({ value: String(n), label: "gameLagniappe" + n });
      }
      const pick = Number(
        yield c.g.askChoice(c.me, "promptLagniappe", choices),
      );
      if (!pick) return;
      c.g.damage(c.me, pick, "hero");
      c.g.draw(c.me, pick);
    },
  },

  "bottom-dealing": {
    *immediate(c) {
      const id = c.g.peekBottom(c.me);
      if (!id) return;
      c.g.logRevealBottom(c.me, id);
      c.combat.dealBonus = {
        ...(c.combat.dealBonus || {}),
        [c.me]: c.g.cardBoost(id),
      };
      const pick = yield c.g.askChoice(c.me, "promptBottomDealing", [
        { value: "top", label: "gameDealTop" },
        { value: "bottom", label: "gameDealBottom" },
      ]);
      if (pick === "top") c.g.bottomToTop(c.me);
    },
    value: (c, value) => value + (c.combat.dealBonus?.[c.me] || 0),
  },

  "better-together": {
    *after(c) {
      const fighter = c.combat.fighters[c.me];
      const all = c.g.fightersOf(c.me);
      if (!all.includes(fighter)) return;
      const links = c.g.linksOf(c.me, fighter);
      const mates = all.filter(
        (item) =>
          item !== fighter && links.includes(c.g.fighterSpace(c.me, item)),
      );
      if (!mates.length) return;
      c.g.heal(c.me, 1, fighter);
      for (const mate of mates) c.g.heal(c.me, 1, mate);
    },
  },

  "long-shot": {
    value: (c, value) => (c.g.adjacent(c.me, c.foe) ? value : 5),
  },

  "quite-a-pair": {
    *immediate(c) {
      const hand = c.g.handOf(c.me);
      const counts = {};
      for (const id of hand) {
        const key = c.g.cardKey(id);
        counts[key] = (counts[key] || 0) + 1;
      }
      const options = hand.filter((id) => counts[c.g.cardKey(id)] > 1);
      if (!options.length) return;
      const ids = yield c.g.askCards(c.me, "promptQuitePair", options, {
        min: 0,
        max: 2,
      });
      if (ids.length !== 2 || c.g.cardKey(ids[0]) !== c.g.cardKey(ids[1])) {
        return;
      }
      c.g.log("logQuitePair", {
        player: c.me,
        card: c.g.cardName(ids[0]),
        cardId: ids[0],
      });
      cancelOpponentCard(c);
    },
  },

  "keep-your-hands-to-yourself": {
    *after(c) {
      const mine = c.combat.fighters[c.me];
      const theirs = c.combat.fighters[c.foe];
      const savedMine = c.g.fighterOf(c.me);
      const savedTheirs = c.g.fighterOf(c.foe);
      if (c.g.fightersOf(c.me).includes(mine)) {
        c.g.setFighter(c.me, mine);
        yield* c.g.walk(
          c.me,
          c.me,
          2,
          mine === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
          { fighter: mine },
        );
      }
      if (c.g.fightersOf(c.foe).includes(theirs)) {
        c.g.setFighter(c.foe, theirs);
        yield* c.g.walk(c.me, c.foe, 2, "promptMoveFoe", {
          fighter: theirs,
        });
      }
      c.g.setFighter(c.me, savedMine);
      c.g.setFighter(c.foe, savedTheirs);
    },
  },

  "the-turn-and-the-river": {
    *after(c) {
      c.g.draw(c.me, 2);
    },
  },

  "striking-beauty": {
    *after(c) {
      const fighter = c.combat.fighters[c.foe];
      if (!c.g.fightersOf(c.foe).includes(fighter)) return;
      c.g.damage(c.foe, c.combat.won[c.me] ? 2 : 1, fighter);
    },
  },

  "slick-talker": {
    *immediate(c) {
      const all = c.g.fightersOf(c.me);
      const kid = all.find((item) => item !== "hero");
      if (!all.includes("hero") || !kid) return;
      const ok = yield c.g.askConfirm(c.me, "promptSlickTalker");
      if (!ok) return;
      c.g.swapFighterSpaces(c.me, "hero", kid);
      const next = c.combat.fighters[c.me] === "hero" ? kid : "hero";
      c.combat.fighters[c.me] = next;
      c.g.setCombatFighter(c.me, next);
    },
  },

  "mississippi-queen": {
    *immediate(c) {
      c.g.setLastStand(c.me);
    },
  },

  "captain-s-orders": {
    *scheme(c) {
      c.g.setFighter(c.me, "hero");
      yield* placeInZone(c);
      const kid = c.g.fightersOf(c.me).find((item) => item !== "hero");
      if (kid) {
        const options = c.g.zoneSpaces(c.me);
        if (options.length) {
          const space = yield c.g.askSpace(c.me, "promptPlaceFriend", options);
          if (space) c.g.placeFighter(c.me, kid, space);
        }
      }
      c.g.gainAction(1);
    },
  },

  "a-few-more-pearls": {
    *scheme(c) {
      c.g.setFighter(c.me, "hero");
      for (const item of c.g.adjacentFightersTo(c.me)) {
        if (item.owner === c.foe) c.g.damage(c.foe, 2, item.fighter);
      }
    },
  },

  "crash-landing": {
    *after(c) {
      if (c.combat.free) c.g.drawUntil(c.me, 4);
    },
  },

  "strix-salvo": {
    *after(c) {
      c.g.gainHeat(c.me, 1);
    },
    ongoing: true,
    ongoingEnd: "turnStart",
  },

  "hard-sell": {
    value: (c, value) => (c.g.heatOf(c.me) === 0 ? 5 : value),
    *after(c) {
      if (!c.combat.won[c.me]) return;
      c.g.heal(c.me, 1, "hero");
      c.g.draw(c.me, 1);
    },
  },

  "walking-hazard": {
    *after(c) {
      c.g.setFighter(c.me, "hero");
      const amount = c.combat.free ? 2 : 1;
      const near = c.g
        .adjacentFightersTo(c.me)
        .filter((item) => item.owner === c.foe);
      c.g.damage(c.me, 1, "hero");
      for (const item of near) c.g.damage(c.foe, amount, item.fighter);
    },
  },

  "jettison-fuel": {
    value: (c, value) => value + c.g.heatOf(c.me),
    *after(c) {
      c.combat.noHeat = true;
      const steps = c.g.heatOf(c.me);
      if (!steps) return;
      c.g.setFighter(c.me, "hero");
      yield* c.g.walk(c.me, c.me, steps, "promptMoveSpace", {
        fighter: "hero",
      });
    },
  },

  "rocket-jump": {
    *after(c) {
      if (c.g.heroHp(c.me) < 2) return;
      const ok = yield c.g.askConfirm(c.me, "promptRocketJump");
      if (!ok) return;
      c.g.damage(c.me, 1, "hero");
      c.g.setFighter(c.me, "hero");
      yield* c.g.walk(c.me, c.me, 4, "promptMoveSpace", { fighter: "hero" });
      c.g.draw(c.me, 1);
    },
  },

  "close-the-deal": {
    *after(c) {
      const target = c.combat.fighters[c.foe];
      if (!c.g.fightersOf(c.foe).includes(target)) return;
      const options = c.g.freeSpacesAdjacentTo(c.me, "hero");
      if (options.length) {
        const space = yield c.g.askSpace(c.me, "promptPlaceFoe", options);
        if (space) c.g.placeFighter(c.foe, target, space);
      }
      const attackCard = c.combat.cards[c.combat.attacker];
      const printed = attackCard?.value || 0;
      if (printed) c.g.damage(c.foe, printed, target);
    },
  },

  "the-most-painful-death-yet": {
    value: (c, value) => value - c.g.heatOf(c.me),
    *after(c) {
      if (c.combat.won[c.me]) return;
      c.g.damage(c.me, c.combat.taken[c.me] || 0, "hero");
      c.g.draw(c.me, 2);
    },
  },

  "fairfax-guarantee": {
    damageCap: () => 2,
    deemedWon: true,
  },

  "warranty-void": {
    *scheme(c) {
      c.g.setFighter(c.me, "hero");
      const near = c.g.adjacentFightersTo(c.me);
      for (const item of near) c.g.damage(item.owner, 2, item.fighter);
      c.g.damage(c.me, 4, "hero");
    },
  },

  "killer-deal": {
    *scheme(c) {
      const pick = yield c.g.askChoice(c.foe, "promptKillerDeal", [
        { value: "draw", label: "gameKillerDraw" },
        { value: "heat", label: "gameKillerHeat" },
      ]);
      if (pick === "draw") {
        c.g.draw(c.me, 1);
        c.g.draw(c.foe, 1);
        c.g.heal(c.me, 2, "hero");
      } else {
        c.g.draw(c.me, 1);
        c.g.gainHeat(c.me, 3);
      }
    },
  },

  "the-aid-of-morgana": {
    *after(c) {
      c.g.draw(c.me, 2);
    },
  },

  "aid-the-chosen-one": {
    *after(c) {
      if (c.combat.won[c.me]) c.g.draw(c.me, 2);
    },
  },

  "swift-strike": {
    *after(c) {
      const fighter = c.combat.fighters[c.me];
      if (!c.g.fightersOf(c.me).includes(fighter)) return;
      const saved = c.g.fighterOf(c.me);
      c.g.setFighter(c.me, fighter);
      yield* c.g.walk(
        c.me,
        c.me,
        4,
        fighter === "hero" ? "promptMoveSpace" : "promptMoveSidekick",
        { fighter },
      );
      c.g.setFighter(c.me, saved);
    },
  },

  "noble-sacrifice": {
    canBoost: () => true,
  },

  "divine-intervention": {
    *after(c) {
      if (!c.g.fightersOf(c.me).includes("hero")) return;
      const saved = c.g.fighterOf(c.me);
      c.g.setFighter(c.me, "hero");
      yield* c.g.walk(c.me, c.me, 5, "promptMoveSpace", { fighter: "hero" });
      c.g.setFighter(c.me, saved);
    },
  },

  "the-holy-grail": {
    *after(c) {
      const hp = c.g.heroHp(c.me);
      if (hp > 0 && hp <= 4) c.g.heal(c.me, 8 - hp, "hero");
    },
  },

  bewilderment: {
    *immediate(c) {
      c.g.setImmune(c.me);
    },
    *after(c) {
      const kid = c.g.fightersOf(c.me).find((item) => item !== "hero");
      if (!kid) return;
      const options = c.g.anySpaces();
      if (!options.length) return;
      const ok = yield c.g.askConfirm(c.me, "promptBewilderment");
      if (!ok) return;
      const space = yield c.g.askSpace(c.me, "promptPlaceAny", options);
      if (space) c.g.placeFighter(c.me, kid, space);
    },
  },

  "the-lady-of-the-lake": {
    *scheme(c) {
      const inDeck = c.g
        .deckOf(c.me)
        .find((id) => c.g.cardKey(id) === "excalibur");
      if (inDeck) {
        c.g.searchDeck(c.me, inDeck);
        return;
      }
      const inDiscard = c.g
        .discardOf(c.me)
        .find((id) => c.g.cardKey(id) === "excalibur");
      if (inDiscard) c.g.takeFromDiscard(c.me, inDiscard);
    },
  },

  prophecy: {
    *scheme(c) {
      const top = c.g.topCards(c.me, 4);
      if (!top.length) return;
      for (const id of top) c.g.logRevealOwn(c.me, id);
      const take = Math.min(2, top.length);
      const picked = yield c.g.askCards(c.me, "promptProphecyTake", top, {
        min: take,
        max: take,
      });
      const rest = top.filter((id) => !picked.includes(id));
      const order = [];
      while (rest.length > 1) {
        const [first] = yield c.g.askCards(c.me, "promptProphecyOrder", rest, {
          min: 1,
          max: 1,
        });
        order.push(first);
        rest.splice(rest.indexOf(first), 1);
      }
      order.push(...rest);
      c.g.prophecyTake(c.me, picked, order);
    },
  },

  "command-the-storms": {
    *scheme(c) {
      yield* c.g.moveAll(c.me, 3, false);
      const saved = c.g.fighterOf(c.foe);
      for (const fighter of c.g.fightersOf(c.foe)) {
        c.g.setFighter(c.foe, fighter);
        yield* c.g.walk(c.me, c.foe, 3, "promptMoveFoe", { fighter });
      }
      c.g.setFighter(c.foe, saved);
    },
  },

  "restless-spirits": {
    *scheme(c) {
      const kid = c.g.fightersOf(c.me).find((item) => item !== "hero");
      if (!kid) return;
      const zone = c.g.zoneSpaceIds(c.me, kid);
      const first = yield c.g.askSpace(c.me, "promptSpiritsSpace", zone);
      if (!first) return;
      const near = c.g.spaceLinks(first);
      let second = null;
      if (near.length) {
        second = yield c.g.askSpace(c.me, "promptSpiritsAdjacent", near);
      }
      const targets = c.g.foeFightersIn(c.me, [first, second].filter(Boolean));
      let defeated = false;
      for (const fighter of targets) {
        c.g.damage(c.foe, 2, fighter);
        if (c.g.fighterDefeated(c.foe, fighter)) defeated = true;
      }
      if (defeated) c.g.draw(c.me, 1);
    },
  },

  "gaze-of-stone": {
    *after(c) {
      if (!c.combat.won[c.me]) return;
      const fighter = c.combat.fighters[c.foe];
      if (!c.g.fightersOf(c.foe).includes(fighter)) return;
      c.g.damage(c.foe, 8, fighter);
    },
  },

  "the-hounds-of-mighty-zeus": {
    *after(c) {
      const saved = c.g.fighterOf(c.me);
      for (const fighter of c.g.fightersOf(c.me)) {
        if (fighter === "hero") continue;
        c.g.setFighter(c.me, fighter);
        yield* c.g.walk(c.me, c.me, 3, "promptMoveSidekick", { fighter });
      }
      c.g.setFighter(c.me, saved);
    },
  },

  snipe: {
    *after(c) {
      c.g.draw(c.me, 1);
    },
  },

  "clutching-claws": {
    *after(c) {
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

  "hiss-and-slither": {
    *after(c) {
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

  "a-momentary-glance": {
    *scheme(c) {
      const targets = c.g.fightersInHeroZone(c.me);
      if (!targets.length) return;
      const space = yield c.g.askSpace(
        c.me,
        "promptGlanceTarget",
        targets.map((item) => item.space),
      );
      const target = targets.find((item) => item.space === space) || targets[0];
      c.g.damage(target.owner, 2, target.fighter);
    },
  },

  "winged-frenzy": {
    *scheme(c) {
      yield* c.g.moveAll(c.me, 3, true);
      if (!c.g.hasDefeatedKid(c.me)) return;
      const options = c.g.reviveSpaces(c.me);
      if (!options.length) return;
      const space = yield c.g.askSpace(c.me, "promptReviveKid", options);
      c.g.reviveKid(c.me, space || options[0]);
    },
  },
};
