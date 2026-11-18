<template>
  <svg
    class="game-board"
    :viewBox="`0 0 ${map.width} ${map.height}`"
    role="img"
    :aria-label="map.name"
  >
    <image :href="map.image" :width="map.width" :height="map.height" />

    <g
      v-for="space in map.spaces"
      :key="space.id"
      class="board-space"
      :class="{ 'is-option': options.includes(space.id) }"
      @click="options.includes(space.id) && emit('select', space.id)"
      @mouseenter="hoverId = space.id"
      @mouseleave="hoverId = null"
    >
      <circle class="space-hit" :cx="space.x" :cy="space.y" :r="map.radius" />
      <circle
        v-if="options.includes(space.id)"
        class="option-ring"
        :cx="space.x"
        :cy="space.y"
        :r="map.radius + 4"
      />
      <circle
        v-if="marks[space.id]"
        class="mark-ring"
        :class="'is-' + marks[space.id]"
        :cx="space.x"
        :cy="space.y"
        :r="map.radius + 9"
      />
    </g>

    <defs>
      <pattern id="fog-dots" width="4" height="4" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.8" fill="#e8f5fb" />
        <circle cx="3" cy="3" r="0.8" fill="#e8f5fb" />
      </pattern>
      <g id="fog-wisp">
        <path
          class="fog-ink"
          d="M-24 6 C-34 -8 -18 -22 -4 -16 C-2 -32 22 -38 30 -22 C44 -22 50 -2 38 6 C44 20 24 30 12 22 C2 32 -18 28 -24 6 Z"
        />
        <path
          class="fog-body"
          d="M-24 6 C-34 -8 -18 -22 -4 -16 C-2 -32 22 -38 30 -22 C44 -22 50 -2 38 6 C44 20 24 30 12 22 C2 32 -18 28 -24 6 Z"
        />
        <path
          class="fog-dots"
          d="M-24 6 C-34 -8 -18 -22 -4 -16 C-2 -32 22 -38 30 -22 C44 -22 50 -2 38 6 C44 20 24 30 12 22 C2 32 -18 28 -24 6 Z"
        />
        <path
          class="fog-curl"
          d="M-8 4 C-10 -6 6 -10 10 -2 C14 6 2 12 -2 6 M18 -14 C26 -14 30 -6 26 0 M20 12 C26 12 30 8 31 4"
        />
      </g>
      <clipPath v-if="ghostSpace" id="ghost-clip">
        <circle :cx="ghostSpace.x" :cy="ghostSpace.y" r="30" />
      </clipPath>
      <clipPath
        v-for="player in ['p1', 'p2']"
        :id="`token-${player}`"
        :key="player"
      >
        <circle
          v-if="players[player]"
          :cx="byId.get(players[player].space).x"
          :cy="byId.get(players[player].space).y"
          r="38"
        />
      </clipPath>
      <template v-for="player in ['p1', 'p2']" :key="'kc-' + player">
        <clipPath
          v-for="kid in players[player] ? players[player].sidekicks : []"
          :id="`kid-${player}-${kid.id}`"
          :key="kid.id"
        >
          <circle
            :cx="byId.get(kid.space).x"
            :cy="byId.get(kid.space).y"
            r="30"
          />
        </clipPath>
      </template>
    </defs>

    <g
      v-for="token in tokenViews"
      :key="token.id"
      class="board-token"
      @mouseenter="hoverToken = token.id"
      @mouseleave="hoverToken = null"
      @click.stop="pinToken = pinToken === token.id ? null : token.id"
    >
      <rect
        class="board-token-box"
        :x="token.x - 36"
        :y="token.y - 36"
        width="72"
        height="72"
        rx="10"
      />
      <image
        :href="token.image"
        :x="token.x - 34"
        :y="token.y - 34"
        width="68"
        height="68"
        preserveAspectRatio="xMidYMid slice"
      />
    </g>

    <g
      v-for="id in fog"
      :key="'fog-' + id"
      class="board-fog"
      :transform="`translate(${byId.get(id).x} ${byId.get(id).y})`"
    >
      <g v-for="(wisp, i) in fogWisps" :key="i" :transform="wisp.t">
        <use
          class="fog-wisp"
          href="#fog-wisp"
          :style="{ animationDelay: wisp.d }"
        />
      </g>
    </g>

    <g v-for="player in ['p1', 'p2']" :key="player">
      <g
        v-if="players[player] && !players[player].hidden && !hideHeroes"
        class="board-hero"
        :transform="heroScale(player)"
        :class="[
          'is-' + player,
          {
            'is-hit': hit[player],
            'is-active':
              active && active.player === player && active.fighter === 'hero',
          },
        ]"
      >
        <circle
          :cx="byId.get(players[player].space).x"
          :cy="byId.get(players[player].space).y"
          r="38"
        />
        <text
          class="hero-initials"
          :x="byId.get(players[player].space).x"
          :y="byId.get(players[player].space).y + 9"
          text-anchor="middle"
        >
          {{ initials(players[player].heroId) }}
        </text>
        <image
          v-if="heroImage(players[player].heroId, players[player].skin)"
          :href="heroImage(players[player].heroId, players[player].skin)"
          :x="byId.get(players[player].space).x - 38"
          :y="byId.get(players[player].space).y - 38"
          width="76"
          height="76"
          preserveAspectRatio="xMidYMin slice"
          :clip-path="`url(#token-${player})`"
          @error="failedImages[players[player].heroId] = true"
        />
        <g
          :transform="`translate(${byId.get(players[player].space).x + 30}, ${byId.get(players[player].space).y + 34})`"
        >
          <circle class="hp-badge" r="22" />
          <text class="hp-label" y="8" text-anchor="middle">
            {{ players[player].hp }}
          </text>
        </g>
      </g>
    </g>

    <g v-for="player in ['p1', 'p2']" v-if="!hideHeroes" :key="'sk-' + player">
      <g
        v-for="kid in visibleKids(player)"
        :key="kid.id"
        class="board-hero board-sidekick"
        :class="[
          'is-' + player,
          {
            'is-hit': hit[player + '-' + kid.id],
            'is-active':
              active && active.player === player && active.fighter === kid.id,
          },
        ]"
      >
        <circle
          :cx="byId.get(kid.space).x"
          :cy="byId.get(kid.space).y"
          r="30"
        />
        <text
          class="hero-initials is-small"
          :x="byId.get(kid.space).x"
          :y="byId.get(kid.space).y + 8"
          text-anchor="middle"
        >
          {{ kid.name.slice(0, 2).toUpperCase() }}
        </text>
        <image
          v-if="kidImage(player, kid)"
          :href="kidImage(player, kid)"
          :x="byId.get(kid.space).x - 30"
          :y="byId.get(kid.space).y - 30"
          width="60"
          height="60"
          preserveAspectRatio="xMidYMin slice"
          :clip-path="`url(#kid-${player}-${kid.id})`"
          @error="failedImages['kid-' + players[player].heroId] = true"
        />
        <g
          :transform="`translate(${byId.get(kid.space).x + 24}, ${byId.get(kid.space).y + 28})`"
        >
          <circle class="hp-badge" r="18" />
          <text class="hp-label is-small" y="7" text-anchor="middle">
            {{ kid.hp }}
          </text>
        </g>
      </g>
    </g>

    <g v-if="ghostSpace" class="board-ghost">
      <circle :cx="ghostSpace.x" :cy="ghostSpace.y" r="30" />
      <image
        v-if="ghost.image"
        :href="ghost.image"
        :x="ghostSpace.x - 30"
        :y="ghostSpace.y - 30"
        width="60"
        height="60"
        preserveAspectRatio="xMidYMin slice"
        clip-path="url(#ghost-clip)"
      />
    </g>

    <g
      v-for="item in floats"
      :key="item.id"
      class="board-float"
      :class="'is-' + item.type"
      :transform="`translate(${item.x}, ${item.y})`"
    >
      <text class="board-float-text" text-anchor="middle">{{ item.text }}</text>
    </g>
    <foreignObject
      v-if="tokenInfo"
      class="board-token-info"
      :x="tokenInfo.x"
      :y="tokenInfo.y"
      width="280"
      height="170"
    >
      <div class="token-info">
        <strong>{{ tokenInfo.name }}</strong>
        <span class="token-info-kind">{{ tokenInfo.kindLabel }}</span>
        <p>{{ tokenInfo.text }}</p>
      </div>
    </foreignObject>
  </svg>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { getHero } from "../gameDecks";
