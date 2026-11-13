<template>
  <div ref="root" class="rmap" :class="{ 'is-wide': wide }">
    <div class="rmap-frame">
      <svg
        class="rmap-svg"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient
            id="rmap-sky"
            :x1="0"
            :y1="wide ? 0 : 1"
            :x2="wide ? 1 : 0"
            :y2="0"
          >
            <stop offset="0" stop-color="#0d1f14" />
            <stop offset="0.3" stop-color="#16301f" />
            <stop offset="0.55" stop-color="#1d2433" />
            <stop offset="0.8" stop-color="#2b1a2e" />
            <stop offset="1" stop-color="#2a0d18" />
          </linearGradient>
          <radialGradient id="rmap-vig" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.6" stop-color="#000" stop-opacity="0" />
            <stop offset="1" stop-color="#000" stop-opacity="0.75" />
          </radialGradient>
          <radialGradient id="rmap-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stop-color="#ff4d6d" stop-opacity="0.55" />
            <stop offset="1" stop-color="#ff4d6d" stop-opacity="0" />
          </radialGradient>
          <linearGradient
            v-for="zone in zones"
            :id="`rmap-zone-${zone.id}`"
            :key="zone.id"
            x1="0"
            y1="0"
            :x2="wide ? 1 : 0"
            :y2="wide ? 0 : 1"
          >
            <stop offset="0" :stop-color="zone.tint" stop-opacity="0" />
            <stop offset="0.5" :stop-color="zone.tint" stop-opacity="0.22" />
            <stop offset="1" :stop-color="zone.tint" stop-opacity="0" />
          </linearGradient>
          <filter id="rmap-ink">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="2"
              seed="3"
            />
            <feDisplacementMap in="SourceGraphic" scale="3" />
          </filter>
        </defs>
        <rect :width="W" :height="H" fill="url(#rmap-sky)" />
        <circle
          :cx="bossSpot.x"
          :cy="bossSpot.y"
          r="190"
          fill="url(#rmap-glow)"
          class="rmap-bossglow"
        />
        <g v-for="item in scenery" :key="item.key" :opacity="item.opacity">
          <g v-if="item.kind === 'mountain'">
            <polygon :points="item.points" :fill="item.fill" />
            <polygon :points="item.cap" fill="#c9d3e0" opacity="0.55" />
          </g>
          <g v-else-if="item.kind === 'pine'" :fill="item.fill">
            <polygon :points="item.points" />
            <polygon :points="item.points2" />
            <rect :x="item.x - 2" :y="item.y" width="4" height="9" />
          </g>
          <g v-else-if="item.kind === 'pillar'" :fill="item.fill">
            <rect :x="item.x" :y="item.y" :width="item.w" :height="item.h" />
            <rect
              :x="item.x - 3"
              :y="item.y - 5"
              :width="item.w + 6"
              height="6"
            />
          </g>
          <g v-else-if="item.kind === 'tower'" :fill="item.fill">
            <rect :x="item.x" :y="item.y" :width="item.w" :height="item.h" />
            <polygon :points="item.points" />
            <rect
              :x="item.x + item.w / 2 - 2"
              :y="item.y + 14"
              width="4"
              height="9"
              fill="#ff9f43"
              opacity="0.8"
            />
          </g>
        </g>
        <g v-for="zone in zones" :key="zone.id">
          <rect
            :x="zone.x"
            :y="zone.y"
            :width="zone.w"
            :height="zone.h"
            :fill="`url(#rmap-zone-${zone.id})`"
          />
          <text
            :x="zone.x + 18"
            :y="wide ? H - 16 : zone.y + 26"
            class="rmap-zone"
          >
            {{ labels[zone.id] || "" }}
          </text>
        </g>
        <g class="rmap-fog">
          <ellipse
            v-for="fog in fogs"
            :key="fog.key"
            :cx="fog.x"
            :cy="fog.y"
            :rx="fog.rx"
            :ry="fog.ry"
            fill="#fff"
            opacity="0.05"
          />
        </g>
        <g filter="url(#rmap-ink)" fill="none" stroke-linecap="round">
          <path
            v-for="edge in edges"
            :key="edge.key"
            class="rmap-edge"
            :class="{ 'is-live': edge.live, 'is-walked': edge.walked }"
            :d="edge.d"
          />
        </g>
        <rect :width="W" :height="H" fill="url(#rmap-vig)" />
      </svg>
      <button
        v-for="node in nodes"
        :key="node.id"
        class="rmap-node"
        :class="[
          'm-' + node.metal,
          {
            'is-live': node.live,
            'is-visited': node.visited,
            'is-current': node.current,
            'is-locked': !node.live && !node.visited,
            'is-boss': node.type === 'boss',
          },
        ]"
        :style="{
          left: node.left + '%',
          top: node.top + '%',
          '--c': node.color,
        }"
        :disabled="!node.live"
        @click="emit('enter', node.id)"
      >
        <span class="rmap-medal">
          <RogueIcon
            :name="node.icon"
            :metal="node.metal"
            :size="node.type === 'boss' ? '38px' : '28px'"
          />
          <span v-if="node.visited" class="rmap-seal">✔</span>
        </span>
        <span class="rmap-label">{{ node.label }}</span>
      </button>
      <div
        v-if="heroImage"
        class="rmap-token"
        :style="{ left: tokenSpot.left + '%', top: tokenSpot.top + '%' }"
      >
        <img :src="heroImage" alt="" />
      </div>
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
import { nodeTypes } from "../rogueData";
import RogueIcon from "./RogueIcon.vue";

