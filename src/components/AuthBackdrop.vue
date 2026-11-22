<template>
  <div class="bd" :class="'bd-' + variant" aria-hidden="true">
    <template v-if="variant === 1">
      <div class="au au-1"></div>
      <div class="au au-2"></div>
      <div class="au au-3"></div>
      <div class="au au-4"></div>
      <div class="au-grain"></div>
    </template>

    <template v-else-if="variant === 3">
      <img
        v-for="card in floaters"
        :key="card.src"
        class="fc"
        :src="card.src"
        alt=""
        :style="card.style"
      />
      <div class="fc-fade"></div>
    </template>

    <canvas v-else ref="canvas" class="bd-canvas"></canvas>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  variant: { type: Number, default: 1 },
});

const canvas = ref(null);
let frame = 0;
let stop = null;

const base = import.meta.env.BASE_URL;
const files = [
  "Medusa/gaze_of_stone",
  "King Arthur/excalibur",
  "Sinbad/commanding_impact",
  "King Arthur/divine_intervention",
  "Medusa/hiss_and_slither",
  "Sinbad/voyage_home",
  "King Arthur/prophecy",
  "Medusa/winged_frenzy",
  "Sinbad/leap_away",
  "King Arthur/the_holy_grail",
  "Medusa/snipe",
  "Sinbad/exploit",
];

const floaters = computed(() =>
  files.map((file, index) => {
    const depth = [0.55, 0.8, 1, 0.65, 0.9, 0.5][index % 6];
    return {
      src: `${base}images/cards/${file}.webp`,
      style: {
        "--x": `${(index * 8.7 + 4) % 96}%`,
        "--w": `${Math.round(70 + depth * 90)}px`,
        "--d": `${Math.round(34 - depth * 16)}s`,
        "--delay": `${-index * 3.1}s`,
        "--r": `${(index % 2 ? 1 : -1) * (8 + (index % 5) * 5)}deg`,
        "--b": `${(1 - depth) * 3.5}px`,
        "--o": 0.28 + depth * 0.3,
      },
    };
  }),
);

const reduced = () =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

function fit(el) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const w = el.clientWidth;
  const h = el.clientHeight;
  el.width = Math.round(w * ratio);
  el.height = Math.round(h * ratio);
  const ctx = el.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, w, h };
}

function stars(el) {
  let { ctx, w, h } = fit(el);
  const mouse = { x: -999, y: -999 };
  const make = () =>
    Array.from(
      { length: Math.min(110, Math.max(32, Math.round((w * h) / 12000))) },
      () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.6,
      }),
    );
  let dots = make();
  const move = (event) => {
    const rect = el.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  };
  window.addEventListener("pointermove", move);
  const resize = () => {
    ({ ctx, w, h } = fit(el));
    dots = make();
  };
  window.addEventListener("resize", resize);
  const draw = () => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#050a1c");
    bg.addColorStop(1, "#0b1530");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    for (const dot of dots) {
      dot.x += dot.vx;
      dot.y += dot.vy;
      if (dot.x < 0 || dot.x > w) dot.vx *= -1;
      if (dot.y < 0 || dot.y > h) dot.vy *= -1;
    }
    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];
      for (let j = i + 1; j < dots.length; j++) {
        const b = dots[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 130) {
          ctx.strokeStyle = `rgba(122,162,255,${(1 - dist / 130) * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      const toMouse = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (toMouse < 180) {
        ctx.strokeStyle = `rgba(250,204,21,${(1 - toMouse / 180) * 0.7})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
      ctx.fillStyle = "#cfe0ff";
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  return {
    draw,
    clean: () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("resize", resize);
    },
  };
}

