<template>
  <div
    class="bd"
    :class="'bd-' + variant"
    aria-hidden="true"
    @pointermove="track"
  >
    <template v-if="variant === 1">
      <img
        v-for="item in rain"
        :key="item.src + item.style['--x']"
        class="v1-card"
        :src="item.src"
        alt=""
        :style="item.style"
      />
    </template>

    <template v-else-if="variant === 2">
      <div class="v2-board">
        <div
          v-for="(row, index) in rows"
          :key="index"
          class="v2-row"
          :class="{ 'is-rev': index % 2 }"
          :style="{ '--s': 46 + index * 9 + 's' }"
        >
          <img v-for="(src, i) in row" :key="i" :src="src" alt="" />
        </div>
      </div>
    </template>

    <template v-else-if="variant === 3">
      <div class="v3-stage">
        <div class="v3-ring">
          <img
            v-for="(src, index) in ring"
            :key="index"
            :src="src"
            alt=""
            :style="{ '--a': index * (360 / ring.length) + 'deg' }"
          />
        </div>
      </div>
    </template>

    <template v-else-if="variant === 4">
      <div class="v4-wall">
        <img
          v-for="(src, index) in mosaic"
          :key="index"
          :src="src"
          alt=""
          :style="{ '--i': index }"
        />
      </div>
    </template>

    <template v-else-if="variant === 5">
      <img
        v-for="item in flips"
        :key="item.src + item.style['--x']"
        class="v5-card"
        :src="item.src"
        alt=""
        :style="item.style"
      />
    </template>

    <template v-else-if="variant === 6">
      <img
        v-for="item in burst"
        :key="item.src"
        class="v6-card"
        :src="item.src"
        alt=""
        :style="item.style"
      />
    </template>

    <template v-else-if="variant === 7">
      <div class="v7-layer is-back">
        <img
          v-for="item in depth.back"
          :key="item.src"
          :src="item.src"
          alt=""
          :style="item.style"
        />
      </div>
      <div class="v7-layer is-mid">
        <img
          v-for="item in depth.mid"
          :key="item.src"
          :src="item.src"
          alt=""
          :style="item.style"
        />
      </div>
      <div class="v7-layer is-front">
        <img
          v-for="item in depth.front"
          :key="item.src"
          :src="item.src"
          alt=""
          :style="item.style"
        />
      </div>
    </template>

    <template v-else-if="variant === 8">
      <img
        v-for="(src, index) in slides"
        :key="src"
        class="v8-slide"
        :src="src"
        alt=""
        :style="{ '--i': index }"
      />
      <div class="v8-tint"></div>
    </template>

    <template v-else-if="variant === 9">
      <div class="v9-stage">
        <div class="v9-plane">
          <div class="v9-track">
            <img v-for="(src, index) in floor" :key="index" :src="src" alt="" />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 10">
      <div
        v-for="bubble in bubbles"
        :key="bubble.src"
        class="v10-bubble"
        :style="bubble.style"
      >
        <img :src="bubble.src" alt="" />
      </div>
    </template>

    <div class="bd-shade"></div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { cardUrls, pick, portraitUrls } from "./authAssets";

defineProps({
  variant: { type: Number, default: 1 },
});

const rain = pick(cardUrls, 14).map((src, index) => {
  const depth = [0.55, 0.8, 1, 0.65, 0.9, 0.5][index % 6];
  return {
    src,
    style: {
      "--x": `${(index * 7.3 + 2) % 94}%`,
      "--w": `${Math.round(70 + depth * 90)}px`,
      "--d": `${Math.round(38 - depth * 18)}s`,
      "--delay": `${-index * 3}s`,
      "--r": `${(index % 2 ? 1 : -1) * (8 + (index % 5) * 5)}deg`,
      "--b": `${(1 - depth) * 3.5}px`,
      "--o": 0.3 + depth * 0.3,
    },
  };
});

const rows = [0, 1, 2, 3].map((row) => {
  const list = pick(cardUrls, 9, row * 4);
  return [...list, ...list];
});

const ring = pick(cardUrls, 12, 3);
const mosaic = pick(portraitUrls, 30, 0);

const flips = pick(cardUrls, 14, 5).map((src, index) => ({
  src,
  style: {
    "--x": `${(index * 8.1 + 3) % 94}%`,
    "--w": `${70 + (index % 4) * 22}px`,
    "--d": `${12 + (index % 5) * 3}s`,
    "--delay": `${-index * 2.2}s`,
    "--tilt": `${(index % 2 ? 1 : -1) * (10 + (index % 3) * 8)}deg`,
  },
}));