const props = defineProps({
  map: { type: Array, required: true },
  pos: { type: String, default: null },
  visited: { type: Array, default: () => [] },
  reachable: { type: Array, default: () => [] },
  labels: { type: Object, default: () => ({}) },
  heroImage: { type: String, default: "" },
});

const emit = defineEmits(["enter"]);

const root = ref(null);
let context = null;
let query = null;

const wide = ref(true);
const onQuery = () => (wide.value = query.matches);

const total = computed(() => props.map.length);

const WIDE = { step: 112, pad: 86, across: 560 };
const TALL = { step: 86, pad: 86, across: 640 };

const size = computed(() => (wide.value ? WIDE : TALL));
const W = computed(() =>
  wide.value
    ? size.value.pad * 2 + (total.value - 1) * size.value.step
    : size.value.across,
);
const H = computed(() =>
  wide.value
    ? size.value.across
    : size.value.pad * 2 + (total.value - 1) * size.value.step,
);

const hash = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

const alongOf = (row) =>
  wide.value
    ? size.value.pad + row * size.value.step
    : H.value - size.value.pad - row * size.value.step;

const point = (along, across) =>
  wide.value ? { x: along, y: across } : { x: across, y: along };

const spot = (node) => {
  const jitterA = (hash(node.id + "a") - 0.5) * 18;
  const jitterB = (hash(node.id + "b") - 0.5) * 22;
  return point(
    alongOf(node.row) + jitterA,
    node.x * size.value.across + jitterB,
  );
};

const flat = computed(() => props.map.flat());
const byId = computed(() => new Map(flat.value.map((node) => [node.id, node])));

const bossSpot = computed(() => {
  const boss = flat.value.find((node) => node.type === "boss");
  return boss ? spot(boss) : { x: 0, y: 0 };
});

const nodes = computed(() =>
  flat.value.map((node) => {
    const at = spot(node);
    const meta = nodeTypes[node.type];
    return {
      id: node.id,
      type: node.type,
      icon: meta.icon,
      metal: meta.metal,
      color: meta.color,
      label: props.labels[node.type] || "",
      left: (at.x / W.value) * 100,
      top: (at.y / H.value) * 100,
      live: props.reachable.includes(node.id),
      visited: props.visited.includes(node.id),
      current: props.pos === node.id,
    };
  }),
);

const tokenSpot = computed(() => {
  const node = props.pos ? byId.value.get(props.pos) : null;
  if (!node) {
    const start = wide.value
      ? { x: size.value.pad * 0.4, y: H.value / 2 }
      : { x: W.value / 2, y: H.value - size.value.pad * 0.35 };
    return {
      left: (start.x / W.value) * 100,
      top: (start.y / H.value) * 100,
    };
  }
  const at = spot(node);
  return {
    left: (at.x / W.value) * 100,
    top: ((at.y - 46) / H.value) * 100,
  };
});

const edges = computed(() => {
  const list = [];
  for (const node of flat.value) {
    const from = spot(node);
    for (const target of node.next) {
      const other = byId.value.get(target);
      if (!other) continue;
      const to = spot(other);
      const bend = (hash(node.id + target) - 0.5) * 30;
      const midX = (from.x + to.x) / 2 + (wide.value ? 0 : bend);
      const midY = (from.y + to.y) / 2 + (wide.value ? bend : 0);
      list.push({
        key: `${node.id}>${target}`,
        d: `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`,
        walked:
          props.visited.includes(node.id) &&
          (props.visited.includes(target) || props.pos === target),
        live:
          props.reachable.includes(target) &&
          (props.pos === node.id || (!props.pos && node.row === 0)),
      });
    }
  }
  return list;
});

const ZONE_IDS = ["forest", "mountains", "ruins", "citadel"];
const TINTS = {
  forest: "#2e7d32",
  mountains: "#5c6bc0",
  ruins: "#8d6e63",
  citadel: "#c62828",
};

