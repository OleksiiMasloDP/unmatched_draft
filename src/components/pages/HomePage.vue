<template>
  <div ref="root" class="home" :class="{ 'reveal-on': revealOn }">
    <!-- ================= HERO ================= -->
    <section class="home-hero" @pointermove="heroMove">
      <div class="home-bg" aria-hidden="true">
        <div
          v-for="(img, i) in bgSlides"
          :key="img"
          class="home-slide"
          :style="{
            backgroundImage: `url(${abs(img)})`,
            animationDelay: `${i * 6}s`,
          }"
        ></div>
        <div class="home-bg-tint"></div>
        <div class="home-bg-fade"></div>
      </div>
      <div class="home-spot" aria-hidden="true"></div>
      <div class="home-orb home-orb-blue"></div>
      <div class="home-orb home-orb-red"></div>

      <div class="home-hero-inner">
        <p class="home-eyebrow">{{ L.eyebrow }}</p>
        <h1 class="home-title">
          <span>UNMATCHED</span>
          <span class="home-title-accent">DRAFT</span>
        </h1>
        <p class="home-tagline">{{ L.tagline }}</p>

        <div class="home-cta">
          <router-link :to="{ name: 'main' }" class="home-btn home-btn-primary">
            {{ L.ctaDraft }}
          </router-link>
          <router-link
            :to="{ name: 'formats' }"
            class="home-btn home-btn-ghost"
          >
            {{ L.ctaFormats }}
          </router-link>
        </div>

        <ul class="home-stats">
          <li v-for="s in stats" :key="s">
            <strong>{{ shown[s] }}</strong>
            <span>{{ L.stats[s] }}</span>
          </li>
        </ul>
      </div>

      <div v-if="rowA.length" class="home-marquees" aria-hidden="true">
        <div class="home-marquee">
          <div class="home-track">
            <img
              v-for="(c, i) in [...rowA, ...rowA]"
              :key="'a' + i"
              :src="c.image"
              alt=""
              loading="lazy"
              class="home-portrait"
            />
          </div>
        </div>
        <div class="home-marquee">
          <div class="home-track home-track-reverse">
            <img
              v-for="(c, i) in [...rowB, ...rowB]"
              :key="'b' + i"
              :src="c.image"
              alt=""
              loading="lazy"
              class="home-portrait"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ================= LIVE DRAFT DEMO ================= -->
    <section class="home-section">
      <h2 class="home-h2" data-reveal>{{ L.aboutTitle }}</h2>
      <p class="home-lead" data-reveal>{{ L.aboutText }}</p>

      <div class="home-demo" data-reveal>
        <div
          v-for="side in sides"
          :key="side.key"
          class="demo-side"
          :class="[`is-${side.color}`, `order-${side.order}`]"
        >
          <div class="demo-label">{{ side.p1 ? L.p1 : L.p2 }}</div>
          <div class="demo-row demo-bans">
            <div
              v-for="s in slotsOf(side.p1, 'ban')"
              :key="s.i"
              class="demo-slot is-ban"
              :class="{ filled: demoStep > s.i, active: demoStep === s.i }"
            >
              <img
                v-if="demoStep > s.i"
                :src="demoHeroes[s.i] && demoHeroes[s.i].image"
                alt=""
              />
              <span v-else class="demo-ph">BAN</span>
            </div>
          </div>
          <div class="demo-row demo-picks">
            <div
              v-for="s in slotsOf(side.p1, 'pick')"
              :key="s.i"
              class="demo-slot is-pick"
              :class="{ filled: demoStep > s.i, active: demoStep === s.i }"
            >
              <img
                v-if="demoStep > s.i"
                :src="demoHeroes[s.i] && demoHeroes[s.i].image"
                alt=""
              />
              <span v-else class="demo-ph">PICK</span>
            </div>
          </div>
        </div>

        <div class="demo-center">
          <div class="demo-vs">VS</div>
          <div class="demo-status" :key="demoStatus">{{ demoStatus }}</div>
          <div
            class="demo-map"
            :class="{ show: demoDone }"
            :style="demoMapStyle"
          >
            <span>{{ L.mapWord }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= HOW IT WORKS ================= -->
    <section class="home-section">
      <h2 class="home-h2" data-reveal>{{ L.howTitle }}</h2>
      <ol class="home-steps">
        <li
          v-for="(step, i) in L.steps"
          :key="i"
          data-reveal
          :style="{ '--d': i * 120 + 'ms' }"
        >
          <span class="home-step-num">{{ i + 1 }}</span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.text }}</p>
        </li>
      </ol>
    </section>

    <!-- ================= FEATURES ================= -->
    <section class="home-section">
      <h2 class="home-h2" data-reveal>{{ L.featuresTitle }}</h2>
      <div class="home-grid">
        <router-link
          v-for="(f, i) in features"
          :key="f.route"
          :to="{ name: f.route }"
          class="home-card"
          :class="{ 'is-beta': f.beta }"
          data-reveal
          :style="{ '--d': (i % 3) * 100 + 'ms' }"
          @pointermove="cardMove"
          @pointerleave="cardLeave"
        >
          <img
            v-if="artFor(f, i)"
            :src="artFor(f, i)"
            alt=""
            loading="lazy"
            class="home-card-art"
            :class="{ 'is-map': f.art === 'map' }"
          />
          <div class="home-card-body">
            <span class="home-card-icon">{{ f.icon }}</span>
            <span v-if="f.beta" class="home-card-badge">
              🔒 {{ L.betaBadge }}
            </span>
            <h3>{{ L.features[f.key].title }}</h3>
            <p>{{ L.features[f.key].text }}</p>
            <span class="home-card-link">{{ L.open }} →</span>
          </div>
        </router-link>
      </div>
    </section>

    <!-- ================= BETA NOTICE ================= -->
    <section class="home-section">
      <div class="home-beta" data-reveal>
        <h2>{{ L.betaTitle }}</h2>
        <p>{{ L.betaText }}</p>
      </div>
    </section>

    <footer class="home-footer">
      <div class="foot-line" aria-hidden="true"></div>
      <div class="foot-inner">
        <div class="foot-brand">
          <div class="foot-logo">
            <span>UNMATCHED</span>
            <span class="foot-logo-accent">DRAFT</span>
          </div>
          <p>{{ L.foot.brand }}</p>
          <ReportBugButton />
        </div>

        <nav class="foot-col">
          <h4>{{ L.foot.tools }}</h4>
          <router-link
            v-for="f in toolLinks"
            :key="f.route"
            :to="{ name: f.route }"
          >
            {{ L.features[f.key].title }}
          </router-link>
        </nav>

        <nav class="foot-col">
          <h4>{{ L.foot.beta }}</h4>
          <router-link
            v-for="f in betaLinks"
            :key="f.route"
            :to="{ name: f.route }"
          >
            🔒 {{ L.features[f.key].title }}
          </router-link>
        </nav>

        <nav class="foot-col">
          <h4>{{ L.foot.project }}</h4>
          <a :href="FEEDBACK.githubRepo" target="_blank" rel="noopener">
            GitHub
          </a>
          <button type="button" class="foot-link" @click="openFeedback()">
            {{ L.foot.report }}
          </button>
          <button type="button" class="foot-link" @click="scrollTop">
            ↑ {{ L.foot.top }}
          </button>
        </nav>
      </div>

      <div class="foot-bottom">
        <p>{{ L.footer }}</p>
        <p>© {{ year }} Unmatched Draft</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import {
  computed,
  reactive,
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { banPresets } from "../../draftFormats.js";
import ReportBugButton from "../ReportBugButton.vue";
import { useFeedback } from "../../composables/useFeedback";
import { FEEDBACK } from "../../feedbackConfig";

const { lang, characters, maps } = useDraftState();

/* ---------------- тексти ---------------- */
const dict = {
  en: {
    eyebrow: "Draft simulator for the Unmatched board game",
    tagline:
      "Ban and pick heroes, choose the map, test new formats and even play the match — all in your browser.",
    ctaDraft: "Start drafting",
    ctaFormats: "Draft formats",
    stats: {
      tools: "tools",
      schemes: "draft schemes",
      guides: "hero guides",
      langs: "languages",
    },
    p1: "Player 1",
    p2: "Player 2",
    bans: "bans…",
    picks: "picks…",
    mapWord: "MAP",
    demoDone: "Draft complete — map chosen!",
    aboutTitle: "What is this?",
    aboutText:
      "Unmatched Draftsim is a fan-made toolbox for players who like to draft. Run a ban/pick with your opponent, see how heroes rank and which maps suit them, build your own draft formats, and take the result straight into a game.",
    howTitle: "How it works",
    steps: [
      {
        title: "Pick a format",
        text: "Choose a ready-made format or build your own: allowed heroes, maps and the ban/pick scheme.",
      },
      {
        title: "Draft the heroes",
        text: "Take turns banning and picking heroes, or choose simultaneously in Ladder mode.",
      },
      {
        title: "Choose the map and play",
        text: "Pick the battlefield, check matchups and guides — then fight it out.",
      },
    ],
    featuresTitle: "What's inside",
    open: "Open",
    betaBadge: "Beta",
    features: {
      draft: {
        title: "Draft simulator",
        text: "Turn-based ban/pick (3 bans / 5 picks, 2 bans / 4 picks) or simultaneous Ladder mode, with heroes ranked by Elo — and a map choice at the end.",
      },
      formats: {
        title: "Draft formats",
        text: "Ready-made formats plus an editor for your own: choose heroes, maps and the ban/pick scheme. Saved in your browser.",
      },
      maps: {
        title: "Hero map guide",
        text: "See which maps favor, are neutral to, or disfavor every hero before you commit to a pick.",
      },
      matchups: {
        title: "Hero matchups",
        text: "Head-to-head win rates and the best maps for a duel, plus a generator for balanced matchups from your own collection.",
      },
      guide: {
        title: "Character guides",
        text: "Tactical tips, deep meta insights and matchup breakdowns for your favorite fighters.",
      },
      "pack-draft": {
        title: "Pack Draft",
        text: "A 2-player, 4-hero format: all cards go into one pool, get split into packs and drafted — and only then played.",
      },
      game: {
        title: "Game",
        text: "Play your drafted decks on one screen or online with a room code: hand, deck, attacks, maneuvers and a battle log.",
      },
    },
    betaTitle: "Pack Draft and Game are in closed beta",
    betaText:
      "These two sections are available to testers only. If the author gave you a password, open either of them and enter it once — the browser will remember it. Everything else on the site is open to everyone.",
    foot: {
      brand:
        "Draft simulator and toolbox for the Unmatched board game: ban/pick, formats, maps, matchups, guides and a playable beta.",
      tools: "Tools",
      beta: "Closed beta",
      project: "Project",
      report: "Report a bug / feedback",
      top: "Back to top",
    },
    footer:
      "Fan-made tool for the Unmatched board game. Not affiliated with the game's publishers.",
  },
  ua: {
    eyebrow: "Драфт-симулятор для настільної гри Unmatched",
    tagline:
      "Банте й пікайте героїв, обирайте мапу, пробуйте нові формати і навіть грайте матч — усе в браузері.",
    ctaDraft: "Почати драфт",
    ctaFormats: "Формати драфту",
    stats: {
      tools: "інструментів",
      schemes: "схеми драфту",
      guides: "гайдів",
      langs: "мови",
    },
    p1: "Гравець 1",
    p2: "Гравець 2",
    bans: "банить…",
    picks: "обирає…",
    mapWord: "МАПА",
    demoDone: "Драфт завершено — мапу обрано!",
    aboutTitle: "Що це?",
    aboutText:
      "Unmatched Draftsim — фанатський набір інструментів для тих, хто любить драфт. Проведіть бан/пік із суперником, подивіться рейтинг героїв і які мапи їм підходять, створіть власні формати драфту та одразу перейдіть до гри.",
    howTitle: "Як це працює",
    steps: [
      {
        title: "Оберіть формат",
        text: "Готовий формат або власний: дозволені герої, мапи та схема банів/піків.",
      },
      {
        title: "Задрафтуйте героїв",
        text: "По черзі банте й пікайте героїв або обирайте одночасно в режимі Ladder.",
      },
      {
        title: "Оберіть мапу та грайте",
        text: "Виберіть поле бою, гляньте матчапи та гайди — і в бій.",
      },
    ],
    featuresTitle: "Що всередині",
    open: "Відкрити",
    betaBadge: "Бета",
    features: {
      draft: {
        title: "Драфт-симулятор",
        text: "Покроковий бан/пік (3 бани / 5 піків, 2 бани / 4 піки) або одночасний режим Ladder, герої з рейтингом Elo — і вибір мапи наприкінці.",
      },
      formats: {
        title: "Формати драфту",
        text: "Готові формати та редактор власних: герої, мапи й схема банів/піків. Зберігається у вашому браузері.",
      },
      maps: {
        title: "Мапи героїв",
        text: "Які мапи підсилюють, нейтральні або невигідні кожному герою — ще до того, як ви зробите пік.",
      },
      matchups: {
        title: "Матчапи героїв",
        text: "Вінрейт у дуелях і найкращі мапи для них, а ще генератор збалансованих матчапів з вашої колекції.",
      },
      guide: {
        title: "Гайди по персонажах",
        text: "Тактичні поради, глибокий мета-аналіз і розбір матчапів для ваших улюблених бійців.",
      },
      "pack-draft": {
        title: "Pack Draft",
        text: "Формат для 2 гравців і 4 героїв: усі карти йдуть в один пул, діляться на паки й драфтяться — і лише потім грають.",
      },
      game: {
        title: "Гра",
        text: "Грайте задрафтовані колоди на одному екрані або онлайн за кодом кімнати: рука, колода, атаки, маневри та журнал бою.",
      },
    },
    betaTitle: "Pack Draft і Гра — закрита бета",
    betaText:
      "Ці два розділи доступні лише тестерам. Якщо автор дав вам пароль, відкрийте будь-який із них і введіть його один раз — браузер запам'ятає. Решта сайту відкрита для всіх.",
    foot: {
      brand:
        "Драфт-симулятор і набір інструментів для настільної гри Unmatched: бан/пік, формати, мапи, матчапи, гайди та гра в бета-версії.",
      tools: "Інструменти",
      beta: "Закрита бета",
      project: "Проєкт",
      report: "Повідомити про баг / фідбек",
      top: "Нагору",
    },
    footer:
      "Фанатський інструмент для настільної гри Unmatched. Не пов'язаний з видавцями гри.",
  },
};

const L = computed(() => dict[lang.value] || dict.en);

const features = [
  { key: "draft", route: "main", icon: "⚔️", art: "hero" },
  { key: "formats", route: "formats", icon: "🧩", art: "map" },
  { key: "maps", route: "maps", icon: "🗺️", art: "map" },
  { key: "matchups", route: "matchups", icon: "🆚", art: "hero" },
  { key: "guide", route: "guide", icon: "📖", art: "hero" },
  {
    key: "pack-draft",
    route: "pack-draft",
    icon: "🎴",
    art: "map",
    beta: true,
  },
  { key: "game", route: "game", icon: "🎮", art: "hero", beta: true },
];

const { openFeedback } = useFeedback();
const year = new Date().getFullYear();
const toolLinks = features.filter((f) => !f.beta);
const betaLinks = features.filter((f) => f.beta);
const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const abs = (path) => new URL(path, document.baseURI).href;

const heroPool = computed(() =>
  [...characters.value]
    .filter((c) => c.image)
    .sort((a, b) => b.elo - a.elo)
    .slice(0, 24),
);
const mapPool = computed(() =>
  maps.value.map((m) => m.image).filter((i) => i && i.endsWith(".webp")),
);

const rowA = computed(() => heroPool.value.filter((_, i) => i % 2 === 0));
const rowB = computed(() => heroPool.value.filter((_, i) => i % 2 === 1));

const bgSlides = computed(() => {
  const pool = mapPool.value;
  if (!pool.length) return [];
  const step = Math.max(1, Math.floor(pool.length / 5));
  return Array.from({ length: Math.min(5, pool.length) }, (_, i) => {
    return pool[(i * step + 3) % pool.length];
  });
});

function artFor(f, i) {
  if (f.art === "map") {
    const pool = mapPool.value;
    return pool.length ? pool[(i * 3 + 1) % pool.length] : "";
  }
  const pool = heroPool.value;
  return pool.length ? pool[(i * 2 + 1) % pool.length].image : "";
}

const stats = ["tools", "schemes", "guides", "langs"];
const guidesCount = ref(15);

const targets = computed(() => ({
  tools: features.length,
  schemes: Object.keys(banPresets).length,
  guides: guidesCount.value,
  langs: 2,
}));

const shown = reactive({ tools: 0, schemes: 0, guides: 0, langs: 0 });

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function countUp() {
  const to = targets.value;
  if (prefersReduced()) {
    Object.assign(shown, to);
    return;
  }
  const start = performance.now();
  const duration = 1100;
  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    for (const k of Object.keys(shown)) shown[k] = Math.round(to[k] * eased);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

async function loadGuidesCount() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}guides/index.json`);
    if (!res.ok) return;
    const list = await res.json();
    if (Array.isArray(list) && list.length) guidesCount.value = list.length;
  } catch {
    // лишаємо значення за замовчуванням
  }
}
watch(guidesCount, () => countUp());

const demoSeq = banPresets.two_bans_four_picks.sequence;
const sides = [
  { key: "p1", p1: true, color: "blue", order: 0 },
  { key: "p2", p1: false, color: "red", order: 2 },
];
const slotsOf = (p1, type) =>
  demoSeq
    .map((s, i) => ({ i, type: s.type, p1: s.p1 }))
    .filter((s) => s.p1 === p1 && s.type === type);

const demoStep = ref(0);
const demoHeroes = ref([]);
const demoMap = ref("");
const demoDone = computed(() => demoStep.value >= demoSeq.length);

const demoStatus = computed(() => {
  if (demoDone.value) return L.value.demoDone;
  const s = demoSeq[demoStep.value];
  return `${s.p1 ? L.value.p1 : L.value.p2} ${
    s.type === "ban" ? L.value.bans : L.value.picks
  }`;
});

const demoMapStyle = computed(() =>
  demoMap.value ? { backgroundImage: `url(${abs(demoMap.value)})` } : {},
);

function reshuffleDemo() {
  const heroes = characters.value.filter((c) => c.image);
  const shuffled = [...heroes].sort(() => Math.random() - 0.5);
  demoHeroes.value = shuffled.slice(0, demoSeq.length);
  const pool = mapPool.value;
  demoMap.value = pool.length
    ? pool[Math.floor(Math.random() * pool.length)]
    : "";
}

let demoTimer = null;
let holdTicks = 0;
function demoTick() {
  if (demoStep.value < demoSeq.length) {
    demoStep.value++;
  } else if (++holdTicks >= 5) {
    holdTicks = 0;
    demoStep.value = 0;
    reshuffleDemo();
  }
}

const root = ref(null);
const revealOn = ref(false);
let observer = null;

function heroMove(e) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}
function cardMove(e) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  el.style.setProperty("--x", `${x}px`);
  el.style.setProperty("--y", `${y}px`);
  el.style.setProperty("--ry", `${((x / r.width - 0.5) * 8).toFixed(2)}deg`);
  el.style.setProperty("--rx", `${((0.5 - y / r.height) * 8).toFixed(2)}deg`);
}
function cardLeave(e) {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
}

reshuffleDemo();

onMounted(async () => {
  countUp();
  loadGuidesCount();

  if (prefersReduced()) {
    demoStep.value = demoSeq.length;
    return;
  }

  demoTimer = setInterval(demoTick, 800);

  if ("IntersectionObserver" in window && root.value) {
    revealOn.value = true;
    await nextTick();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    root.value
      .querySelectorAll("[data-reveal]")
      .forEach((el) => observer.observe(el));
  }
});

onBeforeUnmount(() => {
  if (demoTimer) clearInterval(demoTimer);
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.home {
  overflow-x: hidden;
  color: var(--text-main, #f8fafc);
}

.reveal-on [data-reveal]:not(.is-in) {
  opacity: 0;
  transform: translateY(28px);
}
.reveal-on [data-reveal] {
  transition:
    opacity 0.7s ease var(--d, 0ms),
    transform 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) var(--d, 0ms);
}

.home-hero {
  --mx: 50%;
  --my: 30%;
  position: relative;
  padding: 64px 16px 32px;
  text-align: center;
  overflow: hidden;
}

.home-bg {
  position: absolute;
  inset: 0;
  isolation: isolate;
  -webkit-mask-image: linear-gradient(to bottom, #000 60%, transparent);
  mask-image: linear-gradient(to bottom, #000 60%, transparent);
}
.home-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: grayscale(1) contrast(1.2) brightness(0.75);
  opacity: 0;
  animation: home-slide 30s linear infinite both;
}
.home-bg-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    rgba(var(--color-player-rgb, 79, 124, 255), 0.95),
    rgba(var(--color-opponent-rgb, 255, 79, 109), 0.9)
  );
  mix-blend-mode: color;
}
.home-bg-fade {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 35%,
    rgba(11, 15, 25, 0.7),
    rgba(11, 15, 25, 0.15) 75%
  );
}
@keyframes home-slide {
  0% {
    opacity: 0;
    transform: scale(1.04);
  }
  4% {
    opacity: 0.55;
  }
  18% {
    opacity: 0.55;
  }
  24% {
    opacity: 0;
    transform: scale(1.16);
  }
  100% {
    opacity: 0;
    transform: scale(1.16);
  }
}

.home-spot {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    380px circle at var(--mx) var(--my),
    rgba(255, 255, 255, 0.1),
    transparent 65%
  );
}
.home-orb {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.3;
  pointer-events: none;
}
.home-orb-blue {
  top: -140px;
  left: -140px;
  background: var(--color-player, #4f7cff);
}
.home-orb-red {
  top: -60px;
  right: -140px;
  background: var(--color-opponent, #ff4f6d);
}
.home-hero-inner {
  position: relative;
  max-width: 820px;
  margin: 0 auto;
}
.home-eyebrow {
  margin: 0 0 12px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted, #cbd5e1);
}
.home-title {
  display: flex;
  flex-direction: column;
  margin: 0 0 16px;
  font-size: clamp(2.6rem, 9vw, 5.4rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.02em;
  text-shadow: 0 6px 40px rgba(0, 0, 0, 0.5);
}
.home-title-accent {
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    #c084fc,
    var(--color-opponent, #ff4f6d),
    #c084fc,
    var(--color-player, #4f7cff)
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  text-shadow: none;
  animation: home-shimmer 6s linear infinite;
}
@keyframes home-shimmer {
  to {
    background-position: -200% 0;
  }
}
.home-tagline {
  max-width: 600px;
  margin: 0 auto 28px;
  font-size: 1.1rem;
  color: var(--text-light, #f1f5f9);
}
.home-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 32px;
}
.home-btn {
  display: inline-block;
  padding: 12px 26px;
  font-weight: 700;
  text-decoration: none;
  border-radius: 10px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease;
}
.home-btn:hover {
  transform: translateY(-2px);
}
.home-btn-primary {
  color: #fff;
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    var(--color-player-dark, #3b60d1)
  );
  box-shadow: 0 8px 24px rgba(var(--color-player-rgb, 79, 124, 255), 0.4);
}
.home-btn-ghost {
  color: var(--text-light, #f1f5f9);
  border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.15));
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.55);
  backdrop-filter: blur(6px);
}
.home-btn-ghost:hover {
  background: var(--bg-slate-hover, #27374d);
}
.home-btn-light {
  color: #0b0f19;
  background: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
}

.home-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
  list-style: none;
}
.home-stats li {
  padding: 12px 8px;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.6);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 12px;
  backdrop-filter: blur(8px);
}
.home-stats strong {
  display: block;
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1.1;
}
.home-stats span {
  font-size: 0.72rem;
  color: var(--text-muted, #cbd5e1);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.home-marquees {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 40px;
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent,
    #000 12%,
    #000 88%,
    transparent
  );
  mask-image: linear-gradient(
    90deg,
    transparent,
    #000 12%,
    #000 88%,
    transparent
  );
}
.home-marquee {
  overflow: hidden;
}
.home-track {
  display: flex;
  gap: 12px;
  width: max-content;
  animation: home-scroll 70s linear infinite;
}
.home-track-reverse {
  animation-direction: reverse;
  animation-duration: 85s;
}
.home-portrait {
  flex: none;
  width: 92px;
  height: 92px;
  object-fit: cover;
  object-position: top;
  background: var(--bg-card, #121824);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 14px;
}
@keyframes home-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.home-section {
  max-width: 1080px;
  margin: 0 auto;
  padding: 56px 16px 8px;
}
.home-h2 {
  margin: 0 0 18px;
  font-size: 1.7rem;
  font-weight: 800;
  text-align: center;
}
.home-h2::after {
  content: "";
  display: block;
  width: 64px;
  height: 4px;
  margin: 10px auto 0;
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    var(--color-opponent, #ff4f6d)
  );
}
.home-lead {
  max-width: 720px;
  margin: 0 auto;
  font-size: 1.05rem;
  line-height: 1.65;
  text-align: center;
  color: var(--text-muted, #cbd5e1);
}

/* ---------- DEMO ---------- */
.home-demo {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 18px;
  align-items: start;
  max-width: 900px;
  margin: 28px auto 0;
  padding: 22px 18px;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.75);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}
.demo-side.order-0 {
  order: 0;
}
.demo-center {
  order: 1;
}
.demo-side.order-2 {
  order: 2;
}
.demo-label {
  margin-bottom: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.demo-side.is-blue .demo-label {
  color: var(--color-player, #4f7cff);
}
.demo-side.is-red .demo-label {
  color: var(--color-opponent, #ff4f6d);
}
.demo-row {
  display: grid;
  gap: 8px;
  margin-bottom: 8px;
}
.demo-bans {
  grid-template-columns: repeat(2, 1fr);
  max-width: 130px;
}
.demo-picks {
  grid-template-columns: repeat(2, 1fr);
}
.demo-side.is-red .demo-row {
  margin-left: auto;
}
.demo-slot {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg-slate, #1e293b);
  border: 2px dashed var(--border-strong, rgba(255, 255, 255, 0.15));
  border-radius: 12px;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}
.demo-slot.active {
  border-style: solid;
  animation: demo-pulse 0.8s ease-in-out infinite;
}
.demo-side.is-blue .demo-slot.active,
.demo-side.is-blue .demo-slot.filled.is-pick {
  border-color: var(--color-player, #4f7cff);
}
.demo-side.is-red .demo-slot.active,
.demo-side.is-red .demo-slot.filled.is-pick {
  border-color: var(--color-opponent, #ff4f6d);
}
.demo-slot.filled {
  border-style: solid;
}
.demo-slot.filled.is-pick {
  box-shadow: 0 0 22px rgba(255, 255, 255, 0.12);
}
.demo-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  animation: demo-pop 0.4s cubic-bezier(0.2, 1.4, 0.4, 1);
}
.demo-slot.filled.is-ban {
  border-color: var(--color-danger, #ef4444);
}
.demo-slot.filled.is-ban img {
  filter: grayscale(1) brightness(0.55);
}
.demo-slot.filled.is-ban::after {
  content: "✕";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--color-danger, #ef4444);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}
.demo-ph {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--text-dim, #94a3b8);
}
@keyframes demo-pop {
  from {
    transform: scale(1.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes demo-pulse {
  50% {
    box-shadow: 0 0 18px rgba(255, 255, 255, 0.25);
  }
}

.demo-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 150px;
  padding-top: 6px;
  text-align: center;
}
.demo-vs {
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    var(--color-opponent, #ff4f6d)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.demo-status {
  min-height: 2.6em;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-light, #f1f5f9);
  animation: demo-pop 0.35s ease;
}
.demo-map {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  aspect-ratio: 4 / 3;
  background-color: var(--bg-slate, #1e293b);
  background-size: cover;
  background-position: center;
  border: 2px dashed var(--border-strong, rgba(255, 255, 255, 0.15));
  border-radius: 12px;
  opacity: 0.35;
  filter: grayscale(1);
  transition:
    opacity 0.5s ease,
    filter 0.5s ease,
    border-color 0.5s ease;
}
.demo-map.show {
  opacity: 1;
  filter: none;
  border-style: solid;
  border-color: var(--color-success, #22c55e);
}
.demo-map span {
  width: 100%;
  padding: 3px 0;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 0 0 9px 9px;
}

/* ---------- STEPS ---------- */
.home-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.home-steps li {
  padding: 22px;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.7);
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
}
.home-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-bottom: 10px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--color-player, #4f7cff),
    var(--color-opponent, #ff4f6d)
  );
  border-radius: 50%;
}
.home-steps h3 {
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 700;
}
.home-steps p {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text-muted, #cbd5e1);
}

/* ---------- FEATURE CARDS ---------- */
.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 16px;
}
.home-card {
  --x: 50%;
  --y: 50%;
  --rx: 0deg;
  --ry: 0deg;
  position: relative;
  display: block;
  overflow: hidden;
  min-height: 220px;
  color: inherit;
  text-decoration: none;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.85);
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.08));
  border-radius: 18px;
  transform: perspective(800px) rotateX(var(--rx)) rotateY(var(--ry));
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.home-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    260px circle at var(--x) var(--y),
    rgba(var(--color-player-rgb, 79, 124, 255), 0.28),
    transparent 70%
  );
  transition: opacity 0.25s ease;
}
.home-card.is-beta::before {
  background: radial-gradient(
    260px circle at var(--x) var(--y),
    rgba(250, 204, 21, 0.22),
    transparent 70%
  );
}
.home-card:hover {
  border-color: rgba(var(--color-player-rgb, 79, 124, 255), 0.6);
  box-shadow: 0 18px 44px rgba(var(--color-player-rgb, 79, 124, 255), 0.2);
}
.home-card.is-beta:hover {
  border-color: rgba(250, 204, 21, 0.6);
  box-shadow: 0 18px 44px rgba(250, 204, 21, 0.14);
}
.home-card:hover::before {
  opacity: 1;
}
.home-card-art {
  position: absolute;
  top: 0;
  right: 0;
  width: 62%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  opacity: 0.3;
  filter: grayscale(0.7);
  -webkit-mask-image: linear-gradient(to left, #000 20%, transparent);
  mask-image: linear-gradient(to left, #000 20%, transparent);
  transition:
    opacity 0.3s ease,
    filter 0.3s ease,
    transform 0.4s ease;
}
.home-card-art.is-map {
  object-position: center;
}
.home-card:hover .home-card-art {
  opacity: 0.55;
  filter: none;
  transform: scale(1.06);
}
.home-card-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 22px 20px 18px;
}
.home-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  width: 46px;
  height: 46px;
  margin-bottom: 12px;
  font-size: 1.4rem;
  background: var(--bg-slate, #1e293b);
  border-radius: 12px;
}
.home-card-badge {
  position: absolute;
  top: 18px;
  right: 16px;
  padding: 2px 9px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--color-warning, #facc15);
  background: rgba(11, 15, 25, 0.7);
  border: 1px solid var(--color-warning, #facc15);
  border-radius: 999px;
}
.home-card h3 {
  margin: 0 0 6px;
  font-size: 1.15rem;
  font-weight: 700;
}
.home-card p {
  flex: 1;
  margin: 0 0 14px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-muted, #cbd5e1);
}
.home-card-link {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-player, #4f7cff);
}

.home-beta {
  padding: 22px;
  text-align: center;
  background: rgba(250, 204, 21, 0.06);
  border: 1px solid rgba(250, 204, 21, 0.35);
  border-radius: 16px;
}
.home-beta h2 {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-warning, #facc15);
}
.home-beta p {
  max-width: 680px;
  margin: 0 auto;
  font-size: 0.95rem;
  color: var(--text-muted, #cbd5e1);
}
.home-footer {
  position: relative;
  margin-top: 64px;
  color: var(--text-muted, #cbd5e1);
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(var(--bg-dark-rgb, 15, 23, 42), 0.9) 40%
  );
}
.foot-line {
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    #c084fc,
    var(--color-opponent, #ff4f6d),
    #c084fc,
    var(--color-player, #4f7cff)
  );
  background-size: 200% 100%;
  animation: home-shimmer 8s linear infinite;
}
.foot-inner {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 28px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 16px 28px;
}
.foot-logo {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-main, #f8fafc);
}
.foot-logo-accent {
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    var(--color-opponent, #ff4f6d)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.foot-brand p {
  max-width: 320px;
  margin: 0 0 14px;
  font-size: 0.88rem;
  line-height: 1.55;
}
.foot-bug {
  padding: 8px 14px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-light, #f1f5f9);
  background: rgba(var(--bg-slate-rgb, 30, 41, 59), 0.8);
  border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.15));
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}
.foot-bug:hover {
  border-color: var(--color-warning, #facc15);
  transform: translateY(-2px);
}
.foot-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.foot-col h4 {
  margin: 0 0 4px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim, #94a3b8);
}
.foot-col a,
.foot-link {
  padding: 0;
  font-size: 0.9rem;
  text-align: left;
  text-decoration: none;
  color: var(--text-muted, #cbd5e1);
  background: none;
  border: 0;
  cursor: pointer;
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}
.foot-col a:hover,
.foot-link:hover {
  color: var(--color-player, #4f7cff);
  transform: translateX(3px);
}
.foot-bottom {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px 16px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 16px 16px 36px;
  font-size: 0.8rem;
  color: var(--text-dim, #94a3b8);
  border-top: 1px solid var(--border-light, rgba(255, 255, 255, 0.08));
}
.foot-bottom p {
  margin: 0;
}

@media (max-width: 720px) {
  .foot-inner {
    grid-template-columns: 1fr 1fr;
  }
  .foot-brand {
    grid-column: 1 / -1;
  }
  .home-steps {
    grid-template-columns: 1fr;
  }
  .home-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .home-portrait {
    width: 72px;
    height: 72px;
  }
  .home-demo {
    grid-template-columns: 1fr 1fr;
    padding: 16px 12px;
  }
  .demo-center {
    order: 3;
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    width: auto;
  }
  .demo-map {
    width: 140px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-track,
  .foot-line,
  .home-title-accent,
  .home-slide,
  .demo-slot.active,
  .demo-slot img,
  .demo-status {
    animation: none;
  }
  .home-slide:first-child {
    opacity: 0.5;
  }
  .home-btn,
  .home-card,
  .home-card-art {
    transition: none;
  }
}
</style>
