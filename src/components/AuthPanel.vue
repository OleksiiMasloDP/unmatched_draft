<template>
  <div class="pn" :class="'pn-' + variant">
    <div class="pn-head">
      <div class="pn-logo">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <defs>
            <linearGradient id="png" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#facc15" />
              <stop offset="1" stop-color="#ef4444" />
            </linearGradient>
          </defs>
          <path
            d="M24 3 42 10v14c0 10-7.5 17.5-18 21C13.5 41.5 6 34 6 24V10z"
            fill="url(#png)"
          />
          <path
            d="M24 12l2.6 8.4H35l-6.5 5.500 2.100 8.500L24 30.400 17.400 35l2.100-8.500L13 21l8.400-.6z"
            fill="#1a1204"
          />
        </svg>
        <span>Unmatched Draft</span>
      </div>
      <h1 v-if="variant !== 9" class="pn-title">{{ C.title }}</h1>
      <h1 v-else class="pn-title">
        {{ C.titleA }}
        <span class="pn-words">
          <b v-for="word in C.words" :key="word">{{ word }}</b>
        </span>
      </h1>
      <p class="pn-lead">{{ C.lead }}</p>
    </div>

    <div class="pn-body">
      <template v-if="variant === 1">
        <div class="pn1-fan">
          <img
            v-for="(src, i) in fan"
            :key="src"
            :src="src"
            :class="'f' + i"
            alt=""
          />
        </div>
        <ul class="pn-rows">
          <li v-for="row in C.rows" :key="row[1]">
            <span class="pn-ico">{{ row[0] }}</span>
            <span
              ><strong>{{ row[1] }}</strong
              ><small>{{ row[2] }}</small></span
            >
          </li>
        </ul>
      </template>

      <template v-else-if="variant === 2">
        <div class="pn2">
          <div class="pn2-col is-bad">
            <h3>{{ C.badTitle }}</h3>
            <p v-for="line in C.bad" :key="line"><i>✕</i>{{ line }}</p>
          </div>
          <div class="pn2-col is-good">
            <h3>{{ C.goodTitle }}</h3>
            <p v-for="line in C.good" :key="line"><i>✓</i>{{ line }}</p>
          </div>
        </div>
      </template>

      <template v-else-if="variant === 3">
        <ol class="pn3">
          <li v-for="step in C.steps" :key="step[1]">
            <span class="pn3-dot">{{ step[0] }}</span>
            <span
              ><strong>{{ step[1] }}</strong
              ><small>{{ step[2] }}</small></span
            >
          </li>
        </ol>
      </template>

      <template v-else-if="variant === 4">
        <ul class="pn4">
          <li v-for="item in C.items" :key="item[0]">
            <i>✓</i>
            <span
              ><strong>{{ item[0] }}</strong
              ><small>{{ item[1] }}</small></span
            >
          </li>
        </ul>
      </template>

      <template v-else-if="variant === 5">
        <div class="pn5">
          <img :src="hero" alt="" />
          <div class="pn5-bubble">{{ C.quote }}</div>
        </div>
        <div class="pn-chips">
          <span v-for="chip in C.chips" :key="chip">{{ chip }}</span>
        </div>
      </template>

      <template v-else-if="variant === 6">
        <div class="pn6">
          <div class="pn6-laptop">
            <i
              v-for="n in 4"
              :key="n"
              :style="{ width: 40 + ((n * 17) % 50) + '%' }"
            ></i>
          </div>
          <div class="pn6-sync">⇄</div>
          <div class="pn6-phone">
            <i
              v-for="n in 4"
              :key="n"
              :style="{ width: 40 + ((n * 17) % 50) + '%' }"
            ></i>
          </div>
        </div>
        <p class="pn-caption">{{ C.caption }}</p>
      </template>

      <template v-else-if="variant === 7">
        <div class="pn7">
          <div
            v-for="(perk, i) in C.perks"
            :key="perk[0]"
            class="pn7-card"
            :class="'c' + i"
          >
            <span class="pn7-val">{{ perk[0] }}</span>
            <strong>{{ perk[1] }}</strong>
            <small>{{ perk[2] }}</small>
          </div>
        </div>
      </template>

      <template v-else-if="variant === 8">
        <dl class="pn8">
          <template v-for="qa in C.faq" :key="qa[0]">
            <dt>{{ qa[0] }}</dt>
            <dd>{{ qa[1] }}</dd>
          </template>
        </dl>
      </template>

      <template v-else-if="variant === 9">
        <ul class="pn9">
          <li v-for="line in C.lines" :key="line">{{ line }}</li>
        </ul>
      </template>

      <template v-else>
        <div class="pn10">
          <div v-for="slot in C.slots" :key="slot[1]" class="pn10-slot">
            <span>{{ slot[0] }}</span>
            <strong>{{ slot[1] }}</strong>
          </div>
        </div>
        <p class="pn-caption">{{ C.caption }}</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { cardUrls, portraitUrls } from "./authAssets";