const zones = computed(() => {
  const rows = total.value;
  const each = Math.ceil(rows / ZONE_IDS.length);
  const half = size.value.step / 2;
  return ZONE_IDS.map((id, i) => {
    const first = i * each;
    const last = Math.min(rows - 1, (i + 1) * each - 1);
    const a = alongOf(first);
    const b = alongOf(last);
    const start = Math.min(a, b) - half;
    const end = Math.max(a, b) + half;
    const lo = Math.max(0, start);
    const hi = Math.min(wide.value ? W.value : H.value, end);
    return wide.value
      ? { id, x: lo, y: 0, w: hi - lo, h: H.value, tint: TINTS[id] }
      : { id, x: 0, y: lo, w: W.value, h: hi - lo, tint: TINTS[id] };
  });
});

const scenery = computed(() => {
  let seed = 7;
  const rng = () => {
    seed = (seed * 16807 + 11) % 2147483647;
    return seed / 2147483647;
  };
  const list = [];
  let key = 0;
  const edge = 78;
  for (const zone of zones.value) {
    const length = wide.value ? zone.w : zone.h;
    const count = Math.round(length / 14);
    for (let i = 0; i < count; i += 1) {
      const nearStart = rng() < 0.5;
      const across = nearStart
        ? 8 + rng() * edge
        : size.value.across - 8 - rng() * edge;
      const along = (wide.value ? zone.x : zone.y) + 10 + rng() * (length - 20);
      const at = point(along, across);
      const { x, y } = at;
      const scale = 0.7 + rng() * 0.9;
      key += 1;
      if (zone.id === "forest") {
        const w = 18 * scale;
        const h = 30 * scale;
        list.push({
          key,
          kind: "pine",
          x,
          y,
          fill: `hsl(${130 + rng() * 20}, 40%, ${10 + rng() * 8}%)`,
          opacity: 0.9,
          points: `${x - w},${y} ${x},${y - h} ${x + w},${y}`,
          points2: `${x - w * 0.75},${y - h * 0.45} ${x},${y - h * 1.25} ${x + w * 0.75},${y - h * 0.45}`,
        });
      } else if (zone.id === "mountains") {
        const w = 44 * scale;
        const h = 62 * scale;
        list.push({
          key,
          kind: "mountain",
          fill: `hsl(${225 + rng() * 15}, 22%, ${14 + rng() * 8}%)`,
          opacity: 0.95,
          points: `${x - w},${y + 14} ${x},${y - h} ${x + w},${y + 14}`,
          cap: `${x - w * 0.28},${y - h * 0.72} ${x},${y - h} ${x + w * 0.28},${y - h * 0.72} ${x + w * 0.1},${y - h * 0.8} ${x - w * 0.08},${y - h * 0.66}`,
        });
      } else if (zone.id === "ruins") {
        const w = 8 + rng() * 8;
        const h = 24 + rng() * 40;
        list.push({
          key,
          kind: "pillar",
          x,
          y: y - h,
          w,
          h,
          fill: `hsl(25, 12%, ${14 + rng() * 8}%)`,
          opacity: 0.9,
        });
      } else {
        const w = 18 + rng() * 14;
        const h = 40 + rng() * 60;
        list.push({
          key,
          kind: "tower",
          x,
          y: y - h,
          w,
          h,
          fill: `hsl(345, 30%, ${8 + rng() * 6}%)`,
          opacity: 0.95,
          points: `${x - 4},${y - h} ${x + w / 2},${y - h - 22} ${x + w + 4},${y - h}`,
        });
      }
    }
  }
  return list;
});

const fogs = computed(() =>
  Array.from({ length: 9 }, (_, i) => ({
    key: i,
    x: wide.value ? (W.value / 9) * i + 40 : 60 + ((i * 97) % 480),
    y: wide.value ? 60 + ((i * 83) % 420) : (H.value / 9) * i + 40,
    rx: 150 + (i % 3) * 40,
    ry: 26,
  })),
);

