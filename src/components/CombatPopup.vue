<template>
  <div class="combat-wrap">
    <button v-if="!open" type="button" class="combat-pill" @click="open = true">
      <svg class="combat-eye" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z"
        />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
      {{ t("combatShow") }}
    </button>

    <div v-else class="combat">
      <div class="combat-head">
        <span class="combat-title">⚔ {{ t("gameReveal") }}</span>
        <span class="combat-stage">{{ stageText }}</span>
        <button
          type="button"
          class="combat-hide"
          :title="t('combatHide')"
          :aria-label="t('combatHide')"
          @click="open = false"
        >
          <svg class="combat-eye" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z"
            />
            <circle cx="12" cy="12" r="3.2" />
          </svg>
        </button>
      </div>

      <div class="combat-body">
        <div
          v-for="side in sides"
          :key="side.role"
          class="combat-side"
          :class="'is-' + side.player"
        >
          <div class="combat-who">
            <img
              v-if="heroOf(side.player).image"
              class="combat-avatar"
              :src="heroOf(side.player).image"
              :alt="heroOf(side.player).name"
            />
            <div class="combat-who-text">
              <div class="combat-role">
                {{
                  t(side.role === "attacker" ? "gameAttacker" : "gameDefender")
                }}
                · {{ playerLabel(side.player) }}
              </div>
              <div class="combat-hero">{{ heroOf(side.player).name }}</div>
              <div class="combat-hp">
                <span class="combat-heart">❤</span>
                {{ players[side.player].hp }}
                <span class="combat-hp-max"
                  >/ {{ players[side.player].maxHp }}</span
                >
              </div>
            </div>
          </div>

          <div class="combat-slot" :class="slotClass(side)">
            <PackCard v-if="cardFor(side)" :card="cardFor(side)" />
            <div v-else-if="isPending(side)" class="combat-ph">
              {{ t("combatChoosing") }}
            </div>
            <div v-else-if="isNoDefense(side)" class="combat-ph">
              {{ t("combatNoDefense") }}
            </div>
            <img
              v-else-if="coverFor(side)"
              class="combat-cover"
              :src="coverFor(side)"
              :alt="t('combatFaceDown')"
            />
            <div v-else class="combat-back">
              <span>UNMATCHED</span>
            </div>
          </div>

          <div class="combat-tags">
            <span v-if="combat.revealed[side.player]" class="combat-tag">
              {{ t("combatFaceUp") }}
            </span>
            <span v-if="combat.boost[side.player]" class="combat-tag is-boost">
              ⚡ {{ t("combatBoosted") }}
            </span>
            <span
              v-if="previewFor(side) && !combat.cardIds[side.player]"
              class="combat-tag is-pick"
            >
              {{ t("combatYourPick") }}
            </span>
          </div>
        </div>
      </div>

      <p v-if="combat.announcedValue !== null" class="combat-spidey">
        {{ t("combatSpidey").replace("{n}", combat.announcedValue) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { getCard, getHero } from "../gameDecks";
import { coverImage } from "../packDraftData";
import PackCard from "./PackCard.vue";

const props = defineProps({
  combat: { type: Object, required: true },
  players: { type: Object, required: true },
  // Чий екран: власну закриту карту показуємо лише власнику.
  viewer: { type: String, required: true },
  // Карта, яку гравець зараз обирає в руці (ще не підтверджена).
  preview: { type: String, default: null },
});

const { t } = useDraftState();
const open = ref(true);

const heroOf = (player) => getHero(props.players[player].heroId);
const playerLabel = (player) =>
  t(player === "p1" ? "packPlayer1" : "packPlayer2");

const sides = computed(() => [
  { role: "attacker", player: props.combat.attacker },
  { role: "defender", player: props.combat.defender },
]);

const previewFor = (side) =>
  side.role === "defender" &&
  props.combat.defense === "pending" &&
  side.player === props.viewer &&
  props.preview
    ? props.preview
    : null;

function cardFor(side) {
  const id =
    props.combat.revealed[side.player] ||
    (side.player === props.viewer ? props.combat.cardIds[side.player] : null) ||
    previewFor(side);
  return id ? getCard(id) : null;
}

// Обкладинка залежить від карти (з якого героя вона), а не від героя гравця.
const coverFor = (side) =>
  coverImage(
    props.combat.covers?.[side.player] || props.players[side.player].heroId,
  );

const isPending = (side) =>
  side.role === "defender" && props.combat.defense === "pending";
const isNoDefense = (side) =>
  side.role === "defender" && props.combat.defense === "none";

const slotClass = (side) => ({
  "is-empty": isPending(side) || isNoDefense(side),
  "is-preview": Boolean(previewFor(side)),
});

const stageText = computed(() => {
  const stage = props.combat.stage;
  if (stage === "defense") {
    return t("combatStageDefense").replace(
      "{player}",
      playerLabel(props.combat.defender),
    );
  }
  const keys = {
    immediate: "combatStageImmediate",
    boost: "combatStageBoost",
    reveal: "combatStageReveal",
    after: "combatStageAfter",
  };
  return keys[stage] ? t(keys[stage]) : "";
});
</script>

<style scoped>
.combat-wrap {
  position: absolute;
  top: 10px;
  left: 50%;
  z-index: 15;
  width: min(96%, 680px);
  transform: translateX(-50%);
  pointer-events: none;
}

.combat-wrap > * {
  pointer-events: auto;
}

.combat-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 auto;
  padding: 11px 24px;
  border: 2px solid var(--color-warning);
  border-radius: 999px;
  background: rgba(var(--bg-dark-rgb), 0.95);
  color: var(--text-white);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  animation: combat-pill-pulse 1.8s ease-in-out infinite;
}

.combat-pill:hover {
  background: var(--color-warning);
  color: #111827;
}

.combat-pill .combat-eye {
  width: 22px;
  height: 22px;
}

.combat-eye {
  display: block;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@keyframes combat-pill-pulse {
  50% {
    box-shadow: 0 8px 28px rgba(250, 204, 21, 0.45);
  }
}

.combat {
  padding: 10px 12px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 14px;
  background: rgba(var(--bg-dark-rgb), 0.93);
  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
}

.combat-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.combat-title {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--color-warning);
}

.combat-stage {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--text-muted);
}

