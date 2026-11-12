<template>
  <div ref="root" class="rmap">
    <div class="rmap-frame">
      <svg
        class="rmap-svg"
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="rmap-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#2a0d18" />
            <stop offset="0.28" stop-color="#2b1a2e" />
            <stop offset="0.5" stop-color="#1d2433" />
            <stop offset="0.75" stop-color="#16301f" />
            <stop offset="1" stop-color="#0d1f14" />
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
            x2="0"
            y2="1"
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
          :cx="W / 2"
          :cy="60"
          r="190"
          fill="url(#rmap-glow)"
          class="rmap-bossglow"
        />
        <g v-for="item in scenery" :key="item.key" :opacity="item.opacity">
          <polygon
            v-if="item.kind === 'mountain'"
            :points="item.points"
            :fill="item.fill"
          />
          <polygon
            v-if="item.kind === 'mountain'"
            :points="item.cap"
            fill="#c9d3e0"
            opacity="0.55"
          />
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
            :x="0"
            :y="zone.y"
            :width="W"
            :height="zone.h"
            :fill="`url(#rmap-zone-${zone.id})`"
          />
          <text :x="22" :y="zone.y + 26" class="rmap-zone">
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
        :class="{
          'is-live': node.live,
          'is-visited': node.visited,
          'is-current': node.current,
          'is-locked': !node.live && !node.visited,
          'is-boss': node.type === 'boss',
        }"
        :style="{
          left: node.left + '%',
          top: node.top + '%',
          '--c': node.color,
          '--tilt': node.tilt + 'deg',
        }"
        :disabled="!node.live"
        @click="emit('enter', node.id)"
      >
        <span class="rmap-plate">
          <span class="rmap-icon">{{ node.icon }}</span>
          <span v-if="node.visited" class="rmap-seal">✔</span>
        </span>
        <span class="rmap-label">{{ node.label }}</span>
      </button>
      <div
        v-if="heroImage"
        ref="token"
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

const props = defineProps({
  map: { type: Array, required: true },
  pos: { type: String, default: null },
  visited: { type: Array, default: () => [] },
  reachable: { type: Array, default: () => [] },
  labels: { type: Object, default: () => ({}) },
  heroImage: { type: String, default: "" },
});

const emit = defineEmits(["enter"]);

const W = 600;
const STEP = 112;
const TOP = 96;
const BOTTOM = 96;

const root = ref(null);
const token = ref(null);
let context = null;
let seed = 0;

const total = computed(() => props.map.length);
const H = computed(() => TOP + BOTTOM + (total.value - 1) * STEP);

const hash = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
};

const spot = (node) => {
  const jitterX = (hash(node.id + "x") - 0.5) * 26;
  const jitterY = (hash(node.id + "y") - 0.5) * 20;
  return {
    x: node.x * W + jitterX,
    y: H.value - BOTTOM - node.row * STEP + jitterY,
  };
};

const flat = computed(() => props.map.flat());
const byId = computed(() => new Map(flat.value.map((node) => [node.id, node])));

const nodes = computed(() =>
  flat.value.map((node) => {
    const at = spot(node);
    const meta = nodeTypes[node.type];
    return {
      id: node.id,
      type: node.type,
      icon: meta.icon,
      color: meta.color,
      label: props.labels[node.type] || "",
      left: (at.x / W) * 100,
      top: (at.y / H.value) * 100,
      tilt: Math.round((hash(node.id + "t") - 0.5) * 10),
      live: props.reachable.includes(node.id),
      visited: props.visited.includes(node.id),
      current: props.pos === node.id,
    };
  }),
);

const tokenSpot = computed(() => {
  const node = props.pos ? byId.value.get(props.pos) : null;
  if (!node) return { left: 50, top: ((H.value - 26) / H.value) * 100 };
  const at = spot(node);
  return { left: (at.x / W) * 100, top: ((at.y - 44) / H.value) * 100 };
});

