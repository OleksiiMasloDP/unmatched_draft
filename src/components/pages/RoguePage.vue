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
        <div class="rogue-map rogue-anim">
          <svg
            class="rogue-path"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              :points="pathPoints"
              fill="none"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <div
            v-for="node in nodes"
            :key="node.n"
            class="rogue-node"
            :class="{
              'is-done': node.n < run.level,
              'is-current': node.n === run.level,
              'is-elite': node.n % 5 === 0,
            }"
            :style="{ left: node.x + '%', top: node.y + '%' }"
          >
            <span class="rogue-node-dot">
              {{
                node.n < run.level
                  ? "✔"
                  : node.n === run.level
                    ? node.n
                    : node.n % 5 === 0
                      ? "★"
                      : "?"
              }}
            </span>
            <span class="rogue-node-label">
              {{ node.n % 5 === 0 ? t("rogueBoss") : "" }}
            </span>
          </div>
        </div>

        <div class="rogue-versus">
          <div class="rogue-side rogue-anim">
            <div class="rogue-side-title">{{ heroName(run.heroId) }}</div>
            <PackHeroCard v-if="myHero" :hero="myHero" />
          </div>
          <div class="rogue-vs rogue-anim">
            <div class="rogue-level">
              {{ t("rogueLevel").replace("{n}", run.level) }}
            </div>
            <div class="rogue-info">
              {{
                t("rogueHpScale")
                  .replace("{p}", Math.round(scale() * 100))
                  .replace("{n}", run.deck.length)
                  .replace("{max}", constants.FULL_DECK)
              }}
            </div>
            <div class="rogue-info">
              {{
                t("rogueBotLevel").replace(
                  "{level}",
                  t("rogueLevel" + capitalize(botLevel())),
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
        <div v-if="showDeck" class="rogue-cards">
          <div v-for="card in myDeck" :key="card.id" class="rogue-card">
            <PackCard :card="card" />
          </div>
        </div>
      </section>

      <section v-else-if="run.phase === 'reward'">
        <h2 class="rogue-subtitle">{{ t("rogueRewardTitle") }}</h2>
        <p class="rogue-hint">{{ t("rogueRewardHint") }}</p>
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

      <section v-else-if="run.phase === 'over'" class="rogue-intro rogue-anim">
        <h2 class="rogue-subtitle">{{ t("rogueOverTitle") }}</h2>
        <p>
          {{
            t("rogueOverText")
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
        <button class="btn btn-sm btn-success" @click="syncBattle">
          {{ t("rogueAfterBattle") }}
        </button>
      </template>
      <template v-else>
        <span>{{ t("rogueBattleLabel").replace("{n}", run.level) }}</span>
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
import { getCard, getHero } from "../../gameDecks";
import { packDraftHeroes } from "../../packDraftData";
import GamePage from "./GamePage.vue";
import PackCard from "../PackCard.vue";
import PackHeroCard from "../PackHeroCard.vue";

const { t } = useDraftState();
const engine = useGame();
const { game } = engine;
const {
  run,
  heroCards,
  scale,
  botLevel,
  constants,
  startRun,
  pickHero,
  confirmDeck,
  startBattle,
  syncBattle,
  pickReward,
  abandon: endRun,
} = useRogue();

const root = ref(null);
const picked = ref([]);
const showDeck = ref(false);
const base = constants.BASE_DECK;
let context = null;

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const heroName = (id) => (id ? getHero(id).name : "");
const heroOf = (id) => packDraftHeroes.find((hero) => hero.id === id);

const step = computed(() =>
  run.phase === "hero" ? 1 : run.phase === "deck" ? 2 : 3,
);
const heroOptions = computed(() => run.heroOptions.map(heroOf).filter(Boolean));
const myHero = computed(() => heroOf(run.heroId));
const enemyHero = computed(() => heroOf(run.enemy?.heroId));
const deckPool = computed(() => (run.heroId ? heroCards(run.heroId) : []));
const myDeck = computed(() => run.deck.map(getCard).filter(Boolean));
const rewardCards = computed(() => run.rewards.map(getCard).filter(Boolean));

const NODES = 9;
const nodes = computed(() => {
  const first = Math.max(1, run.level - 2);
  return Array.from({ length: NODES }, (_, i) => ({
    n: first + i,
    x: 6 + (i * 88) / (NODES - 1),
    y: 50 + Math.sin(i * 1.25) * 26,
  }));
});
const pathPoints = computed(() =>
  nodes.value.map((node) => `${node.x},${node.y}`).join(" "),
);

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
    gsap.from(".rogue-node", {
      scale: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: "back.out(2)",
    });
    gsap.to(".rogue-node.is-current .rogue-node-dot", {
      scale: 1.18,
      repeat: -1,
      yoyo: true,
      duration: 0.8,
      ease: "sine.inOut",
    });
  }, root.value);
}

watch(
  () => run.phase,
  async (phase) => {
    if (phase === "deck") picked.value = [];
    if (phase === "map") showDeck.value = false;
    await nextTick();
    animate();
  },
);

watch(
  () => game.phase,
  () => {
    if (run.phase === "battle" && game.phase === "setup") syncBattle();
  },
);

onMounted(async () => {
  if (run.phase === "battle" && game.phase === "setup") syncBattle();
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
</style>
