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
          <RogueIcon
            :name="proofIcons[i].name"
            :metal="proofIcons[i].metal"
            size="1.3em"
          />
          {{ item }}
        </li>
      </ul>

      <div v-if="muHero" class="mu-show" data-reveal="zoom">
        <Transition name="mu-swap">
          <div :key="muHero.id" class="mu-slide">
            <div class="mu-hero">
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

            <div class="mu-vs">
              <span>VS</span>
            </div>

            <div class="mu-foes">
              <div
                v-for="(foe, i) in muFoes"
                :key="foe.id"
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
            </div>
          </div>
        </Transition>
      </div>
      <p v-if="muHero" class="home-caption" data-reveal>{{ L.mu.note }}</p>
    </section>

    <div class="home-ribbon" data-parallax aria-hidden="true">
      <div class="home-ribbon-track">
        <span v-for="n in 4" :key="n">{{ L.ribbon[0] }}</span>
      </div>
    </div>

    <section class="home-band home-tools">
      <div class="home-band-glow" data-parallax aria-hidden="true"></div>
      <div class="home-wrap">
        <span class="home-tag" data-reveal>{{ L.tools.tag }}</span>
        <h2 class="home-h2" data-reveal>{{ L.tools.title }}</h2>

        <div
          class="tl-grid"
          data-reveal
          @pointerenter="toolPause = true"
          @pointerleave="toolPause = false"
        >
          <ul class="tl-list">
            <li v-for="(item, i) in toolItems" :key="item.key">
              <button
                type="button"
                class="tl-item"
                :class="{ 'is-active': i === toolIndex }"
                @click="selectTool(i)"
              >
                <span class="tl-icon">
                  <RogueIcon
                    :name="item.icon"
                    :metal="item.metal"
                    size="30px"
                  />
                </span>
                <span class="tl-text">
                  <b>{{ item.title }}</b>
                  <small>{{ item.text }}</small>
                </span>
              </button>
            </li>
          </ul>

          <div class="tl-stage">
            <Transition name="tl-swap">
              <div :key="toolIndex + '-' + toolRound" class="tl-slide">
                <template v-if="toolItems[toolIndex].key === 'stats'">
                  <div v-if="tlStats" class="tl-stats">
                    <div class="tl-banner tl-pop" :style="{ '--i': 0 }">
                      <img :src="tlStats.hero.image" :alt="tlStats.hero.name" />
                      <div class="tl-banner-body">
                        <b>{{ tlStats.hero.name }}</b>
                        <span>
                          {{ L.tools.ui.elo }} <i>{{ tlStats.hero.elo }}</i>
                        </span>
                        <span>
                          {{ L.tools.ui.avg }} <i>{{ tlStats.avg }}%</i>
                        </span>
                      </div>
                    </div>
                    <div class="tl-cards">
                      <div
                        v-for="(foe, i) in tlStats.foes"
                        :key="foe.id"
                        class="tl-card tl-pop"
                        :class="foe.cls"
                        :style="{ '--i': i + 1 }"
                      >
                        <img :src="foe.image" :alt="foe.name" />
                        <span class="tl-badge">{{ foe.wr }}%</span>
                        <em>{{ foe.name }}</em>
                      </div>
                    </div>
                  </div>
                </template>

                <template v-else-if="toolItems[toolIndex].key === 'guides'">
                  <div v-if="tlGuide" class="tl-guide">
                    <div class="tl-banner tl-pop" :style="{ '--i': 0 }">
                      <img :src="tlGuide.image" :alt="tlGuide.name" />
                      <div class="tl-banner-body">
                        <b>{{ tlGuide.name }}</b>
                        <span>{{ tlGuide.style }}</span>
                        <span>
                          {{ L.tools.ui.complexity }}
                          <i>{{ tlGuide.complexity }}</i>
                        </span>
                      </div>
                    </div>
                    <div class="tl-keycards">
                      <img
                        v-for="(card, i) in tlGuide.cards"
                        :key="card"
                        class="tl-pop"
                        :style="{ '--i': i + 1 }"
                        :src="card"
                        alt=""
                      />
                    </div>
                    <ul class="tl-points is-good tl-pop" :style="{ '--i': 5 }">
                      <li v-for="line in tlGuide.good" :key="line">
                        {{ line }}
                      </li>
                    </ul>
                    <ul class="tl-points is-bad tl-pop" :style="{ '--i': 6 }">
                      <li v-for="line in tlGuide.bad" :key="line">
                        {{ line }}
                      </li>
                    </ul>
                  </div>
                </template>

                <template v-else-if="toolItems[toolIndex].key === 'maps'">
                  <div v-if="tlMap" class="tl-map">
                    <div class="tl-map-img tl-pop" :style="{ '--i': 0 }">
                      <img :src="tlMap.image" :alt="tlMap.name" />
                      <b>{{ tlMap.name }}</b>
                    </div>
                    <div class="tl-rows">
                      <div
                        v-for="(row, i) in tlMap.rows"
                        :key="row.id"
                        class="tl-row tl-pop"
                        :class="row.cls"
                        :style="{ '--i': i + 1 }"
                      >
                        <img :src="row.image" :alt="row.name" />
                        <span>{{ row.name }}</span>
                        <b>{{ row.label }}</b>
                      </div>
                    </div>
                  </div>
                </template>

                <template v-else-if="toolItems[toolIndex].key === 'matchups'">
                  <div v-if="tlDuel" class="tl-duel">
                    <div class="tl-duel-top">
                      <div class="tl-fighter tl-pop" :style="{ '--i': 0 }">
                        <img :src="tlDuel.a.image" :alt="tlDuel.a.name" />
                        <b>{{ tlDuel.a.name }}</b>
                      </div>
                      <div class="tl-vs tl-pop" :style="{ '--i': 1 }">VS</div>
                      <div class="tl-fighter tl-pop" :style="{ '--i': 2 }">
                        <img :src="tlDuel.b.image" :alt="tlDuel.b.name" />
                        <b>{{ tlDuel.b.name }}</b>
                      </div>
                    </div>
                    <div class="tl-meter tl-pop" :style="{ '--i': 3 }">
                      <span class="is-a" :style="{ width: tlDuel.wr + '%' }">
                        {{ tlDuel.wr }}%
                      </span>
                      <span class="is-b">{{ 100 - tlDuel.wr }}%</span>
                    </div>
                    <div
                      v-if="tlDuel.map"
                      class="tl-bestmap tl-pop"
                      :style="{ '--i': 4 }"
                    >
                      <img :src="tlDuel.map.image" :alt="tlDuel.map.name" />
                      <span>{{ L.tools.ui.bestMap }}</span>
                      <b>{{ tlDuel.map.name }}</b>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="tl-gen">
                    <div class="tl-chips tl-pop" :style="{ '--i': 0 }">
                      <span class="tl-chip">{{ L.tools.ui.balanced }}</span>
                      <span class="tl-chip is-on">
                        <RogueIcon name="laurels" metal="gold" size="16px" />
                        {{ L.tools.ui.collection }}
                      </span>
                    </div>
                    <div
                      v-for="(pair, i) in tlPairs"
                      :key="pair.a.id + pair.b.id"
                      class="tl-pair tl-pop"
                      :style="{ '--i': i + 1 }"
                    >
                      <img :src="pair.a.image" :alt="pair.a.name" />
                      <span>{{ pair.a.name }}</span>
                      <b>{{ pair.wr }}%</b>
                      <span class="is-end">{{ pair.b.name }}</span>
                      <img :src="pair.b.image" :alt="pair.b.name" />
                    </div>
                  </div>
                </template>
              </div>
            </Transition>
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

    <section class="home-band home-rogue">
      <div
        class="home-band-glow is-gold"
        data-parallax
        aria-hidden="true"
      ></div>
      <div class="home-wrap rg-grid">
        <div class="rg-text">
          <span class="home-tag is-left" data-reveal>{{ L.rogue.tag }}</span>
          <h2 class="home-h2 is-left" data-reveal>{{ L.rogue.title }}</h2>
          <p class="home-lead is-left" data-reveal>{{ L.rogue.text }}</p>
          <ul class="rg-legend" data-reveal>
            <li v-for="item in rogueLegend" :key="item.type">
              <RogueIcon :name="item.icon" :metal="item.metal" size="1.3em" />
              {{ item.label }}
            </li>
          </ul>
          <router-link
            :to="{ name: 'rogue' }"
            class="home-btn home-btn-primary"
            data-reveal
          >
            {{ L.rogue.cta }}
          </router-link>
        </div>

        <div class="rg-map" data-reveal="right">
          <svg
            class="rg-lines"
            viewBox="0 0 100 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line
              v-for="edge in rogueEdges"
              :key="edge.key"
              :x1="edge.x1"
              :y1="edge.y1"
              :x2="edge.x2"
              :y2="edge.y2"
            />
          </svg>
          <div
            v-for="node in rogueNodes"
            :key="node.id"
            class="rg-node"
            :style="{
              left: node.x + '%',
              top: (node.y / 120) * 100 + '%',
              '--c': node.color,
            }"
          >
            <RogueIcon :name="node.icon" :metal="node.metal" size="60%" />
          </div>
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
            <span class="home-card-icon">
              <RogueIcon :name="f.icon" :metal="f.metal" size="1.6em" />
            </span>
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
import { nodeTypes } from "../../rogueData.js";
import PackCard from "../PackCard.vue";
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
      "Hero ratings, matchups and map statistics are all built from the results of professional players.",
    proof: ["Elo ratings", "Matchup win rates", "Map statistics"],
    mu: {
      elo: "Elo",
      avg: "avg. win rate",
      note: "Win rates of one hero against the rest of the roster — the same numbers you see while drafting.",
    },
    ribbon: ["MATCHUPS · RATINGS · MAPS · ", "ONLINE · DRAFT · ROGUELIKE · "],
    tools: {
      tag: "Toolbox",
      title: "What is inside",
      items: {
        stats: {
          title: "Player statistics",
          text: "Elo and win rates of every hero against the rest of the roster.",
        },
        guides: {
          title: "Hero guides",
          text: "Key cards, strengths and weaknesses — the essentials, squeezed.",
        },
        maps: {
          title: "Hero map guide",
          text: "Which heroes a map favors and which it punishes.",
        },
        matchups: {
          title: "Matchups",
          text: "Head-to-head win rates and the best map for a duel.",
        },
        generator: {
          title: "Matchup generator",
          text: "Balanced duels, or only from your own collection.",
        },
      },
      ui: {
        elo: "Elo",
        avg: "avg. win rate",
        complexity: "Complexity",
        favored: "Favored",
        disfavored: "Disfavored",
        bestMap: "Best map",
        balanced: "Balanced matchups",
        collection: "My collection",
      },
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
      "Банте й пікайте героїв за рейтингом професійних гравців, драфтіть паки карт, грайте онлайн чи проходьте роуглайк — усе в браузері.",
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
      "Рейтинги героїв, матчапи та статистика мап — усе побудовано на результатах професійних гравців.",
    proof: ["Рейтинг Elo", "Вінрейт у матчапах", "Статистика мап"],
    mu: {
      elo: "Elo",
      avg: "середній вінрейт",
      note: "Вінрейт одного героя проти решти ростеру — ті самі цифри, що ви бачите під час драфту.",
    },
    ribbon: ["МАТЧАПИ · РЕЙТИНГИ · МАПИ · ", "ОНЛАЙН · ДРАФТ · РОГАЛИК · "],
    tools: {
      tag: "Інструменти",
      title: "Що всередині",
      items: {
        stats: {
          title: "Статистика гравців",
          text: "Elo та вінрейт кожного героя проти решти ростеру.",
        },
        guides: {
          title: "Гайди по персонажах",
          text: "Ключові карти, сильні й слабкі сторони — найголовніше стисло.",
        },
        maps: {
          title: "Мапи героїв",
          text: "Яким героям мапа допомагає, а яким шкодить.",
        },
        matchups: {
          title: "Матчапи",
          text: "Вінрейт у дуелях і найкраща мапа для поєдинку.",
        },
        generator: {
          title: "Генератор матчапів",
          text: "Рівні дуелі або лише з вашої колекції.",
        },
      },
      ui: {
        elo: "Elo",
        avg: "середній вінрейт",
        complexity: "Складність",
        favored: "Підходить",
        disfavored: "Не підходить",
        bestMap: "Найкраща мапа",
        balanced: "Збалансовані матчапи",
        collection: "Моя колекція",
      },
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
      tag: "Роуглайк",
      title: "Пройдіть мапу боїв",
      text: "Обирайте маршрут крізь бої, еліт і події, збирайте золото й карти, перебудовуйте колоду та зустрічайте кастомного боса.",
      cta: "Почати роуглайк",
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
        title: "Роуглайк",
        text: "Проходьте мапу з боїв, еліт і подій, збирайте золото й карти та зустрічайте кастомних босів.",
      },
    },
  },
};

