<template>
  <div class="ghist" @click.self="emit('close')">
    <div class="ghist-box" role="dialog" :aria-label="t('gameHistoryTitle')">
      <header class="ghist-head">
        <h3>{{ t("gameHistoryTitle") }}</h3>
        <button
          type="button"
          class="ghist-close"
          :aria-label="t('combatHide')"
          @click="emit('close')"
        >
          ✕
        </button>
      </header>
      <div class="ghist-body">
        <p v-if="!turns.length" class="ghist-empty">
          {{ t("gameHistoryEmpty") }}
        </p>
        <section v-for="turn in turns" :key="turn.key" class="ghist-turn">
          <div
            v-if="turn.head"
            class="ghist-turnhead"
            :class="'is-' + turn.head.params.player"
          >
            <span class="ghist-dot" />
            {{ plain(turn.head) }}
          </div>
          <article
            v-for="(item, index) in turn.items"
            :key="index"
            class="ghist-item"
            :class="['is-' + item.type, item.player ? 'by-' + item.player : '']"
          >
            <h4 class="ghist-title">
              <template v-for="(part, pi) in parts(item.head)" :key="pi">
                <span :class="part.cls">{{ part.text }}</span>
              </template>
            </h4>

            <div v-if="item.type === 'combat'" class="ghist-duel">
              <button
                v-if="item.att && cardOf(item.att)"
                type="button"
                class="ghist-card is-att"
                @click="emit('card', cardOf(item.att))"
              >
                <img
                  :src="cardOf(item.att).image"
                  :alt="item.att.params.card"
                />
              </button>
              <div class="ghist-score">
                <div class="ghist-vs">
                  <b>{{ item.score ? item.score.a : "-" }}</b>
                  <span>:</span>
                  <b>{{ item.score ? item.score.d : "-" }}</b>
                </div>
                <div class="ghist-result" :class="{ 'is-none': item.noDamage }">
                  {{ item.noDamage ? t("logNoDamage") : t("gameHistoryHit") }}
                </div>
              </div>
              <button
                v-if="item.def && cardOf(item.def)"
                type="button"
                class="ghist-card is-def"
                @click="emit('card', cardOf(item.def))"
              >
                <img
                  :src="cardOf(item.def).image"
                  :alt="item.def.params.card"
                />
              </button>
              <div v-else class="ghist-nodef">
                {{ t("gameNoDefense") }}
              </div>
            </div>

            <div v-else-if="item.card" class="ghist-single">
              <button
                type="button"
                class="ghist-card"
                @click="emit('card', item.card)"
              >
                <img :src="item.card.image" :alt="item.card.name" />
              </button>
            </div>

            <ul v-if="item.lines.length" class="ghist-lines">
              <li
                v-for="(line, li) in item.lines"
                :key="li"
                :class="lineClass(line)"
              >
                <template v-for="(part, pi) in parts(line)" :key="pi">
                  <span :class="part.cls">{{ part.text }}</span>
                </template>
              </li>
            </ul>
          </article>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getCard } from "../gameDecks";
import { useDraftState } from "../composables/useDraftState";

const props = defineProps({
  entries: { type: Array, required: true },
});

const emit = defineEmits(["close", "card"]);

const { t } = useDraftState();

const playerLabel = (player) =>
  t(player === "p1" ? "packPlayer1" : "packPlayer2");

const cardOf = (entry) =>
  entry?.params?.cardId ? getCard(entry.params.cardId) : null;

const LOG_PARTS = /(\{[a-zA-Z]+\})/;

function parts(entry) {
  const result = [];
  if (!entry) return result;
  for (const piece of t(entry.key).split(LOG_PARTS)) {
    const match = piece.match(/^\{([a-zA-Z]+)\}$/);
    if (!match) {
      if (piece) result.push({ text: piece });
      continue;
    }
    const name = match[1];
    const value = entry.params[name];
    if (["player", "attacker", "defender"].includes(name)) {
      result.push({ text: playerLabel(value), cls: "log-" + value });
    } else if (name === "token") {
      result.push({ text: t("token_" + value), cls: "log-name" });
    } else if (["card", "who", "hero", "src"].includes(name)) {
      result.push({ text: String(value), cls: "log-name" });
    } else {
      result.push({ text: String(value), cls: "log-num" });
    }
  }
  return result;
}

const plain = (entry) =>
  parts(entry)
    .map((part) => part.text)
    .join("");

const lineClass = (entry) => ({
  "is-damage": entry.key.startsWith("logDamage"),
  "is-reveal": entry.key.startsWith("logReveal"),
  "is-move": entry.key === "logMove",
});

const SKIP = new Set(["logRevealAttack", "logRevealDefense"]);

