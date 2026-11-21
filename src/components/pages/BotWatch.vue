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
        <input v-model="oracleA" type="checkbox" />
        <span>{{ t("botWatchOracleA") }}</span>
      </label>
      <label class="bot-watch-field">
        <input v-model="oracleB" type="checkbox" />
        <span>{{ t("botWatchOracleB") }}</span>
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
            <option value="cards">{{ t("botWatchAttacks") }}</option>
            <option value="actions">{{ t("botWatchActionsOnly") }}</option>
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
        :options="spaceOptions"
        :marks="spaceMarks"
        :active="null"
        :fx="game.fx"
        :tokens="game.tokens"
        :hide-heroes="game.phase === 'startpick'"
        @select="pickSpace"
      />

      <section
        v-if="proposal"
        class="bot-watch-panel bot-watch-decision"
        :class="'is-' + proposal.seat"
      >
        <h3>
          {{ seatLabel(proposal.seat) }} · {{ t("botWatchTurn") }}
          {{ game.turnNo }}
        </h3>
        <p class="bot-watch-question">{{ question }}</p>

        <div v-if="proposal.kind === 'action'" class="bot-watch-options">
          <button
            v-for="row in proposal.rows"
            :key="row.action"
            type="button"
            class="bot-watch-option"
            :class="{
              'is-picked': row.action === proposal.mine,
              'is-bot': row.action === proposal.bot,
            }"
            @click="proposal.mine = row.action"
          >
            <b>{{ actionLabel(row.action) }}</b>
            <span>{{ row.score.toFixed(1) }}</span>
            <small v-if="row.action === proposal.bot">
              {{ t("botWatchBot") }}
            </small>
          </button>
        </div>

        <template v-else-if="proposal.kind === 'cards'">
          <div class="bot-watch-cardrow">
            <div
              v-for="(card, index) in proposalCards"
              :key="card.id + index"
              class="bot-watch-card"
            >
              <PackCard
                :card="card"
                :selected="proposal.mine.includes(card.id)"
                :clickable="true"
                @select="toggleCard(card.id)"
              >
                <template #overlay>
                  <span
                    v-if="proposal.bot.includes(card.id)"
                    class="bot-watch-badge"
                  >
                    BOT
                  </span>
                </template>
              </PackCard>
            </div>
            <span v-if="!proposalCards.length" class="bot-watch-meta">
              {{ t("botWatchEmptyHand") }}
            </span>
          </div>
          <div class="bot-watch-meta">
            {{ proposal.mine.length }}/{{ proposal.max }}
            <button
              v-if="!proposal.min"
              type="button"
              class="bot-watch-btn"
              @click="proposal.mine = []"
            >
              {{ t("botWatchStay") }}
            </button>
          </div>
        </template>

        <template v-else-if="proposal.kind === 'space'">
          <div class="bot-watch-pickline">
            <span>
              {{ t("botWatchBot") }}:
              <b>{{ describe(proposal.bot) }}</b>
            </span>
            <span>
              {{ t("botWatchMine") }}:
              <b>{{ describe(proposal.mine) }}</b>
            </span>
            <button type="button" class="bot-watch-btn" @click="skipSpace">
              {{ t("botWatchStay") }}
            </button>
          </div>
          <div v-if="proposalBoosts.length" class="bot-watch-cardrow">
            <div
              v-for="card in proposalBoosts"
              :key="card.id"
              class="bot-watch-card"
            >
              <PackCard
                :card="card"
                :selected="proposal.mine && proposal.mine.boost === card.id"
                :clickable="true"
                @select="proposal.mine = { boost: card.id }"
              >
                <template #overlay>
                  <span
                    v-if="proposal.bot && proposal.bot.boost === card.id"
                    class="bot-watch-badge"
                  >
                    BOT
                  </span>
                </template>
              </PackCard>
            </div>
          </div>
        </template>

        <div v-else class="bot-watch-options">
          <button
            v-for="row in proposal.rows"
            :key="String(row.value)"
            type="button"
            class="bot-watch-option"
            :class="{
              'is-picked': row.value === proposal.mine,
              'is-bot': row.value === proposal.bot,
            }"
            @click="proposal.mine = row.value"
          >
            <b>{{ row.label }}</b>
            <small v-if="row.value === proposal.bot">
              {{ t("botWatchBot") }}
            </small>
          </button>
        </div>

        <textarea
          v-model="note"
          class="bot-watch-note"
          :placeholder="t('botWatchNote')"
          rows="2"
        ></textarea>

        <label v-if="canTeach" class="bot-watch-teach">
          <input v-model="teach" type="checkbox" />
          {{ t("botWatchTeach") }}
          <small>{{ t("botWatchTeachHint") }}</small>
        </label>

        <div class="bot-watch-buttons">
          <button type="button" class="bot-watch-btn is-main" @click="accept">
            {{ changed ? t("botWatchApply") : t("botWatchOk") }}
          </button>
          <button
            type="button"
            class="bot-watch-btn"
            :disabled="!note && !changed"
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
          :class="'is-' + seat"
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
            {{ t("botWatchHandOf") }}: {{ handCards(seat).length }}
          </div>
          <div class="bot-watch-cardrow is-small">
            <div
              v-for="(card, index) in handCards(seat)"
              :key="card.id + index"
              class="bot-watch-card"
            >
              <PackCard :card="card" />
            </div>
            <span v-if="!handCards(seat).length" class="bot-watch-meta">
              {{ t("botWatchEmptyHand") }}
            </span>
          </div>
        </section>
      </div>
    </template>

    <section class="bot-watch-panel">
      <h3>{{ t("botWatchLessons") }}</h3>
      <p v-if="!lessons.length" class="bot-watch-meta">
        {{ t("botWatchNoLessons") }}
      </p>
      <ul v-else class="bot-watch-remarks">
        <li v-for="lesson in lessons" :key="lessonText(lesson)">
          {{ lessonText(lesson) }}
          <button
            type="button"
            class="bot-watch-link"
            @click="dropLesson(lesson)"
          >
            {{ t("botWatchRemove") }}
          </button>
        </li>
      </ul>
    </section>

    <section class="bot-watch-panel">
      <h3>{{ t("botWatchRemarks") }}</h3>
      <p v-if="!remarks.length" class="bot-watch-meta">
        {{ t("botWatchNoRemarks") }}
      </p>
      <ul v-else class="bot-watch-remarks">
        <li v-for="(item, index) in remarks" :key="index">
          <b>{{ item.hero }} · {{ item.turn }}</b>
          {{ item.question }}: {{ item.bot }}
          <template v-if="item.mine !== item.bot"> → {{ item.mine }}</template>
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
import { computed, onBeforeUnmount, ref } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { useGame } from "../../composables/useGame.js";
import { useBot } from "../../composables/useBot.js";
import { validReply } from "../../composables/botSearch.js";
import { addLessons, cardId, loadBotData, removeLesson } from "../../botData";
import { gameMaps } from "../../gameMaps.js";
import { getCard } from "../../gameDecks.js";
import {
  buildAllCards,
  buildCustomCards,
  everyHero,
} from "../../packDraftData.js";
import GameBoard from "../GameBoard.vue";
import PackCard from "../PackCard.vue";

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
const oracleA = ref(false);
const oracleB = ref(false);
const mapId = ref(gameMaps[0].id);
const running = ref(false);
const pauseOn = ref("every");
const delay = ref(400);
const proposal = ref(null);
const note = ref("");
const teach = ref(false);
const copied = ref(false);
const lessons = ref(loadBotData().lessons || []);

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
const cardNames = new Map(cards.map((card) => [cardId(card), card.name]));

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

const sameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const describe = (value) => {
  if (value === null || value === undefined) return t("botWatchStay");
  if (typeof value === "object" && !Array.isArray(value)) {
    return `${getCard(value.boost)?.name ?? value.boost}`;
  }
  return String(value);
};

const describeAnswer = (item) => {
  if (!item) return "";
  if (item.kind === "action") return actionLabel(item.value);
  if (item.kind === "cards") {
    return item.value.length
      ? item.value.map((id) => getCard(id)?.name ?? id).join(", ")
      : t("botWatchStay");
  }
  if (item.kind === "space") return describe(item.value);
  if (item.kind === "confirm") {
    return item.value ? t("botWatchYes") : t("botWatchNo");
  }
  const row = item.rows?.find((entry) => entry.value === item.value);
  return row ? row.label : String(item.value);
};

const questionOf = (item) => {
  if (item.kind === "action") return t("botWatchPickAction");
  if (item.kind === "space")
    return `${t(item.title)} — ${t("botWatchPickZone")}`;
  if (item.kind === "cards")
    return `${t(item.title)} — ${t("botWatchPickCards")}`;
  return `${t(item.title)} — ${t("botWatchPickAnswer")}`;
};

const question = computed(() =>
  proposal.value ? questionOf(proposal.value) : "",
);