const L = computed(() => dict[lang.value] || dict.en);

const proofIcons = [
  { name: "trophy", metal: "gold" },
  { name: "crossedSwords", metal: "bronze" },
  { name: "treasureMap", metal: "silver" },
];

const features = [
  {
    key: "draft",
    route: "main",
    icon: "crossedSwords",
    metal: "bronze",
    art: "hero",
  },
  {
    key: "formats",
    route: "formats",
    icon: "pentacle",
    metal: "silver",
    art: "map",
  },
  {
    key: "maps",
    route: "maps",
    icon: "treasureMap",
    metal: "silver",
    art: "map",
  },
  {
    key: "matchups",
    route: "matchups",
    icon: "shakingHands",
    metal: "silver",
    art: "hero",
  },
  {
    key: "guide",
    route: "guide",
    icon: "openBook",
    metal: "gold",
    art: "hero",
  },
  {
    key: "pack-draft",
    route: "pack-draft",
    icon: "cardPlay",
    metal: "gold",
    art: "map",
    isNew: true,
  },
  {
    key: "game",
    route: "game",
    icon: "rollingDices",
    metal: "ruby",
    art: "hero",
    isNew: true,
  },
  {
    key: "rogue",
    route: "rogue",
    icon: "swordman",
    metal: "bronze",
    art: "map",
    isNew: true,
  },
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

const toolKeys = [
  { key: "stats", icon: "scales", metal: "gold" },
  { key: "guides", icon: "openBook", metal: "gold" },
  { key: "maps", icon: "treasureMap", metal: "silver" },
  { key: "matchups", icon: "crossedSwords", metal: "bronze" },
  { key: "generator", icon: "rollingDices", metal: "ruby" },
];
const toolItems = computed(() =>
  toolKeys.map((item) => ({
    ...item,
    title: L.value.tools.items[item.key].title,
    text: L.value.tools.items[item.key].text,
  })),
);
const toolIndex = ref(0);
const toolRound = ref(0);
const toolPause = ref(false);

function selectTool(i) {
  if (i === toolIndex.value) return;
  toolIndex.value = i;
}

function nextTool() {
  if (toolPause.value) return;
  const next = (toolIndex.value + 1) % toolKeys.length;
  if (next === 0) toolRound.value += 1;
  toolIndex.value = next;
}

const guideHeroes = ref([]);
const pickHero = (k) => {
  const pool = muPool.value;
  return pool.length ? pool[((k % pool.length) * 7 + 3) % pool.length] : null;
};
const classOf = (wr) =>
  wr >= 58 ? "is-win" : wr <= 42 ? "is-lose" : "is-even";

const tlStats = computed(() => {
  const hero = pickHero(toolRound.value * 5);
  if (!hero) return null;
  const foes = foesOf(hero);
  const mid = Math.floor(foes.length / 2);
  const picked = [foes[0], foes[1], foes[mid], foes.at(-2), foes.at(-1)];
  return {
    hero,
    avg: Math.round(foes.reduce((sum, f) => sum + f.wr, 0) / foes.length),
    foes: picked.map((f) => ({ ...f, cls: classOf(f.wr) })),
  };
});

const tlGuide = computed(() => {
  const list = guideHeroes.value.filter((g) =>
    characters.value.some((c) => c.name === g.name && c.image),
  );
  if (!list.length) return null;
  const guide = list[(toolRound.value * 3) % list.length];
  const char = characters.value.find((c) => c.name === guide.name);
  const code = lang.value;
  const pickText = (value) => (value?.[code] || value?.en || []).slice(0, 2);
  return {
    name: guide.name,
    image: char.image,
    style: guide.style?.[code] || guide.style?.en || "",
    complexity: guide.complexity,
    cards: guide.cards.slice(0, 4),
    good: pickText(guide.features),
    bad: pickText(guide.weaknesses).slice(0, 1),
  };
});

const tlMap = computed(() => {
  const list = maps.value.filter(
    (m) =>
      (m.favoredBy || []).length >= 2 && (m.disfavoredBy || []).length >= 2,
  );
  if (!list.length) return null;
  const map = list[(toolRound.value * 5 + 1) % list.length];
  const byName = (name) => characters.value.find((c) => c.name === name);
  const rows = [
    ...(map.favoredBy || [])
      .map(byName)
      .filter((c) => c && c.image)
      .slice(0, 3)
      .map((c) => ({ ...c, cls: "is-win", label: L.value.tools.ui.favored })),
    ...(map.disfavoredBy || [])
      .map(byName)
      .filter((c) => c && c.image)
      .slice(0, 2)
      .map((c) => ({
        ...c,
        cls: "is-lose",
        label: L.value.tools.ui.disfavored,
      })),
  ];
  return { name: map.name, image: map.image, rows };
});

const tlDuel = computed(() => {
  const a = pickHero(toolRound.value * 5 + 2);
  if (!a) return null;
  const foes = foesOf(a);
  const b = foes[(toolRound.value * 3) % Math.min(8, foes.length)];
  if (!b) return null;
  const map = maps.value.find(
    (m) =>
      (m.favoredBy || []).includes(a.name) ||
      (m.disfavoredBy || []).includes(b.name),
  );
  return { a, b, wr: b.wr, map: map || null };
});

const tlPairs = computed(() => {
  const pool = heroPool.value.filter((_, i) => i % 3 !== 1);
  const found = [];
  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const wr = getWinrate(pool[i].name, pool[j].name);
      if (wr === null || wr === undefined) continue;
      if (Math.abs(wr - 50) <= 3) {
        found.push({ a: pool[i], b: pool[j], wr: Math.round(wr) });
      }
    }
  }
  if (!found.length) return [];
  const offset = (toolRound.value * 4) % found.length;
  return Array.from(
    { length: Math.min(4, found.length) },
    (_, k) => found[(offset + k * 3) % found.length],
  );
});

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

