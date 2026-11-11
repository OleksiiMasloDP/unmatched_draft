<template>
  <div ref="root" class="rmap" :style="{ height: height + 'px' }">
    <svg class="rmap-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line
        v-for="edge in edges"
        :key="edge.key"
        class="rmap-edge"
        :class="{ 'is-live': edge.live, 'is-walked': edge.walked }"
        :x1="edge.x1"
        :y1="edge.y1"
        :x2="edge.x2"
        :y2="edge.y2"
        vector-effect="non-scaling-stroke"
      />
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
      }"
      :disabled="!node.live"
      @click="emit('enter', node.id)"
    >
      <span class="rmap-icon">{{ node.visited ? "✔" : node.icon }}</span>
      <span class="rmap-label">{{ node.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { ref } from "vue";
import gsap from "gsap";
import { nodeTypes } from "../rogueData";

const props = defineProps({
  map: { type: Array, required: true },
  pos: { type: String, default: null },
  visited: { type: Array, default: () => [] },
  reachable: { type: Array, default: () => [] },
  labels: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["enter"]);

const root = ref(null);
let context = null;

const rows = computed(() => props.map.length);
const height = computed(() => Math.max(520, rows.value * 74));

const place = (node) => ({
  left: 8 + node.x * 84,
  top: 94 - (node.row / Math.max(1, rows.value - 1)) * 88,
});

const nodes = computed(() =>
  props.map.flat().map((node) => {
    const spot = place(node);
    const meta = nodeTypes[node.type];
    return {
      id: node.id,
      type: node.type,
      icon: meta.icon,
      color: meta.color,
      label: props.labels[node.type] || "",
      left: spot.left,
      top: spot.top,
      live: props.reachable.includes(node.id),
      visited: props.visited.includes(node.id),
      current: props.pos === node.id,
    };
  }),
);

const edges = computed(() => {
  const list = [];
  for (const node of props.map.flat()) {
    const from = place(node);
    for (const target of node.next) {
      const other = props.map.flat().find((item) => item.id === target);
      if (!other) continue;
      const to = place(other);
      list.push({
        key: `${node.id}>${target}`,
        x1: from.left,
        y1: from.top,
        x2: to.left,
        y2: to.top,
        walked:
          props.visited.includes(node.id) &&
          (props.visited.includes(target) || props.pos === target),
        live: props.pos === node.id || (!props.pos && node.row === 0),
      });
    }
  }
  return list;
});

function animate() {
  context?.revert();
  if (!root.value) return;
  context = gsap.context(() => {
    gsap.from(".rmap-node", {
      scale: 0,
      opacity: 0,
      duration: 0.45,
      stagger: { each: 0.025, from: "start" },
      ease: "back.out(2.2)",
    });
    gsap.from(".rmap-edge", { opacity: 0, duration: 0.8, delay: 0.3 });
    gsap.to(".rmap-node.is-live .rmap-icon", {
      scale: 1.18,
      repeat: -1,
      yoyo: true,
      duration: 0.7,
      ease: "sine.inOut",
    });
    const current = root.value.querySelector(".rmap-node.is-current");
    const live = root.value.querySelector(".rmap-node.is-live");
    (live || current)?.scrollIntoView({ block: "center", behavior: "smooth" });
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
  position: relative;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  border: 1px solid var(--border-light);
  border-radius: 16px;
  background:
    radial-gradient(
      circle at 50% 100%,
      rgba(var(--color-info-rgb), 0.18),
      transparent 55%
    ),
    radial-gradient(
      circle at 50% 0%,
      rgba(255, 77, 109, 0.16),
      transparent 50%
    ),
    rgba(255, 255, 255, 0.02);
  overflow: hidden;
}

.rmap-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.rmap-edge {
  stroke: rgba(255, 255, 255, 0.14);
  stroke-width: 2;
  stroke-dasharray: 5 6;
}

.rmap-edge.is-walked {
  stroke: var(--color-info);
  stroke-dasharray: none;
  stroke-width: 3;
  opacity: 0.8;
}

.rmap-edge.is-live {
  stroke: rgba(255, 255, 255, 0.55);
  stroke-width: 3;
}

.rmap-node {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
  cursor: default;
}

.rmap-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  font-size: 22px;
  background: var(--bg-card, #1c1f26);
  border: 2px solid var(--c);
  transition: box-shadow 0.2s;
}

.rmap-node.is-locked .rmap-icon {
  opacity: 0.45;
  filter: grayscale(0.6);
}

.rmap-node.is-visited .rmap-icon {
  border-color: var(--color-info);
  color: var(--color-info);
  opacity: 0.7;
  font-weight: 800;
}

.rmap-node.is-current .rmap-icon {
  background: rgba(var(--color-info-rgb), 0.3);
  opacity: 1;
}

.rmap-node.is-live {
  cursor: pointer;
}

.rmap-node.is-live .rmap-icon {
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.08),
    0 0 20px var(--c);
}

.rmap-node.is-live:hover .rmap-icon {
  box-shadow:
    0 0 0 5px rgba(255, 255, 255, 0.18),
    0 0 28px var(--c);
}

.rmap-node.is-boss .rmap-icon {
  width: 68px;
  height: 68px;
  font-size: 32px;
}

.rmap-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-dim);
}

.rmap-node.is-live .rmap-label {
  color: var(--c);
}

@media (max-width: 560px) {
  .rmap-icon {
    width: 38px;
    height: 38px;
    font-size: 18px;
  }
}
</style>