const props = defineProps({
  variant: { type: Number, default: 1 },
});

const { lang } = useDraftState();

const fan = [cardUrls[10], cardUrls[11], cardUrls[12]];
const hero = portraitUrls[2];

const dict = {
  ua: {
    1: {
      title: "Ваші драфти скрізь",
      lead: "Один безкоштовний акаунт зберігає прогрес і синхронізує його між телефоном і комп'ютером.",
      rows: [
        [
          "☁️",
          "Хмарна синхронізація",
          "Драфти, формати й колоди на будь-якому пристрої",
        ],
        ["🗡", "Забіги Роуглайку", "Продовжуйте забіг з того ж місця"],
        ["🔒", "Приватно", "Ваші дані бачите лише ви"],
      ],
    },
    2: {
      title: "З акаунтом і без",
      lead: "Різниця стає помітною в той момент, коли ви змінюєте пристрій або чистите браузер.",
      badTitle: "Без акаунта",
      goodTitle: "З акаунтом",
      bad: [
        "Дані живуть в одному браузері",
        "Очистили кеш і все зникло",
        "Телефон і ПК не знають один про одного",
      ],
      good: [
        "Все збережено в хмарі",
        "Увійшли й усе на місці",
        "Той самий драфт на будь-якому екрані",
      ],
    },
    3: {
      title: "Один день з акаунтом",
      lead: "Ви починаєте на одному пристрої й спокійно закінчуєте на іншому.",
      steps: [
        [
          "🏠",
          "Вдома, за комп'ютером",
          "Збираєте власний формат і починаєте драфт",
        ],
        [
          "🚌",
          "У дорозі, з телефона",
          "Відкриваєте той самий драфт і продовжуєте",
        ],
        ["🌙", "Увечері", "Добираєте забіг Роуглайку з місця, де зупинилися"],
      ],
    },
    4: {
      title: "Що збережеться",
      lead: "Усе, що ви створюєте на сайті, лишається вашим, навіть якщо зміниться телефон.",
      items: [
        ["Драфти", "Поточні й завершені, з усіма піками"],
        ["Власні формати", "Правила, які ви налаштували"],
        ["Збережені колоди", "Для гри, драфту й Роуглайку"],
        ["Забіги Роуглайку", "Колода, золото й мапа забігу"],
        ["Історія", "Що ви грали й чим закінчилось"],
      ],
    },
    5: {
      title: "Мандрівнику, не губи прогрес!",
      lead: "Увійдіть один раз і більше не думайте про збереження.",
      quote:
        "Я пройшов сім подорожей, але свій забіг у Роуглайку з телефона вперше загубив. Не повторюйте моєї помилки: зробіть акаунт!",
      chips: ["Безкоштовно", "Без реклами", "10 секунд"],
    },
    6: {
      title: "ПК і телефон завжди разом",
      lead: "Змінили щось на одному пристрої, і воно вже на другому.",
      caption: "Драфти, формати, колоди й забіги синхронізуються автоматично.",
    },
    7: {
      title: "Три причини для акаунта",
      lead: "Як у грі: невеликий внесок, помітна перевага.",
      perks: [
        [
          "1",
          "Хмара",
          "Після входу: усі ваші драфти й колоди з'являються на будь-якому пристрої.",
        ],
        [
          "2",
          "Забіг",
          "Під час забігу: гра зберігається, і ви продовжуєте з того ж вузла мапи.",
        ],
        [
          "3",
          "Спокій",
          "Завжди: очистили браузер чи змінили телефон, нічого не втрачено.",
        ],
      ],
    },
    8: {
      title: "Навіщо мені акаунт?",
      lead: "Коротко про головне.",
      faq: [
        [
          "Що це дає?",
          "Драфти, власні формати, колоди й забіги Роуглайку зберігаються в хмарі й доступні з будь-якого пристрою.",
        ],
        ["Це платно?", "Ні. Акаунт безкоштовний, на сайті немає реклами."],
        [
          "Хто бачить мої дані?",
          "Лише ви. Кожен акаунт бачить тільки власні записи.",
        ],
      ],
    },
    9: {
      titleA: "Ваші",
      words: ["драфти", "формати", "колоди", "забіги"],
      lead: "Усе це можна зберегти в одному безкоштовному акаунті.",
      lines: [
        "Продовжуйте з іншого пристрою",
        "Не губіть прогрес Роуглайку",
        "Будуйте власну колекцію форматів",
      ],
    },
    10: {
      title: "Ваш інвентар у хмарі",
      lead: "Створіть акаунт, і ці слоти будуть із вами всюди.",
      slots: [
        ["🗂", "Драфти"],
        ["⚙️", "Формати"],
        ["🃏", "Колоди"],
        ["🗡", "Забіги"],
        ["📜", "Історія"],
        ["🌐", "Будь-який пристрій"],
      ],
      caption: "Безкоштовно, займає десять секунд.",
    },
  },
  en: {
    1: {
      title: "Your drafts, everywhere",
      lead: "One free account keeps your progress safe and in sync between phone and computer.",
      rows: [
        ["☁️", "Cloud sync", "Drafts, formats and decks on any device"],
        ["🗡", "Roguelike runs", "Continue a run where you stopped"],
        ["🔒", "Private", "Only you can see your data"],
      ],
    },
    2: {
      title: "With and without",
      lead: "The difference shows the moment you switch devices or clear your browser.",
      badTitle: "No account",
      goodTitle: "With an account",
      bad: [
        "Data lives in one browser",
        "Clear the cache and it's gone",
        "Phone and PC don't know each other",
      ],
      good: [
        "Everything saved in the cloud",
        "Sign in and it's all there",
        "The same draft on any screen",
      ],
    },
    3: {
      title: "One day with an account",
      lead: "Start on one device, calmly finish on another.",
      steps: [
        [
          "🏠",
          "At home, on the computer",
          "Build a custom format and start a draft",
        ],
        ["🚌", "On the go, on the phone", "Open the same draft and carry on"],
        [
          "🌙",
          "In the evening",
          "Pick up a roguelike run exactly where you left it",
        ],
      ],
    },
    4: {
      title: "What gets saved",
      lead: "Everything you create here stays yours, even if you change phones.",
      items: [
        ["Drafts", "In progress and finished, every pick"],
        ["Custom formats", "The rules you set up"],
        ["Saved decks", "For games, drafts and roguelike"],
        ["Roguelike runs", "Deck, gold and run map"],
        ["History", "What you played and how it ended"],
      ],
    },
    5: {
      title: "Traveler, don't lose your progress!",
      lead: "Sign in once and stop worrying about saving.",
      quote:
        "I survived seven voyages, yet I once lost a roguelike run on my phone. Don't repeat my mistake: make an account!",
      chips: ["Free", "No ads", "10 seconds"],
    },
    6: {
      title: "PC and phone, always together",
      lead: "Change something on one device and it's already on the other.",
      caption: "Drafts, formats, decks and runs sync automatically.",
    },
    7: {
      title: "Three reasons for an account",
      lead: "Like in the game: a small investment, a clear edge.",
      perks: [
        [
          "1",
          "Cloud",
          "After sign-in: all your drafts and decks appear on any device.",
        ],
        [
          "2",
          "Run",
          "During a run: the game saves, and you resume from the same map node.",
        ],
        [
          "3",
          "Peace",
          "Always: clear the browser or change phones, nothing is lost.",
        ],
      ],
    },
    8: {
      title: "Why do I need an account?",
      lead: "The short version.",
      faq: [
        [
          "What does it give me?",
          "Drafts, custom formats, decks and roguelike runs are stored in the cloud and open on any device.",
        ],
        ["Is it paid?", "No. The account is free and the site has no ads."],
        [
          "Who can see my data?",
          "Only you. Each account sees only its own records.",
        ],
      ],
    },
    9: {
      titleA: "Your",
      words: ["drafts", "formats", "decks", "runs"],
      lead: "All of it can live in one free account.",
      lines: [
        "Continue from another device",
        "Never lose roguelike progress",
        "Build your own collection of formats",
      ],
    },
    10: {
      title: "Your inventory in the cloud",
      lead: "Create an account and these slots follow you everywhere.",
      slots: [
        ["🗂", "Drafts"],
        ["⚙️", "Formats"],
        ["🃏", "Decks"],
        ["🗡", "Runs"],
        ["📜", "History"],
        ["🌐", "Any device"],
      ],
      caption: "Free, takes ten seconds.",
    },
  },
};