import { useDraftState } from "../composables/useDraftState";
import { TOKENS } from "../gameTokens";

const { t } = useDraftState();

const props = defineProps({
  map: {
    type: Object,
    required: true,
  },
  players: {
    type: Object,
    required: true,
  },
  options: {
    type: Array,
    default: () => [],
  },
  marks: {
    type: Object,
    default: () => ({}),
  },
  active: {
    type: Object,
    default: null,
  },
  fx: {
    type: Array,
    default: () => [],
  },
  tokens: {
    type: Array,
    default: () => [],
  },
  fog: {
    type: Array,
    default: () => [],
  },
  hideHeroes: {
    type: Boolean,
    default: false,
  },
  ghost: {
    type: Object,
    default: null,
  },
  pending: {
    type: String,
    default: null,
  },
});

const hoverId = ref(null);

const ghostSpace = computed(() => {
  if (!props.ghost) return null;
  const id =
    props.pending ||
    (props.options.includes(hoverId.value) ? hoverId.value : null);
  return id ? byId.value.get(id) : null;
});

const visibleKids = (player) =>
  (props.players[player]?.sidekicks || []).filter((kid) => !kid.unplaced);

const fogWisps = [
  { t: "translate(-34 22) rotate(-8) scale(0.9)", d: "0s" },
  { t: "translate(30 -30) rotate(14) scale(0.8)", d: "-2s" },
  { t: "translate(36 30) rotate(-20) scale(0.7)", d: "-4s" },
  { t: "translate(-30 -34) rotate(22) scale(0.7)", d: "-6s" },
];

