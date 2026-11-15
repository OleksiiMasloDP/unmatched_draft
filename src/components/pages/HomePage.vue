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
          <router-link :to="{ name: 'game' }" class="home-btn home-btn-ghost">
            {{ L.ctaPlay }}
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

    <section class="home-section home-about">
      <h2 class="home-h2" data-reveal>{{ L.aboutTitle }}</h2>
      <p class="home-lead" data-reveal>{{ L.aboutText }}</p>
      <p class="home-lead home-lead-mark" data-reveal>
        <mark>{{ L.aboutMark }}</mark>
      </p>
      <ul class="home-proof" data-reveal>
        <li v-for="(item, i) in L.proof" :key="i">
          <span>{{ proofIcons[i] }}</span>
          {{ item }}
        </li>
      </ul>

      <div v-if="muHero" class="mu-show" data-reveal="zoom">
        <Transition name="mu-swap" mode="out-in">
          <div :key="muHero.id" class="mu-hero">
            <img :src="muHero.image" :alt="muHero.name" class="mu-hero-img" />
            <div class="mu-hero-body">
              <div class="mu-hero-name">{{ muHero.name }}</div>
              <div class="mu-hero-meta">
                <span>
                  {{ L.mu.elo }} <b>{{ muHero.elo }}</b>
                </span>
                <span>
                  {{ L.mu.avg }} <b>{{ muAvg }}%</b>
                </span>
              </div>
            </div>
          </div>
        </Transition>

        <div class="mu-vs">
          <span>VS</span>
        </div>

        <TransitionGroup name="mu-foe" tag="div" class="mu-foes">
          <div
            v-for="(foe, i) in muFoes"
            :key="muHero.id + '-' + foe.id"
            class="mu-foe"
            :class="foe.cls"
            :style="{ '--i': i }"
          >
            <img :src="foe.image" :alt="foe.name" />
            <span class="mu-foe-name">{{ foe.name }}</span>
            <span class="mu-foe-bar">
              <i :style="{ width: foe.wr + '%' }"></i>
            </span>
            <b class="mu-foe-wr">{{ foe.wr }}%</b>
          </div>
        </TransitionGroup>
      </div>
      <p v-if="muHero" class="home-caption" data-reveal>{{ L.mu.note }}</p>
    </section>

    <div class="home-ribbon" data-parallax aria-hidden="true">
      <div class="home-ribbon-track">
        <span v-for="n in 4" :key="n">{{ L.ribbon[0] }}</span>
      </div>
    </div>

    <section v-if="csHero" class="home-band home-cards">
      <div class="home-band-glow" data-parallax aria-hidden="true"></div>
      <div class="home-wrap">
        <span class="home-tag" data-reveal>{{ L.cards.tag }}</span>
        <h2 class="home-h2" data-reveal>{{ L.cards.title }}</h2>
        <p class="home-lead" data-reveal>{{ L.cards.text }}</p>

        <div class="cs-stage">
          <div class="cs-fan" data-reveal="zoom" data-parallax>
            <div
              v-for="(card, i) in csHero.cards"
              :key="csHero.name + card.file"
              class="cs-card"
              :class="{ 'is-active': i === csActive }"
              :style="fanStyle(i, csHero.cards.length)"
              @click="csActive = i"
            >
              <img :src="card.url" :alt="card.title" loading="lazy" />
            </div>
          </div>

          <div class="cs-panel" data-reveal="right">
            <span class="cs-example">{{ L.cards.example }}</span>
            <div class="cs-title">
              <Transition name="mu-swap" mode="out-in">
                <h3 :key="csHero.name + csActive">{{ csCard.title }}</h3>
              </Transition>
              <small>{{ csHero.name }} · {{ csStyle }}</small>
            </div>
            <div class="cs-cols">
              <div v-for="col in csCols" :key="col.key" class="cs-col">
                <h4 :class="col.key">{{ col.label }}</h4>
                <TransitionGroup name="mu-foe" tag="ul">
                  <li
                    v-for="(row, i) in col.rows"
                    :key="csHero.name + csActive + col.key + row.id"
                    :class="col.key"
                    :style="{ '--i': i }"
                  >
                    <img :src="row.image" :alt="row.name" />
                    <span>{{ row.name }}</span>
                    <b>{{ row.fit }}%</b>
                  </li>
                </TransitionGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

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

    <section class="home-band home-packs">
      <div class="home-band-glow is-red" data-parallax aria-hidden="true"></div>
      <div class="home-wrap">
        <span class="home-tag" data-reveal>{{ L.packs.tag }}</span>
        <h2 class="home-h2" data-reveal>{{ L.packs.title }}</h2>
        <p class="home-lead" data-reveal>{{ L.packs.text }}</p>

        <div class="pk-board" data-reveal="zoom">
          <div class="pk-stats">
            <div>
              <span>{{ L.packs.round }}</span>
              <b>
                {{ packRound }} <small>/ {{ PACK_ROUNDS }}</small>
              </b>
            </div>
            <div>
              <span>{{ L.packs.inPack }}</span>
              <b>{{ packCards.length }}</b>
            </div>
            <div>
              <span>{{ L.packs.kept }}</span>
              <b>
                {{ keptYou.length }} <small>/ {{ keptFoe.length }}</small>
              </b>
            </div>
          </div>

          <div
            class="pk-banner"
            :class="packTurn === 'you' ? 'is-you' : 'is-foe'"
          >
            {{ packTurn === "you" ? L.packs.you : L.packs.foe }}
          </div>

          <div class="pk-layout">
            <div class="pk-side is-you">
              <h4>{{ L.p1 }}</h4>
              <TransitionGroup name="pk-kept" tag="div" class="pk-kept">
                <img
                  v-for="card in keptYou"
                  :key="card.id"
                  :src="abs(card.image)"
                  :alt="card.name"
                />
              </TransitionGroup>
            </div>

            <TransitionGroup name="pk" tag="div" class="pk-grid">
              <PackCard
                v-for="card in packCards"
                :key="card.id"
                :card="{ ...card, image: abs(card.image) }"
                :mark="packMarks[card.id] || ''"
              />
            </TransitionGroup>

            <div class="pk-side is-foe">
              <h4>{{ L.p2 }}</h4>
              <TransitionGroup name="pk-kept" tag="div" class="pk-kept">
                <img
                  v-for="card in keptFoe"
                  :key="card.id"
                  :src="abs(card.image)"
                  :alt="card.name"
                />
              </TransitionGroup>
            </div>
          </div>
        </div>

        <div class="home-show-cta" data-reveal>
          <router-link
            :to="{ name: 'pack-draft' }"
            class="home-btn home-btn-primary"
          >
            {{ L.packs.cta }}
          </router-link>
        </div>
      </div>
    </section>

    <section class="home-section home-online">
      <div class="on-text" data-reveal="left">
        <span class="home-tag is-left">{{ L.online.tag }}</span>
        <h2 class="home-h2 is-left">{{ L.online.title }}</h2>
        <p class="home-lead is-left">{{ L.online.text }}</p>
        <ul class="on-points">
          <li v-for="(item, i) in L.online.points" :key="i">{{ item }}</li>
        </ul>
        <router-link :to="{ name: 'game' }" class="home-btn home-btn-primary">
          {{ L.online.cta }}
        </router-link>
      </div>

      <div class="on-stage" data-reveal="right" data-parallax>
        <div class="on-room">
          <span>{{ L.online.room }}</span>
          <div class="on-code">
            <b
              v-for="(ch, i) in onlineCode"
              :key="i"
              :class="{ on: onlineStep >= 1 }"
              :style="{ '--i': i }"
            >
              {{ ch }}
            </b>
          </div>
          <span class="on-copy" :class="{ on: onlineStep >= 1 }">
            {{ L.online.copy }}
          </span>
        </div>
        <div class="on-peers">
          <div class="on-peer is-you" :class="{ on: onlineStep >= 1 }">
            <i></i>
            <span>{{ L.p1 }}</span>
            <small>{{
              onlineStep >= 1 ? L.online.ready : L.online.creating
            }}</small>
          </div>
          <div class="on-link" :class="{ on: onlineStep >= 3 }">
            <i></i><i></i><i></i><i></i><i></i>
          </div>
          <div class="on-peer is-foe" :class="{ on: onlineStep >= 2 }">
            <i></i>
            <span>{{ L.p2 }}</span>
            <small>
              {{
                onlineStep >= 3
                  ? L.online.connected
                  : onlineStep >= 2
                    ? L.online.joining
                    : L.online.waiting
              }}
            </small>
          </div>
        </div>
      </div>
    </section>

    <div class="home-ribbon is-reverse" data-parallax aria-hidden="true">
      <div class="home-ribbon-track">
        <span v-for="n in 4" :key="n">{{ L.ribbon[1] }}</span>
      </div>
    </div>

    <section v-if="rogueMapData.length" class="home-band home-rogue">
      <div
        class="home-band-glow is-gold"
        data-parallax
        aria-hidden="true"
      ></div>
      <div class="home-wrap">
        <span class="home-tag" data-reveal>{{ L.rogue.tag }}</span>
        <h2 class="home-h2" data-reveal>{{ L.rogue.title }}</h2>
        <p class="home-lead" data-reveal>{{ L.rogue.text }}</p>

        <div class="rg-board" data-reveal="zoom">
          <div class="rg-top">
            <span class="rg-stat">
              <RogueIcon name="coins" metal="gold" size="1.4em" />
              {{ rogueGold }}
            </span>
            <span class="rg-stat">
              <RogueIcon name="heartPlus" metal="ruby" size="1.4em" />
              {{ rogueHp }}
            </span>
            <span class="rg-stat">
              <RogueIcon name="cardDraw" metal="silver" size="1.4em" />
              {{ rogueCards }}
            </span>
          </div>
          <RogueMap
            :map="rogueMapData"
            :pos="roguePos"
            :visited="rogueVisited"
            :reachable="rogueReach"
            :labels="rogueLabels"
            :hero-image="rogueHeroImage"
          />
          <ul class="rg-legend">
            <li v-for="item in rogueLegend" :key="item.type">
              <RogueIcon :name="item.icon" :metal="item.metal" size="1.3em" />
              {{ item.label }}
            </li>
          </ul>
        </div>

        <div class="home-show-cta" data-reveal>
          <router-link
            :to="{ name: 'rogue' }"
            class="home-btn home-btn-primary"
          >
            {{ L.rogue.cta }}
          </router-link>
        </div>
      </div>
    </section>

    <section class="home-section">
      <h2 class="home-h2" data-reveal>{{ L.featuresTitle }}</h2>
      <div class="home-grid">
        <router-link
          v-for="(f, i) in features"
          :key="f.route"
          :to="{ name: f.route }"
          class="home-card"
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
            <h3>{{ L.features[f.key].title }}</h3>
            <p>{{ L.features[f.key].text }}</p>
            <span v-if="f.isNew" class="home-card-new">{{ L.newLabel }}</span>
            <span class="home-card-link">{{ L.open }} →</span>
          </div>
        </router-link>
      </div>
    </section>

    <SiteFooter />
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
import { buildAllCards } from "../../packDraftData.js";
import { generateMap } from "../../rogueMap.js";
import { ROWS, nodeTypes } from "../../rogueData.js";
import PackCard from "../PackCard.vue";
import RogueMap from "../RogueMap.vue";
import RogueIcon from "../RogueIcon.vue";
import SiteFooter from "../SiteFooter.vue";