const turns = computed(() => {
  const list = [];
  let turn = null;
  let item = null;
  props.entries.forEach((entry, index) => {
    if (entry.key === "logTurn" || !turn) {
      turn = {
        key: index,
        head: entry.key === "logTurn" ? entry : null,
        items: [],
      };
      list.push(turn);
      item = null;
      if (entry.key === "logTurn") return;
    }
    if (entry.key === "logAttack" && entry.params.act) {
      item = {
        type: "combat",
        player: entry.params.player,
        head: entry,
        att: null,
        def: null,
        score: null,
        noDamage: false,
        lines: [],
      };
      turn.items.push(item);
      return;
    }
    if (
      entry.params.act &&
      (entry.key === "logManeuver" || entry.key === "logScheme")
    ) {
      item = {
        type: "action",
        player: entry.params.player,
        head: entry,
        card: cardOf(entry),
        lines: [],
      };
      turn.items.push(item);
      return;
    }
    if (!item) {
      item = { type: "misc", head: null, lines: [] };
      turn.items.push(item);
    }
    if (item.type === "combat") {
      if (entry.key === "logRevealAttack") {
        item.att = entry;
        return;
      }
      if (entry.key === "logRevealDefense") {
        item.def = entry;
        return;
      }
      if (entry.key === "logCombat") {
        item.score = { a: entry.params.a, d: entry.params.d };
        return;
      }
      if (entry.key === "logNoDamage") {
        item.noDamage = true;
        return;
      }
      if (entry.key === "logRevealNoDefense") return;
    }
    if (SKIP.has(entry.key) && item.type !== "combat") return;
    item.lines.push(entry);
  });
  return list.reverse().map((entry) => ({
    ...entry,
    items: [...entry.items].reverse(),
  }));
});
</script>

<style scoped>
.ghist {
  position: fixed;
  inset: 0;
  z-index: 1900;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding: 24px 12px;
  background: rgba(var(--bg-dark-rgb), 0.88);
}

.ghist-box {
  width: 100%;
  max-width: 640px;
  background: var(--bg-slate);
  border: 1px solid var(--border-medium);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
}

.ghist-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
  border-radius: 16px 16px 0 0;
  background: var(--bg-slate);
}

.ghist-head h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.ghist-close {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-medium);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-light);
  cursor: pointer;
}

.ghist-close:hover {
  background: rgba(255, 255, 255, 0.12);
}

.ghist-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 20px 22px;
}

.ghist-empty {
  margin: 0;
  color: var(--text-dim);
}

.ghist-turnhead {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--color-warning);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.ghist-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--text-dim);
}

.ghist-turnhead.is-p1 .ghist-dot {
  background: var(--color-player);
}

.ghist-turnhead.is-p2 .ghist-dot {
  background: var(--color-opponent);
}

.ghist-item {
  margin-bottom: 10px;
  padding: 12px 14px;
  border: 1px solid var(--border-light);
  border-left: 3px solid var(--border-medium);
  border-radius: 12px;
  background: rgba(var(--bg-dark-rgb), 0.55);
}

.ghist-item.by-p1 {
  border-left-color: var(--color-player);
}

.ghist-item.by-p2 {
  border-left-color: var(--color-opponent);
}

.ghist-title {
  margin: 0 0 10px;
  font-size: 0.95rem;
  font-weight: 800;
}

.ghist-item.is-misc .ghist-title {
  display: none;
}

.ghist-duel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ghist-card {
  flex: none;
  width: 84px;
  height: 118px;
  padding: 0;
  border: 2px solid var(--color-opponent);
  border-radius: 8px;
  overflow: hidden;
  background: transparent;
  cursor: zoom-in;
  transition: transform 0.15s;
}

.ghist-card:hover {
  transform: translateY(-3px);
}

.ghist-card.is-def {
  border-color: var(--color-info);
}

.ghist-single .ghist-card {
  border-color: var(--color-warning);
}

.ghist-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ghist-score {
  flex: 1;
  text-align: center;
}

.ghist-vs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 2rem;
  font-weight: 900;
}

.ghist-vs span {
  color: var(--text-dim);
}

.ghist-result {
  margin-top: 2px;
  color: #f87171;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.ghist-result.is-none {
  color: var(--text-dim);
  font-weight: 600;
  text-transform: none;
}

.ghist-nodef {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 118px;
  border: 2px dashed var(--border-medium);
  border-radius: 8px;
  color: var(--text-dim);
  font-size: 0.7rem;
  text-align: center;
}

.ghist-lines {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ghist-lines li {
  position: relative;
  padding-left: 14px;
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.35;
  white-space: pre-wrap;
}

.ghist-lines li::before {
  content: "◆";
  position: absolute;
  left: 0;
  top: 2px;
  color: var(--color-warning-dark);
  font-size: 0.55rem;
}

.ghist-lines li.is-damage {
  color: #f87171;
  font-weight: 700;
}

.ghist-lines li.is-reveal {
  color: var(--text-light);
}

.ghist-single {
  margin-bottom: 4px;
}

.log-p1 {
  color: var(--color-player);
  font-weight: 800;
}

.log-p2 {
  color: var(--color-opponent);
  font-weight: 800;
}

.log-name {
  color: var(--color-warning);
  font-weight: 700;
}

.log-num {
  color: var(--text-white);
  font-weight: 700;
}

.ghist-vs b:first-child {
  color: var(--text-white);
}

@media (max-width: 480px) {
  .ghist-card,
  .ghist-nodef {
    width: 68px;
    height: 96px;
  }

  .ghist-vs {
    font-size: 1.6rem;
  }
}
</style>
