<template>
  <div class="bot-watch container">
    <h1 class="page-main-title">{{ t("botWatchTitle") }}</h1>
    <p class="bot-watch-hint">{{ t("botWatchHint") }}</p>

    <section v-if="!running" class="bot-watch-panel bot-watch-setup">
      <label class="bot-watch-field">
        <span>{{ t("botWatchHeroA") }}</span>
        <select v-model="heroA">
          <option v-for="item in everyHero" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </label>
      <label class="bot-watch-field">
        <span>{{ t("botWatchHeroB") }}</span>
        <select v-model="heroB">
          <option v-for="item in everyHero" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </label>
      <label class="bot-watch-field">
        <span>{{ t("botWatchMap") }}</span>
        <select v-model="mapId">
          <option v-for="item in gameMaps" :key="item.id" :value="item.id">
            {{ item.name }}
          </option>
        </select>
      </label>
      <button
        type="button"
        class="bot-watch-btn is-main"
        :disabled="heroA === heroB"
        @click="start"
      >
        {{ t("botWatchStart") }}
      </button>
    </section>

    <template v-else>
      <section class="bot-watch-panel bot-watch-bar">
        <label class="bot-watch-field">
          <span>{{ t("botWatchPause") }}</span>
          <select v-model="pauseOn">
            <option value="every">{{ t("botWatchEvery") }}</option>
            <option value="attack">{{ t("botWatchAttacks") }}</option>
            <option value="never">{{ t("botWatchNever") }}</option>
          </select>
        </label>
        <label class="bot-watch-field">
          <span>{{ t("botWatchDelay") }}</span>
          <input v-model.number="delay" type="range" min="50" max="1500" />
        </label>
        <span class="bot-watch-turn">
          {{ t("botWatchTurn") }} {{ game.turnNo }} ·
          {{ seatLabel(game.turn) }} · {{ t("botWatchActions") }}
          {{ game.actions }}
        </span>
        <button type="button" class="bot-watch-btn" @click="stop">
          {{ t("botWatchStop") }}
        </button>
      </section>

      <div v-if="game.phase === 'over'" class="bot-watch-over">
        {{ t("botWatchOver") }} · {{ t("botWatchWinner") }}:
        {{ seatLabel(game.winner) }}
      </div>

      <GameBoard
        :map="map"
        :players="game.players"
        :options="[]"
        :active="null"
        :fx="game.fx"
        :tokens="game.tokens"
        :hide-heroes="game.phase === 'startpick'"
        @select="() => {}"
      />

      <section v-if="proposal" class="bot-watch-panel bot-watch-decision">
        <h3>
          {{ t("botWatchDecision") }} · {{ seatLabel(proposal.seat) }} ·
          {{ t("botWatchTurn") }} {{ game.turnNo }}
        </h3>
        <div class="bot-watch-options">
          <button
            v-for="row in proposal.rows"
            :key="row.action"
            type="button"
            class="bot-watch-option"
            :class="{
              'is-picked': row.action === proposal.action,
              'is-bot': row.action === proposal.botAction,
            }"
            @click="proposal.action = row.action"
          >
            <b>{{ actionLabel(row.action) }}</b>
            <span>{{ row.score.toFixed(1) }}</span>
          </button>
        </div>
        <textarea
          v-model="note"
          class="bot-watch-note"
          :placeholder="t('botWatchNote')"
          rows="2"
        ></textarea>
        <div class="bot-watch-buttons">
          <button type="button" class="bot-watch-btn is-main" @click="accept">
            {{
              proposal.action === proposal.botAction
                ? t("botWatchOk")
                : t("botWatchOther")
            }}
          </button>
          <button
            type="button"
            class="bot-watch-btn"
            :disabled="!note && proposal.action === proposal.botAction"
            @click="remark"
          >
            {{ t("botWatchSaveNote") }}
          </button>
        </div>
      </section>

      <div class="bot-watch-hands">
        <section
          v-for="seat in ['p1', 'p2']"
          :key="seat"
          class="bot-watch-panel"
        >
          <h3>
            {{ seatLabel(seat) }} · {{ game.players[seat].hp }}/{{
              game.players[seat].maxHp
            }}
            <span v-for="kid in kidsOf(seat)" :key="kid.id" class="kid">
              · {{ kid.hp }}
            </span>
          </h3>
          <div class="bot-watch-meta">
            {{ t("botWatchDeck") }}: {{ game.players[seat].deck.length }} ·
            {{ t("botWatchHand") }}: {{ handCards(seat).length }}
          </div>
          <ul class="bot-watch-cards">
            <li v-for="(card, index) in handCards(seat)" :key="index">
              <b>{{ card.name }}</b>
              <span>
                {{ card.type || "scheme" }}
                <template
                  v-if="card.value !== null && card.value !== undefined"
                >
                  {{ card.value }}
                </template>
                <template v-if="card.boost"> +{{ card.boost }}</template>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <section class="bot-watch-panel">
      <h3>{{ t("botWatchRemarks") }}</h3>
      <p v-if="!remarks.length" class="bot-watch-meta">
        {{ t("botWatchNoRemarks") }}
      </p>
      <ul v-else class="bot-watch-remarks">
        <li v-for="(item, index) in remarks" :key="index">
          <b>{{ item.hero }} · {{ item.turn }}</b>
          {{ item.botAction
          }}<template v-if="item.userAction !== item.botAction">
            → {{ item.userAction }}</template
          >
          <i v-if="item.note"> — {{ item.note }}</i>
        </li>
      </ul>
      <div class="bot-watch-buttons">
        <button
          type="button"
          class="bot-watch-btn"
          :disabled="!remarks.length"
          @click="copy"
        >
          {{ copied ? t("botWatchCopied") : t("botWatchCopy") }}
        </button>
        <button
          type="button"
          class="bot-watch-btn"
          :disabled="!remarks.length"
          @click="clearRemarks"
        >
          {{ t("botWatchClear") }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { useGame } from "../../composables/useGame.js";
import { useBot } from "../../composables/useBot.js";
import { gameMaps } from "../../gameMaps.js";
import { getCard } from "../../gameDecks.js";
import {
  buildAllCards,
  buildCustomCards,
  everyHero,
} from "../../packDraftData.js";
import GameBoard from "../GameBoard.vue";

const { t } = useDraftState();
const engine = useGame();
const { game, map } = engine;
const bots = {
  p1: useBot({ manual: true }),
  p2: useBot({ manual: true }),
};

const STORE = "unmatched-bot-watch-remarks";
const heroA = ref(everyHero[0].id);
const heroB = ref(everyHero[1].id);
const mapId = ref(gameMaps[0].id);
const running = ref(false);
const pauseOn = ref("every");
const delay = ref(400);
const proposal = ref(null);
const note = ref("");
const copied = ref(false);

const loadRemarks = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "[]");
  } catch {
    return [];
  }
};
const remarks = ref(loadRemarks());
const saveRemarks = () => {
  try {
    localStorage.setItem(STORE, JSON.stringify(remarks.value));
  } catch {
    remarks.value = [...remarks.value];
  }
};

