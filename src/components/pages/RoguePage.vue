<template>
  <div class="rogue-root">
    <GamePage v-if="run.phase === 'battle'" />
    <div v-else class="rogue-page container" ref="root">
      <div class="rogue-title-row">
        <h1 class="page-main-title">{{ t("rogueTitle") }}</h1>
        <span class="rogue-beta">{{ t("rogueBeta") }}</span>
        <span v-if="run.best" class="rogue-best">
          {{ t("rogueBest") }}: {{ run.best }} {{ t("rogueWinsShort") }}
        </span>
        <span v-if="inRun" class="rogue-gold">💰 {{ run.gold }}</span>
      </div>

      <div v-if="run.phase !== 'idle'" class="rogue-steps">
        <span
          class="rogue-step"
          :class="{ active: step === 1, done: step > 1 }"
        >
          <b>1</b> {{ t("rogueStepHero") }}
        </span>
        <span
          class="rogue-step"
          :class="{ active: step === 2, done: step > 2 }"
        >
          <b>2</b> {{ t("rogueStepDeck") }}
        </span>
        <span class="rogue-step" :class="{ active: step === 3 }">
          <b>3</b> {{ t("rogueStepRun") }}
        </span>
      </div>

      <section v-if="run.phase === 'idle'" class="rogue-intro rogue-anim">
        <p>{{ t("rogueIntro") }}</p>
        <button class="btn btn-success" @click="startRun">
          {{ t("rogueStart") }}
        </button>
      </section>

      <section v-else-if="run.phase === 'hero'">
        <h2 class="rogue-subtitle">{{ t("rogueChooseHero") }}</h2>
        <p class="rogue-hint">{{ t("rogueChooseHeroHint") }}</p>
        <div class="rogue-heroes">
          <div v-for="hero in heroOptions" :key="hero.id" class="rogue-anim">
            <PackHeroCard :hero="hero" clickable @select="pickHero" />
          </div>
        </div>
      </section>

      <section v-else-if="run.phase === 'deck'">
        <h2 class="rogue-subtitle">{{ t("rogueDeckTitle") }}</h2>
        <div class="rogue-toolbar">
          <span class="rogue-count" :class="{ ready: picked.length === base }">
            {{
              t("rogueDeckCount")
                .replace("{n}", picked.length)
                .replace("{max}", base)
            }}
          </span>
          <button class="btn btn-sm btn-outline-secondary" @click="randomDeck">
            {{ t("rogueDeckAuto") }}
          </button>
          <button class="btn btn-sm btn-outline-secondary" @click="picked = []">
            {{ t("rogueDeckClear") }}
          </button>
          <button
            class="btn btn-sm btn-success"
            :disabled="picked.length !== base"
            @click="confirmDeck(picked)"
          >
            {{ t("rogueDeckConfirm") }}
          </button>
        </div>
        <div class="rogue-cards">
          <div
            v-for="card in deckPool"
            :key="card.id"
            class="rogue-card rogue-anim"
          >
            <PackCard
              :card="card"
              :selected="picked.includes(card.id)"
              clickable
              @select="togglePick"
            />
          </div>
        </div>
      </section>

      <section v-else-if="run.phase === 'map'">
        <p class="rogue-hint">{{ t("rogueMapHint") }}</p>
        <div class="rogue-toolbar">
          <button
            class="btn btn-sm btn-outline-secondary"
            @click="showDeck = !showDeck"
          >
            {{ showDeck ? t("rogueHideDeck") : t("rogueShowDeck") }}
          </button>
          <span class="rogue-count">
            {{ t("rogueYourDeck").replace("{n}", run.deck.length) }}
          </span>
          <button class="btn btn-sm btn-outline-danger" @click="abandon">
            {{ t("rogueAbandon") }}
          </button>
        </div>
        <div v-if="showDeck" class="rogue-cards rogue-deckview">
          <div v-for="(card, i) in myDeck" :key="i" class="rogue-card">
            <PackCard :card="card" />
          </div>
        </div>
        <RogueMap
          :map="run.map"
          :pos="run.pos"
          :visited="run.visited"
          :reachable="reachable()"
          :labels="nodeLabels"
          @enter="enterNode"
        />
      </section>

      <section v-else-if="run.phase === 'encounter'">
        <div class="rogue-versus">
          <div class="rogue-side rogue-anim">
            <div class="rogue-side-title">{{ heroName(run.heroId) }}</div>
            <PackHeroCard v-if="myHero" :hero="myHero" />
          </div>
          <div class="rogue-vs rogue-anim">
            <div class="rogue-level" :class="'kind-' + enemyKind">
              {{ encounterTitle }}
            </div>
            <div class="rogue-info">
              {{
                t("rogueHealthNote").replace("{p}", Math.round(myScale * 100))
              }}
            </div>
            <div class="rogue-info">
              {{
                t("rogueFoeNote").replace("{p}", Math.round(foePercent * 100))
              }}
            </div>
            <div class="rogue-info">
              {{
                t("rogueBotLevel").replace(
                  "{level}",
                  t("rogueLevel" + capitalize(botLevelFor(currentNode))),
                )
              }}
            </div>
            <button class="btn btn-success rogue-fight" @click="startBattle">
              {{ t("rogueFight") }}
            </button>
          </div>
          <div class="rogue-side rogue-anim">
            <div class="rogue-side-title">{{ t("rogueEnemy") }}</div>
            <PackHeroCard v-if="enemyHero" :hero="enemyHero" />
          </div>
        </div>
      </section>

      <section v-else-if="run.phase === 'reward'">
        <h2 class="rogue-subtitle">{{ t("rogueRewardTitle") }}</h2>
        <p class="rogue-hint">
          {{ t("rogueRewardHint") }} ·
          {{ t("rogueRewardGold").replace("{n}", lastGold) }}
        </p>
        <div class="rogue-rewards">
          <div
            v-for="card in rewardCards"
            :key="card.id"
            class="rogue-card rogue-reward rogue-anim"
          >
            <PackCard :card="card" clickable @select="pickReward" />
          </div>
        </div>
      </section>

      <section v-else-if="run.phase === 'packs'">
        <h2 class="rogue-subtitle">{{ t("roguePacksTitle") }}</h2>
        <p class="rogue-hint">
          {{ t("roguePacksHint") }} ·
          {{ t("rogueRewardGold").replace("{n}", lastGold) }}
        </p>
        <div class="rogue-packs">
          <RoguePack
            v-for="pack in run.packs"
            :key="pack.id"
            class="rogue-anim"
            :pack="pack"
            :opened="run.packChosen === pack.id"
            :dim="!!run.packChosen && run.packChosen !== pack.id"
            :locked="!!run.packChosen"
            @open="pickPack"
          />
        </div>
        <div v-if="run.packChosen" class="rogue-toolbar rogue-center">
          <button class="btn btn-success" @click="leavePacks">
            {{ t("roguePackTake") }}
          </button>
        </div>
      </section>

      <section v-else-if="run.phase === 'rest'">
        <h2 class="rogue-subtitle">🔥 {{ t("rogueRestTitle") }}</h2>
        <template v-if="!run.rest.mode">
          <p class="rogue-hint">{{ t("rogueRestText") }}</p>
          <div class="rogue-options">
            <button
              class="rogue-option rogue-anim"
              :disabled="run.deck.length <= constants.MIN_DECK"
              @click="chooseRest('remove')"
            >
              <span class="rogue-option-icon">🗑️</span>
              <span>{{ t("rogueRestRemove") }}</span>
              <small v-if="run.deck.length <= constants.MIN_DECK">
                {{ t("rogueDeckTooSmall") }}
              </small>
            </button>
            <button
              class="rogue-option rogue-anim"
              :disabled="!upgradable().length"
              @click="chooseRest('upgrade')"
            >
              <span class="rogue-option-icon">⬆️</span>
              <span>{{ t("rogueRestUpgrade") }}</span>
            </button>
          </div>
        </template>
        <template v-else>
          <p class="rogue-hint">
            {{
              run.rest.mode === "remove"
                ? t("rogueRestPickRemove")
                : t("rogueRestPickUpgrade")
            }}
          </p>
          <div class="rogue-cards">
            <div
              v-for="(card, i) in run.rest.mode === 'remove'
                ? myDeck
                : upgradableCards"
              :key="card.id + i"
              class="rogue-card rogue-anim"
            >
              <PackCard :card="card" clickable @select="restPick" />
            </div>
          </div>
        </template>
      </section>

      <section v-else-if="run.phase === 'shop'">
        <h2 class="rogue-subtitle">💰 {{ t("rogueShopTitle") }}</h2>
        <template v-if="!run.shop.picking">
          <div class="rogue-cards">
            <div
              v-for="(item, i) in run.shop.cards"
              :key="item.id"
              class="rogue-card rogue-anim rogue-shopitem"
              :class="{ 'is-sold': item.sold }"
            >
              <PackCard :card="getCard(item.id)" />
              <button
                class="btn btn-sm"
                :class="
                  run.gold >= item.price
                    ? 'btn-success'
                    : 'btn-outline-secondary'
                "
                :disabled="item.sold || run.gold < item.price"
                @click="buy(i)"
              >
                {{ item.sold ? t("rogueShopSold") : t("rogueShopBuy") }} · 💰
                {{ item.price }}
              </button>
            </div>
          </div>
          <div class="rogue-toolbar">
            <button
              class="btn btn-sm btn-outline-warning"
              :disabled="
                run.gold < removePrice(run.shop.removed) ||
                run.deck.length <= constants.MIN_DECK
              "
              @click="startShopRemove"
            >
              🗑️
              {{
                t("rogueShopRemove").replace(
                  "{price}",
                  removePrice(run.shop.removed),
                )
              }}
            </button>
            <button class="btn btn-sm btn-success" @click="leave">
              {{ t("rogueShopLeave") }}
            </button>
          </div>
        </template>
        <template v-else>
          <p class="rogue-hint">{{ t("rogueShopPickRemove") }}</p>
          <div class="rogue-toolbar">
            <button
              class="btn btn-sm btn-outline-secondary"
              @click="cancelShopRemove"
            >
              {{ t("rogueCancel") }}
            </button>
          </div>
          <div class="rogue-cards">
            <div
              v-for="(card, i) in myDeck"
              :key="card.id + i"
              class="rogue-card"
            >
              <PackCard :card="card" clickable @select="shopRemove" />
            </div>
          </div>
        </template>
      </section>

      <section v-else-if="run.phase === 'event' && eventData">
        <div class="rogue-event rogue-anim">
          <div class="rogue-event-icon">{{ eventData.icon }}</div>
          <h2 class="rogue-subtitle">{{ eventData.title[lang] }}</h2>
          <p>{{ eventData.text[lang] }}</p>
        </div>
        <div v-if="run.event.step === 'choose'" class="rogue-options">
          <button
            v-for="(choice, i) in eventData.choices"
            :key="i"
            class="rogue-option rogue-anim"
            :disabled="eventBlocked(choice)"
            @click="chooseEvent(i)"
          >
            <span>{{ choice.label[lang] }}</span>
          </button>
        </div>
        <template v-else-if="run.event.step === 'result'">
          <p class="rogue-hint">{{ run.event.result?.[lang] }}</p>
          <div v-if="eventCards.length" class="rogue-rewards">
            <div
              v-for="card in eventCards"
              :key="card.id"
              class="rogue-card rogue-reward"
            >
              <PackCard :card="card" />
            </div>
          </div>
          <div class="rogue-toolbar">
            <button class="btn btn-success" @click="leave">
              {{ t("rogueLeave") }}
            </button>
          </div>
        </template>
        <template v-else>
          <p class="rogue-hint">
            {{
              run.event.step === "pickCard"
                ? t("rogueEventPickCard")
                : run.event.step === "pickUpgrade"
                  ? t("rogueEventPickUpgrade")
                  : t("rogueEventPickRemove")
            }}
          </p>
          <div class="rogue-cards">
            <div
              v-for="(card, i) in eventPickList"
              :key="card.id + i"
              class="rogue-card rogue-anim"
            >
              <PackCard :card="card" clickable @select="eventPick" />
            </div>
          </div>
          <div class="rogue-toolbar">
            <button
              class="btn btn-sm btn-outline-secondary"
              @click="skipEventPick"
            >
              {{ t("rogueEventSkip") }}
            </button>
          </div>
        </template>
      </section>

      <section v-else-if="run.phase === 'over'" class="rogue-intro rogue-anim">
        <h2 class="rogue-subtitle">
          {{ run.victory ? t("rogueOverVictory") : t("rogueOverTitle") }}
        </h2>
        <p>
          {{
            (run.victory ? t("rogueOverVictoryText") : t("rogueOverText"))
              .replace("{n}", run.wins)
              .replace("{hero}", heroName(run.heroId))
          }}
        </p>
        <button class="btn btn-success" @click="startRun">
          {{ t("rogueNewRun") }}
        </button>
      </section>
    </div>

    <div
      v-if="run.phase === 'battle'"
      class="rogue-battle-bar"
      :class="{ 'is-over': game.phase === 'over' }"
    >
      <template v-if="game.phase === 'over'">
        <span class="rogue-battle-result">
          {{ game.winner === "p1" ? t("rogueVictory") : t("rogueDefeat") }}
        </span>
        <button class="btn btn-sm btn-success" @click="afterBattle">
          {{ t("rogueAfterBattle") }}
        </button>
      </template>
      <template v-else>
        <span>{{ encounterTitle }}</span>
        <button class="btn btn-sm btn-outline-danger" @click="abandon">
          {{ t("rogueAbandon") }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import gsap from "gsap";
import { useDraftState } from "../../composables/useDraftState";
import { useGame } from "../../composables/useGame";
import { useRogue } from "../../composables/useRogue";
import { getHero } from "../../gameDecks";
import { packDraftHeroes } from "../../packDraftData";
import { events } from "../../rogueData";
import GamePage from "./GamePage.vue";
import PackCard from "../PackCard.vue";
import PackHeroCard from "../PackHeroCard.vue";
import RogueMap from "../RogueMap.vue";
import RoguePack from "../RoguePack.vue";

const { t, lang } = useDraftState();
const engine = useGame();
const { game } = engine;
const {
  run,
  heroCards,
  getCard,
  upgradable,
  reachable,
  nodeById,
  kindOf,
  hpScale,
  foeScale,
  botLevelFor,
  constants,
  removePrice,
  startRun,
  pickHero,
  confirmDeck,
  enterNode,
  startBattle,
  syncBattle,
  pickReward,
  pickPack,
  leavePacks,
  chooseRest,
  restPick,
  buy,
  startShopRemove,
  shopRemove,
  cancelShopRemove,
  chooseEvent,
  eventPick,
  skipEventPick,
  leave,
  abandon: endRun,
} = useRogue();

const root = ref(null);
const picked = ref([]);
const showDeck = ref(false);
const lastGold = ref(0);
const base = constants.BASE_DECK;
let context = null;

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const heroName = (id) => (id ? getHero(id).name : "");
const heroOf = (id) => packDraftHeroes.find((hero) => hero.id === id);
const cardsOf = (ids) => ids.map(getCard).filter(Boolean);

const inRun = computed(
  () => !["idle", "hero", "deck"].includes(run.phase) && run.deck.length > 0,
);
const step = computed(() =>
  run.phase === "hero" ? 1 : run.phase === "deck" ? 2 : 3,
);
const heroOptions = computed(() => run.heroOptions.map(heroOf).filter(Boolean));
const myHero = computed(() => heroOf(run.heroId));
const enemyHero = computed(() => heroOf(run.enemy?.heroId));
const deckPool = computed(() => (run.heroId ? heroCards(run.heroId) : []));
const myDeck = computed(() => cardsOf(run.deck));
const upgradableCards = computed(() => cardsOf(upgradable()));
const rewardCards = computed(() => cardsOf(run.rewards));
const currentNode = computed(() => (run.node ? nodeById(run.node) : null));
const enemyKind = computed(() => run.enemy?.kind || "fight");
const myScale = computed(() =>
  currentNode.value ? hpScale(currentNode.value) : 1,
);
const foePercent = computed(() =>
  currentNode.value ? foeScale(currentNode.value) : 1,
);
const eventData = computed(() =>
  run.event ? events.find((item) => item.id === run.event.id) : null,
);
const eventCards = computed(() => cardsOf(run.event?.cards || []));
const eventPickList = computed(() => {
  const stepName = run.event?.step;
  if (stepName === "pickCard") return cardsOf(run.event.options);
  if (stepName === "pickUpgrade") return upgradableCards.value;
  return myDeck.value;
});
const encounterTitle = computed(() =>
  enemyKind.value === "boss"
    ? t("rogueEncounterBoss")
    : enemyKind.value === "elite"
      ? t("rogueEncounterElite")
      : t("rogueEncounterFight"),
);
const nodeLabels = computed(() => ({
  fight: t("rogueNodeFight"),
  mystery: t("rogueNodeMystery"),
  rest: t("rogueNodeRest"),
  shop: t("rogueNodeShop"),
  boss: t("rogueNodeBoss"),
}));

function eventBlocked(choice) {
  if (run.gold < (choice.cost || 0)) return true;
  if (choice.effect.upgrade && !upgradable().length) return true;
  if (choice.effect.remove && run.deck.length <= constants.MIN_DECK)
    return true;
  return false;
}

function afterBattle() {
  const before = run.gold;
  syncBattle();
  lastGold.value = run.gold - before;
  engine.resetGame();
  engine.setBot(null);
}

function abandon() {
  engine.resetGame();
  engine.setBot(null);
  endRun();
}

function togglePick(id) {
  if (picked.value.includes(id)) {
    picked.value = picked.value.filter((item) => item !== id);
  } else if (picked.value.length < base) {
    picked.value = [...picked.value, id];
  }
}

function randomDeck() {
  const pool = [...deckPool.value];
  const result = [];
  while (result.length < base && pool.length) {
    result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
  }
  picked.value = result;
}

function animate() {
  context?.revert();
  if (!root.value) return;
  context = gsap.context(() => {
    gsap.from(".rogue-anim", {
      y: 28,
      opacity: 0,
      duration: 0.5,
      stagger: 0.07,
      ease: "power2.out",
    });
    gsap.from(".rogue-reward", {
      rotationY: 90,
      duration: 0.6,
      stagger: 0.15,
      ease: "back.out(1.4)",
    });
  }, root.value);
}

watch(
  () => [run.phase, run.rest?.mode, run.event?.step, run.shop?.picking],
  async ([phase]) => {
    if (phase === "deck") picked.value = [];
    if (phase === "map") showDeck.value = false;
    await nextTick();
    animate();
  },
);

onMounted(async () => {
  if (run.phase === "battle" && game.phase !== "play") syncBattle();
  await nextTick();
  animate();
});

onBeforeUnmount(() => {
  context?.revert();
  if (run.phase === "battle") {
    engine.resetGame();
    engine.setBot(null);
    syncBattle();
  }
});
</script>

<style scoped>
.rogue-page {
  padding: 2rem 1rem;
}

.rogue-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.rogue-beta {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(var(--color-info-rgb), 0.15);
  border: 1px solid rgba(var(--color-info-rgb), 0.5);
  color: var(--color-info);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.rogue-best {
  color: var(--text-dim);
  font-size: 0.85rem;
}

.rogue-steps {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 12px 0 20px;
}

.rogue-step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  color: var(--text-dim);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rogue-step.active {
  color: var(--color-info);
  border-color: rgba(var(--color-info-rgb), 0.6);
}

.rogue-step.done {
  opacity: 0.6;
}

.rogue-intro {
  max-width: 640px;
  margin: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.rogue-subtitle {
  font-size: 1.2rem;
  margin: 8px 0;
}

.rogue-hint {
  color: var(--text-dim);
}

.rogue-heroes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  max-width: 820px;
}

.rogue-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin: 12px 0;
}

.rogue-count {
  font-weight: 700;
  color: var(--text-dim);
}

.rogue-count.ready {
  color: var(--color-info);
}

.rogue-cards,
.rogue-rewards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.rogue-rewards {
  max-width: 720px;
  perspective: 900px;
}

.rogue-map {
  position: relative;
  height: 180px;
  margin: 8px 0 20px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  overflow: hidden;
}

.rogue-path {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.rogue-path polyline {
  stroke: var(--border-light);
  stroke-width: 3;
  stroke-dasharray: 8 8;
}

.rogue-node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rogue-node-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--bg-card, #1c1f26);
  border: 2px solid var(--border-light);
  color: var(--text-dim);
  font-weight: 800;
}

.rogue-node.is-done .rogue-node-dot {
  border-color: var(--color-info);
  color: var(--color-info);
  opacity: 0.7;
}

.rogue-node.is-current .rogue-node-dot {
  border-color: var(--color-info);
  background: rgba(var(--color-info-rgb), 0.25);
  color: #fff;
  box-shadow: 0 0 18px rgba(var(--color-info-rgb), 0.6);
}

.rogue-node.is-elite .rogue-node-dot {
  border-color: #e0a526;
  color: #e0a526;
}

.rogue-node-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #e0a526;
  position: absolute;
  top: 100%;
}

