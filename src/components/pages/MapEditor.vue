<template>
  <div class="map-editor container">
    <h1 class="page-main-title">{{ t("mapEditorTitle") }}</h1>
    <div class="map-editor-bar">
      <select v-model="mapId" class="form-select form-select-sm">
        <option v-for="map in gameMaps" :key="map.id" :value="map.id">
          {{ map.name }}
          {{ edited[map.id] ? " ✎" : "" }}
        </option>
      </select>
      <label class="map-editor-field">
        {{ t("mapEditorRadius") }}
        <input v-model.number="radius" type="range" min="30" max="90" />
        <b>{{ radius }}</b>
      </label>
      <label class="map-editor-field">
        <input v-model="showLinks" type="checkbox" />
        {{ t("mapEditorLinks") }}
      </label>
      <label class="map-editor-field">
        <input v-model="showRing" type="checkbox" />
        {{ t("mapEditorRing") }}
      </label>
      <button class="btn btn-sm btn-outline-light" @click="resetMap">
        {{ t("mapEditorReset") }}
      </button>
    </div>
    <p class="map-editor-hint">{{ t("mapEditorHint") }}</p>

    <svg
      ref="svg"
      class="map-editor-board"
      :viewBox="`0 0 ${map.width} ${map.height}`"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointerleave="onUp"
    >
      <image :href="map.image" :width="map.width" :height="map.height" />
      <g v-if="showLinks">
        <template v-for="space in spaces" :key="'l-' + space.id">
          <line
            v-for="other in space.links.filter((id) => id > space.id)"
            :key="space.id + other"
            :x1="space.x"
            :y1="space.y"
            :x2="pos(other).x"
            :y2="pos(other).y"
            class="map-editor-link"
          />
        </template>
      </g>
      <g
        v-for="space in spaces"
        :key="space.id"
        :class="{ 'is-selected': selected === space.id }"
        @pointerdown.prevent="onDown($event, space.id)"
      >
        <circle
          class="map-editor-circle"
          :cx="space.x"
          :cy="space.y"
          :r="radius"
        />
        <circle
          v-if="showRing"
          class="map-editor-ring"
          :cx="space.x"
          :cy="space.y"
          :r="radius + 4"
        />
        <circle class="map-editor-dot" :cx="space.x" :cy="space.y" r="4" />
        <text class="map-editor-label" :x="space.x" :y="space.y - 10">
          {{ space.id }}
        </text>
      </g>
    </svg>

    <div class="map-editor-out">
      <div class="map-editor-out-head">
        <b>{{ t("mapEditorExport") }}</b>
        <button class="btn btn-sm btn-primary" @click="copy(exportMap)">
          {{ t("mapEditorCopyMap") }}
        </button>
        <button
          class="btn btn-sm btn-outline-light"
          :disabled="!Object.keys(edited).length"
          @click="copy(exportAll)"
        >
          {{ t("mapEditorCopyAll") }}
        </button>
        <span v-if="copied" class="map-editor-copied">✓</span>
      </div>
      <textarea class="form-control" rows="8" readonly :value="exportMap" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useDraftState } from "../../composables/useDraftState";
import { gameMaps } from "../../gameMaps";

const { t } = useDraftState();
const STORE = "unmatched_map_editor_v1";

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || {};
  } catch {
    return {};
  }
};

const edited = ref(load());
const mapId = ref(gameMaps[0].id);
const showLinks = ref(true);
const showRing = ref(false);
const selected = ref(null);
const copied = ref(false);
const svg = ref(null);
let dragging = null;

const map = computed(() => gameMaps.find((item) => item.id === mapId.value));

const radius = computed({
  get: () => edited.value[mapId.value]?.radius ?? map.value.radius,
  set: (value) => {
    edit().radius = value;
    save();
  },
});

const spaces = computed(() =>
  map.value.spaces.map((space) => {
    const saved = edited.value[mapId.value]?.spaces?.[space.id];
    return {
      id: space.id,
      zones: space.zones,
      links: space.links,
      x: saved ? saved[0] : space.x,
      y: saved ? saved[1] : space.y,
    };
  }),
);