let timer = null;
const cards = [...buildAllCards(), ...buildCustomCards()];

const seatLabel = (seat) => {
  if (!seat || !game.players[seat]) return "";
  const hero = everyHero.find((item) => item.id === game.players[seat].heroId);
  return `${seat === "p1" ? "P1" : "P2"} ${hero?.name ?? ""}`;
};
const actionLabel = (action) =>
  t(
    action === "attack"
      ? "botWatchAttack"
      : action === "scheme"
        ? "botWatchScheme"
        : "botWatchManeuver",
  );
const kidsOf = (seat) =>
  (game.players[seat]?.sidekicks || []).filter((kid) => !kid.unplaced);
const handCards = (seat) =>
  (game.players[seat]?.hand || []).map((id) => getCard(id)).filter(Boolean);

const clearTimer = () => {
  clearTimeout(timer);
  timer = null;
};

const schedule = (ms = delay.value) => {
  clearTimer();
  if (running.value) timer = setTimeout(tick, ms);
};

const tick = () => {
  timer = null;
  if (!running.value || proposal.value) return;
  try {
    if (game.phase === "over") return;
    if (game.phase === "startpick") {
      for (const seat of ["p1", "p2"]) {
        game.bot = seat;
        bots[seat].step();
      }
      schedule();
      return;
    }
    if (game.phase !== "play") {
      schedule();
      return;
    }
    if (game.prompt && game.prompt.kind === "info" && !game.prompt.player) {
      engine.answerPrompt();
      schedule();
      return;
    }
    const seat = game.prompt?.player || game.turn;
    game.bot = seat;
    if (!game.prompt && pauseOn.value !== "never") {
      const found = bots[seat].propose(seat);
      if (found) {
        const rows = (found.found.scores || []).map(([action, score]) => ({
          action,
          score,
        }));
        const stop =
          pauseOn.value === "every" || found.found.action === "attack";
        if (stop) {
          note.value = "";
          proposal.value = {
            seat,
            rows,
            action: found.found.action,
            botAction: found.found.action,
          };
          return;
        }
      }
    }
    bots[seat].step();
  } catch (error) {
    console.error(error);
  }
  schedule();
};

