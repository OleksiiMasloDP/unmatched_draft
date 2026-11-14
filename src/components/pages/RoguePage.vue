<template>
  <div class="rogue-root">
    <GamePage v-if="run.phase === 'battle'" />
    <div v-else class="rogue-page container" ref="root">
      <div class="rogue-title-row">
        <h1 class="page-main-title">{{ t("rogueTitle") }}</h1>
        <span class="rogue-beta">{{ t("rogueBeta") }}</span>
        <button
          v-if="history.length"
          class="rogue-bestbtn"
          @click="historyOpen = true"
        >
          🏆 {{ t("rogueBest") }}: {{ bestWins }} {{ t("rogueWinsShort") }}
        </button>
        <button
          v-if="inRun && run.phase !== 'battle'"
          class="btn btn-sm btn-outline-danger rogue-abandon"
          @click="abandon"
        >
          {{ t("rogueAbandon") }}
        </button>
      </div>

      <div
        v-if="run.phase === 'hero' || run.phase === 'deck'"
        class="rogue-steps"
      >
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
            <RogueHeroTile :hero="hero" clickable @select="pickHero" />
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
          <button class="rogue-deckbtn" @click="deckOpen = true">
            <span>📚</span>
            <b>{{ t("rogueDeckButton") }}</b>
            <i>{{ run.deck.length }}</i>
          </button>
          <span class="rogue-gold">💰 {{ run.gold }}</span>
        </div>
        <RogueMap
          :map="run.map"
          :pos="run.pos"
          :visited="run.visited"
          :reachable="reachable()"
          :labels="nodeLabels"
          :hero-image="myHero ? assetUrl(myHero.image) : ''"
          @enter="enterNode"
        />
      </section>

      <section v-else-if="run.phase === 'encounter'" class="rogue-encounter">
        <div class="rogue-banner" :class="'kind-' + enemyKind">
          {{ encounterTitle }}
        </div>
        <p v-if="enemyKind !== 'fight'" class="rogue-hint rogue-center-text">
          {{ enemyKind === "boss" ? t("rogueBossHint") : t("rogueEliteHint") }}
        </p>
        <div class="rogue-duel">
          <div class="rogue-anim">
            <RogueHeroTile
              v-if="myHero"
              :hero="myHero"
              side="me"
              :tag="t('rogueYourHp')"
              :hp-value="scaledHp(myHero.hp, myScale)"
            />
          </div>
          <div class="rogue-vsbadge rogue-anim">VS</div>
          <div class="rogue-anim">
            <RogueHeroTile
              v-if="enemyHero"
              :hero="enemyHero"
              side="foe"
              :tag="t('rogueEnemy')"
              :hp-value="scaledHp(enemyHero.hp, foePercent)"
            />
          </div>
        </div>
        <div class="rogue-info-row">
          <span>
            {{
              t("rogueBotLevel").replace(
                "{level}",
                t("rogueLevel" + capitalize(botLevelFor(currentNode))),
              )
            }}
          </span>
        </div>
        <div class="rogue-toolbar rogue-center">
          <button class="btn btn-success rogue-fight" @click="startBattle">
            ⚔️ {{ t("rogueFight") }}
          </button>
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

      <section v-else-if="run.phase === 'rest'" class="rogue-restscene">
        <div class="rogue-fire">🔥</div>
        <h2 class="rogue-subtitle">{{ t("rogueRestTitle") }}</h2>
        <p class="rogue-hint">{{ t("rogueRestText") }}</p>
        <div class="rogue-toolbar rogue-center">
          <button class="btn btn-success" @click="leave">
            {{ t("rogueLeave") }}
          </button>
        </div>
        <p v-if="run.deck.length > constants.MIN_DECK" class="rogue-hint">
          {{ t("rogueRestPickRemove") }}
        </p>
        <p v-else class="rogue-hint">{{ t("rogueDeckTooSmall") }}</p>
        <div v-if="run.deck.length > constants.MIN_DECK" class="rogue-cards">
          <div
            v-for="(card, i) in myDeck"
            :key="card.id + i"
            class="rogue-card rogue-anim"
          >
            <PackCard :card="card" clickable @select="restPick" />
          </div>
        </div>
      </section>

      <section v-else-if="run.phase === 'shop'" class="rogue-shop">
        <div class="rogue-shop-head">
          <div class="rogue-shopkeeper">🧙</div>
          <div class="rogue-bubble">
            <b>{{ t("rogueShopTitle") }}</b>
            <span>{{ t("rogueShopKeeper") }}</span>
          </div>
        </div>
        <template v-if="!run.shop.picking">
          <div class="rogue-shelf">
            <div
              v-for="(item, i) in run.shop.cards"
              :key="item.id"
              class="rogue-ware rogue-anim"
              :class="{
                'is-sold': item.sold,
                'is-poor': run.gold < item.price,
              }"
            >
              <div class="rogue-ware-card">
                <PackCard :card="getCard(item.id)" />
                <span v-if="item.sold" class="rogue-sold">
                  {{ t("rogueShopSold") }}
                </span>
              </div>
              <button
                class="rogue-price"
                :disabled="item.sold || run.gold < item.price"
                @click="buy(i)"
              >
                <span class="rogue-coin">🪙</span>
                <b>{{ item.price }}</b>
                <small>{{ t("rogueShopBuy") }}</small>
              </button>
            </div>
          </div>
          <div class="rogue-services">
            <button
              class="rogue-service"
              :disabled="
                run.gold < removePrice(run.shop.removed) ||
                run.deck.length <= constants.MIN_DECK
              "
              @click="startShopRemove"
            >
              <span class="rogue-service-icon">✂️</span>
              <span>{{ t("rogueShopRemoveSign") }}</span>
              <b>🪙 {{ removePrice(run.shop.removed) }}</b>
            </button>
            <button class="btn btn-success" @click="leave">
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
        <RogueEventScene
          class="rogue-anim"
          :title="eventText(eventData.title)"
          :text="eventText(eventData.text)"
          :icon="eventData.icon || ''"
          :art="eventArt"
          :tint="eventData.tint"
          :choices="run.event.step === 'choose' ? eventChoices : []"
          @choose="chooseEvent"
        />
        <template v-if="run.event.step === 'result'">
          <p class="rogue-hint">{{ eventText(run.event.result) }}</p>
          <div v-if="run.event.gold" class="rogue-gain">
            <span :class="run.event.gold > 0 ? 'is-up' : 'is-down'">
              🪙 {{ run.event.gold > 0 ? "+" : "" }}{{ run.event.gold }}
            </span>
          </div>
          <div v-if="removedCard" class="rogue-removed">
            <small>{{ t("rogueEventRemoved") }}</small>
            <div class="rogue-card"><PackCard :card="removedCard" /></div>
          </div>
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
        <template
          v-else-if="
            run.event.step === 'pickCard' || run.event.step === 'pickRemove'
          "
        >
          <p class="rogue-hint">
            {{
              run.event.step === "pickCard"
                ? t("rogueEventPickCard")
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
      <p v-if="run.phase !== 'battle'" class="rogue-credit">
        {{ t("rogueIconsCredit") }}
      </p>
    </div>

    <button
      v-if="inRun && run.phase !== 'map'"
      class="rogue-fab"
      @click="deckOpen = true"
    >
      📚 <b>{{ run.deck.length }}</b>
      <span class="rogue-fab-gold">💰 {{ run.gold }}</span>
    </button>
    <RogueHistoryModal
      v-if="historyOpen"
      :history="history"
      @close="historyOpen = false"
    />
    <RogueDeckModal v-if="deckOpen" :cards="myDeck" @close="deckOpen = false" />

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
import GamePage from "./GamePage.vue";
import PackCard from "../PackCard.vue";
import RogueHistoryModal from "../RogueHistoryModal.vue";
import RogueDeckModal from "../RogueDeckModal.vue";
import RogueHeroTile from "../RogueHeroTile.vue";
import RogueEventScene from "../RogueEventScene.vue";
import RogueMap from "../RogueMap.vue";
import RoguePack from "../RoguePack.vue";

const { t, lang } = useDraftState();
const engine = useGame();
const { game } = engine;
const {
  run,
  history,
  eventData: currentEvent,
  heroCards,
  getCard,
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
const bestWins = computed(() =>
  Math.max(run.best, ...history.map((entry) => entry.wins)),
);
const deckOpen = ref(false);
const historyOpen = ref(false);
const lastGold = ref(0);
const base = constants.BASE_DECK;
const scaledHp = (value, factor) => Math.max(1, Math.ceil(value * factor));
let context = null;

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
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
const rewardCards = computed(() => cardsOf(run.rewards));
const currentNode = computed(() => (run.node ? nodeById(run.node) : null));
const enemyKind = computed(() => run.enemy?.kind || "fight");
const myScale = computed(() =>
  currentNode.value ? hpScale(currentNode.value) : 1,
);
const foePercent = computed(() =>
  currentNode.value ? foeScale(currentNode.value) : 1,
);
const eventData = computed(() => (run.event ? currentEvent() : null));
const eventHero = computed(() =>
  run.event?.hero ? heroOf(run.event.hero) : null,
);
const removedCard = computed(() =>
  run.event?.removed ? getCard(run.event.removed) : null,
);
const eventText = (value) =>
  (value?.[lang.value] || value?.en || "").replaceAll(
    "{hero}",
    run.event?.hero ? heroName(run.event.hero) : "",
  );
const eventArt = computed(() => {
  if (eventHero.value) return assetUrl(eventHero.value.image);
  return run.event ? assetUrl(`images/rogue/events/${run.event.id}.webp`) : "";
});
const eventChoices = computed(() =>
  (eventData.value?.choices || []).map((choice) => ({
    icon: choice.icon,
    label: eventText(choice.label),
    blocked: eventBlocked(choice),
    tip: choiceTip(choice),
  })),
);
const eventCards = computed(() => cardsOf(run.event?.cards || []));
const eventPickList = computed(() => {
  const stepName = run.event?.step;
  if (stepName === "pickCard") return cardsOf(run.event.options);
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
  elite: t("rogueNodeElite"),
  mystery: t("rogueNodeMystery"),
  rest: t("rogueNodeRest"),
  shop: t("rogueNodeShop"),
  boss: t("rogueNodeBoss"),
  forest: t("rogueZoneForest"),
  mountains: t("rogueZoneMountains"),
  ruins: t("rogueZoneRuins"),
  citadel: t("rogueZoneCitadel"),
}));

function choiceTip(choice) {
  const lines = [];
  if (choice.cost) {
    lines.push(t("rogueEventTipCost").replace("{n}", choice.cost));
    if (run.gold < choice.cost) lines.push(t("rogueEventTipPoor"));
  }
  if (choice.remove) lines.push(t("rogueEventTipRemove"));
  const count = choice.pick || choice.pickAlly;
  if (count) lines.push(t("rogueEventTipPick").replace("{n}", count));
  return lines;
}

function eventBlocked(choice) {
  if (run.gold < (choice.cost || 0)) return true;
  if (choice.remove && run.deck.length <= constants.MIN_DECK) return true;
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

.rogue-bestbtn {
  padding: 4px 14px;
  border: 1px solid #8a6c43;
  border-radius: 999px;
  background: rgba(138, 108, 67, 0.15);
  color: #ffecc8;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.rogue-bestbtn:hover {
  background: rgba(138, 108, 67, 0.4);
}

.rogue-gain {
  display: flex;
  justify-content: center;
  margin: 8px 0;
  font-size: 1.4rem;
  font-weight: 900;
}

.rogue-gain .is-up {
  color: #f6c945;
}

.rogue-gain .is-down {
  color: #ff7b8f;
}

.rogue-removed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  color: var(--text-dim);
}

.rogue-removed .rogue-card {
  width: 140px;
  opacity: 0.6;
  filter: grayscale(1);
}

.rogue-credit {
  margin-top: 28px;
  color: var(--text-dim);
  font-size: 0.7rem;
  text-align: center;
  opacity: 0.7;
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.rogue-abandon {
  margin-left: auto;
  padding: 5px 14px;
  border: 1px solid rgba(217, 83, 79, 0.7);
  border-radius: 999px;
  background: rgba(217, 83, 79, 0.12);
  color: #ff8d8a;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
}

.rogue-abandon:hover {
  background: rgba(217, 83, 79, 0.3);
  color: #fff;
}

.rogue-fab-gold {
  margin-left: 10px;
  padding-left: 10px;
  border-left: 1px solid rgba(255, 236, 200, 0.3);
  color: #f6c945;
  font-weight: 800;
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
  margin: 16px auto;
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

.rogue-deckbtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 2px solid #8a6c43;
  border-radius: 12px;
  background: linear-gradient(160deg, #3a2c1b, #1a120a);
  color: #ffecc8;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
  transition: transform 0.15s;
}

.rogue-deckbtn:hover {
  transform: translateY(-2px);
}

.rogue-deckbtn span {
  font-size: 1.4rem;
}

.rogue-deckbtn i {
  min-width: 28px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #f6c945;
  color: #1b130a;
  font-style: normal;
  font-weight: 900;
  text-align: center;
}

.rogue-fab {
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 1200;
  padding: 10px 16px;
  border: 2px solid #8a6c43;
  border-radius: 999px;
  background: linear-gradient(160deg, #3a2c1b, #1a120a);
  color: #ffecc8;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
}

.rogue-fab b {
  margin-left: 4px;
  color: #f6c945;
}

.rogue-center-text {
  text-align: center;
}

.rogue-banner {
  margin: 0 auto 10px;
  width: fit-content;
  padding: 6px 28px;
  border: 2px solid currentColor;
  border-radius: 8px;
  color: #d9534f;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.rogue-banner.kind-elite {
  color: #ff9f43;
}

.rogue-banner.kind-boss {
  color: #ff4d6d;
  box-shadow: 0 0 24px rgba(255, 77, 109, 0.5);
}

.rogue-duel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  max-width: 680px;
  margin: 0 auto;
}

.rogue-vsbadge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: radial-gradient(circle, #ff4d6d, #7a1126);
  font-weight: 900;
  box-shadow: 0 0 24px rgba(255, 77, 109, 0.6);
}

.rogue-info-row {
  margin: 12px 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-dim);
}

.rogue-restscene {
  text-align: center;
}

.rogue-restscene .rogue-cards {
  text-align: left;
}

.rogue-fire {
  font-size: 72px;
  filter: drop-shadow(0 0 22px #ff9f43);
  animation: rogue-flicker 1.4s ease-in-out infinite alternate;
}

@keyframes rogue-flicker {
  from {
    transform: scale(0.94);
  }
  to {
    transform: scale(1.06);
  }
}

.rogue-shop {
  padding: 16px;
  border: 3px solid #5a4630;
  border-radius: 16px;
  background:
    repeating-linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.12) 0 2px,
      transparent 2px 46px
    ),
    linear-gradient(180deg, #2a1c10, #17100a);
  box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.6);
}

.rogue-shop-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.rogue-shopkeeper {
  font-size: 56px;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6));
}

