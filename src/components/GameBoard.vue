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
    >
      <circle class="space-hit" :cx="space.x" :cy="space.y" :r="map.radius" />
      <circle
        v-if="options.includes(space.id)"
        class="option-ring"
        :cx="space.x"
        :cy="space.y"
        :r="map.radius + 4"
      />
    </g>

    <defs>
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
    </defs>

    <g v-for="player in ['p1', 'p2']" :key="player">
      <g
        v-if="players[player]"
        class="board-hero"
        :class="['is-' + player, { 'is-hit': hit[player] }]"
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
          v-if="heroImage(players[player].heroId)"
          :href="heroImage(players[player].heroId)"
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

    <g
      v-for="item in floats"
      :key="item.id"
      class="board-float"
      :class="'is-' + item.type"
      :transform="`translate(${item.x}, ${item.y})`"
    >
      <text class="board-float-text" text-anchor="middle">{{ item.text }}</text>
    </g>
  </svg>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { getHero } from "../gameDecks";

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
  fx: {
    type: Array,
    default: () => [],
  },
});

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
const hit = reactive({ p1: false, p2: false });
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
      const space = unit && byId.value.get(unit.space);
      if (!space) return;
      const entry = {
        id: item.id,
        type: item.type,
        x: space.x,
        y: space.y - 48 - index * 30,
        text: (item.type === "damage" ? "-" : "+") + item.n,
      };
      floats.value = [...floats.value, entry];
      if (item.type === "damage") {
        hit[item.player] = true;
        timers.push(setTimeout(() => (hit[item.player] = false), 600));
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

const heroImage = (heroId) =>
  failedImages[heroId] ? null : getHero(heroId)?.image || null;

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

.hp-label {
  fill: var(--text-white);
  font-size: 24px;
  font-weight: 800;
}
</style>