const burst = pick(cardUrls, 12, 2).map((src, index) => {
  const angle = (index / 12) * Math.PI * 2;
  const reach = 42 + (index % 3) * 6;
  return {
    src,
    style: {
      "--tx": `${Math.round(Math.cos(angle) * reach * 1.5)}vmin`,
      "--ty": `${Math.round(Math.sin(angle) * reach)}vmin`,
      "--r": `${Math.round((angle * 180) / Math.PI + 90)}deg`,
      "--delay": `${-index * 0.75}s`,
    },
  };
});

const layer = (list, sizes, spread) =>
  list.map((src, index) => ({
    src,
    style: {
      left: `${(index * spread + 3) % 92}%`,
      top: `${(index * 29 + 6) % 78}%`,
      width: `${sizes[index % sizes.length]}px`,
      "--dur": `${24 + index * 3}s`,
    },
  }));

const depth = computed(() => ({
  back: layer(pick(portraitUrls, 5, 0), [300, 360, 320], 21),
  mid: layer(pick(portraitUrls, 5, 6), [190, 220], 24),
  front: layer(pick(cardUrls, 6, 1), [90, 110, 100], 17),
}));

const slides = pick(portraitUrls, 6, 1);
const floor = [...pick(cardUrls, 24, 0), ...pick(cardUrls, 24, 0)];

const bubbles = pick(portraitUrls, 14, 4).map((src, index) => {
  const size = [90, 140, 200, 110, 170, 120][index % 6];
  return {
    src,
    style: {
      left: `${(index * 9.1 + 2) % 92}%`,
      width: `${size}px`,
      height: `${size}px`,
      "--d": `${22 + (index % 5) * 5}s`,
      "--delay": `${-index * 3.7}s`,
      "--o": 0.35 + (size / 200) * 0.4,
    },
  };
});

function track(event) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  el.style.setProperty("--mx", x.toFixed(3));
  el.style.setProperty("--my", y.toFixed(3));
}
</script>

<style scoped>
.bd {
  --mx: 0;
  --my: 0;
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 0%, #1b2a55, transparent 60%), #070b18;
}

.bd img {
  display: block;
  user-select: none;
}

.bd-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    transparent 30%,
    rgba(7, 11, 24, 0.82)
  );
}

.v1-card {
  position: absolute;
  bottom: -40%;
  left: var(--x);
  width: var(--w);
  border-radius: 8px;
  opacity: var(--o);
  filter: blur(var(--b));
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  animation: v1-rise var(--d) linear infinite;
  animation-delay: var(--delay);
}

@keyframes v1-rise {
  from {
    transform: translateY(0) rotate(var(--r));
  }
  to {
    transform: translateY(-190vh) rotate(calc(var(--r) * -1.6));
  }
}

.v2-board {
  position: absolute;
  inset: -30% -20%;
  display: grid;
  align-content: center;
  gap: 18px;
  transform: rotate(-14deg);
}

.v2-row {
  display: flex;
  gap: 18px;
  width: max-content;
  animation: v2-slide var(--s) linear infinite;
}

.v2-row.is-rev {
  animation-direction: reverse;
}

.v2-row img {
  width: 150px;
  border-radius: 10px;
  opacity: 0.55;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
}

@keyframes v2-slide {
  to {
    transform: translateX(-50%);
  }
}

.v3-stage {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  perspective: 1400px;
}

.v3-ring {
  position: relative;
  width: 150px;
  height: 210px;
  transform-style: preserve-3d;
  animation: v3-spin 70s linear infinite;
}

.v3-ring img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  opacity: 0.75;
  backface-visibility: visible;
  transform: rotateY(var(--a)) translateZ(560px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}

@keyframes v3-spin {
  from {
    transform: rotateX(-10deg) rotateY(0deg);
  }
  to {
    transform: rotateX(-10deg) rotateY(360deg);
  }
}

.v4-wall {
  position: absolute;
  inset: -15%;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  transform: rotate(-6deg);
  animation: v4-pan 60s ease-in-out infinite alternate;
}

.v4-wall img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 14px;
  opacity: 0.35;
  animation: v4-glow 9s ease-in-out infinite;
  animation-delay: calc(var(--i) * -0.7s);
}

@keyframes v4-glow {
  50% {
    opacity: 0.75;
    transform: scale(1.04);
  }
}

@keyframes v4-pan {
  to {
    transform: rotate(-6deg) translate(-4%, -6%) scale(1.1);
  }
}

