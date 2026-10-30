<template>
  <div class="lab">
    <!-- ============ HERO 1: ДУЭЛЬ ============ -->
    <p class="lab-tag lab-tag-first">Hero 1 · {{ ua ? "Дуель" : "Duel" }}</p>
    <section class="hv v1">
      <div class="v1-glow v1-glow-l" aria-hidden="true"></div>
      <div class="v1-glow v1-glow-r" aria-hidden="true"></div>
      <div v-if="duel.length" class="v1-stage">
        <transition name="v1-swap" mode="out-in">
          <figure :key="duel[0].id" class="v1-fighter v1-left">
            <img :src="duel[0].image" alt="" />
            <figcaption>
              {{ duel[0].name }}<small>ELO {{ duel[0].elo }}</small>
            </figcaption>
          </figure>
        </transition>

        <div class="v1-center">
          <span class="v1-vs">VS</span>
          <p class="lb-eyebrow">{{ T.eyebrow }}</p>
          <h1 class="lb-title">
            <span>UNMATCHED</span><span class="lb-accent">DRAFT</span>
          </h1>
          <p class="lb-sub">{{ T.tagline }}</p>
          <div class="lb-cta">
            <router-link :to="{ name: 'main' }" class="lb-btn lb-btn-p">{{
              T.ctaDraft
            }}</router-link>
            <router-link :to="{ name: 'formats' }" class="lb-btn lb-btn-g">{{
              T.ctaFormats
            }}</router-link>
          </div>
        </div>

        <transition name="v1-swap" mode="out-in">
          <figure :key="duel[1].id" class="v1-fighter v1-right">
            <img :src="duel[1].image" alt="" />
            <figcaption>
              {{ duel[1].name }}<small>ELO {{ duel[1].elo }}</small>
            </figcaption>
          </figure>
        </transition>
      </div>
    </section>

    <!-- ============ HERO 2: ВЕЕР КАРТ ============ -->
    <p class="lab-tag">Hero 2 · {{ ua ? "Віяло карт" : "Card fan" }}</p>
    <section class="hv v2">
      <div class="v2-text">
        <p class="lb-eyebrow">{{ T.eyebrow }}</p>
        <h1 class="lb-title">
          <span>UNMATCHED</span><span class="lb-accent">DRAFT</span>
        </h1>
        <p class="lb-sub">{{ T.tagline }}</p>
        <div class="lb-cta">
          <router-link :to="{ name: 'main' }" class="lb-btn lb-btn-p">{{
            T.ctaDraft
          }}</router-link>
          <router-link :to="{ name: 'formats' }" class="lb-btn lb-btn-g">{{
            T.ctaFormats
          }}</router-link>
        </div>
      </div>
      <div v-if="fan.length" class="v2-fan">
        <div
          v-for="(c, k) in fan"
          :key="c.id"
          class="v2-card"
          :style="{ '--i': k - 3 }"
        >
          <img :src="c.image" alt="" loading="lazy" />
          <span class="v2-name">{{ c.name }}</span>
        </div>
      </div>
    </section>

    <!-- ============ HERO 3: ВИТРИНА ============ -->
    <p class="lab-tag">Hero 3 · {{ ua ? "Вітрина героя" : "Hero showcase" }}</p>
    <section class="hv v3">
      <div v-if="cur" class="v3-in">
        <div class="v3-text">
          <p class="lb-eyebrow">{{ T.eyebrow }}</p>
          <h1 class="lb-title">
            <span>UNMATCHED</span><span class="lb-accent">DRAFT</span>
          </h1>
          <p class="lb-sub">{{ T.tagline }}</p>
          <div class="lb-cta">
            <router-link :to="{ name: 'main' }" class="lb-btn lb-btn-p">{{
              T.ctaDraft
            }}</router-link>
            <router-link :to="{ name: 'guide' }" class="lb-btn lb-btn-g">{{
              T.ctaGuides
            }}</router-link>
          </div>
        </div>

        <div
          class="v3-show"
          @pointerenter="paused = true"
          @pointerleave="paused = false"
        >
          <transition name="v3-fade" mode="out-in">
            <article :key="cur.id" class="v3-card">
              <img :src="cur.image" alt="" />
              <div class="v3-info">
                <span class="v3-set">{{ cur.set }}</span>
                <h3>{{ cur.name }}</h3>
                <div class="v3-elo">
                  <i :style="{ width: eloPct + '%' }"></i>
                </div>
                <span class="v3-elo-num">ELO {{ cur.elo }}</span>
              </div>
            </article>
          </transition>
          <div class="v3-thumbs">
            <button
              v-for="(c, k) in showPool"
              :key="c.id"
              type="button"
              class="v3-thumb"
              :class="{ on: k === showI }"
              :aria-label="c.name"
              @click="showI = k"
            >
              <img :src="c.image" alt="" loading="lazy" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ HERO 4: СТЕНА ГЕРОЕВ ============ -->
    <p class="lab-tag">Hero 4 · {{ ua ? "Стіна героїв" : "Hero wall" }}</p>
    <section class="hv v4">
      <div class="v4-wall" aria-hidden="true">
        <div
          v-for="(col, ci) in wallCols"
          :key="ci"
          class="v4-col"
          :class="{ rev: ci % 2 === 1 }"
        >
          <div class="v4-track">
            <img
              v-for="(c, i) in [...col, ...col]"
              :key="i"
              :src="c.image"
              alt=""
              loading="lazy"
            />
          </div>
        </div>
      </div>
      <div class="v4-shade" aria-hidden="true"></div>
      <div class="v4-in">
        <p class="lb-eyebrow">{{ T.eyebrow }}</p>
        <h1 class="lb-title">
          <span>UNMATCHED</span><span class="lb-accent">DRAFT</span>
        </h1>
        <p class="lb-sub">{{ T.tagline }}</p>
        <div class="lb-cta">
          <router-link :to="{ name: 'main' }" class="lb-btn lb-btn-p">{{
            T.ctaDraft
          }}</router-link>
          <router-link :to="{ name: 'formats' }" class="lb-btn lb-btn-g">{{
            T.ctaFormats
          }}</router-link>
        </div>
      </div>
    </section>

    <div class="lab-gap">· · ·</div>

    <!-- ============ FOOTER A: ТОНКАЯ ПОЛОСА ============ -->
    <p class="lab-tag">Footer A · {{ ua ? "Тонка смуга" : "Slim strip" }}</p>
    <footer class="fa">
      <div class="fa-line" aria-hidden="true"></div>
      <div class="fa-in">
        <div class="fa-brand">
          <span class="fa-logo">UNMATCHED <b>DRAFT</b></span>
          <span class="fa-stack" aria-hidden="true">
            <img v-for="c in stack" :key="c.id" :src="c.image" alt="" />
          </span>
        </div>
        <nav class="fa-nav">
          <router-link
            v-for="l in links"
            :key="l.route"
            :to="{ name: l.route }"
            >{{ l.label }}</router-link
          >
        </nav>
        <div class="fa-meta">
          <a :href="FEEDBACK.githubRepo" target="_blank" rel="noopener"
            >GitHub</a
          >
          <button type="button" @click="openFeedback()">{{ T.report }}</button>
        </div>
      </div>
      <p class="fa-note">{{ T.disclaimer }} · © {{ year }}</p>
    </footer>

    <div class="lab-gap">· · ·</div>

    <!-- ============ FOOTER B: ПРИЗРАЧНЫЙ ЛОГОТИП ============ -->
    <p class="lab-tag">
      Footer B · {{ ua ? "Привидний логотип" : "Ghost wordmark" }}
    </p>
    <footer class="fb">
      <div class="fb-in">
        <div class="fb-brand">
          <span class="fa-logo">UNMATCHED <b>DRAFT</b></span>
          <p>{{ T.disclaimer }}</p>
        </div>
        <nav class="fb-col">
          <h4>{{ T.tools }}</h4>
          <router-link
            v-for="l in links"
            :key="l.route"
            :to="{ name: l.route }"
            >{{ l.label }}</router-link
          >
        </nav>
        <nav class="fb-col">
          <h4>{{ T.beta }}</h4>
          <router-link
            v-for="l in betaLinks"
            :key="l.route"
            :to="{ name: l.route }"
            >🔒 {{ l.label }}</router-link
          >
        </nav>
        <nav class="fb-col">
          <h4>{{ T.project }}</h4>
          <a :href="FEEDBACK.githubRepo" target="_blank" rel="noopener"
            >GitHub</a
          >
          <button type="button" @click="openFeedback()">{{ T.report }}</button>
        </nav>
      </div>
      <div class="fb-word" aria-hidden="true">UNMATCHED DRAFT</div>
    </footer>

    <div class="lab-gap">· · ·</div>

    <!-- ============ FOOTER C: ЛЕНТА РОСТЕРА ============ -->
    <p class="lab-tag">
      Footer C · {{ ua ? "Стрічка ростеру" : "Roster ticker" }}
    </p>
    <footer class="fc">
      <div v-if="roster.length" class="fc-ticker" aria-hidden="true">
        <div class="fc-track">
          <img
            v-for="(c, i) in [...roster, ...roster]"
            :key="i"
            :src="c.image"
            alt=""
            loading="lazy"
          />
        </div>
      </div>
      <div class="fc-in">
        <span class="fa-logo">UNMATCHED <b>DRAFT</b></span>
        <nav class="fa-nav">
          <router-link
            v-for="l in links"
            :key="l.route"
            :to="{ name: l.route }"
            >{{ l.label }}</router-link
          >
          <a :href="FEEDBACK.githubRepo" target="_blank" rel="noopener"
            >GitHub</a
          >
          <button type="button" @click="openFeedback()">{{ T.report }}</button>
        </nav>
      </div>
      <p class="fc-stats">
        {{ characters.length }} {{ T.heroes }} · {{ maps.length }}
        {{ T.mapsWord }} · {{ T.disclaimer }} · © {{ year }}
      </p>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { useFeedback } from "../../composables/useFeedback";