const proposalCards = computed(() =>
  proposal.value?.kind === "cards"
    ? proposal.value.options.map((id) => getCard(id)).filter(Boolean)
    : [],
);
const proposalBoosts = computed(() =>
  proposal.value?.kind === "space"
    ? (proposal.value.boostOptions || [])
        .map((id) => getCard(id))
        .filter(Boolean)
    : [],
);
const spaceOptions = computed(() =>
  proposal.value?.kind === "space" ? proposal.value.options : [],
);
const spaceMarks = computed(() => {
  const p = proposal.value;
  if (!p || p.kind !== "space") return {};
  const out = {};
  if (typeof p.bot === "string") out[p.bot] = "bot";
  if (typeof p.mine === "string") {
    out[p.mine] = out[p.mine] ? "both" : "mine";
  }
  return out;
});

const changed = computed(() => {
  const p = proposal.value;
  return Boolean(p) && !sameValue(p.mine, p.bot);
});

const canTeach = computed(() => {
  const p = proposal.value;
  return Boolean(p) && p.kind === "cards" && changed.value;
});

const pickSpace = (id) => {
  if (proposal.value?.kind === "space") proposal.value.mine = id;
};
const skipSpace = () => {
  if (proposal.value?.kind === "space") proposal.value.mine = null;
};

const toggleCard = (id) => {
  const p = proposal.value;
  if (!p || p.kind !== "cards") return;
  if (p.mine.includes(id)) {
    p.mine = p.mine.filter((item) => item !== id);
  } else if (p.max <= 1) {
    p.mine = [id];
  } else if (p.mine.length < p.max) {
    p.mine = [...p.mine, id];
  }
};

const wantsPause = (prompt) => {
  if (pauseOn.value === "every") return true;
  if (pauseOn.value === "cards") return prompt.kind === "cards";
  return false;
};