const C = computed(() => (dict[lang.value] || dict.en)[props.variant]);
</script>

<style scoped>
.pn {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: 100%;
  padding: 36px 34px;
  color: #f8fafc;
  background:
    radial-gradient(circle at 15% 0%, rgba(79, 124, 255, 0.3), transparent 55%),
    radial-gradient(
      circle at 100% 100%,
      rgba(239, 68, 68, 0.26),
      transparent 55%
    ),
    rgba(255, 255, 255, 0.03);
}

.pn-head {
  display: grid;
  gap: 10px;
}

.pn-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
}

.pn-logo svg {
  width: 32px;
  height: 32px;
}

.pn-title {
  margin: 8px 0 0;
  font-size: 1.9rem;
  font-weight: 900;
  line-height: 1.1;
}

.pn-lead {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.5;
}

.pn-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  justify-content: center;
}

strong {
  display: block;
  font-size: 0.93rem;
}

small {
  display: block;
  color: #94a3b8;
  font-size: 0.8rem;
  line-height: 1.4;
}

.pn-caption {
  margin: 0;
  color: #94a3b8;
  font-size: 0.85rem;
  text-align: center;
}

.pn1-fan {
  position: relative;
  height: 160px;
  margin-bottom: 16px;
}

.pn1-fan img {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 104px;
  border-radius: 9px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55);
}