.rogue-bubble {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #f4e6c4;
  color: #2a1c10;
  font-size: 0.85rem;
}

.rogue-bubble b {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rogue-bubble::before {
  content: "";
  position: absolute;
  left: -8px;
  top: 18px;
  border: 8px solid transparent;
  border-left: 0;
  border-right-color: #f4e6c4;
}

.rogue-shelf {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 22px 14px;
  padding: 16px 8px 18px;
  border-bottom: 10px solid #5a4630;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.18);
}

.rogue-ware {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.rogue-ware-card {
  position: relative;
  width: 100%;
  filter: drop-shadow(0 8px 10px rgba(0, 0, 0, 0.6));
}

.rogue-ware.is-sold .rogue-ware-card {
  opacity: 0.35;
  filter: grayscale(1);
}

.rogue-sold {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff4d6d;
  font-size: 1.4rem;
  font-weight: 900;
  letter-spacing: 3px;
  text-transform: uppercase;
  transform: rotate(-18deg);
  text-shadow: 0 2px 8px #000;
}

.rogue-price {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: 2px solid #f6c945;
  border-radius: 999px;
  background: rgba(246, 201, 69, 0.15);
  color: #f6c945;
  cursor: pointer;
}

.rogue-price b {
  font-size: 1.05rem;
}

.rogue-price small {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.8;
}

.rogue-price:not(:disabled):hover {
  background: #f6c945;
  color: #1b130a;
}

.rogue-ware.is-poor .rogue-price,
.rogue-price:disabled {
  border-color: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.45);
  background: none;
  cursor: not-allowed;
}

.rogue-services {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.rogue-service {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border: 2px dashed #8a6c43;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  color: #ffecc8;
  cursor: pointer;
}

.rogue-service:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rogue-service-icon {
  font-size: 1.4rem;
}

@media (max-width: 720px) {
  .rogue-cards,
  .rogue-rewards {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
  }

  .rogue-duel {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    position: relative;
  }

  .rogue-vsbadge {
    position: absolute;
    left: 50%;
    top: 50px;
    z-index: 2;
    width: 42px;
    height: 42px;
    transform: translateX(-50%);
    font-size: 0.85rem;
  }

  .rogue-shelf {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.rogue-page {
  padding-bottom: 84px;
}
</style>