const { lang, characters, maps, getWinrate } = useDraftState();

const dict = {
  en: {
    eyebrow: "Draft simulator for the Unmatched board game",
    tagline:
      "Ban and pick heroes with ratings from professional players, draft card packs, play online or run a roguelike — all in your browser.",
    ctaDraft: "Start drafting",
    ctaFormats: "Draft formats",
    ctaPlay: "Play",
    newLabel: "New",
    stats: {
      tools: "tools",
      schemes: "draft schemes",
      guides: "hero guides",
      langs: "languages",
    },
    p1: "Player 1",
    p2: "Player 2",
    aboutTitle: "What is this?",
    aboutText:
      "Unmatched Draftsim is a fan-made toolbox for players who like to draft. Run a ban/pick with your opponent, check which maps suit every hero, build your own draft formats and take the result straight into a game against a friend or a bot.",
    aboutMark:
      "Hero ratings, matchups and card statistics are all built from the results of professional players.",
    proof: ["Elo ratings", "Matchup win rates", "Card statistics"],
    mu: {
      elo: "Elo",
      avg: "avg. win rate",
      note: "Win rates of one hero against the rest of the roster — the same numbers you see while drafting.",
    },
    ribbon: ["MATCHUPS · RATINGS · CARDS · ", "ONLINE · DRAFT · ROGUELIKE · "],
    cards: {
      tag: "Card statistics",
      title: "Know which cards work",
      text: "Statistics also cover cards: which ones shine in which matchups and which stay in the binder. Build the right deck before the game starts.",
      example: "Example",
      good: "Fits against",
      bad: "Weak against",
    },
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
    packs: {
      tag: "Pack Draft",
      title: "Draft the cards, then play",
      text: "Two players, four characters, one shared pool. Each turn you keep one card, discard another openly and pass the pack on — and only then the match begins.",
      round: "Round",
      inPack: "Cards in pack",
      kept: "Kept (you / opponent)",
      you: "Your turn — keep 1, discard 1",
      foe: "Opponent's turn",
      cta: "Try Pack Draft",
    },
    online: {
      tag: "Online",
      title: "Play with a friend online",
      text: "Create a room, send the code or the link — and your friend joins from any device.",
      points: [
        "Room code or a direct link",
        "Drafts and games stay in sync",
        "Or play on one screen",
      ],
      cta: "Open the game",
      room: "Room code",
      copy: "Copy link",
      creating: "Creating room…",
      ready: "Room ready",
      waiting: "Waiting…",
      joining: "Joining…",
      connected: "Connected",
    },
    rogue: {
      tag: "Roguelike",
      title: "Fight through the map",
      text: "Choose your route through battles, elites and events, collect gold and cards, reshape your deck and face a custom boss.",
      cta: "Start the roguelike",
      fight: "Fight",
      elite: "Elite",
      mystery: "Unknown",
      rest: "Campfire",
      shop: "Shop",
      boss: "Boss",
      forest: "Forest",
      mountains: "Mountains",
      ruins: "Ruins",
      citadel: "Citadel",
    },
    featuresTitle: "Everything in one place",
    open: "Open",
    features: {
      draft: {
        title: "Draft simulator",
        text: "Turn-based ban/pick (3 bans / 5 picks, 2 bans / 4 picks) or simultaneous Ladder mode. Heroes are ranked by Elo built from statistics of professional players — and a map choice at the end.",
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
        text: "Play your decks against a bot, on one screen or online with a room code: hand, deck, attacks, maneuvers and a battle log.",
      },
      rogue: {
        title: "Roguelike",
        text: "Fight through a map of battles, elites and events, collect gold and cards and face custom bosses.",
      },
    },
  },
  ua: {
    eyebrow: "Драфт-симулятор для настільної гри Unmatched",
    tagline:
      "Банте й пікайте героїв за рейтингом професійних гравців, драфтіть паки карт, грайте онлайн чи проходьте рогалик — усе в браузері.",
    ctaDraft: "Почати драфт",
    ctaFormats: "Формати драфту",
    ctaPlay: "Грати",
    newLabel: "Нове",
    stats: {
      tools: "інструментів",
      schemes: "схеми драфту",
      guides: "гайдів",
      langs: "мови",
    },
    p1: "Гравець 1",
    p2: "Гравець 2",
    aboutTitle: "Що це?",
    aboutText:
      "Unmatched Draftsim — фанатський набір інструментів для тих, хто любить драфт. Проведіть бан/пік із суперником, подивіться, які мапи підходять кожному герою, створіть власні формати драфту та одразу перейдіть до гри з другом або ботом.",
    aboutMark:
      "Рейтинги героїв, матчапи та статистика карт — усе побудовано на результатах професійних гравців.",
    proof: ["Рейтинг Elo", "Вінрейт у матчапах", "Статистика карт"],
    mu: {
      elo: "Elo",
      avg: "середній вінрейт",
      note: "Вінрейт одного героя проти решти ростеру — ті самі цифри, що ви бачите під час драфту.",
    },
    ribbon: ["МАТЧАПИ · РЕЙТИНГИ · КАРТИ · ", "ОНЛАЙН · ДРАФТ · РОГАЛИК · "],
    cards: {
      tag: "Статистика карт",
      title: "Знайте, які карти працюють",
      text: "Статистика є й по картах: які сяють у яких матчапах, а які краще залишити в колекції. Зберіть правильну колоду ще до початку гри.",
      example: "Приклад",
      good: "Підходить проти",
      bad: "Слабка проти",
    },
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
    packs: {
      tag: "Pack Draft",
      title: "Драфтіть карти, а потім грайте",
      text: "Двоє гравців, чотири персонажі, один спільний пул. Кожен хід ви залишаєте одну карту, іншу відкрито скидаєте й передаєте пак далі — і лише потім починається матч.",
      round: "Раунд",
      inPack: "Карт у паку",
      kept: "Залишено (ви / суперник)",
      you: "Ваш хід — залишіть 1, скиньте 1",
      foe: "Хід суперника",
      cta: "Спробувати Pack Draft",
    },
    online: {
      tag: "Онлайн",
      title: "Грайте з другом онлайн",
      text: "Створіть кімнату, надішліть код або посилання — і друг приєднається з будь-якого пристрою.",
      points: [
        "Код кімнати або пряме посилання",
        "Драфт і гра синхронізуються",
        "Або грайте на одному екрані",
      ],
      cta: "Відкрити гру",
      room: "Код кімнати",
      copy: "Копіювати посилання",
      creating: "Створення кімнати…",
      ready: "Кімната готова",
      waiting: "Очікування…",
      joining: "Приєднується…",
      connected: "Підключено",
    },
    rogue: {
      tag: "Рогалик",
      title: "Пройдіть мапу боїв",
      text: "Обирайте маршрут крізь бої, еліт і події, збирайте золото й карти, перебудовуйте колоду та зустрічайте кастомного боса.",
      cta: "Почати рогалик",
      fight: "Бій",
      elite: "Еліта",
      mystery: "Невідоме",
      rest: "Багаття",
      shop: "Магазин",
      boss: "Бос",
      forest: "Ліс",
      mountains: "Гори",
      ruins: "Руїни",
      citadel: "Цитадель",
    },
    featuresTitle: "Усе в одному місці",
    open: "Відкрити",
    features: {
      draft: {
        title: "Драфт-симулятор",
        text: "Покроковий бан/пік (3 бани / 5 піків, 2 бани / 4 піки) або одночасний режим Ladder. Герої з рейтингом Elo, побудованим на статистиці професійних гравців, — і вибір мапи наприкінці.",
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
        text: "Грайте колодами проти бота, на одному екрані або онлайн за кодом кімнати: рука, колода, атаки, маневри та журнал бою.",
      },
      rogue: {
        title: "Рогалик",
        text: "Проходьте мапу з боїв, еліт і подій, збирайте золото й карти та зустрічайте кастомних босів.",
      },
    },
  },
};