.combat-hide {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
}

.combat-hide:hover {
  color: var(--text-white);
  border-color: var(--text-muted);
}

.combat-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.combat-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--border-medium);
  background: rgba(var(--bg-slate-rgb), 0.5);
}

.combat-side.is-p1 {
  border-color: rgba(var(--color-player-rgb), 0.6);
}

.combat-side.is-p2 {
  border-color: rgba(var(--color-opponent-rgb), 0.6);
}

.combat-who {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.combat-avatar {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  object-fit: cover;
  object-position: top;
  border: 2px solid var(--border-strong);
}

.combat-side.is-p1 .combat-avatar {
  border-color: var(--color-player);
}

.combat-side.is-p2 .combat-avatar {
  border-color: var(--color-opponent);
}

.combat-who-text {
  min-width: 0;
}

.combat-role {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.combat-hero {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.combat-hp {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-white);
}

.combat-heart {
  color: var(--color-danger);
}

.combat-hp-max {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-dim);
}

/* зона карти: велика, щоб було видно атаку/захист */
.combat-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, 150px);
  min-height: 190px;
}

.combat-slot :deep(.pack-card) {
  width: 100%;
}

.combat-slot.is-empty {
  border: 2px dashed var(--border-strong);
  border-radius: 12px;
}

.combat-slot.is-preview :deep(.pack-card) {
  outline: 2px dashed var(--color-warning);
  outline-offset: 3px;
  border-radius: 10px;
}

.combat-ph {
  padding: 8px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
}

.combat-cover {
  width: 100%;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
}

.combat-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 5 / 7;
  border: 2px solid var(--border-strong);
  border-radius: 10px;
  background:
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.05) 0 8px,
      transparent 8px 16px
    ),
    linear-gradient(160deg, #1e293b, #0f172a);
}

.combat-back span {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--text-dim);
  transform: rotate(-90deg);
}

.combat-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  min-height: 22px;
}

.combat-tag {
  padding: 2px 9px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  font-size: 11px;
  font-weight: 800;
  color: var(--text-muted);
}

.combat-tag.is-boost {
  border-color: var(--color-warning);
  color: var(--color-warning);
  background: rgba(250, 204, 21, 0.12);
}

.combat-tag.is-pick {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.combat-spidey {
  margin: 10px 0 0;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(var(--color-info-rgb), 0.5);
  background: rgba(var(--color-info-rgb), 0.12);
  color: var(--text-light);
  font-size: 12.5px;
  font-weight: 700;
  text-align: center;
}

@media (max-width: 575px) {
  .combat-slot {
    min-height: 150px;
  }
  .combat-avatar {
    width: 38px;
    height: 38px;
  }
}
</style>