const rogueLabels = computed(() => {
  const r = L.value.rogue;
  return {
    fight: r.fight,
    elite: r.elite,
    mystery: r.mystery,
    rest: r.rest,
    shop: r.shop,
    boss: r.boss,
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

const rogueLayout = [
  { id: "a", type: "boss", lane: 1, row: 0, next: [] },
  { id: "b", type: "rest", lane: 1, row: 1, next: ["a"] },
  { id: "c", type: "elite", lane: 0, row: 2, next: ["b"] },
  { id: "d", type: "mystery", lane: 2, row: 2, next: ["b"] },
  { id: "e", type: "fight", lane: 0, row: 3, next: ["c"] },
  { id: "f", type: "shop", lane: 1, row: 3, next: ["c", "d"] },
  { id: "g", type: "fight", lane: 2, row: 3, next: ["d"] },
  { id: "h", type: "mystery", lane: 0, row: 4, next: ["e", "f"] },
  { id: "i", type: "fight", lane: 2, row: 4, next: ["f", "g"] },
  { id: "j", type: "fight", lane: 1, row: 5, next: ["h", "i"] },
];
const rogueNodes = rogueLayout.map((node) => ({
  id: node.id,
  x: 20 + node.lane * 30,
  y: 10 + node.row * 20,
  icon: nodeTypes[node.type].icon,
  metal: nodeTypes[node.type].metal,
  color: nodeTypes[node.type].color,
}));
const rogueEdges = rogueLayout.flatMap((node) =>
  node.next.map((id) => {
    const to = rogueLayout.find((item) => item.id === id);
    return {
      key: node.id + id,
      x1: 20 + node.lane * 30,
      y1: 10 + node.row * 20,
      x2: 20 + to.lane * 30,
      y2: 10 + to.row * 20,
    };
  }),
);

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
        complexity: g.complexity,
        features: g.features,
        weaknesses: g.weaknesses,
        cards: g.keyCards
          .filter((c) => c.image)
          .map((c) => abs(`images/cards/${name}/${c.image}`)),
      };
    }),
  );
  guideHeroes.value = loaded.filter(Boolean);
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