import { FEEDBACK } from "../../feedbackConfig";

const { lang, characters, maps } = useDraftState();
const { openFeedback } = useFeedback();

const ua = computed(() => lang.value === "ua");
const year = new Date().getFullYear();

const T = computed(() =>
  ua.value
    ? {
        eyebrow: "Драфт-симулятор для настільної гри Unmatched",
        tagline:
          "Банте й пікайте героїв, обирайте мапу, пробуйте нові формати і навіть грайте матч — усе в браузері.",
        ctaDraft: "Почати драфт",
        ctaFormats: "Формати драфту",
        ctaGuides: "Гайди героїв",
        heroes: "героїв",
        mapsWord: "мап",
        tools: "Інструменти",
        beta: "Закрита бета",
        project: "Проєкт",
        report: "Повідомити про баг",
        disclaimer: "Фанатський проєкт, не пов'язаний з видавцями гри",
      }
    : {
        eyebrow: "Draft simulator for the Unmatched board game",
        tagline:
          "Ban and pick heroes, choose the map, test new formats and even play the match — all in your browser.",
        ctaDraft: "Start drafting",
        ctaFormats: "Draft formats",
        ctaGuides: "Hero guides",
        heroes: "heroes",
        mapsWord: "maps",
        tools: "Tools",
        beta: "Closed beta",
        project: "Project",
        report: "Report a bug",
        disclaimer: "Fan-made, not affiliated with the game's publishers",
      },
);