.rogue-versus {
  display: grid;
  grid-template-columns: 1fr minmax(200px, 1.2fr) 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.rogue-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rogue-side-title {
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.8rem;
  color: var(--text-dim);
}

.rogue-vs {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.rogue-level {
  font-size: 1.6rem;
  font-weight: 900;
}

.rogue-info {
  color: var(--text-dim);
  font-size: 0.85rem;
}

.rogue-fight {
  padding: 10px 32px;
  font-weight: 800;
}

.rogue-battle-bar {
  position: fixed;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(20, 22, 28, 0.92);
  border: 1px solid var(--border-light);
  font-weight: 700;
}

.rogue-battle-bar.is-over {
  border-color: var(--color-info);
  box-shadow: 0 0 24px rgba(var(--color-info-rgb), 0.5);
}

.rogue-battle-result {
  font-size: 1.1rem;
  font-weight: 900;
  text-transform: uppercase;
}

@media (max-width: 720px) {
  .rogue-versus {
    grid-template-columns: 1fr;
  }
}

.rogue-gold {
  margin-left: auto;
  padding: 3px 12px;
  border-radius: 999px;
  background: rgba(246, 201, 69, 0.15);
  border: 1px solid rgba(246, 201, 69, 0.6);
  color: #f6c945;
  font-weight: 800;
}

.rogue-center {
  justify-content: center;
}

.rogue-packs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 28px;
  margin: 24px 0;
}

.rogue-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  max-width: 720px;
  margin: 16px 0;
}

.rogue-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px 16px;
  border: 1px solid var(--border-light);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s,
    border-color 0.15s;
}

.rogue-option:not(:disabled):hover {
  transform: translateY(-3px);
  border-color: var(--color-info);
}

.rogue-option:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rogue-option-icon {
  font-size: 40px;
}

.rogue-event {
  max-width: 560px;
  text-align: center;
  margin: 8px auto 16px;
}

.rogue-event-icon {
  font-size: 64px;
}

.rogue-shopitem {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rogue-shopitem.is-sold {
  opacity: 0.4;
}

.rogue-level.kind-elite {
  color: #ff9f43;
}

.rogue-level.kind-boss {
  color: #ff4d6d;
}

.rogue-deckview {
  margin-bottom: 16px;
}
</style>