const L = computed(() => dict[lang.value] || dict.en);

const proofIcons = ["📊", "⚔️", "🃏"];

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
    isNew: true,
  },
  { key: "game", route: "game", icon: "🎮", art: "hero", isNew: true },
  { key: "rogue", route: "rogue", icon: "🗡️", art: "map", isNew: true },
];

const abs = (path) => new URL(path, document.baseURI).href;
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffle = (list) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

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

function foesOf(hero) {
  const list = [];
  for (const other of characters.value) {
    if (other.id === hero.id || !other.image) continue;
    const wr = getWinrate(hero.name, other.name);
    if (wr === null || wr === undefined) continue;
    list.push({ ...other, wr: Math.round(wr) });
  }
  return list.sort((a, b) => b.wr - a.wr);
}

const muIndex = ref(0);
const muPool = computed(() =>
  characters.value
    .filter((c) => c.image && foesOf(c).length >= 8)
    .sort((a, b) => a.name.localeCompare(b.name)),
);
const muHero = computed(() => {
  const pool = muPool.value;
  if (!pool.length) return null;
  return pool[(muIndex.value * 11 + 2) % pool.length];
});
const muAll = computed(() => (muHero.value ? foesOf(muHero.value) : []));
const muAvg = computed(() => {
  const list = muAll.value;
  if (!list.length) return 0;
  return Math.round(list.reduce((sum, f) => sum + f.wr, 0) / list.length);
});
const muFoes = computed(() => {
  const list = muAll.value;
  const picked =
    list.length > 6 ? [...list.slice(0, 3), ...list.slice(-3)] : list;
  return picked.map((f) => ({
    ...f,
    cls: f.wr >= 58 ? "is-win" : f.wr <= 42 ? "is-lose" : "is-even",
  }));
});

