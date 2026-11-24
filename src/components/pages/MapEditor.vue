<template>
  <div class="map-editor container">
    <h1 class="page-main-title">{{ t("mapEditorTitle") }}</h1>
    <div class="map-editor-bar">
      <select v-model="mapId" class="form-select form-select-sm">
        <option v-for="map in gameMaps" :key="map.id" :value="map.id">
          {{ map.name }}
          {{ editedIds.includes(map.id) ? " ✎" : "" }}
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
      <label class="map-editor-field">
        <input v-model="showZones" type="checkbox" />
        {{ t("mapEditorZones") }}
      </label>
      <div class="btn-group btn-group-sm">
        <button
          class="btn"
          :class="mode === 'move' ? 'btn-primary' : 'btn-outline-light'"
          @click="mode = 'move'"
        >
          {{ t("mapEditorModeMove") }}
        </button>
        <button
          class="btn"
          :class="mode === 'zones' ? 'btn-primary' : 'btn-outline-light'"
          @click="mode = 'zones'"
        >
          {{ t("mapEditorModeZones") }}
        </button>
      </div>
      <button class="btn btn-sm btn-outline-light" @click="resetMap">
        {{ t("mapEditorReset") }}
      </button>
    </div>
    <p class="map-editor-hint">
      {{ mode === "zones" ? t("mapEditorHintZones") : t("mapEditorHint") }}
    </p>

    <div class="map-editor-zones">
      <button
        v-for="zone in zoneList"
        :key="zone.name"
        type="button"
        class="map-editor-chip"
        :class="{ on: focusZone === zone.name }"
        @click="focusZone = focusZone === zone.name ? null : zone.name"
      >
        <i :style="{ background: colorOf(zone.name) }"></i>
        {{ zone.name }} · {{ zone.count }}
      </button>
    </div>

    <div v-if="mode === 'zones' && selectedSpace" class="map-editor-pick">
      <b>{{ selectedSpace.id }}</b>
      <label v-for="name in zoneNames" :key="name" class="map-editor-field">
        <input
          type="checkbox"
          :checked="selectedSpace.zones.includes(name)"
          @change="toggleZone(selectedSpace.id, name)"
        />
        <i class="map-editor-swatch" :style="{ background: colorOf(name) }"></i>
        {{ name }}
      </label>
      <select
        class="form-select form-select-sm map-editor-extra"
        @change="
          toggleZone(selectedSpace.id, $event.target.value);
          $event.target.value = '';
        "
      >
        <option value="">{{ t("mapEditorOtherZone") }}</option>
        <option v-for="name in extraZones" :key="name" :value="name">
          {{ name }}
        </option>
      </select>
      <button
        v-if="zonesChanged(selectedSpace.id)"
        class="btn btn-sm btn-outline-light"
        @click="resetZones(selectedSpace.id)"
      >
        {{ t("mapEditorZoneUndo") }}
      </button>
    </div>

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
        <template v-if="showZones">
          <path
            v-for="(wedge, index) in wedges(space)"
            :key="index"
            class="map-editor-wedge"
            :d="wedge.d"
            :fill="wedge.color"
            :class="{ dim: focusZone && !space.zones.includes(focusZone) }"
          />
        </template>
        <circle
          class="map-editor-circle"
          :class="{
            focus: focusZone && space.zones.includes(focusZone),
            changed: zonesChanged(space.id),
          }"
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
        <text
          v-if="showZones"
          class="map-editor-zone-label"
          :x="space.x"
          :y="space.y + 18"
        >
          {{ space.zones.join("+") }}
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
          :disabled="!editedIds.length"
          @click="copy(exportAll)"
        >
          {{ t("mapEditorCopyAll") }}
        </button>
        <span v-if="copied" class="map-editor-copied">✓</span>
      </div>
      <textarea class="form-control" rows="8" readonly :value="exportMap" />
      <div v-if="editedIds.length" class="map-editor-all">
        <div class="map-editor-out-head">
          <b>{{ t("mapEditorAllTitle") }}: {{ editedIds.length }}</b>
          <button
            v-for="id in editedIds"
            :key="id"
            class="btn btn-sm btn-outline-light"
            @click="mapId = id"
          >
            {{ nameOf(id) }}
          </button>
        </div>
        <textarea class="form-control" rows="12" readonly :value="exportAll" />
      </div>
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
const showZones = ref(true);
const mode = ref("move");
const focusZone = ref(null);
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

const ZONE_COLORS = {
  lilac: "#c8a2ff",
  orange: "#ff8c2a",
  yellow: "#ffd400",
  red: "#ff3b3b",
  navy: "#1e3a8a",
  cream: "#fff1c9",
  green: "#22c55e",
  brown: "#8b5a2b",
  purple: "#9333ea",
  tan: "#d2b48c",
  blue: "#3b82f6",
  lightblue: "#7dd3fc",
  wood: "#a0703c",
  gray: "#9ca3af",
  grey: "#9ca3af",
  lime: "#a3e635",
  pink: "#f472b6",
  slate: "#64748b",
  rust: "#b7410e",
  cyan: "#06b6d4",
  gold: "#eab308",
  dgreen: "#166534",
  sand: "#e6cf9a",
  olive: "#808000",
  brick: "#b22222",
  violet: "#8b5cf6",
  teal: "#14b8a6",
  magenta: "#e11d99",
  white: "#f8fafc",
  peach: "#ffb38a",
  burgundy: "#800020",
  stone: "#a8a29e",
  beige: "#f5f5dc",
  dark: "#1f2937",
  lawn: "#7cfc00",
  aqua: "#00ffd5",
  star: "#fde047",
};