const pos = (id) => spaces.value.find((space) => space.id === id);

function edit() {
  if (!edited.value[mapId.value]) {
    edited.value[mapId.value] = { radius: map.value.radius, spaces: {} };
  }
  return edited.value[mapId.value];
}

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(edited.value));
  } catch {
    return;
  }
}

function setPos(id, x, y) {
  edit().spaces[id] = [Math.round(x), Math.round(y)];
  save();
}

function point(event) {
  const ctm = svg.value.getScreenCTM().inverse();
  const p = svg.value.createSVGPoint();
  p.x = event.clientX;
  p.y = event.clientY;
  const out = p.matrixTransform(ctm);
  return { x: out.x, y: out.y };
}

function onDown(event, id) {
  selected.value = id;
  const at = point(event);
  const current = pos(id);
  dragging = { id, dx: current.x - at.x, dy: current.y - at.y };
}

function onMove(event) {
  if (!dragging) return;
  const at = point(event);
  setPos(dragging.id, at.x + dragging.dx, at.y + dragging.dy);
}

function onUp() {
  dragging = null;
}

function onKey(event) {
  if (!selected.value || !event.key.startsWith("Arrow")) return;
  event.preventDefault();
  const step = event.shiftKey ? 5 : 1;
  const current = pos(selected.value);
  const dx = { ArrowLeft: -step, ArrowRight: step }[event.key] || 0;
  const dy = { ArrowUp: -step, ArrowDown: step }[event.key] || 0;
  setPos(selected.value, current.x + dx, current.y + dy);
}

function resetMap() {
  delete edited.value[mapId.value];
  save();
}

const exportFor = (id) => {
  const source = gameMaps.find((item) => item.id === id);
  const data = edited.value[id];
  const lines = source.spaces.map((space) => {
    const saved = data?.spaces?.[space.id];
    const x = saved ? saved[0] : space.x;
    const y = saved ? saved[1] : space.y;
    return `  ["${space.id}", ${x}, ${y}, [${space.zones.map((z) => `"${z}"`).join(", ")}]],`;
  });
  return `${source.id}\nradius: ${data?.radius ?? source.radius}\n${lines.join("\n")}`;
};

const exportMap = computed(() => exportFor(mapId.value));
const exportAll = computed(() =>
  Object.keys(edited.value).map(exportFor).join("\n\n"),
);

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    copied.value = false;
  }
}

watch(mapId, () => {
  selected.value = null;
});

onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<style scoped>
.map-editor {
  padding-bottom: 40px;
}

.map-editor-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.map-editor-bar select {
  max-width: 260px;
}

.map-editor-field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-light);
}

.map-editor-hint {
  margin: 0 0 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.map-editor-board {
  display: block;
  width: 100%;
  touch-action: none;
  user-select: none;
  border: 1px solid var(--border-medium);
  border-radius: 12px;
}

.map-editor-circle {
  fill: rgba(0, 255, 255, 0.08);
  stroke: #00e5ff;
  stroke-width: 2;
  cursor: grab;
}

.is-selected .map-editor-circle {
  stroke: #ff3df2;
  stroke-width: 4;
  fill: rgba(255, 61, 242, 0.15);
}

.map-editor-ring {
  fill: none;
  stroke: #facc15;
  stroke-width: 2;
  stroke-dasharray: 6 6;
  pointer-events: none;
}

.map-editor-dot {
  fill: #ff3df2;
  pointer-events: none;
}

.map-editor-label {
  fill: #fff;
  font-size: 15px;
  font-weight: 700;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #000;
  stroke-width: 3px;
  pointer-events: none;
}

.map-editor-link {
  stroke: #ff3b3b;
  stroke-width: 3;
  opacity: 0.8;
  pointer-events: none;
}

.map-editor-out {
  margin-top: 12px;
}

.map-editor-out-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.map-editor-copied {
  color: var(--color-success, #22c55e);
  font-weight: 800;
}

.map-editor-out textarea {
  font-family: monospace;
  font-size: 12px;
}
</style>