const csHeroes = ref([]);
const csIndex = ref(0);
const csActive = ref(0);

const csList = computed(() =>
  csHeroes.value.filter((h) => {
    const char = characters.value.find((c) => c.name === h.name);
    return char && foesOf(char).length >= 6;
  }),
);
const csHero = computed(() => {
  const list = csList.value;
  return list.length ? list[csIndex.value % list.length] : null;
});
const csCard = computed(() => {
  const hero = csHero.value;
  if (!hero) return { title: "" };
  return hero.cards[csActive.value % hero.cards.length];
});
const csStyle = computed(() => {
  const hero = csHero.value;
  if (!hero || !hero.style) return "";
  return hero.style[lang.value] || hero.style.en || "";
});
const csCols = computed(() => {
  const hero = csHero.value;
  if (!hero) return [];
  const char = characters.value.find((c) => c.name === hero.name);
  if (!char) return [];
  const foes = foesOf(char);
  if (foes.length < 6) return [];
  const turn = (list, shift) => {
    const rot = shift % list.length;
    return [...list.slice(rot), ...list.slice(0, rot)].slice(0, 3);
  };
  const shift = csActive.value;
  const fit = (f, k, sign) =>
    Math.max(8, Math.min(94, f.wr + sign * ((shift * 5 + k * 3) % 7)));
  const good = turn(foes.slice(0, 6), shift).map((f, k) => ({
    ...f,
    fit: fit(f, k, 1),
  }));
  const bad = turn(foes.slice(-6), shift).map((f, k) => ({
    ...f,
    fit: fit(f, k, -1),
  }));
  return [
    { key: "is-good", label: L.value.cards.good, rows: good },
    { key: "is-bad", label: L.value.cards.bad, rows: bad },
  ];
});