const hoverToken = ref(null);
const pinToken = ref(null);

const tokenViews = computed(() =>
  props.tokens
    .map((token) => {
      const slot = props.map.tokenSlots?.find(
        (item) => item.space === token.space && item.kind === token.kind,
      );
      if (!slot) return null;
      return {
        id: token.id,
        kind: token.kind,
        x: slot.x,
        y: slot.y,
        image: TOKENS[token.id]?.image,
      };
    })
    .filter(Boolean),
);

const tokenInfo = computed(() => {
  const id = hoverToken.value || pinToken.value;
  const token = tokenViews.value.find((item) => item.id === id);
  if (!token) return null;
  return {
    x: Math.min(Math.max(token.x - 140, 6), props.map.width - 286),
    y:
      token.y + 44 + 170 > props.map.height ? token.y - 44 - 170 : token.y + 44,
    name: t("token_" + token.id),
    kindLabel: t(
      token.kind === "scheme" ? "tokenKindScheme" : "tokenKindBoost",
    ),
    text: t("tokenDesc_" + token.id),
  };
});

watch(
  () => props.tokens.map((token) => token.id).join(","),
  () => {
    hoverToken.value = null;
    pinToken.value = null;
  },
);

const emit = defineEmits(["select"]);

const byId = computed(
  () => new Map(props.map.spaces.map((space) => [space.id, space])),
);

const pairs = computed(() => {
  const seen = new Map();
  for (const space of props.map.spaces) {
    if (space.zones.length > 1) seen.set(space.zones.join("-"), space.zones);
  }
  return [...seen.values()];
});

const fillFor = (space) =>
  space.zones.length > 1
    ? `url(#zone-${space.zones.join("-")})`
    : props.map.zoneColors[space.zones[0]];

const floats = ref([]);
const hit = reactive({});
let lastFx = Math.max(0, ...props.fx.map((item) => item.id));
const timers = [];

watch(
  () => props.fx.map((item) => item.id).join(","),
  () => {
    const fresh = props.fx.filter((item) => item.id > lastFx);
    lastFx = Math.max(lastFx, ...props.fx.map((item) => item.id));
    fresh.forEach((item, index) => {
      if (item.type !== "damage" && item.type !== "heal") return;
      const unit = props.players[item.player];
      const kid =
        item.fighter && item.fighter !== "hero"
          ? unit?.sidekicks?.find((k) => k.id === item.fighter)
          : null;
      const space = unit && byId.value.get(kid ? kid.space : unit.space);
      if (!space) return;
      const hitKey = kid ? item.player + "-" + kid.id : item.player;
      const entry = {
        id: item.id,
        type: item.type,
        x: space.x,
        y: space.y - 48 - index * 30,
        text: (item.type === "damage" ? "-" : "+") + item.n,
      };
      floats.value = [...floats.value, entry];
      if (item.type === "damage") {
        hit[hitKey] = true;
        timers.push(setTimeout(() => (hit[hitKey] = false), 600));
      }
      timers.push(
        setTimeout(() => {
          floats.value = floats.value.filter((x) => x.id !== entry.id);
        }, 1500),
      );
    });
  },
);

onBeforeUnmount(() => timers.forEach(clearTimeout));

const failedImages = reactive({});

const heroImage = (heroId, skin) =>
  failedImages[heroId] ? null : skin || getHero(heroId)?.image || null;

const heroScale = (player) => {
  const data = props.players[player];
  const space = data && byId.value.get(data.space);
  if (!space || !getHero(data.heroId)?.team) return null;
  return `translate(${space.x} ${space.y}) scale(0.79) translate(${-space.x} ${-space.y})`;
};