const links = computed(() => [
  { route: "main", label: ua.value ? "Драфт" : "Draft" },
  { route: "formats", label: ua.value ? "Формати" : "Formats" },
  { route: "maps", label: ua.value ? "Мапи героїв" : "Hero maps" },
  { route: "matchups", label: ua.value ? "Матчапи" : "Matchups" },
  { route: "guide", label: ua.value ? "Гайди" : "Guides" },
]);
const betaLinks = computed(() => [
  { route: "pack-draft", label: "Pack Draft" },
  { route: "game", label: ua.value ? "Гра" : "Game" },
]);

/* ---------- пулы героев ---------- */
const withImg = computed(() => characters.value.filter((c) => c.image));
const top = computed(() => [...withImg.value].sort((a, b) => b.elo - a.elo));
const pool24 = computed(() => top.value.slice(0, 24));

/* ---------- Hero 1: дуэль ---------- */
const duelI = ref(0);
const duel = computed(() => {
  const p = pool24.value;
  if (p.length < 4) return [];
  const h = Math.floor(p.length / 2);
  const k = duelI.value % h;
  return [p[k], p[p.length - 1 - k]];
});

/* ---------- Hero 2: веер ---------- */
const fan = computed(() => top.value.slice(0, 7));

/* ---------- Hero 3: витрина ---------- */
const showPool = computed(() => top.value.slice(0, 8));
const showI = ref(0);
const paused = ref(false);
const cur = computed(() => showPool.value[showI.value] || null);
const eloPct = computed(() =>
  cur.value
    ? Math.max(8, Math.min(100, ((cur.value.elo - 1000) / 1000) * 100))
    : 0,
);