const colorOf = (name) => ZONE_COLORS[name] || "#ffffff";

const allZoneNames = computed(() => {
  const names = new Set();
  for (const item of gameMaps) {
    for (const space of item.spaces) space.zones.forEach((z) => names.add(z));
  }
  return [...names].sort();
});

const zoneNames = computed(() => {
  const names = new Set();
  for (const space of map.value.spaces) {
    space.zones.forEach((z) => names.add(z));
  }
  return [...names];
});

const extraZones = computed(() =>
  allZoneNames.value.filter((name) => !zoneNames.value.includes(name)),
);

const baseZones = (id) =>
  map.value.spaces.find((space) => space.id === id)?.zones || [];

const zonesFor = (id) =>
  edited.value[mapId.value]?.zones?.[id] ?? baseZones(id);

const zonesChanged = (id) =>
  Boolean(edited.value[mapId.value]?.zones?.[id]) &&
  zonesFor(id).join() !== baseZones(id).join();

function toggleZone(id, name) {
  const list = [...zonesFor(id)];
  const at = list.indexOf(name);
  if (at >= 0) list.splice(at, 1);
  else list.push(name);
  if (!list.length) return;
  const data = edit();
  data.zones = data.zones || {};
  data.zones[id] = list;
  if (list.join() === baseZones(id).join()) delete data.zones[id];
  save();
}

function resetZones(id) {
  const data = edit();
  if (data.zones) delete data.zones[id];
  save();
}

const spaces = computed(() =>
  map.value.spaces.map((space) => {
    const saved = edited.value[mapId.value]?.spaces?.[space.id];
    return {
      id: space.id,
      zones: zonesFor(space.id),
      links: space.links,
      x: saved ? saved[0] : space.x,
      y: saved ? saved[1] : space.y,
    };
  }),
);

const zoneList = computed(() => {
  const counts = new Map();
  for (const space of spaces.value) {
    for (const z of space.zones) counts.set(z, (counts.get(z) || 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
});

const selectedSpace = computed(
  () => spaces.value.find((space) => space.id === selected.value) || null,
);

function wedges(space) {
  const n = space.zones.length;
  const r = radius.value;
  const { x, y } = space;
  if (n === 1) {
    return [
      {
        color: colorOf(space.zones[0]),
        d: `M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`,
      },
    ];
  }
  const start = n === 2 ? Math.PI : -Math.PI / 2;
  return space.zones.map((name, index) => {
    const a0 = start + (index * 2 * Math.PI) / n;
    const a1 = start + ((index + 1) * 2 * Math.PI) / n;
    const x0 = x + r * Math.cos(a0);
    const y0 = y + r * Math.sin(a0);
    const x1 = x + r * Math.cos(a1);
    const y1 = y + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return {
      color: colorOf(name),
      d: `M ${x} ${y} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`,
    };
  });
}

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
  if (mode.value === "zones") return;
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
    const zones = data?.zones?.[space.id] ?? space.zones;
    const note =
      data?.zones?.[space.id] && zones.join() !== space.zones.join()
        ? ` // was [${space.zones.join(", ")}]`
        : "";
    return `  ["${space.id}", ${x}, ${y}, [${zones.map((z) => `"${z}"`).join(", ")}]],${note}`;
  });
  return `${source.id}\nradius: ${data?.radius ?? source.radius}\n${lines.join("\n")}`;
};

const nameOf = (id) => gameMaps.find((item) => item.id === id)?.name || id;
const editedIds = computed(() =>
  Object.keys(edited.value).filter((id) => {
    const data = edited.value[id];
    return (
      data &&
      (Object.keys(data.spaces || {}).length ||
        Object.keys(data.zones || {}).length ||
        data.radius !== gameMaps.find((item) => item.id === id)?.radius)
    );
  }),
);

const exportMap = computed(() => exportFor(mapId.value));
const exportAll = computed(() => editedIds.value.map(exportFor).join("\n\n"));

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

.map-editor-wedge {
  opacity: 0.55;
  pointer-events: none;
}

.map-editor-wedge.dim {
  opacity: 0.12;
}

.map-editor-circle.focus {
  stroke: #fff;
  stroke-width: 5;
}

.map-editor-circle.changed {
  stroke: #facc15;
  stroke-width: 5;
}

.map-editor-zone-label {
  fill: #fff;
  font-size: 11px;
  font-weight: 700;
  text-anchor: middle;
  paint-order: stroke;
  stroke: #000;
  stroke-width: 2.5px;
  pointer-events: none;
}

.map-editor-zones,
.map-editor-pick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  margin-bottom: 8px;
}

.map-editor-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border: 1px solid var(--border-medium);
  border-radius: 999px;
  background: transparent;
  color: var(--text-light);
  font-size: 12px;
  cursor: pointer;
}

.map-editor-chip.on {
  border-color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.map-editor-chip i,
.map-editor-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.map-editor-extra {
  max-width: 170px;
}

.map-editor-all {
  margin-top: 14px;
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