function grid(el) {
  let { ctx, w, h } = fit(el);
  const resize = () => {
    ({ ctx, w, h } = fit(el));
  };
  window.addEventListener("resize", resize);
  const draw = (time) => {
    const horizon = h * 0.52;
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#12052e");
    sky.addColorStop(1, "#5b1166");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, horizon);
    const floor = ctx.createLinearGradient(0, horizon, 0, h);
    floor.addColorStop(0, "#1a0638");
    floor.addColorStop(1, "#07010f");
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, w, h - horizon);

    const radius = Math.min(w, h) * 0.2;
    const sun = ctx.createLinearGradient(0, horizon - radius * 2, 0, horizon);
    sun.addColorStop(0, "#ffd34d");
    sun.addColorStop(1, "#ff2f8a");
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, horizon - radius * 0.2, radius, Math.PI, 0);
    ctx.lineTo(w / 2 + radius, horizon);
    ctx.lineTo(w / 2 - radius, horizon);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, horizon);
    ctx.fillStyle = "#12052e";
    for (let i = 1; i < 6; i++) {
      const y = horizon - radius * 0.2 - radius * (i * 0.17);
      ctx.fillRect(0, y, w, i * 1.6);
    }
    ctx.restore();

    ctx.strokeStyle = "rgba(255,70,170,0.85)";
    ctx.lineWidth = 1.2;
    const speed = (time / 1000) * 0.45;
    for (let i = 0; i < 16; i++) {
      const p = (i + (speed % 1)) / 16;
      const y = horizon + Math.pow(p, 2.4) * (h - horizon);
      ctx.globalAlpha = 0.15 + p * 0.85;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(90,220,255,0.8)";
    for (let i = -14; i <= 14; i++) {
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * 14, horizon);
      ctx.lineTo(w / 2 + i * w * 0.16, h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  return { draw, clean: () => window.removeEventListener("resize", resize) };
}

function embers(el) {
  let { ctx, w, h } = fit(el);
  const resize = () => {
    ({ ctx, w, h } = fit(el));
  };
  window.addEventListener("resize", resize);
  const spawn = (fromBottom) => ({
    x: Math.random() * w,
    y: fromBottom ? h + 10 : Math.random() * h,
    vy: 0.35 + Math.random() * 1.1,
    r: 0.8 + Math.random() * 2.4,
    sway: Math.random() * Math.PI * 2,
    freq: 0.5 + Math.random() * 1.2,
    life: 0.4 + Math.random() * 0.6,
  });
  const sparks = Array.from({ length: Math.min(160, Math.round(w / 6)) }, () =>
    spawn(false),
  );
  const draw = (time) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#07060a");
    bg.addColorStop(0.7, "#1a0a07");
    bg.addColorStop(1, "#3b1204");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(
      w / 2,
      h * 1.05,
      10,
      w / 2,
      h * 1.05,
      h * 0.8,
    );
    glow.addColorStop(0, "rgba(255,120,30,0.45)");
    glow.addColorStop(1, "rgba(255,120,30,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const spark of sparks) {
      spark.y -= spark.vy;
      spark.x += Math.sin((time / 1000) * spark.freq + spark.sway) * 0.5;
      const rise = 1 - spark.y / h;
      if (spark.y < -10 || rise > spark.life + 0.2)
        Object.assign(spark, spawn(true));
      const alpha = Math.max(0, 1 - rise / (spark.life + 0.2));
      const halo = ctx.createRadialGradient(
        spark.x,
        spark.y,
        0,
        spark.x,
        spark.y,
        spark.r * 5,
      );
      halo.addColorStop(
        0,
        `rgba(255,${Math.round(150 + rise * 60)},60,${alpha})`,
      );
      halo.addColorStop(1, "rgba(255,80,0,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.r * 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  };
  return { draw, clean: () => window.removeEventListener("resize", resize) };
}

const factories = { 2: stars, 4: grid, 5: embers };

function start() {
  cancelAnimationFrame(frame);
  if (stop) stop();
  stop = null;
  const factory = factories[props.variant];
  if (!factory || !canvas.value) return;
  const scene = factory(canvas.value);
  const still = reduced();
  const loop = (time) => {
    scene.draw(time);
    if (!still) frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);
  stop = scene.clean;
}

onMounted(start);
watch(
  () => props.variant,
  () => setTimeout(start, 0),
);
onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  if (stop) stop();
});
</script>

<style scoped>
.bd {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #070b18;
  pointer-events: none;
}

.bd-canvas {
  width: 100%;
  height: 100%;
}

.bd-1 {
  background: #060914;
}

.au {
  position: absolute;
  width: 70vmax;
  height: 70vmax;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.65;
  mix-blend-mode: screen;
}

.au-1 {
  top: -25%;
  left: -15%;
  background: radial-gradient(circle, #22d3ee, transparent 65%);
  animation: au-a 18s ease-in-out infinite alternate;
}

.au-2 {
  top: 10%;
  right: -25%;
  background: radial-gradient(circle, #8b5cf6, transparent 65%);
  animation: au-b 22s ease-in-out infinite alternate;
}

.au-3 {
  bottom: -35%;
  left: 10%;
  background: radial-gradient(circle, #ec4899, transparent 65%);
  animation: au-c 20s ease-in-out infinite alternate;
}

.au-4 {
  top: 30%;
  left: 30%;
  width: 40vmax;
  height: 40vmax;
  background: radial-gradient(circle, #34d399, transparent 65%);
  opacity: 0.4;
  animation: au-d 16s ease-in-out infinite alternate;
}

.au-grain {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(
    rgba(255, 255, 255, 0.05) 1px,
    transparent 1px
  );
  background-size: 3px 3px;
}

@keyframes au-a {
  to {
    transform: translate(30vw, 18vh) scale(1.2);
  }
}

@keyframes au-b {
  to {
    transform: translate(-35vw, 12vh) scale(0.85);
  }
}

@keyframes au-c {
  to {
    transform: translate(28vw, -24vh) scale(1.15);
  }
}

@keyframes au-d {
  to {
    transform: translate(-18vw, -14vh) scale(1.3);
  }
}

.bd-3 {
  background:
    radial-gradient(circle at 50% 0%, #1b2a55, transparent 60%), #070b18;
}

.fc {
  position: absolute;
  bottom: -40%;
  left: var(--x);
  width: var(--w);
  border-radius: 8px;
  opacity: var(--o);
  filter: blur(var(--b));
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  animation: fc-rise var(--d) linear infinite;
  animation-delay: var(--delay);
}

@keyframes fc-rise {
  from {
    transform: translateY(0) rotate(var(--r));
  }
  to {
    transform: translateY(-190vh) rotate(calc(var(--r) * -1.6));
  }
}

.fc-fade {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    transparent 35%,
    rgba(7, 11, 24, 0.8)
  );
}

@media (prefers-reduced-motion: reduce) {
  .au,
  .fc {
    animation: none;
  }
}
</style>