const titleOf = (file) =>
  file
    .replace(/\.[a-z]+$/i, "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

function fanStyle(i, total) {
  const mid = (total - 1) / 2;
  const d = i - mid;
  return {
    "--fx": `${d * 58}px`,
    "--fr": `${d * 8}deg`,
    "--fy": `${Math.abs(d) * 10}px`,
    zIndex: i === csActive.value ? 10 : 5 - Math.abs(Math.round(d)),
  };
}

const PACK_CARDS = 8;
const PACK_ROUNDS = 3;
const cardPool = buildAllCards().filter((c) => c.image && c.type);
const packCards = ref([]);
const packMarks = reactive({});
const keptYou = ref([]);
const keptFoe = ref([]);
const packTurn = ref("you");
const packPhase = ref(0);
const packRound = ref(1);
let packPicked = { keep: null, discard: null };

function newPack() {
  packCards.value = shuffle(cardPool).slice(0, PACK_CARDS);
}

function clearMarks() {
  for (const key of Object.keys(packMarks)) delete packMarks[key];
}

function packTick() {
  if (!packCards.value.length) newPack();
  if (packPhase.value === 0) {
    clearMarks();
    const keep = pick(packCards.value);
    packPicked = { keep, discard: null };
    packMarks[keep.id] = "keep";
    packPhase.value = 1;
  } else if (packPhase.value === 1) {
    const rest = packCards.value.filter((c) => c.id !== packPicked.keep.id);
    packPicked.discard = pick(rest);
    packMarks[packPicked.discard.id] = "discard";
    packPhase.value = 2;
  } else {
    const { keep, discard } = packPicked;
    packCards.value = packCards.value.filter(
      (c) => c.id !== keep.id && c.id !== discard.id,
    );
    clearMarks();
    const target = packTurn.value === "you" ? keptYou : keptFoe;
    target.value = [...target.value, keep].slice(-8);
    packTurn.value = packTurn.value === "you" ? "foe" : "you";
    packPhase.value = 0;
    if (!packCards.value.length) {
      packRound.value += 1;
      if (packRound.value > PACK_ROUNDS) {
        packRound.value = 1;
        keptYou.value = [];
        keptFoe.value = [];
      }
      newPack();
    }
  }
}

const onlineCode = "K7QX".split("");
const onlineStep = ref(0);

function onlineTick() {
  onlineStep.value = (onlineStep.value + 1) % 6;
}

const mulberry = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const rogueMapData = ref([]);
const roguePos = ref(null);
const rogueVisited = ref([]);
const rogueReach = ref([]);
const rogueGold = ref(0);
const rogueHp = ref(40);
const rogueCards = ref(0);
let rogueSeed = 11;
let rogueWait = 0;

const rogueHeroImage = computed(() =>
  heroPool.value.length ? abs(heroPool.value[0].image) : "",
);
const rogueLabels = computed(() => {
  const r = L.value.rogue;
  return {
    fight: r.fight,
    elite: r.elite,
    mystery: r.mystery,
    rest: r.rest,
    shop: r.shop,
    boss: r.boss,
    forest: r.forest,
    mountains: r.mountains,
    ruins: r.ruins,
    citadel: r.citadel,
  };
});
const rogueLegend = computed(() =>
  ["fight", "elite", "mystery", "rest", "shop", "boss"].map((type) => ({
    type,
    icon: nodeTypes[type].icon,
    metal: nodeTypes[type].metal,
    label: rogueLabels.value[type],
  })),
);

function rogueReset() {
  rogueSeed += 7;
  const map = generateMap(mulberry(rogueSeed));
  rogueMapData.value = map;
  roguePos.value = null;
  rogueVisited.value = [];
  rogueReach.value = map[0].map((n) => n.id);
  rogueGold.value = 0;
  rogueHp.value = 40;
  rogueCards.value = 0;
  rogueWait = 0;
}

const rogueEffects = {
  fight: { gold: 12, hp: -3, cards: 1 },
  elite: { gold: 25, hp: -6, cards: 1 },
  mystery: { gold: 8, hp: 0, cards: 1 },
  rest: { gold: 0, hp: 8, cards: 0 },
  shop: { gold: -10, hp: 0, cards: 1 },
  boss: { gold: 50, hp: 0, cards: 1 },
};

function rogueTick() {
  if (!rogueMapData.value.length) return;
  const nodes = new Map(rogueMapData.value.flat().map((n) => [n.id, n]));
  const here = roguePos.value ? nodes.get(roguePos.value) : null;
  if (here && here.type === "boss") {
    rogueWait += 1;
    if (rogueWait > 3) rogueReset();
    return;
  }
  const options = rogueReach.value.length ? rogueReach.value : [];
  if (!options.length) {
    rogueReset();
    return;
  }
  const next = nodes.get(pick(options));
  const effect = rogueEffects[next.type];
  roguePos.value = next.id;
  rogueVisited.value = [...rogueVisited.value, next.id];
  rogueReach.value = next.next;
  rogueGold.value = Math.max(0, rogueGold.value + effect.gold);
  rogueHp.value = Math.max(8, Math.min(40, rogueHp.value + effect.hp));
  rogueCards.value += effect.cards;
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

async function loadGuides() {
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}guides/index.json`).catch(() => null);
  if (!res || !res.ok) return;
  const list = await res.json().catch(() => null);
  if (!Array.isArray(list) || !list.length) return;
  guidesCount.value = list.length;
  const loaded = await Promise.all(
    list.map(async (name) => {
      const r = await fetch(
        `${base}guides/${encodeURIComponent(name)}.json`,
      ).catch(() => null);
      const g = r && r.ok ? await r.json().catch(() => null) : null;
      if (!g || !g.keyCards || g.keyCards.length < 3) return null;
      return {
        name,
        style: g.style,
        cards: g.keyCards
          .filter((c) => c.image)
          .map((c) => ({
            file: c.image,
            title: titleOf(c.image),
            url: abs(`images/cards/${name}/${c.image}`),
          })),
      };
    }),
  );
  csHeroes.value = loaded.filter(Boolean);
}
watch(guidesCount, () => countUp());

const root = ref(null);
const revealOn = ref(false);
let observer = null;
let parallaxItems = [];
let frameId = 0;

function updateParallax() {
  frameId = 0;
  const vh = window.innerHeight;
  for (const el of parallaxItems) {
    const r = el.getBoundingClientRect();
    const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
    el.style.setProperty("--p", Math.max(-1, Math.min(1, p)).toFixed(3));
  }
}
function onScroll() {
  if (!frameId) frameId = requestAnimationFrame(updateParallax);
}

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

newPack();
rogueReset();

const timers = [];

onMounted(async () => {
  countUp();
  loadGuides();

  if (prefersReduced()) {
    for (let i = 0; i < 6; i++) packTick();
    onlineStep.value = 5;
    for (let i = 0; i < 6; i++) rogueTick();
    return;
  }

  timers.push(
    setInterval(() => (muIndex.value += 1), 4800),
    setInterval(() => {
      const hero = csHero.value;
      if (!hero) return;
      if (csActive.value + 1 >= hero.cards.length) {
        csActive.value = 0;
        csIndex.value += 1;
      } else {
        csActive.value += 1;
      }
    }, 3200),
    setInterval(packTick, 1100),
    setInterval(onlineTick, 1100),
    setInterval(rogueTick, 1200),
  );

  await nextTick();
  if (root.value) {
    parallaxItems = [...root.value.querySelectorAll("[data-parallax]")];
    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }

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

watch([csHero, muHero], async () => {
  await nextTick();
  if (!root.value) return;
  parallaxItems = [...root.value.querySelectorAll("[data-parallax]")];
  updateParallax();
  if (observer) {
    root.value
      .querySelectorAll("[data-reveal]:not(.is-in)")
      .forEach((el) => observer.observe(el));
  }
});

onBeforeUnmount(() => {
  timers.forEach(clearInterval);
  if (frameId) cancelAnimationFrame(frameId);
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
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
.home-card:hover {
  border-color: rgba(var(--color-player-rgb, 79, 124, 255), 0.6);
  box-shadow: 0 18px 44px rgba(var(--color-player-rgb, 79, 124, 255), 0.2);
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

/* ---------- NEW ---------- */
.home-wrap {
  position: relative;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px;
}
.home-band {
  position: relative;
  margin-top: 72px;
  padding: 88px 0;
  overflow: hidden;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(var(--bg-dark-rgb, 15, 23, 42), 0.92) 14%,
    rgba(var(--bg-dark-rgb, 15, 23, 42), 0.92) 86%,
    transparent
  );
}
.home-band-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 720px;
  height: 720px;
  margin: -360px 0 0 -360px;
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgba(var(--color-player-rgb, 79, 124, 255), 0.28),
    transparent 65%
  );
  transform: translate(calc(var(--p, 0) * -320px), calc(var(--p, 0) * 140px));
}
.home-band-glow.is-red {
  background: radial-gradient(
    circle,
    rgba(var(--color-opponent-rgb, 255, 79, 109), 0.26),
    transparent 65%
  );
  transform: translate(calc(var(--p, 0) * 320px), calc(var(--p, 0) * 140px));
}
.home-band-glow.is-gold {
  background: radial-gradient(circle, rgba(246, 201, 69, 0.2), transparent 65%);
}
.home-tag {
  display: block;
  width: max-content;
  margin: 0 auto 12px;
  padding: 4px 14px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-warning, #facc15);
  background: rgba(var(--color-player-rgb, 79, 124, 255), 0.12);
  border: 1px solid rgba(var(--color-player-rgb, 79, 124, 255), 0.4);
  border-radius: 999px;
}
.home-tag.is-left,
.home-h2.is-left,
.home-lead.is-left {
  margin-left: 0;
  text-align: left;
}
.home-h2.is-left::after {
  margin-left: 0;
}
.home-show-cta {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
.home-caption {
  max-width: 620px;
  margin: 14px auto 0;
  font-size: 0.82rem;
  text-align: center;
  color: var(--text-muted, #94a3b8);
}

.reveal-on [data-reveal="zoom"]:not(.is-in) {
  transform: scale(0.92) translateY(30px);
}
.reveal-on [data-reveal="left"]:not(.is-in) {
  transform: translateX(-60px);
}
.reveal-on [data-reveal="right"]:not(.is-in) {
  transform: translateX(60px);
}

.home-lead + .home-lead {
  margin-top: 14px;
}
.home-lead-mark mark {
  padding: 3px 10px;
  color: #fff;
  background: linear-gradient(
    100deg,
    rgba(var(--color-player-rgb, 79, 124, 255), 0.55),
    rgba(var(--color-opponent-rgb, 255, 79, 109), 0.55)
  );
  border-radius: 6px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}
.home-proof {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  padding: 0;
  margin: 22px 0 0;
  list-style: none;
}
.home-proof li {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 7px 16px;
  font-size: 0.88rem;
  font-weight: 700;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.8);
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.1));
  border-radius: 999px;
}

.home-ribbon {
  margin-top: 56px;
  overflow: hidden;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}
.home-ribbon-track {
  display: inline-block;
  font-size: clamp(3rem, 11vw, 8rem);
  font-weight: 900;
  line-height: 1;
  letter-spacing: 0.02em;
  color: transparent;
  -webkit-text-stroke: 2px rgba(var(--color-player-rgb, 79, 124, 255), 0.45);
  transform: translateX(calc(-10% + var(--p, 0) * -22%));
}
.home-ribbon.is-reverse .home-ribbon-track {
  -webkit-text-stroke-color: rgba(
    var(--color-opponent-rgb, 255, 79, 109),
    0.45
  );
  transform: translateX(calc(-45% + var(--p, 0) * 22%));
}

/* matchups */
.mu-show {
  display: grid;
  grid-template-columns: 250px 52px 1fr;
  gap: 14px;
  align-items: center;
  max-width: 980px;
  padding: 22px;
  margin: 34px auto 0;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.85);
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.08));
  border-radius: 22px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}
.mu-hero {
  position: relative;
  overflow: hidden;
  border: 2px solid var(--color-player, #4f7cff);
  border-radius: 16px;
  box-shadow: 0 0 28px rgba(var(--color-player-rgb, 79, 124, 255), 0.45);
}
.mu-hero-img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  object-position: top;
}
.mu-hero-body {
  position: absolute;
  inset: auto 0 0;
  padding: 36px 12px 12px;
  background: linear-gradient(transparent, rgba(8, 12, 22, 0.95));
}
.mu-hero-name {
  font-size: 1.2rem;
  font-weight: 800;
}
.mu-hero-meta {
  display: flex;
  gap: 14px;
  font-size: 0.78rem;
  color: var(--text-muted, #cbd5e1);
}
.mu-hero-meta b {
  color: var(--color-warning, #facc15);
}
.mu-vs {
  display: flex;
  align-items: center;
  justify-content: center;
}
.mu-vs span {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  font-size: 0.85rem;
  font-weight: 900;
  background: linear-gradient(
    135deg,
    var(--color-player, #4f7cff),
    var(--color-opponent, #ff4f6d)
  );
  border-radius: 50%;
  animation: home-pulse 2s ease-in-out infinite;
}
@keyframes home-pulse {
  50% {
    transform: scale(1.12);
  }
}
.mu-foes {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.mu-foe {
  position: relative;
  display: grid;
  grid-template-columns: 52px 1fr auto;
  grid-template-rows: auto auto;
  gap: 2px 10px;
  align-items: center;
  padding: 8px 12px 8px 8px;
  background: rgba(var(--bg-slate-rgb, 30, 41, 59), 0.8);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 12px;
  transition-delay: calc(var(--i, 0) * 70ms);
}
.mu-foe img {
  grid-row: 1 / 3;
  width: 52px;
  height: 52px;
  object-fit: cover;
  object-position: top;
  border-radius: 10px;
}
.mu-foe-name {
  overflow: hidden;
  font-size: 0.86rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mu-foe-wr {
  font-size: 1.05rem;
  font-weight: 900;
}
.mu-foe-bar {
  grid-column: 2 / 4;
  height: 6px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}
.mu-foe-bar i {
  display: block;
  height: 100%;
  background: var(--text-muted, #94a3b8);
  border-radius: 6px;
  transition: width 0.8s ease;
}
.mu-foe.is-win {
  border-color: rgba(var(--color-proceed-rgb, 16, 185, 129), 0.6);
}
.mu-foe.is-win .mu-foe-wr {
  color: var(--color-proceed, #10b981);
}
.mu-foe.is-win .mu-foe-bar i {
  background: var(--color-proceed, #10b981);
}
.mu-foe.is-lose {
  border-color: rgba(var(--color-opponent-rgb, 255, 79, 109), 0.6);
}
.mu-foe.is-lose .mu-foe-wr {
  color: var(--color-opponent, #ff4f6d);
}
.mu-foe.is-lose .mu-foe-bar i {
  background: var(--color-opponent, #ff4f6d);
}

.mu-swap-enter-active,
.mu-swap-leave-active {
  transition:
    opacity 0.35s ease,
    transform 0.35s ease;
}
.mu-swap-enter-from {
  opacity: 0;
  transform: translateX(-30px) rotate(-3deg);
}
.mu-swap-leave-to {
  opacity: 0;
  transform: translateX(30px) rotate(3deg);
}
.mu-foe-enter-active,
.mu-foe-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.mu-foe-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.mu-foe-leave-to {
  position: absolute;
  opacity: 0;
  transform: translateX(-20px);
}

/* card stats */
.cs-stage {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  align-items: center;
  margin-top: 40px;
}
.cs-fan {
  position: relative;
  height: 400px;
  perspective: 900px;
  transform: rotate(calc(var(--p, 0) * 5deg));
}
.cs-card {
  position: absolute;
  top: 0;
  left: 50%;
  width: 230px;
  margin-left: -115px;
  cursor: pointer;
  border-radius: 14px;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55);
  transform: translate(var(--fx), var(--fy)) rotate(var(--fr));
  transition:
    transform 0.55s cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 0.4s ease;
}
.cs-card img {
  display: block;
  width: 100%;
  border-radius: 14px;
}
.cs-card.is-active {
  box-shadow:
    0 0 0 3px var(--color-warning, #facc15),
    0 22px 50px rgba(0, 0, 0, 0.7),
    0 0 36px rgba(250, 204, 21, 0.35);
  transform: translate(var(--fx), -22px) rotate(0deg) scale(1.08);
}
.cs-panel {
  position: relative;
  padding: 22px;
  background: rgba(var(--bg-slate-rgb, 30, 41, 59), 0.7);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 18px;
}
.cs-example {
  position: absolute;
  top: -11px;
  right: 18px;
  padding: 2px 12px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1a1204;
  background: var(--color-warning, #facc15);
  border-radius: 999px;
}
.cs-title {
  min-height: 62px;
  margin-bottom: 14px;
}
.cs-title h3 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
}
.cs-title small {
  color: var(--text-muted, #94a3b8);
}
.cs-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.cs-col h4 {
  margin: 0 0 8px;
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cs-col h4.is-good {
  color: var(--color-proceed, #10b981);
}
.cs-col h4.is-bad {
  color: var(--color-opponent, #ff4f6d);
}
.cs-col ul {
  position: relative;
  padding: 0;
  margin: 0;
  list-style: none;
}
.cs-col li {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 5px 8px 5px 5px;
  margin-bottom: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  border-radius: 10px;
  transition-delay: calc(var(--i, 0) * 70ms);
}
.cs-col li.is-good {
  background: rgba(var(--color-proceed-rgb, 16, 185, 129), 0.14);
}
.cs-col li.is-bad {
  background: rgba(var(--color-opponent-rgb, 255, 79, 109), 0.14);
}
.cs-col li img {
  width: 34px;
  height: 34px;
  object-fit: cover;
  object-position: top;
  border-radius: 8px;
}
.cs-col li span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cs-col li.is-good b {
  color: var(--color-proceed, #10b981);
}
.cs-col li.is-bad b {
  color: var(--color-opponent, #ff4f6d);
}

/* pack draft */
.pk-board {
  max-width: 980px;
  padding: 18px;
  margin: 36px auto 0;
  background: rgba(var(--bg-slate-rgb, 30, 41, 59), 0.55);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 22px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
}
.pk-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.pk-stats div {
  padding: 8px 12px;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.8);
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
}
.pk-stats span {
  display: block;
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted, #94a3b8);
}
.pk-stats b {
  font-size: 1.15rem;
}
.pk-stats small {
  color: var(--text-muted, #94a3b8);
}
.pk-banner {
  padding: 8px 14px;
  margin: 12px 0;
  font-size: 0.88rem;
  font-weight: 700;
  text-align: center;
  border-radius: 10px;
  transition:
    background 0.4s ease,
    border-color 0.4s ease;
}
.pk-banner.is-you {
  background: rgba(var(--color-player-rgb, 79, 124, 255), 0.18);
  border: 1px solid rgba(var(--color-player-rgb, 79, 124, 255), 0.6);
}
.pk-banner.is-foe {
  background: rgba(var(--color-opponent-rgb, 255, 79, 109), 0.18);
  border: 1px solid rgba(var(--color-opponent-rgb, 255, 79, 109), 0.6);
}
.pk-layout {
  display: grid;
  grid-template-columns: 110px 1fr 110px;
  gap: 14px;
  align-items: start;
}
.pk-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  min-height: 300px;
  align-content: start;
}
.pk-grid :deep(.pack-card) {
  min-height: 0;
  pointer-events: none;
}
.pk-side h4 {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 800;
  text-align: center;
  text-transform: uppercase;
}
.pk-side.is-you h4 {
  color: var(--color-player, #4f7cff);
}
.pk-side.is-foe h4 {
  color: var(--color-opponent, #ff4f6d);
}
.pk-kept {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  min-height: 100px;
  padding: 6px;
  border: 1px dashed var(--border-medium, rgba(255, 255, 255, 0.2));
  border-radius: 10px;
  align-content: start;
}
.pk-kept img {
  width: 100%;
  border-radius: 6px;
}
.pk-enter-active,
.pk-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s ease;
}
.pk-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.9);
}
.pk-leave-active {
  position: absolute;
  z-index: 2;
}
.pk-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.85);
}
.pk-move {
  transition: transform 0.5s ease;
}
.pk-kept-enter-active {
  transition:
    opacity 0.5s ease,
    transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1.3);
}
.pk-kept-enter-from {
  opacity: 0;
  transform: scale(0.3);
}

/* online */
.home-online {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  padding-top: 96px;
}
.on-points {
  padding: 0;
  margin: 18px 0 24px;
  list-style: none;
}
.on-points li {
  position: relative;
  padding-left: 24px;
  margin-bottom: 8px;
  color: var(--text-muted, #cbd5e1);
}
.on-points li::before {
  content: "✓";
  position: absolute;
  left: 0;
  font-weight: 900;
  color: var(--color-proceed, #10b981);
}
.on-stage {
  position: relative;
  padding: 26px;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.85);
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.1));
  border-radius: 24px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
  transform: translateY(calc(var(--p, 0) * -26px));
}
.on-room {
  text-align: center;
}
.on-room > span:first-child {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted, #94a3b8);
}
.on-code {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 8px 0;
}
.on-code b {
  display: grid;
  place-items: center;
  width: 54px;
  height: 66px;
  font-size: 2rem;
  color: transparent;
  background: rgba(var(--bg-slate-rgb, 30, 41, 59), 0.9);
  border: 2px solid var(--border-medium, rgba(255, 255, 255, 0.15));
  border-radius: 12px;
  transition:
    color 0.4s ease calc(var(--i) * 140ms),
    border-color 0.4s ease calc(var(--i) * 140ms),
    transform 0.4s ease calc(var(--i) * 140ms);
}
.on-code b.on {
  color: var(--color-warning, #facc15);
  border-color: var(--color-warning, #facc15);
  transform: translateY(-4px);
}
.on-copy {
  display: inline-block;
  padding: 4px 14px;
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.2));
  border-radius: 999px;
  opacity: 0.3;
  transition: opacity 0.4s ease;
}
.on-copy.on {
  opacity: 1;
}
.on-peers {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
  margin-top: 26px;
}
.on-peer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding: 16px 8px;
  text-align: center;
  background: rgba(var(--bg-slate-rgb, 30, 41, 59), 0.6);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 16px;
  opacity: 0.35;
  transition:
    opacity 0.5s ease,
    border-color 0.5s ease,
    box-shadow 0.5s ease;
}
.on-peer.on {
  opacity: 1;
}
.on-peer i {
  width: 46px;
  height: 46px;
  border-radius: 50%;
}
.on-peer.is-you i {
  background: var(--color-player, #4f7cff);
}
.on-peer.is-foe i {
  background: var(--color-opponent, #ff4f6d);
}
.on-peer.is-you.on {
  border-color: var(--color-player, #4f7cff);
  box-shadow: 0 0 22px rgba(var(--color-player-rgb, 79, 124, 255), 0.4);
}
.on-peer.is-foe.on {
  border-color: var(--color-opponent, #ff4f6d);
  box-shadow: 0 0 22px rgba(var(--color-opponent-rgb, 255, 79, 109), 0.4);
}
.on-peer span {
  font-weight: 800;
}
.on-peer small {
  font-size: 0.72rem;
  color: var(--text-muted, #94a3b8);
}
.on-link {
  display: flex;
  gap: 5px;
}
.on-link i {
  width: 8px;
  height: 8px;
  background: var(--border-medium, rgba(255, 255, 255, 0.2));
  border-radius: 50%;
  transition: background 0.3s ease;
}
.on-link.on i {
  background: var(--color-proceed, #10b981);
  animation: on-blink 1s ease-in-out infinite;
}
.on-link.on i:nth-child(2) {
  animation-delay: 0.15s;
}
.on-link.on i:nth-child(3) {
  animation-delay: 0.3s;
}
.on-link.on i:nth-child(4) {
  animation-delay: 0.45s;
}
.on-link.on i:nth-child(5) {
  animation-delay: 0.6s;
}
@keyframes on-blink {
  50% {
    opacity: 0.25;
    transform: scale(0.6);
  }
}

/* roguelike */
.rg-board {
  max-width: 980px;
  margin: 36px auto 0;
}
.rg-top {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 14px;
}
.rg-stat {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 6px 16px;
  font-size: 1.05rem;
  font-weight: 800;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.85);
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.1));
  border-radius: 999px;
}
.rg-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  justify-content: center;
  padding: 0;
  margin: 14px 0 0;
  font-size: 0.82rem;
  color: var(--text-muted, #cbd5e1);
  list-style: none;
}
.rg-legend li {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.home-card-new {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 1px 9px;
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--color-warning, #facc15);
  background: rgba(8, 12, 22, 0.8);
  border: 1px solid var(--color-warning, #facc15);
  border-radius: 999px;
}

@media (max-width: 820px) {
  .mu-show {
    grid-template-columns: 1fr;
  }
  .mu-hero {
    max-width: 260px;
    margin: 0 auto;
  }
  .mu-vs {
    margin: -6px 0;
  }
  .mu-foes {
    grid-template-columns: 1fr;
  }
  .cs-stage,
  .home-online {
    grid-template-columns: 1fr;
    gap: 28px;
  }
  .cs-fan {
    height: 340px;
  }
  .cs-card {
    width: 180px;
    margin-left: -90px;
  }
  .cs-cols {
    grid-template-columns: 1fr;
  }
  .pk-layout {
    grid-template-columns: 1fr;
  }
  .pk-side {
    order: 2;
  }
  .pk-kept {
    grid-template-columns: repeat(4, 1fr);
  }
  .pk-grid {
    grid-template-columns: repeat(2, 1fr);
    min-height: 0;
  }
  .home-band {
    padding: 64px 0;
  }
}

@media (max-width: 720px) {
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
}

@media (prefers-reduced-motion: reduce) {
  .home-track,
  .home-title-accent,
  .home-slide,
  .mu-vs span,
  .on-link i {
    animation: none;
  }
  .home-slide:first-child {
    opacity: 0.5;
  }
  .home-btn,
  .home-card,
  .home-card-art,
  .home-chip,
  .cs-card,
  .mu-foe-bar i {
    transition: none;
  }
}
</style>