/* ---------- Hero 4: стена ---------- */
const wallCols = computed(() => {
  const cols = Array.from({ length: 8 }, () => []);
  withImg.value.forEach((c, i) => cols[i % 8].push(c));
  return cols.filter((c) => c.length);
});

/* ---------- Footer A / C ---------- */
const stack = computed(() => top.value.slice(0, 5));
const roster = computed(() => withImg.value);

/* ---------- таймеры ---------- */
let t1 = null;
let t2 = null;
onMounted(() => {
  const reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;
  t1 = setInterval(() => duelI.value++, 4200);
  t2 = setInterval(() => {
    if (!paused.value && showPool.value.length) {
      showI.value = (showI.value + 1) % showPool.value.length;
    }
  }, 4800);
});
onBeforeUnmount(() => {
  clearInterval(t1);
  clearInterval(t2);
});
</script>

<style scoped>
.lab {
  overflow-x: hidden;
  color: var(--text-main, #f8fafc);
}
.lab-tag {
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 16px 10px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-warning, #facc15);
}
.lab-tag-first {
  padding-top: 76px;
}
.lab-gap {
  padding: 40px 0 0;
  text-align: center;
  color: var(--text-dim, #94a3b8);
  letter-spacing: 0.5em;
}

/* ---------- общие кирпичики героя ---------- */
.hv {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 560px;
  padding: 40px 16px 56px;
  overflow: hidden;
  text-align: center;
}
.lb-eyebrow {
  margin: 0 0 12px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted, #cbd5e1);
}
.lb-title {
  display: flex;
  flex-direction: column;
  margin: 0 0 16px;
  font-size: clamp(2.4rem, 7vw, 4.8rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.02em;
  text-shadow: 0 6px 40px rgba(0, 0, 0, 0.5);
}
.lb-accent {
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
  animation: lb-shimmer 6s linear infinite;
}
@keyframes lb-shimmer {
  to {
    background-position: -200% 0;
  }
}
.lb-sub {
  max-width: 520px;
  margin: 0 auto 24px;
  font-size: 1.05rem;
  color: var(--text-light, #f1f5f9);
}
.lb-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}
.lb-btn {
  display: inline-block;
  padding: 12px 24px;
  font-weight: 700;
  text-decoration: none;
  border-radius: 10px;
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}
.lb-btn:hover {
  transform: translateY(-2px);
}
.lb-btn-p {
  color: #fff;
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    var(--color-player-dark, #3b60d1)
  );
  box-shadow: 0 8px 24px rgba(var(--color-player-rgb, 79, 124, 255), 0.4);
}
.lb-btn-g {
  color: var(--text-light, #f1f5f9);
  border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.15));
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.55);
  backdrop-filter: blur(6px);
}
.lb-btn-g:hover {
  background: var(--bg-slate-hover, #27374d);
}

/* ================= HERO 1: ДУЭЛЬ ================= */
.v1-glow {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 55%;
  pointer-events: none;
}
.v1-glow-l {
  left: 0;
  background: radial-gradient(
    60% 70% at 15% 50%,
    rgba(var(--color-player-rgb, 79, 124, 255), 0.38),
    transparent 70%
  );
}
.v1-glow-r {
  right: 0;
  background: radial-gradient(
    60% 70% at 85% 50%,
    rgba(var(--color-opponent-rgb, 255, 79, 109), 0.38),
    transparent 70%
  );
}
.v1-stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  width: 100%;
  max-width: 1180px;
}
.v1-fighter {
  width: 100%;
  max-width: 270px;
  margin: 0;
  justify-self: center;
}
.v1-fighter img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: top;
  background: var(--bg-card, #121824);
  border: 2px solid;
  border-radius: 20px;
}
.v1-left img {
  border-color: var(--color-player, #4f7cff);
  transform: rotate(-4deg);
  box-shadow: 0 24px 60px rgba(var(--color-player-rgb, 79, 124, 255), 0.35);
}
.v1-right img {
  border-color: var(--color-opponent, #ff4f6d);
  transform: rotate(4deg);
  box-shadow: 0 24px 60px rgba(var(--color-opponent-rgb, 255, 79, 109), 0.35);
}
.v1-fighter figcaption {
  display: flex;
  flex-direction: column;
  margin-top: 14px;
  font-weight: 800;
  font-size: 1.05rem;
}
.v1-fighter small {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--text-dim, #94a3b8);
}
.v1-vs {
  display: inline-block;
  margin-bottom: 14px;
  padding: 4px 14px;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    var(--color-opponent, #ff4f6d)
  );
}
.v1-swap-enter-active,
.v1-swap-leave-active {
  transition:
    opacity 0.35s ease,
    filter 0.35s ease;
}
.v1-swap-enter-from,
.v1-swap-leave-to {
  opacity: 0;
  filter: blur(8px);
}

/* ================= HERO 2: ВЕЕР ================= */
.v2 {
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 56px;
  background: radial-gradient(
    70% 55% at 50% 100%,
    rgba(192, 132, 252, 0.2),
    transparent 70%
  );
}
.v2-fan {
  position: relative;
  width: 100%;
  height: 300px;
  margin-top: 44px;
}
.v2-card {
  --i: 0;
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 150px;
  margin-left: -75px;
  z-index: calc(10 - var(--i) * var(--i));
  transform-origin: 50% 130%;
  transform: translateX(calc(var(--i) * 96px))
    translateY(calc(var(--i) * var(--i) * 9px)) rotate(calc(var(--i) * 7deg));
  transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);
  border: 2px solid #c084fc;
  border-radius: 16px;
  overflow: hidden;
  background: var(--bg-card, #121824);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
}
.v2-card:nth-child(-n + 3) {
  border-color: var(--color-player, #4f7cff);
}
.v2-card:nth-child(n + 5) {
  border-color: var(--color-opponent, #ff4f6d);
}
.v2-card:hover {
  z-index: 30;
  transform: translateX(calc(var(--i) * 96px)) translateY(-30px) rotate(0deg)
    scale(1.1);
}
.v2-card img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: top;
}
.v2-name {
  position: absolute;
  inset: auto 0 0;
  padding: 22px 8px 8px;
  font-size: 0.78rem;
  font-weight: 800;
  background: linear-gradient(to top, rgba(11, 15, 25, 0.95), transparent);
}

/* ================= HERO 3: ВИТРИНА ================= */
.v3 {
  background:
    radial-gradient(
      50% 70% at 85% 50%,
      rgba(var(--color-opponent-rgb, 255, 79, 109), 0.18),
      transparent 70%
    ),
    radial-gradient(
      50% 70% at 10% 40%,
      rgba(var(--color-player-rgb, 79, 124, 255), 0.2),
      transparent 70%
    );
}
.v3-in {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  gap: 48px;
  width: 100%;
  max-width: 1080px;
  text-align: left;
}
.v3-text .lb-sub {
  margin-left: 0;
}
.v3-text .lb-cta {
  justify-content: flex-start;
}
.v3-show {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.v3-card {
  position: relative;
  width: 100%;
  max-width: 340px;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 24px;
  background:
    linear-gradient(var(--bg-card, #121824), var(--bg-card, #121824))
      padding-box,
    linear-gradient(
        135deg,
        var(--color-player, #4f7cff),
        var(--color-opponent, #ff4f6d)
      )
      border-box;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.55);
}
.v3-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}
.v3-info {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 48px 18px 16px;
  background: linear-gradient(to top, rgba(11, 15, 25, 0.96) 35%, transparent);
}
.v3-set {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim, #94a3b8);
}
.v3-info h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
}
.v3-elo {
  height: 6px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.12);
}
.v3-elo i {
  display: block;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    var(--color-opponent, #ff4f6d)
  );
}
.v3-elo-num {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--text-muted, #cbd5e1);
}
.v3-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.v3-thumb {
  width: 46px;
  height: 46px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.5;
  background: var(--bg-card, #121824);
  border: 2px solid transparent;
  border-radius: 12px;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}
.v3-thumb:hover {
  opacity: 0.85;
}
.v3-thumb.on {
  opacity: 1;
  border-color: #fff;
  transform: translateY(-3px);
}
.v3-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}
.v3-fade-enter-active,
.v3-fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.v3-fade-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.98);
}
.v3-fade-leave-to {
  opacity: 0;
  transform: translateY(-14px) scale(0.98);
}

/* ================= HERO 4: СТЕНА ================= */
.v4-wall {
  position: absolute;
  inset: -25% -10%;
  display: flex;
  gap: 14px;
  justify-content: center;
  opacity: 0.6;
  transform: rotate(-9deg);
}
.v4-col {
  flex: 0 0 150px;
  overflow: hidden;
}
.v4-track {
  display: flex;
  flex-direction: column;
  animation: v4-up 70s linear infinite;
}
.v4-col.rev .v4-track {
  animation-direction: reverse;
  animation-duration: 85s;
}
.v4-track img {
  flex: none;
  width: 100%;
  aspect-ratio: 3 / 4;
  margin-bottom: 14px;
  object-fit: cover;
  object-position: top;
  border-radius: 14px;
  background: var(--bg-card, #121824);
}
@keyframes v4-up {
  to {
    transform: translateY(-50%);
  }
}
.v4-shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse at 50% 50%,
      rgba(11, 15, 25, 0.9) 18%,
      rgba(11, 15, 25, 0.3) 72%
    ),
    linear-gradient(to bottom, transparent 70%, var(--bg-main, #0b0f19));
}
.v4-in {
  position: relative;
  max-width: 720px;
}

/* ================= FOOTER A ================= */
.fa-logo {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-main, #f8fafc);
}
.fa-logo b {
  background: linear-gradient(
    90deg,
    var(--color-player, #4f7cff),
    var(--color-opponent, #ff4f6d)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.fa {
  margin-top: 8px;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.55);
}
.fa-line {
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--color-player-rgb, 79, 124, 255), 0.6),
    rgba(var(--color-opponent-rgb, 255, 79, 109), 0.6),
    transparent
  );
}
.fa-in {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px 28px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 22px 16px 10px;
}
.fa-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}
.fa-stack {
  display: flex;
}
.fa-stack img {
  width: 28px;
  height: 28px;
  margin-left: -8px;
  object-fit: cover;
  object-position: top;
  border: 2px solid var(--bg-dark, #0f172a);
  border-radius: 50%;
  transition: margin 0.25s ease;
}
.fa-stack img:first-child {
  margin-left: 0;
}
.fa-brand:hover .fa-stack img {
  margin-left: 2px;
}
.fa-brand:hover .fa-stack img:first-child {
  margin-left: 0;
}
.fa-nav,
.fa-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
}
.fa-nav a,
.fa-nav button,
.fa-meta a,
.fa-meta button {
  padding: 0;
  font-size: 0.85rem;
  text-decoration: none;
  color: var(--text-dim, #94a3b8);
  background: none;
  border: 0;
  cursor: pointer;
  transition: color 0.15s ease;
}
.fa-nav a:hover,
.fa-nav button:hover,
.fa-meta a:hover,
.fa-meta button:hover {
  color: var(--text-white, #fff);
}
.fa-note {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px 20px;
  font-size: 0.75rem;
  color: var(--text-dim, #94a3b8);
  opacity: 0.7;
}

/* ================= FOOTER B ================= */
.fb {
  margin-top: 8px;
  overflow: hidden;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(var(--bg-dark-rgb, 15, 23, 42), 0.8)
  );
}
.fb-in {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 28px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 16px 8px;
}
.fb-brand p {
  max-width: 280px;
  margin: 10px 0 0;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--text-dim, #94a3b8);
}
.fb-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.fb-col h4 {
  margin: 0 0 4px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim, #94a3b8);
  opacity: 0.8;
}
.fb-col a,
.fb-col button {
  padding: 0;
  font-size: 0.88rem;
  text-align: left;
  text-decoration: none;
  color: var(--text-muted, #cbd5e1);
  background: none;
  border: 0;
  cursor: pointer;
  transition: color 0.15s ease;
}
.fb-col a:hover,
.fb-col button:hover {
  color: var(--color-player, #4f7cff);
}
.fb-word {
  margin-top: 8px;
  padding: 0 8px;
  font-size: clamp(2.2rem, 10.5vw, 9rem);
  font-weight: 800;
  line-height: 0.85;
  letter-spacing: -0.03em;
  text-align: center;
  white-space: nowrap;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1);
  user-select: none;
  -webkit-mask-image: linear-gradient(to bottom, #000 35%, transparent 92%);
  mask-image: linear-gradient(to bottom, #000 35%, transparent 92%);
  transition: -webkit-text-stroke-color 0.4s ease;
}
.fb:hover .fb-word {
  -webkit-text-stroke-color: rgba(var(--color-player-rgb, 79, 124, 255), 0.45);
}

/* ================= FOOTER C ================= */
.fc {
  margin-top: 8px;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.55);
  border-top: 1px solid var(--border-light, rgba(255, 255, 255, 0.08));
}
.fc-ticker {
  overflow: hidden;
  padding: 16px 0 6px;
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
.fc-track {
  display: flex;
  gap: 8px;
  width: max-content;
  animation: fc-scroll 160s linear infinite;
}
.fc-ticker:hover .fc-track {
  animation-play-state: paused;
}
.fc-track img {
  flex: none;
  width: 44px;
  height: 44px;
  object-fit: cover;
  object-position: top;
  border-radius: 10px;
  filter: grayscale(1);
  opacity: 0.45;
  transition:
    filter 0.25s ease,
    opacity 0.25s ease,
    transform 0.25s ease;
}
.fc-track img:hover {
  filter: none;
  opacity: 1;
  transform: translateY(-4px);
}
@keyframes fc-scroll {
  to {
    transform: translateX(-50%);
  }
}
.fc-in {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 28px;
  max-width: 1080px;
  margin: 0 auto;
  padding: 14px 16px 6px;
}
.fc-stats {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px 20px;
  font-size: 0.75rem;
  color: var(--text-dim, #94a3b8);
  opacity: 0.7;
}

/* ================= АДАПТИВ ================= */
@media (max-width: 820px) {
  .hv {
    min-height: 0;
  }
  .v1-stage {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .v1-fighter {
    max-width: 170px;
    grid-row: 1;
  }
  .v1-center {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .v2-fan {
    height: 230px;
  }
  .v2-card {
    width: 104px;
    margin-left: -52px;
    transform: translateX(calc(var(--i) * 62px))
      translateY(calc(var(--i) * var(--i) * 6px)) rotate(calc(var(--i) * 7deg));
  }
  .v2-card:hover {
    transform: translateX(calc(var(--i) * 62px)) translateY(-20px) rotate(0deg)
      scale(1.08);
  }
  .v2-card:nth-child(1),
  .v2-card:nth-child(7) {
    display: none;
  }
  .v3-in {
    grid-template-columns: 1fr;
    gap: 28px;
    text-align: center;
  }
  .v3-text .lb-sub {
    margin-left: auto;
  }
  .v3-text .lb-cta {
    justify-content: center;
  }
  .v4-col {
    flex-basis: 110px;
  }
  .v4-col:nth-child(n + 6) {
    display: none;
  }
  .fb-in {
    grid-template-columns: 1fr 1fr;
  }
  .fb-brand {
    grid-column: 1 / -1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lb-accent,
  .v4-track,
  .fc-track {
    animation: none;
  }
  .v1-swap-enter-active,
  .v1-swap-leave-active,
  .v3-fade-enter-active,
  .v3-fade-leave-active,
  .v2-card {
    transition: none;
  }
}
</style>
