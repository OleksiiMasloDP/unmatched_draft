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
      <g v-if="players[player]" class="board-hero" :class="'is-' + player">
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
  </svg>
</template>

<script setup>
import { computed, reactive } from "vue";
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
