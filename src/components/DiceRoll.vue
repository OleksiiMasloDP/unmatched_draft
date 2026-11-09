<template>
  <div ref="stage" class="dice-stage">
    <canvas ref="canvas" class="dice-canvas" />
    <div v-if="failed" class="dice-fallback">
      <span>{{ rolls.p1 }}</span>
      <span>{{ rolls.p2 }}</span>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  rolls: { type: Object, required: true },
  rollKey: { type: Number, default: 0 },
  winner: { type: String, default: null },
});
const emit = defineEmits(["done"]);

const stage = ref(null);
const canvas = ref(null);
const failed = ref(false);

const DURATION = 2600;
const COLORS = { p1: "#2f6fed", p2: "#d9483b" };
const SPACING = 1.35;

let THREE = null;
let renderer = null;
let scene = null;
let camera = null;
let dice = [];
let frame = 0;
let started = 0;
let observer = null;
let finished = false;

function buildTexture(faceNumbers, color) {
  const size = 1024;
  const cols = 5;
  const rows = 4;
  const cellW = size / cols;
  const cellH = size / rows;
  const el = document.createElement("canvas");
  el.width = size;
  el.height = size;
  const ctx = el.getContext("2d");
  for (let face = 0; face < 20; face++) {
    const x0 = (face % cols) * cellW;
    const y0 = Math.floor(face / cols) * cellH;
    const gradient = ctx.createLinearGradient(x0, y0, x0 + cellW, y0 + cellH);
    gradient.addColorStop(0, color.light);
    gradient.addColorStop(1, color.dark);
    ctx.fillStyle = gradient;
    ctx.fillRect(x0, y0, cellW, cellH);
    const top = y0 + cellH * 0.12;
    const bottom = top + cellW * 0.96 * 0.866;
    const cy = (top + bottom * 2) / 3;
    ctx.font = `800 ${cellW * 0.46}px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const value = faceNumbers[face];
    const label = value === 6 || value === 9 ? `${value}.` : String(value);
    ctx.lineWidth = cellW * 0.05;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.strokeText(label, x0 + cellW / 2, cy);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x0 + cellW / 2, cy);
  }
  const texture = new THREE.CanvasTexture(el);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function buildDie(seat) {
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const position = geometry.attributes.position;
  const faces = [];
  for (let face = 0; face < 20; face++) {
    const a = new THREE.Vector3().fromBufferAttribute(position, face * 3);
    const b = new THREE.Vector3().fromBufferAttribute(position, face * 3 + 1);
    const c = new THREE.Vector3().fromBufferAttribute(position, face * 3 + 2);
    const center = a.clone().add(b).add(c).divideScalar(3);
    const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    if (normal.dot(center) < 0) normal.negate();
    faces.push({ a, center, normal });
  }

  const numbers = new Array(20).fill(0);
  let next = 1;
  for (let i = 0; i < 20; i++) {
    if (numbers[i]) continue;
    const j = faces.findIndex(
      (face, index) =>
        index !== i &&
        !numbers[index] &&
        face.normal.dot(faces[i].normal) < -0.99,
    );
    numbers[i] = next;
    numbers[j] = 21 - next;
    next += 1;
  }

  const uv = new Float32Array(20 * 3 * 2);
  const size = 1024;
  const cellW = size / 5;
  const cellH = size / 4;
  for (let face = 0; face < 20; face++) {
    const x0 = (face % 5) * cellW;
    const y0 = Math.floor(face / 5) * cellH;
    const top = y0 + cellH * 0.12;
    const bottom = top + cellW * 0.96 * 0.866;
    const corners = [
      [x0 + cellW * 0.5, top],
      [x0 + cellW * 0.02, bottom],
      [x0 + cellW * 0.98, bottom],
    ];
    corners.forEach(([x, y], index) => {
      uv[(face * 3 + index) * 2] = x / size;
      uv[(face * 3 + index) * 2 + 1] = 1 - y / size;
    });
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));

  const tone = new THREE.Color(COLORS[seat]);
  const light = `#${tone.clone().offsetHSL(0, 0, 0.1).getHexString()}`;
  const dark = `#${tone.clone().offsetHSL(0, 0, -0.14).getHexString()}`;
  const texture = buildTexture(numbers, { light, dark });
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.38,
    metalness: 0.12,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x0a0e18 }),
  );
  edges.scale.setScalar(1.002);
  const group = new THREE.Group();
  group.add(mesh, edges);
  return { group, faces, numbers, geometry, material, texture, edges };
}