const openPrompt = (seat, prompt, reply) => {
  const rows =
    prompt.kind === "choice"
      ? prompt.choices.map((item) => ({
          value: item.value,
          label: item.label ? t(item.label) : String(item.value),
        }))
      : prompt.kind === "confirm"
        ? [
            { value: true, label: t("botWatchYes") },
            { value: false, label: t("botWatchNo") },
          ]
        : [];
  note.value = "";
  teach.value = false;
  proposal.value = {
    kind: prompt.kind,
    seat,
    title: prompt.title,
    options: prompt.options ? [...prompt.options] : [],
    boostOptions: prompt.boostOptions ? [...prompt.boostOptions] : [],
    choices: prompt.choices ? prompt.choices.map((item) => ({ ...item })) : [],
    min: prompt.min ?? 0,
    max: prompt.max ?? 1,
    rows,
    bot: reply,
    mine: Array.isArray(reply) ? [...reply] : reply,
  };
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
    const prompt = game.prompt;
    const seat = prompt?.player || game.turn;
    game.bot = seat;
    if (prompt && prompt.player && wantsPause(prompt)) {
      const found = bots[seat].preview(seat);
      if (found && validReply(prompt, found.reply)) {
        openPrompt(seat, prompt, found.reply);
        return;
      }
    }
    if (!prompt && pauseOn.value !== "never") {
      const found = bots[seat].propose(seat);
      if (found) {
        const rows = (found.found.scores || []).map(([action, score]) => ({
          action,
          score,
        }));
        {
          note.value = "";
          teach.value = false;
          proposal.value = {
            kind: "action",
            seat,
            title: "botWatchPickAction",
            rows,
            bot: found.found.action,
            mine: found.found.action,
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
  game.oracle = { p1: oracleA.value, p2: oracleB.value };
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

const positions = () => {
  const out = {};
  for (const seat of ["p1", "p2"]) {
    const state = game.players[seat];
    out[seat] = {
      hero: state.space,
      sidekicks: kidsOf(seat).map((kid) => kid.space),
      hp: state.hp,
    };
  }
  return out;
};

const addRemark = () => {
  const p = proposal.value;
  remarks.value.push({
    hero: seatLabel(p.seat),
    turn: `${t("botWatchTurn")} ${game.turnNo}`,
    question: t(p.title),
    title: p.title,
    options:
      p.kind === "cards"
        ? p.options.map((id) => getCard(id)?.name ?? id)
        : p.options,
    bot: describeAnswer({ ...p, value: p.bot }),
    mine: describeAnswer({ ...p, value: p.mine }),
    note: note.value.trim(),
    state: {
      map: game.mapId,
      positions: positions(),
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

const keyOf = (id) => {
  const card = getCard(id);
  return card ? cardId(card) : null;
};

const learn = (p) => {
  const hero = game.players[p.seat]?.heroId;
  const added = p.mine.filter((id) => !p.bot.includes(id));
  const removed = p.bot.filter((id) => !p.mine.includes(id));
  const items = [];
  if (p.max <= 1 && added.length === 1 && removed.length === 1) {
    items.push({
      kind: "prefer",
      hero,
      title: p.title,
      better: keyOf(added[0]),
      worse: keyOf(removed[0]),
    });
  } else {
    for (const id of added) {
      items.push({
        kind: "use",
        hero,
        title: p.title,
        card: keyOf(id),
        use: true,
      });
    }
    for (const id of removed) {
      items.push({
        kind: "use",
        hero,
        title: p.title,
        card: keyOf(id),
        use: false,
      });
    }
  }
  const valid = items.filter((item) =>
    item.kind === "prefer" ? item.better && item.worse : item.card,
  );
  if (valid.length) addLessons(valid);
  lessons.value = loadBotData().lessons || [];
};

const accept = () => {
  const p = proposal.value;
  if (!p) return;
  if (note.value.trim() || changed.value) addRemark();
  if (teach.value && canTeach.value) learn(p);
  game.bot = p.seat;
  const seat = p.seat;
  const mine = p.mine;
  proposal.value = null;
  note.value = "";
  teach.value = false;
  try {
    if (p.kind === "action") {
      if (mine !== p.bot) bots[seat].choose(mine);
      bots[seat].step();
    } else if (sameValue(mine, p.bot)) {
      bots[seat].step();
    } else {
      bots[seat].forget();
      engine.answerPrompt(mine);
    }
  } catch (error) {
    console.error(error);
  }
  schedule();
};

const lessonText = (lesson) => {
  const hero = everyHero.find((item) => item.id === lesson.hero)?.name ?? "";
  const name = (key) => cardNames.get(key) ?? key;
  const body =
    lesson.kind === "prefer"
      ? t("botWatchPreferOver")
          .replace("{better}", name(lesson.better))
          .replace("{worse}", name(lesson.worse))
      : (lesson.use ? t("botWatchUseCard") : t("botWatchAvoidCard")).replace(
          "{card}",
          name(lesson.card),
        );
  return `${hero} · ${t(lesson.title)}: ${body}`;
};

const dropLesson = (lesson) => {
  removeLesson(lesson);
  lessons.value = loadBotData().lessons || [];
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
  margin-bottom: 16px;
  color: var(--text-muted, #888);
}

.bot-watch-panel {
  padding: 14px;
  margin-bottom: 14px;
  border: 1px solid var(--border, rgba(128, 128, 128, 0.35));
  border-radius: 10px;
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
  color: inherit;
  background: rgba(128, 128, 128, 0.12);
  border: 1px solid rgba(128, 128, 128, 0.4);
  border-radius: 6px;
}

.bot-watch-note {
  box-sizing: border-box;
  width: 100%;
  margin: 10px 0;
}

.bot-watch-btn {
  padding: 7px 14px;
  color: inherit;
  cursor: pointer;
  background: rgba(128, 128, 128, 0.15);
  border: 1px solid rgba(128, 128, 128, 0.5);
  border-radius: 6px;
}

.bot-watch-btn.is-main {
  color: #fff;
  background: #2f6fed;
  border-color: #2f6fed;
}

.bot-watch-btn:disabled {
  cursor: default;
  opacity: 0.45;
}

.bot-watch-link {
  padding: 0 6px;
  margin-left: 8px;
  color: #ff7b7b;
  cursor: pointer;
  background: none;
  border: none;
}

.bot-watch-turn {
  margin-left: auto;
  font-size: 0.9rem;
}

.bot-watch-over {
  padding: 10px;
  margin-bottom: 12px;
  font-weight: 700;
  text-align: center;
  background: rgba(46, 204, 113, 0.18);
  border-radius: 8px;
}

.bot-watch-decision {
  position: sticky;
  bottom: 8px;
  z-index: 5;
  background: var(--bg-dark, #12182a);
  border-width: 2px;
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.45);
}

.bot-watch-decision.is-p1 {
  border-color: var(--color-player, #4f7cff);
}

.bot-watch-decision.is-p2 {
  border-color: var(--color-opponent, #ff4f6d);
}

.bot-watch-question {
  margin-bottom: 10px;
  font-weight: 600;
}

.bot-watch-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.bot-watch-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  min-width: 120px;
  padding: 10px 14px;
  color: inherit;
  cursor: pointer;
  background: rgba(128, 128, 128, 0.12);
  border: 2px solid transparent;
  border-radius: 8px;
}

.bot-watch-option.is-bot {
  border-color: #4f7cff;
  border-style: dashed;
}

.bot-watch-option.is-picked {
  background: rgba(46, 204, 113, 0.2);
  border-color: #2ecc71;
  border-style: solid;
}

.bot-watch-option small {
  font-size: 0.7rem;
  color: #4f7cff;
}

.bot-watch-pickline {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 10px;
}

.bot-watch-cardrow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.bot-watch-card {
  position: relative;
  width: 150px;
}

.bot-watch-cardrow.is-small .bot-watch-card {
  width: 110px;
}

.bot-watch-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 3;
  padding: 1px 7px;
  font-size: 0.7rem;
  font-weight: 800;
  color: #fff;
  background: #4f7cff;
  border-radius: 999px;
}

.bot-watch-teach {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

.bot-watch-teach small {
  flex-basis: 100%;
  color: var(--text-muted, #888);
}

.bot-watch-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.bot-watch-hands {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.bot-watch-hands .bot-watch-panel.is-p1 {
  border-color: var(--color-player, #4f7cff);
}

.bot-watch-hands .bot-watch-panel.is-p2 {
  border-color: var(--color-opponent, #ff4f6d);
}

.bot-watch-meta {
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: var(--text-muted, #888);
}

.bot-watch-remarks {
  padding-left: 18px;
  margin-bottom: 10px;
  font-size: 0.9rem;
}

@media (max-width: 900px) {
  .bot-watch-hands {
    grid-template-columns: 1fr;
  }
}
</style>