const start = () => {
  const deck = (id) => cards.filter((c) => c.heroId === id).map((c) => c.id);
  const mk = (id, name) => ({ id: name, name, heroId: id, cardIds: deck(id) });
  engine.setMap(mapId.value);
  engine.startGame(mk(heroA.value, "a"), mk(heroB.value, "b"));
  for (const p of ["p1", "p2"]) engine.chooseMulligan(false, p);
  engine.continueMulligan();
  proposal.value = null;
  running.value = true;
  schedule(200);
};

const stop = () => {
  running.value = false;
  proposal.value = null;
  clearTimer();
  game.bot = null;
};

const addRemark = () => {
  const p = proposal.value;
  remarks.value.push({
    hero: seatLabel(p.seat),
    turn: `${t("botWatchTurn")} ${game.turnNo}`,
    botAction: actionLabel(p.botAction),
    userAction: actionLabel(p.action),
    note: note.value.trim(),
    state: {
      map: game.mapId,
      hp: { p1: game.players.p1.hp, p2: game.players.p2.hp },
      hands: {
        p1: handCards("p1").map((c) => c.name),
        p2: handCards("p2").map((c) => c.name),
      },
    },
  });
  saveRemarks();
};

const remark = () => {
  if (!proposal.value) return;
  addRemark();
  note.value = "";
};

const accept = () => {
  const p = proposal.value;
  if (!p) return;
  if (note.value.trim() || p.action !== p.botAction) addRemark();
  game.bot = p.seat;
  if (p.action !== p.botAction) bots[p.seat].choose(p.action);
  proposal.value = null;
  note.value = "";
  try {
    bots[p.seat].step();
  } catch (error) {
    console.error(error);
  }
  schedule();
};

const copy = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(remarks.value, null, 2));
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    copied.value = false;
  }
};

const clearRemarks = () => {
  remarks.value = [];
  saveRemarks();
};

onBeforeUnmount(() => {
  clearTimer();
  running.value = false;
  game.bot = null;
});
</script>

<style scoped>
.bot-watch {
  padding-bottom: 40px;
}

.bot-watch-hint {
  color: var(--text-muted, #888);
  margin-bottom: 16px;
}

.bot-watch-panel {
  border: 1px solid var(--border, rgba(128, 128, 128, 0.35));
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
}

.bot-watch-setup,
.bot-watch-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-end;
}

.bot-watch-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
}

.bot-watch-field select,
.bot-watch-note {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--border, rgba(128, 128, 128, 0.5));
  background: transparent;
  color: inherit;
  font: inherit;
}

.bot-watch-note {
  width: 100%;
  margin: 10px 0;
  resize: vertical;
}

.bot-watch-btn {
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid var(--border, rgba(128, 128, 128, 0.5));
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.bot-watch-btn.is-main {
  background: var(--accent, #c0392b);
  border-color: var(--accent, #c0392b);
  color: #fff;
}

.bot-watch-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.bot-watch-turn {
  flex: 1;
  font-size: 0.9rem;
}

.bot-watch-over {
  margin-bottom: 12px;
  font-weight: 700;
}

.bot-watch-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bot-watch-option {
  display: flex;
  gap: 8px;
  align-items: baseline;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border, rgba(128, 128, 128, 0.5));
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.bot-watch-option.is-bot {
  border-style: dashed;
}

.bot-watch-option.is-picked {
  border-color: var(--accent, #c0392b);
  box-shadow: 0 0 0 1px var(--accent, #c0392b);
}

.bot-watch-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.bot-watch-hands {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.bot-watch-meta {
  font-size: 0.85rem;
  opacity: 0.75;
  margin-bottom: 8px;
}

.bot-watch-cards,
.bot-watch-remarks {
  list-style: none;
  margin: 0 0 10px;
  padding: 0;
}

.bot-watch-cards li {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 3px 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  font-size: 0.9rem;
}

.bot-watch-remarks li {
  padding: 4px 0;
  font-size: 0.9rem;
}
</style>