function finalRotation(die, value) {
  const index = die.numbers.indexOf(value);
  const face = die.faces[index];
  const z = new THREE.Vector3(0, 0, 1);
  const q1 = new THREE.Quaternion().setFromUnitVectors(face.normal, z);
  const up = face.a.clone().sub(face.center).applyQuaternion(q1);
  const angle = Math.PI / 2 - Math.atan2(up.y, up.x);
  const q2 = new THREE.Quaternion().setFromAxisAngle(z, angle);
  return q2.multiply(q1);
}

function resize() {
  if (!renderer || !stage.value) return;
  const width = stage.value.clientWidth;
  const height = stage.value.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.fov = width < 420 ? 52 : 38;
  camera.updateProjectionMatrix();
}

function setup() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 2, 0.1, 50);
  camera.position.set(0, 0, 6);
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2.5, 3.5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.9);
  rim.position.set(-3, -2, 2);
  scene.add(rim);
  dice = ["p1", "p2"].map((seat, index) => {
    const die = buildDie(seat);
    die.seat = seat;
    die.baseX = (index === 0 ? -1 : 1) * SPACING;
    scene.add(die.group);
    return die;
  });
  resize();
  observer = new ResizeObserver(resize);
  observer.observe(stage.value);
}

function randomAxis() {
  return new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5,
  ).normalize();
}

function launch() {
  cancelAnimationFrame(frame);
  finished = false;
  started = performance.now();
  const reduced = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const total = reduced ? 400 : DURATION;
  for (const die of dice) {
    die.target = finalRotation(die, props.rolls[die.seat]);
    die.axis = randomAxis();
    die.turns = (reduced ? 0 : 9 + Math.random() * 4) * Math.PI;
    die.delay = die.seat === "p2" ? 120 : 0;
    die.hop = 0.5 + Math.random() * 0.3;
  }
  const tick = (now) => {
    const elapsed = now - started;
    let allDone = true;
    for (const die of dice) {
      const t = Math.min(1, Math.max(0, (elapsed - die.delay) / total));
      if (t < 1) allDone = false;
      const eased = 1 - Math.pow(1 - t, 3);
      const spin = new THREE.Quaternion().setFromAxisAngle(
        die.axis,
        (1 - eased) * die.turns,
      );
      die.group.quaternion.copy(spin.multiply(die.target));
      const bounce = Math.abs(Math.sin(t * Math.PI * 3.2)) * (1 - t) * die.hop;
      const glide = (1 - eased) * 0.8;
      die.group.position.set(
        die.baseX + (die.seat === "p1" ? -glide : glide) * 0.4,
        bounce,
        (1 - t) * 0.6,
      );
      const win = props.winner === die.seat && t >= 1;
      die.group.scale.setScalar(win ? 1.12 : 1);
    }
    renderer.render(scene, camera);
    if (allDone) {
      if (!finished) {
        finished = true;
        emit("done");
      }
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}

function dispose() {
  cancelAnimationFrame(frame);
  observer?.disconnect();
  for (const die of dice) {
    die.geometry.dispose();
    die.material.dispose();
    die.texture.dispose();
    die.edges.geometry.dispose();
    die.edges.material.dispose();
  }
  renderer?.dispose();
  dice = [];
  renderer = null;
}

onMounted(async () => {
  try {
    THREE = await import("three");
    if (!canvas.value) return;
    setup();
    launch();
  } catch {
    failed.value = true;
    setTimeout(() => emit("done"), 900);
  }
});

watch(
  () => props.rollKey,
  () => {
    if (renderer) launch();
  },
);

watch(
  () => props.winner,
  () => {
    if (renderer && finished) launch();
  },
);

onBeforeUnmount(dispose);
</script>

<style scoped>
.dice-stage {
  position: relative;
  width: 100%;
  height: 300px;
}

.dice-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.dice-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  font-size: 4rem;
  font-weight: 800;
  color: var(--text-white);
}

@media (max-width: 520px) {
  .dice-stage {
    height: 240px;
  }
}
</style>