function animate() {
  context?.revert();
  if (!root.value) return;
  context = gsap.context(() => {
    gsap.from(".rmap-node", {
      scale: 0,
      opacity: 0,
      duration: 0.5,
      stagger: { each: 0.025, from: "start" },
      ease: "back.out(2)",
    });
    gsap.from(".rmap-edge", { opacity: 0, duration: 1, delay: 0.3 });
    gsap.to(".rmap-node.is-live .rmap-medal", {
      y: -5,
      repeat: -1,
      yoyo: true,
      duration: 0.8,
      ease: "sine.inOut",
    });
    gsap.to(".rmap-edge.is-live, .rmap-edge.is-walked", {
      strokeDashoffset: -24,
      repeat: -1,
      duration: 1.4,
      ease: "none",
    });
    gsap.to(".rmap-fog ellipse", {
      x: 40,
      repeat: -1,
      yoyo: true,
      duration: 9,
      stagger: 0.8,
      ease: "sine.inOut",
    });
    gsap.to(".rmap-bossglow", {
      opacity: 0.55,
      repeat: -1,
      yoyo: true,
      duration: 2.2,
      ease: "sine.inOut",
    });
    gsap.to(".rmap-token img", {
      y: -4,
      repeat: -1,
      yoyo: true,
      duration: 0.9,
      ease: "sine.inOut",
    });
    if (!wide.value) {
      const focus =
        root.value.querySelector(".rmap-node.is-live") ||
        root.value.querySelector(".rmap-token");
      focus?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, root.value);
}

watch(
  () => [props.pos, props.reachable.join(), wide.value],
  async () => {
    await nextTick();
    animate();
  },
);

onMounted(async () => {
  query = window.matchMedia("(min-width: 900px)");
  wide.value = query.matches;
  query.addEventListener("change", onQuery);
  await nextTick();
  animate();
});

onBeforeUnmount(() => {
  context?.revert();
  query?.removeEventListener("change", onQuery);
});
</script>

<style scoped>
.rmap {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
}

.rmap.is-wide {
  max-width: 1400px;
}

.rmap-frame {
  position: relative;
  border: 3px solid #5a4630;
  border-radius: 14px;
  box-shadow:
    0 0 0 2px #1b130a,
    0 0 0 5px #8a6c43,
    0 24px 50px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.rmap-svg {
  display: block;
  width: 100%;
  height: auto;
}

.rmap-zone {
  fill: rgba(255, 236, 200, 0.55);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.rmap-edge {
  stroke: rgba(235, 215, 170, 0.3);
  stroke-width: 2.2;
  stroke-dasharray: 3 9;
}

.rmap-edge.is-walked {
  stroke: #e0b25c;
  stroke-width: 3;
  stroke-dasharray: 12 12;
  opacity: 0.9;
}

.rmap-edge.is-live {
  stroke: #fff2c9;
  stroke-width: 3.2;
  stroke-dasharray: 12 12;
}

.rmap-node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
  cursor: default;
}

.rmap-medal {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 40%, #2b241b 0 55%, #0e0b08 100%) padding-box,
    var(--ring) border-box;
  border: 4px solid transparent;
  box-shadow:
    inset 0 0 8px rgba(0, 0, 0, 0.9),
    0 4px 10px rgba(0, 0, 0, 0.65);
}

.m-gold {
  --ring: linear-gradient(150deg, #fff3b0, #d9a520 45%, #7a5208 75%, #f7dc7a);
}

.m-silver {
  --ring: linear-gradient(150deg, #ffffff, #b9c2cc 45%, #5b6573 75%, #e3e8ee);
}

.m-bronze {
  --ring: linear-gradient(150deg, #ffd7a8, #c97b3a 45%, #6d3a14 75%, #e6a76a);
}

.m-ruby {
  --ring: linear-gradient(150deg, #ffd0d0, #d9393b 45%, #6d0f13 75%, #ff8e8e);
}

.rmap-node.is-locked .rmap-medal {
  opacity: 0.55;
  filter: grayscale(0.6) brightness(0.8);
}

.rmap-node.is-visited .rmap-medal {
  filter: grayscale(0.9) brightness(0.6);
}

.rmap-seal {
  position: absolute;
  right: -8px;
  bottom: -8px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #a31f2d;
  color: #ffe9c2;
  font-size: 12px;
  font-weight: 900;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.6);
}

.rmap-node.is-live {
  cursor: pointer;
}

.rmap-node.is-live .rmap-medal {
  box-shadow:
    inset 0 0 8px rgba(0, 0, 0, 0.9),
    0 0 0 3px rgba(255, 255, 255, 0.14),
    0 0 24px var(--c);
}

.rmap-node.is-live:hover .rmap-medal {
  filter: brightness(1.25);
}

.rmap-node.is-boss .rmap-medal {
  width: 84px;
  height: 84px;
  border-width: 5px;
}

.rmap-label {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.6);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: rgba(255, 236, 200, 0.7);
}

.rmap-node.is-live .rmap-label {
  color: var(--c);
}

.rmap-token {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 3;
  transition:
    left 0.9s ease,
    top 0.9s ease;
}

.rmap-token img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  object-position: top;
  border-radius: 50%;
  border: 3px solid #e0b25c;
  box-shadow:
    0 0 0 2px #1b130a,
    0 4px 12px rgba(0, 0, 0, 0.7);
}

@media (max-width: 560px) {
  .rmap-medal {
    width: 42px;
    height: 42px;
    border-width: 3px;
  }

  .rmap-node.is-boss .rmap-medal {
    width: 62px;
    height: 62px;
  }

  .rmap-label {
    font-size: 8px;
    letter-spacing: 0.6px;
  }
}
</style>