const edges = computed(() => {
  const list = [];
  for (const node of flat.value) {
    const from = spot(node);
    for (const target of node.next) {
      const other = byId.value.get(target);
      if (!other) continue;
      const to = spot(other);
      const bend = (hash(node.id + target) - 0.5) * 34;
      const midX = (from.x + to.x) / 2 + bend;
      const midY = (from.y + to.y) / 2;
      list.push({
        key: `${node.id}>${target}`,
        d: `M ${from.x} ${from.y - 14} Q ${midX} ${midY} ${to.x} ${to.y + 14}`,
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

const zones = computed(() => {
  const ids = ["forest", "mountains", "ruins", "citadel"];
  const rows = total.value;
  const size = Math.ceil(rows / ids.length);
  return ids.map((id, i) => {
    const topRow = Math.min(rows - 1, (i + 1) * size - 1);
    const bottomRow = i * size;
    const yTop = H.value - BOTTOM - topRow * STEP - STEP / 2;
    const yBottom = H.value - BOTTOM - bottomRow * STEP + STEP / 2;
    return {
      id,
      y: Math.max(0, yTop),
      h: Math.min(H.value, yBottom) - Math.max(0, yTop),
      tint: {
        forest: "#2e7d32",
        mountains: "#5c6bc0",
        ruins: "#8d6e63",
        citadel: "#c62828",
      }[id],
      bottomRow,
      topRow,
    };
  });
});

const scenery = computed(() => {
  seed = 0;
  const rng = () => {
    seed = (seed * 16807 + 11) % 2147483647;
    return seed / 2147483647;
  };
  seed = 7;
  const list = [];
  let key = 0;
  for (const zone of zones.value) {
    const count = 26;
    for (let i = 0; i < count; i += 1) {
      const left = rng() < 0.5;
      const x = left ? 8 + rng() * 78 : W - 8 - rng() * 78;
      const y = zone.y + 14 + rng() * (zone.h - 20);
      const size = 0.7 + rng() * 0.9;
      const id = zone.id;
      key += 1;
      if (id === "forest") {
        const w = 18 * size;
        const h = 30 * size;
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
      } else if (id === "mountains") {
        const w = 44 * size;
        const h = 62 * size;
        list.push({
          key,
          kind: "mountain",
          fill: `hsl(${225 + rng() * 15}, 22%, ${14 + rng() * 8}%)`,
          opacity: 0.95,
          points: `${x - w},${y + 14} ${x},${y - h} ${x + w},${y + 14}`,
          cap: `${x - w * 0.28},${y - h * 0.72} ${x},${y - h} ${x + w * 0.28},${y - h * 0.72} ${x + w * 0.1},${y - h * 0.8} ${x - w * 0.08},${y - h * 0.66}`,
        });
      } else if (id === "ruins") {
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
    x: 60 + ((i * 97) % 480),
    y: (H.value / 9) * i + 40,
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
      stagger: { each: 0.03, from: "start" },
      ease: "back.out(2)",
    });
    gsap.from(".rmap-edge", { opacity: 0, duration: 1, delay: 0.3 });
    gsap.to(".rmap-node.is-live .rmap-plate", {
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
    const target = root.value.querySelector(".rmap-node.is-live");
    const focus = target || root.value.querySelector(".rmap-token");
    focus?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, root.value);
}

watch(
  () => [props.pos, props.reachable.join()],
  async () => {
    await nextTick();
    animate();
  },
);

onMounted(async () => {
  await nextTick();
  animate();
});

onBeforeUnmount(() => context?.revert());
</script>

<style scoped>
.rmap {
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
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
  stroke: rgba(235, 215, 170, 0.28);
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

.rmap-plate {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 56px;
  border-radius: 7px;
  background: linear-gradient(160deg, #3a2c1b, #1a120a);
  border: 2px solid var(--c);
  transform: rotate(var(--tilt));
  box-shadow:
    inset 0 0 0 2px rgba(0, 0, 0, 0.5),
    0 4px 10px rgba(0, 0, 0, 0.6);
}

.rmap-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.7));
}

.rmap-node.is-locked .rmap-plate {
  opacity: 0.5;
  filter: grayscale(0.7) brightness(0.8);
}

.rmap-node.is-visited .rmap-plate {
  border-color: #8a6c43;
  filter: grayscale(0.9) brightness(0.65);
}

.rmap-seal {
  position: absolute;
  right: -9px;
  bottom: -9px;
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

.rmap-node.is-live .rmap-plate {
  box-shadow:
    inset 0 0 0 2px rgba(0, 0, 0, 0.5),
    0 0 0 3px rgba(255, 255, 255, 0.12),
    0 0 22px var(--c);
}

.rmap-node.is-live:hover .rmap-plate {
  filter: brightness(1.25);
}

.rmap-node.is-boss .rmap-plate {
  width: 72px;
  height: 92px;
  border-width: 3px;
}

.rmap-node.is-boss .rmap-icon {
  font-size: 40px;
}

.rmap-label {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
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
  .rmap-plate {
    width: 36px;
    height: 46px;
  }

  .rmap-icon {
    font-size: 19px;
  }

  .rmap-node.is-boss .rmap-plate {
    width: 56px;
    height: 72px;
  }
}
</style>