.pn1-fan .f0 {
  transform: translateX(-50%) rotate(-14deg) translateX(-60px);
}

.pn1-fan .f1 {
  z-index: 1;
  transform: translateX(-50%) translateY(-10px);
}

.pn1-fan .f2 {
  transform: translateX(-50%) rotate(14deg) translateX(60px);
}

.pn-rows,
.pn4,
.pn9 {
  display: grid;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.pn-rows li,
.pn4 li {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pn-ico {
  display: grid;
  flex: none;
  place-items: center;
  width: 38px;
  height: 38px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.pn2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pn2-col {
  padding: 14px;
  border-radius: 16px;
}

.pn2-col h3 {
  margin: 0 0 8px;
  font-size: 0.95rem;
  font-weight: 800;
}

.pn2-col p {
  display: flex;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 0.82rem;
  line-height: 1.35;
}

.pn2-col i {
  flex: none;
  font-style: normal;
  font-weight: 900;
}

.is-bad {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.is-good {
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.pn3 {
  position: relative;
  display: grid;
  gap: 18px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.pn3::before {
  position: absolute;
  top: 20px;
  bottom: 20px;
  left: 19px;
  width: 2px;
  content: "";
  background: linear-gradient(#4f7cff, #ef4444);
  opacity: 0.6;
}

.pn3 li {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
}

.pn3-dot {
  position: relative;
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  background: #0f172a;
  border: 2px solid #4f7cff;
  border-radius: 50%;
}

.pn4 i {
  display: grid;
  flex: none;
  place-items: center;
  width: 26px;
  height: 26px;
  color: #052e16;
  font-style: normal;
  font-weight: 900;
  background: #4ade80;
  border-radius: 50%;
}

.pn5 {
  display: flex;
  align-items: center;
  gap: 14px;
}

.pn5 img {
  flex: none;
  width: 96px;
  height: 96px;
  object-fit: cover;
  border: 3px solid #facc15;
  border-radius: 50%;
  box-shadow: 0 10px 28px rgba(250, 204, 21, 0.3);
}

.pn5-bubble {
  position: relative;
  padding: 14px 16px;
  font-size: 0.88rem;
  line-height: 1.45;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px 18px 18px 18px;
}

.pn-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pn-chips span {
  padding: 5px 12px;
  color: #facc15;
  font-size: 0.8rem;
  font-weight: 800;
  border: 1px solid rgba(250, 204, 21, 0.5);
  border-radius: 999px;
}

.pn6 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.pn6-laptop {
  display: grid;
  gap: 8px;
  align-content: center;
  width: 190px;
  height: 120px;
  padding: 14px;
  background: #0b1224;
  border: 3px solid #334155;
  border-radius: 10px 10px 4px 4px;
}

.pn6-phone {
  display: grid;
  gap: 8px;
  align-content: center;
  width: 66px;
  height: 126px;
  padding: 10px 8px;
  background: #0b1224;
  border: 3px solid #334155;
  border-radius: 14px;
}

.pn6-laptop i,
.pn6-phone i {
  display: block;
  height: 8px;
  background: linear-gradient(90deg, #4f7cff, #7aa2ff);
  border-radius: 4px;
}

.pn6-sync {
  color: #facc15;
  font-size: 1.6rem;
  animation: pn-pulse 2s ease-in-out infinite;
}

@keyframes pn-pulse {
  50% {
    opacity: 0.4;
    transform: scale(1.2);
  }
}

.pn7 {
  display: grid;
  gap: 10px;
}

.pn7-card {
  position: relative;
  padding: 12px 14px 12px 56px;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
}

.pn7-card.c0 {
  border-color: #60a5fa;
}

.pn7-card.c1 {
  border-color: #f87171;
}

.pn7-card.c2 {
  border-color: #4ade80;
}

.pn7-val {
  position: absolute;
  top: 50%;
  left: 12px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #fff;
  font-weight: 900;
  background: #0b1224;
  border: 2px solid currentColor;
  border-radius: 50%;
  transform: translateY(-50%);
}

.pn8 {
  display: grid;
  gap: 4px;
  margin: 0;
}

.pn8 dt {
  margin-top: 8px;
  color: #facc15;
  font-size: 0.92rem;
  font-weight: 800;
}

.pn8 dd {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.85rem;
  line-height: 1.45;
}

.pn-words {
  display: inline-grid;
  height: 1.15em;
  overflow: hidden;
  vertical-align: bottom;
  color: #facc15;
}

.pn-words b {
  grid-area: 1 / 1;
  opacity: 0;
  transform: translateY(100%);
  animation: pn-word 8s infinite;
}

.pn-words b:nth-child(2) {
  animation-delay: 2s;
}

.pn-words b:nth-child(3) {
  animation-delay: 4s;
}

.pn-words b:nth-child(4) {
  animation-delay: 6s;
}

@keyframes pn-word {
  0% {
    opacity: 0;
    transform: translateY(100%);
  }
  5%,
  22% {
    opacity: 1;
    transform: translateY(0);
  }
  27%,
  100% {
    opacity: 0;
    transform: translateY(-100%);
  }
}

.pn9 li {
  position: relative;
  padding-left: 22px;
  color: #e2e8f0;
}

.pn9 li::before {
  position: absolute;
  top: 0.5em;
  left: 0;
  width: 8px;
  height: 8px;
  content: "";
  background: #facc15;
  border-radius: 2px;
  transform: rotate(45deg);
}

.pn10 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.pn10-slot {
  display: grid;
  gap: 6px;
  justify-items: center;
  padding: 14px 6px;
  text-align: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
}

.pn10-slot span {
  font-size: 1.5rem;
}

.pn10-slot strong {
  font-size: 0.78rem;
}

@media (max-width: 820px) {
  .pn {
    gap: 8px;
    padding: 22px 22px 18px;
  }
  .pn-title {
    font-size: 1.45rem;
  }
  .pn-body {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pn-words b,
  .pn6-sync {
    animation: none;
  }
  .pn-words b:first-child {
    opacity: 1;
    transform: none;
  }
}
</style>