const kidImage = (player, kid) => {
  const heroId = props.players[player]?.heroId;
  if (!heroId || failedImages["kid-" + heroId]) return null;
  return kid.image || getHero(heroId)?.sidekick?.image || null;
};

const initials = (heroId) =>
  getHero(heroId)
    .name.split(/[\s.-]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
</script>

<style scoped>
.game-board {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--border-medium);
  border-radius: 14px;
}

.space-hit {
  fill: transparent;
}

.mark-ring {
  fill: none;
  stroke-width: 6;
  pointer-events: none;
}

.mark-ring.is-bot {
  stroke: #4f7cff;
  stroke-dasharray: 10 6;
}

.mark-ring.is-mine {
  stroke: #2ecc71;
}

.mark-ring.is-both {
  stroke: #f6c945;
}

.board-space.is-option {
  cursor: pointer;
}

.board-space.is-option .space-hit {
  fill: rgba(var(--color-proceed-rgb), 0.22);
}

.option-ring {
  fill: none;
  stroke: var(--color-proceed);
  stroke-width: 6;
  stroke-dasharray: 14 8;
}

.board-token {
  cursor: pointer;
}

.board-fog {
  pointer-events: none;
}

.fog-wisp {
  animation: fog-drift 8s ease-in-out infinite;
}

.fog-ink {
  fill: none;
  stroke: #0d2230;
  stroke-width: 4;
  stroke-linejoin: round;
  opacity: 0.8;
}

.fog-body {
  fill: rgba(176, 212, 232, 0.6);
  stroke: #eaf6fb;
  stroke-width: 1.6;
  stroke-linejoin: round;
}

.fog-dots {
  fill: url(#fog-dots);
  opacity: 0.6;
}

.fog-curl {
  fill: none;
  stroke: #eaf6fb;
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.9;
}

@keyframes fog-drift {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(3px, -3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fog-wisp {
    animation: none;
  }
}

.board-ghost {
  opacity: 0.6;
  pointer-events: none;
}

.board-ghost circle {
  fill: rgba(255, 255, 255, 0.15);
  stroke: #fff;
  stroke-width: 3;
  stroke-dasharray: 6 5;
}

.board-token-box {
  fill: rgba(0, 0, 0, 0.78);
  stroke: var(--color-warning);
  stroke-width: 2;
}

.board-token-info {
  pointer-events: none;
  overflow: visible;
}

.token-info {
  background: rgba(0, 0, 0, 0.88);
  border: 2px solid var(--color-warning);
  border-radius: 10px;
  color: #fff;
  font-size: 20px;
  line-height: 1.3;
  padding: 10px 14px;
}

.token-info p {
  margin: 6px 0 0;
}

.token-info-kind {
  display: block;
  font-size: 15px;
  opacity: 0.7;
}

.board-hero {
  pointer-events: none;
}

.board-hero > circle {
  stroke: var(--text-white);
  stroke-width: 6;
}

.board-hero.is-p1 > circle {
  fill: var(--color-player);
}

.board-hero.is-p2 > circle {
  fill: var(--color-opponent);
}

.board-hero.is-active > circle {
  stroke: var(--color-warning);
  stroke-width: 11;
  animation: board-active 1s ease-in-out infinite;
}

@keyframes board-active {
  0%,
  100% {
    stroke-opacity: 1;
  }
  50% {
    stroke-opacity: 0.4;
  }
}

.board-hero.is-hit {
  animation: board-shake 0.5s ease;
}

.board-hero.is-hit > circle {
  stroke: #ff3b3b;
}

@keyframes board-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-5px);
  }
  80% {
    transform: translateX(5px);
  }
}

.board-float {
  pointer-events: none;
}

.board-float-text {
  font-size: 46px;
  font-weight: 900;
  stroke: #000;
  stroke-width: 6px;
  paint-order: stroke;
  animation: board-rise 1.5s ease-out forwards;
}

.board-float.is-damage .board-float-text {
  fill: #ff5252;
}

.board-float.is-heal .board-float-text {
  fill: #4cd964;
}

@keyframes board-rise {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.6);
  }
  15% {
    opacity: 1;
    transform: translateY(0) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(1);
  }
}

.hero-initials {
  fill: var(--text-white);
  font-size: 30px;
  font-weight: 800;
}

.hp-badge {
  fill: var(--bg-dark);
  stroke: var(--text-white);
  stroke-width: 4;
}

.hero-initials.is-small {
  font-size: 22px;
}

.hp-label.is-small {
  font-size: 19px;
}

.hp-label {
  fill: var(--text-white);
  font-size: 24px;
  font-weight: 800;
}
</style>