.v5-card {
  position: absolute;
  top: -30%;
  left: var(--x);
  width: var(--w);
  border-radius: 8px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55);
  opacity: 0.8;
  animation: v5-fall var(--d) linear infinite;
  animation-delay: var(--delay);
}

@keyframes v5-fall {
  from {
    transform: translateY(0) perspective(600px) rotateY(0) rotateZ(var(--tilt));
  }
  to {
    transform: translateY(150vh) perspective(600px) rotateY(720deg)
      rotateZ(calc(var(--tilt) * -1));
  }
}

.v6-card {
  position: absolute;
  top: 52%;
  left: 50%;
  width: 110px;
  margin: -77px 0 0 -55px;
  border-radius: 8px;
  opacity: 0;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.6);
  animation: v6-deal 9s ease-out infinite;
  animation-delay: var(--delay);
}

@keyframes v6-deal {
  0% {
    opacity: 0;
    transform: translate(0, 0) rotate(0) scale(0.3);
  }
  12% {
    opacity: 0.95;
  }
  70% {
    opacity: 0.8;
    transform: translate(var(--tx), var(--ty)) rotate(var(--r)) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(calc(var(--tx) * 1.15), calc(var(--ty) * 1.15))
      rotate(var(--r)) scale(1.05);
  }
}

.v7-layer {
  position: absolute;
  inset: -8%;
  transition: transform 0.3s ease-out;
}

.v7-layer img {
  position: absolute;
  border-radius: 18px;
  animation: v7-drift var(--dur) ease-in-out infinite alternate;
}

.is-back {
  transform: translate(calc(var(--mx) * -18px), calc(var(--my) * -14px));
}

.is-back img {
  opacity: 0.22;
  filter: blur(3px);
}

.is-mid {
  transform: translate(calc(var(--mx) * -40px), calc(var(--my) * -30px));
}

.is-mid img {
  opacity: 0.4;
  border-radius: 50%;
}

.is-front {
  transform: translate(calc(var(--mx) * -80px), calc(var(--my) * -60px));
}

.is-front img {
  opacity: 0.85;
  border-radius: 8px;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.55);
}

@keyframes v7-drift {
  to {
    transform: translate(26px, -32px) rotate(4deg);
  }
}

.v8-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  filter: saturate(1.15) brightness(0.55);
  animation: v8-show 36s ease-in-out infinite;
  animation-delay: calc(var(--i) * 6s);
}

@keyframes v8-show {
  0% {
    opacity: 0;
    transform: scale(1.04);
  }
  6% {
    opacity: 1;
  }
  20% {
    opacity: 1;
  }
  28% {
    opacity: 0;
    transform: scale(1.28) translate(-2%, -2%);
  }
  100% {
    opacity: 0;
    transform: scale(1.28);
  }
}

.v8-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    rgba(79, 124, 255, 0.3),
    rgba(239, 68, 68, 0.22)
  );
  mix-blend-mode: soft-light;
}

.v9-stage {
  position: absolute;
  inset: 0;
  perspective: 700px;
  perspective-origin: 50% 28%;
}

.v9-plane {
  position: absolute;
  right: -30%;
  bottom: -18%;
  left: -30%;
  height: 120%;
  overflow: hidden;
  transform: rotateX(64deg);
  transform-origin: 50% 100%;
  -webkit-mask-image: linear-gradient(transparent, #000 35%);
  mask-image: linear-gradient(transparent, #000 35%);
}

.v9-track {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 22px;
  padding: 0 4%;
  animation: v9-flow 22s linear infinite;
}

.v9-track img {
  width: 100%;
  border-radius: 12px;
  opacity: 0.85;
}

@keyframes v9-flow {
  from {
    transform: translateY(-50%);
  }
  to {
    transform: translateY(0);
  }
}

.v10-bubble {
  position: absolute;
  bottom: -240px;
  opacity: var(--o);
  animation:
    v10-up var(--d) linear infinite,
    v10-sway 7s ease-in-out infinite alternate;
  animation-delay: var(--delay), var(--delay);
}

.v10-bubble img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.55);
  border-radius: 50%;
  box-shadow:
    0 0 0 6px rgba(79, 124, 255, 0.25),
    0 0 40px rgba(79, 124, 255, 0.55);
}

@keyframes v10-up {
  to {
    bottom: 112%;
  }
}

@keyframes v10-sway {
  to {
    transform: translateX(46px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bd * {
    animation: none !important;
  }
}
</style>