const timers = [];

onMounted(async () => {
  countUp();
  loadGuides();

  if (prefersReduced()) {
    for (let i = 0; i < 6; i++) packTick();
    onlineStep.value = 5;
    return;
  }

  timers.push(
    setInterval(() => (muIndex.value += 1), 4800),
    setInterval(packTick, 2000),
    setInterval(onlineTick, 1100),
    setInterval(nextTool, 6000),
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

watch(muHero, async () => {
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
  display: flex;
  flex-direction: column;
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
  flex: 1;
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
  max-width: 980px;
  margin: 34px auto 0;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.85);
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.08));
  border-radius: 22px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}
.mu-slide {
  display: grid;
  grid-area: 1 / 1;
  grid-template-columns: 250px 52px 1fr;
  gap: 14px;
  align-items: center;
  padding: 22px;
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
  transition: opacity 0.6s ease;
}
.mu-swap-enter-from,
.mu-swap-leave-to {
  opacity: 0;
}
.mu-swap-enter-active .mu-foe {
  animation: tl-rise 0.5s ease both;
  animation-delay: calc(var(--i, 0) * 70ms);
}

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
  padding: 10px 14px;
  margin: 22px 0 18px;
  font-size: 0.88rem;
  font-weight: 700;
  text-align: center;
  border-radius: 10px;
  transition:
    background 0.8s ease,
    border-color 0.8s ease;
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
  grid-template-rows: repeat(2, auto);
  aspect-ratio: 4 / 3.1;
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
  height: 330px;
  padding: 6px;
  overflow: hidden;
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
    opacity 0.9s ease,
    transform 0.9s ease;
}
.pk-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.96);
}
.pk-leave-active {
  position: absolute;
  z-index: 2;
  width: calc((100% - 30px) / 4);
}
.pk-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
}
.pk-move {
  transition: transform 0.9s ease;
}
.pk-kept-enter-active {
  transition:
    opacity 0.9s ease,
    transform 0.9s ease;
}
.pk-kept-enter-from {
  opacity: 0;
  transform: scale(0.85);
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
.rg-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 56px;
  align-items: center;
}
.rg-grid .rg-legend {
  justify-content: flex-start;
  margin: 22px 0 26px;
}
.rg-map {
  position: relative;
  width: 100%;
  aspect-ratio: 100 / 120;
  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(255, 77, 109, 0.28),
      transparent 55%
    ),
    radial-gradient(
      circle at 50% 100%,
      rgba(63, 160, 90, 0.28),
      transparent 55%
    ),
    rgba(var(--bg-dark-rgb, 15, 23, 42), 0.9);
  border: 2px solid #8a6c43;
  border-radius: 24px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}
.rg-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.rg-lines line {
  stroke: rgba(255, 255, 255, 0.55);
  stroke-width: 2;
  stroke-dasharray: 2 2;
  vector-effect: non-scaling-stroke;
}
.rg-node {
  position: absolute;
  display: grid;
  place-items: center;
  width: 17%;
  aspect-ratio: 1;
  background: #1c1710;
  border: 3px solid var(--c, #d9843f);
  border-radius: 50%;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%);
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

/* tools */
.tl-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 480px);
  gap: 40px;
  align-items: center;
  margin-top: 36px;
}
.tl-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.tl-item {
  display: flex;
  gap: 16px;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: rgba(var(--bg-slate-rgb, 30, 41, 59), 0.5);
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  transition:
    background 0.3s ease,
    border-color 0.3s ease;
}
.tl-item:hover {
  border-color: rgba(var(--color-player-rgb, 79, 124, 255), 0.6);
}
.tl-item.is-active {
  background: rgba(var(--color-player-rgb, 79, 124, 255), 0.16);
  border-color: var(--color-player, #4f7cff);
}
.tl-icon {
  display: grid;
  flex: 0 0 52px;
  place-items: center;
  height: 52px;
  background: #1c1710;
  border: 2px solid #8a6c43;
  border-radius: 50%;
}
.tl-text {
  display: grid;
  gap: 2px;
}
.tl-text b {
  font-size: 1.02rem;
}
.tl-text small {
  font-size: 0.82rem;
  color: var(--text-muted, #cbd5e1);
}
.tl-stage {
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: rgba(var(--bg-dark-rgb, 15, 23, 42), 0.92);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.14));
  border-radius: 28px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45);
}
.tl-slide {
  grid-area: 1 / 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 22px;
}
.tl-swap-enter-active,
.tl-swap-leave-active {
  transition:
    opacity 0.45s ease,
    transform 0.45s ease;
}
.tl-swap-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.tl-swap-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
.tl-swap-enter-active .tl-pop {
  animation: tl-rise 0.5s ease both;
  animation-delay: calc(var(--i, 0) * 70ms + 120ms);
}
@keyframes tl-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}
.tl-stats,
.tl-guide,
.tl-map,
.tl-duel,
.tl-gen {
  display: grid;
  gap: 14px;
}
.tl-banner {
  position: relative;
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--color-player, #4f7cff);
  border-radius: 18px;
}
.tl-banner img {
  width: 96px;
  height: 96px;
  object-fit: cover;
  object-position: top;
  border-radius: 14px;
}
.tl-banner-body {
  display: grid;
  gap: 3px;
  font-size: 0.85rem;
  color: var(--text-muted, #cbd5e1);
}
.tl-banner-body b {
  font-size: 1.3rem;
  color: var(--text-white, #fff);
}
.tl-banner-body i {
  font-style: normal;
  font-weight: 800;
  color: var(--text-white, #fff);
}
.tl-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.tl-card {
  position: relative;
  overflow: hidden;
  border: 2px solid var(--border-medium, rgba(255, 255, 255, 0.2));
  border-radius: 12px;
}
.tl-card img {
  display: block;
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: top;
}
.tl-card em {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 14px 2px 4px;
  font-size: 0.62rem;
  font-style: normal;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.85));
}
.tl-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 1px 6px;
  font-size: 0.72rem;
  font-weight: 800;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 6px;
}
.tl-card.is-win {
  border-color: #3ddc84;
}
.tl-card.is-win .tl-badge {
  color: #3ddc84;
}
.tl-card.is-lose {
  border-color: #ff6b6b;
}
.tl-card.is-lose .tl-badge {
  color: #ff6b6b;
}
.tl-keycards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.tl-keycards img {
  width: 100%;
  border-radius: 8px;
}
.tl-points {
  padding: 8px 12px 8px 26px;
  margin: 0;
  font-size: 0.8rem;
  border-radius: 12px;
}
.tl-points.is-good {
  background: rgba(61, 220, 132, 0.1);
  border: 1px solid rgba(61, 220, 132, 0.4);
}
.tl-points.is-bad {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.4);
}
.tl-map-img {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
}
.tl-map-img img {
  display: block;
  width: 100%;
  height: 150px;
  object-fit: cover;
}
.tl-map-img b {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 18px 14px 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.85));
}
.tl-rows {
  display: grid;
  gap: 8px;
}
.tl-row,
.tl-pair {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 6px 12px 6px 6px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-light, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
}
.tl-row img,
.tl-pair img {
  width: 38px;
  height: 38px;
  object-fit: cover;
  object-position: top;
  border-radius: 50%;
}
.tl-row span {
  flex: 1;
}
.tl-row b {
  font-size: 0.78rem;
  text-transform: uppercase;
}
.tl-row.is-win {
  border-color: rgba(61, 220, 132, 0.5);
}
.tl-row.is-win b {
  color: #3ddc84;
}
.tl-row.is-lose {
  border-color: rgba(255, 107, 107, 0.5);
}
.tl-row.is-lose b {
  color: #ff6b6b;
}
.tl-duel-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}
.tl-fighter {
  display: grid;
  gap: 8px;
  justify-items: center;
  text-align: center;
}
.tl-fighter img {
  width: 100%;
  max-width: 150px;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: top;
  border: 2px solid var(--border-medium, rgba(255, 255, 255, 0.2));
  border-radius: 16px;
}
.tl-vs {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--color-warning, #ffc107);
}
.tl-meter {
  display: flex;
  height: 34px;
  overflow: hidden;
  font-weight: 800;
  border-radius: 999px;
}
.tl-meter span {
  display: grid;
  place-items: center;
}
.tl-meter .is-a {
  background: var(--color-player, #4f7cff);
}
.tl-meter .is-b {
  flex: 1;
  background: var(--color-opponent, #ff4f6d);
}
.tl-bestmap {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 6px 14px 6px 6px;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}
.tl-bestmap img {
  width: 64px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
}
.tl-bestmap span {
  color: var(--text-muted, #cbd5e1);
}
.tl-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tl-chip {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.2));
  border-radius: 999px;
}
.tl-chip.is-on {
  color: #1b130a;
  background: #f6c945;
  border-color: #f6c945;
}
.tl-pair span {
  flex: 1;
  font-size: 0.85rem;
}
.tl-pair .is-end {
  text-align: right;
}
.tl-pair b {
  color: var(--color-warning, #ffc107);
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
  .mu-slide {
    grid-template-columns: minmax(0, 1fr);
  }
  .mu-hero {
    max-width: 260px;
    margin: 0 auto;
  }
  .mu-vs {
    margin: -6px 0;
  }
  .mu-foes {
    grid-template-columns: minmax(0, 1fr);
  }
  .tl-grid,
  .rg-grid,
  .home-online {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }
  .tl-grid > *,
  .rg-grid > *,
  .home-online > * {
    min-width: 0;
  }
  .tl-stage {
    aspect-ratio: auto;
    min-height: 420px;
  }
  .pk-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .pk-side {
    order: 2;
  }
  .pk-kept {
    grid-template-columns: repeat(4, 1fr);
  }
  .pk-leave-active {
    width: calc((100% - 10px) / 2);
  }
  .pk-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: none;
    aspect-ratio: auto;
  }
  .pk-kept {
    height: auto;
  }
  .rg-map {
    max-width: 360px;
    margin: 0 auto;
  }
  .tl-stage {
    max-width: 480px;
    margin: 0 auto;
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
  .mu-foe-bar i {
    transition: none;
  }
}
</style>
