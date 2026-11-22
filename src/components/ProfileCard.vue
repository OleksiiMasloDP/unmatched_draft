<template>
  <div
    class="pc"
    :class="['cf-' + frame, 'ce-' + effect]"
    :style="tiltStyle"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <div class="pc-frame">
      <div class="pc-in">
        <img class="pc-art" :src="art" alt="" />
        <span class="pc-fx">
          <template v-if="hasParticles">
            <i
              v-for="(item, index) in particles"
              :key="index"
              :style="{
                left: item.x + '%',
                top: item.y + '%',
                '--d': item.d + 's',
                '--t': item.t + 's',
                '--z': item.z + 'px',
              }"
            ></i>
          </template>
        </span>
        <div class="pc-ava" :class="'af-' + avatarFrame">
          <img :src="avatar" alt="" />
          <span class="pc-lvl">{{ level.level }}</span>
        </div>
        <div class="pc-info">
          <b class="pc-nick">{{ nick }}</b>
          <span class="pc-title">{{ title }}</span>
          <div class="pc-xp">
            <i :style="{ width: xpPct + '%' }"></i>
          </div>
          <div class="pc-foot">
            <span>{{ games }} · {{ winrate }}%</span>
            <span class="pc-badges">
              <RogueIcon
                v-for="item in badges"
                :key="item.id"
                :name="item.icon"
                :metal="item.metal"
                size="22px"
              />
            </span>
          </div>
        </div>
      </div>
    </div>
    <span
      v-for="(item, index) in ornaments"
      :key="index"
      class="pc-orn"
      :class="'o-' + item.pos"
    >
      <RogueIcon :name="item.name" :metal="item.metal" :size="item.size" />
    </span>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import RogueIcon from "./RogueIcon.vue";

const props = defineProps({
  nick: { type: String, default: "" },
  title: { type: String, default: "" },
  art: { type: String, default: "" },
  avatar: { type: String, default: "" },
  frame: { type: String, default: "holo" },
  effect: { type: String, default: "shine" },
  avatarFrame: { type: String, default: "gold" },
  level: { type: Object, required: true },
  games: { type: Number, default: 0 },
  winrate: { type: Number, default: 0 },
  badges: { type: Array, default: () => [] },
});

const frameOrnaments = {
  steel: [
    { pos: "bottom", name: "crossedSwords", metal: "silver", size: "34px" },
  ],
  gold: [
    { pos: "top", name: "laurels", metal: "gold", size: "46px" },
    { pos: "bl", name: "coinsPile", metal: "gold", size: "26px" },
    { pos: "br", name: "coinsPile", metal: "gold", size: "26px" },
  ],
  holo: [{ pos: "top", name: "pentacle", metal: "silver", size: "34px" }],
  frost: [
    { pos: "tl", name: "waterDrop", metal: "silver", size: "28px" },
    { pos: "tr", name: "waterDrop", metal: "silver", size: "28px" },
    { pos: "bottom", name: "waterDrop", metal: "silver", size: "30px" },
  ],
  flame: [
    { pos: "tl", name: "candleFlame", metal: "ruby", size: "34px" },
    { pos: "tr", name: "candleFlame", metal: "ruby", size: "34px" },
    { pos: "bl", name: "candleFlame", metal: "gold", size: "28px" },
    { pos: "br", name: "candleFlame", metal: "gold", size: "28px" },
  ],
  emerald: [
    { pos: "top", name: "crystalBall", metal: "silver", size: "40px" },
    { pos: "bottom", name: "rock", metal: "bronze", size: "30px" },
  ],
  shadow: [
    { pos: "top", name: "skullCrossedBones", metal: "silver", size: "42px" },
    { pos: "bl", name: "ghost", metal: "silver", size: "28px" },
    { pos: "br", name: "ghost", metal: "silver", size: "28px" },
  ],
  neon: [
    { pos: "tl", name: "boltSpellCast", metal: "silver", size: "30px" },
    { pos: "br", name: "boltSpellCast", metal: "silver", size: "30px" },
  ],
  royal: [
    { pos: "top", name: "castle", metal: "gold", size: "54px" },
    { pos: "bl", name: "laurels", metal: "gold", size: "34px" },
    { pos: "br", name: "laurels", metal: "gold", size: "34px" },
  ],
};

const ornaments = computed(() => frameOrnaments[props.frame] || []);

const particleKinds = ["sparkles", "snow", "embers"];
const hasParticles = computed(() => particleKinds.includes(props.effect));

const particles = computed(() =>
  Array.from({ length: 16 }, (_, index) => ({
    x: (index * 37 + 11) % 96,
    y: (index * 53 + 7) % 90,
    d: ((index * 0.43) % 4).toFixed(2),
    t: (3 + ((index * 7) % 5)).toFixed(1),
    z: 3 + ((index * 5) % 4) * 2,
  })),
);

const xpPct = computed(() =>
  Math.round((props.level.xp / props.level.need) * 100),
);

const tilt = ref({ x: 0, y: 0, mx: 50, my: 50 });
const tiltStyle = computed(() => ({
  "--rx": `${tilt.value.x}deg`,
  "--ry": `${tilt.value.y}deg`,
  "--mx": `${tilt.value.mx}%`,
  "--my": `${tilt.value.my}%`,
}));

const onMove = (event) => {
  if (props.effect !== "tilt") return;
  const box = event.currentTarget.getBoundingClientRect();
  const px = (event.clientX - box.left) / box.width;
  const py = (event.clientY - box.top) / box.height;
  tilt.value = {
    x: (0.5 - py) * 18,
    y: (px - 0.5) * 18,
    mx: px * 100,
    my: py * 100,
  };
};

const onLeave = () => {
  tilt.value = { x: 0, y: 0, mx: 50, my: 50 };
};
</script>

<style scoped>
.pc {
  --fa: #f0abfc;
  --fb: #6366f1;
  --fc: #22d3ee;
  --glow: rgba(168, 85, 247, 0.45);
  --ro: 22px;
  --ri: 17px;
  --clip: none;
  --pad: 6px;
  position: relative;
  width: 280px;
  height: 400px;
  color: #fff;
  filter: drop-shadow(0 12px 26px var(--glow));
  transform: perspective(800px) rotateX(var(--rx, 0)) rotateY(var(--ry, 0));
  transition: transform 0.15s ease-out;
}

.pc-frame {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  padding: var(--pad);
  border-radius: var(--ro);
  clip-path: var(--clip);
  background: linear-gradient(135deg, var(--fa), var(--fb), var(--fc));
}

.pc-in {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--ri);
  overflow: hidden;
  background: #0a0418;
}

.pc-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pc-fx {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.pc-fx i {
  position: absolute;
  display: block;
  width: var(--z);
  height: var(--z);
}

.pc-ava {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 58px;
  height: 58px;
  padding: 3px;
  box-sizing: border-box;
  border-radius: 15px;
}

.pc-ava img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  display: block;
}

.pc-lvl {
  position: absolute;
  right: -7px;
  bottom: -7px;
  min-width: 24px;
  padding: 1px 5px;
  box-sizing: border-box;
  border-radius: 9px;
  background: #0b0f19;
  border: 2px solid #facc15;
  color: #facc15;
  font-size: 12px;
  font-weight: 900;
  text-align: center;
}

.pc-info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 44px 16px 16px;
  background: linear-gradient(0deg, rgba(8, 3, 20, 0.96) 55%, transparent);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pc-nick {
  font-size: 1.5rem;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #facc15;
}

.pc-xp {
  height: 6px;
  margin: 4px 0;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
}

.pc-xp i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--fb), var(--fa));
}

.pc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  font-weight: 700;
  color: #cbd5e1;
}

.pc-badges {
  display: flex;
  gap: 2px;
}

.pc-orn {
  position: absolute;
  z-index: 2;
  display: flex;
  pointer-events: none;
}

.o-top {
  top: 0;
  left: 50%;
  transform: translate(-50%, -52%);
}
.o-bottom {
  bottom: 0;
  left: 50%;
  transform: translate(-50%, 52%);
}
.o-tl {
  top: 0;
  left: 0;
  transform: translate(-30%, -30%);
}
.o-tr {
  top: 0;
  right: 0;
  transform: translate(30%, -30%);
}
.o-bl {
  bottom: 0;
  left: 0;
  transform: translate(-30%, 30%);
}
.o-br {
  bottom: 0;
  right: 0;
  transform: translate(30%, 30%);
}

.af-iron {
  background: linear-gradient(135deg, #94a3b8, #475569);
}
.af-gold {
  background: linear-gradient(135deg, #fde68a, #b45309);
}
.af-flame {
  background: linear-gradient(135deg, #fb923c, #dc2626);
}
.af-frost {
  background: linear-gradient(135deg, #bae6fd, #3b82f6);
}
.af-emerald {
  background: linear-gradient(135deg, #6ee7b7, #047857);
}
.af-royal {
  background: linear-gradient(135deg, #f0abfc, #6366f1, #22d3ee);
}

.cf-steel {
  --fa: #f1f5f9;
  --fb: #64748b;
  --fc: #e2e8f0;
  --glow: rgba(148, 163, 184, 0.35);
  --ro: 6px;
  --ri: 4px;
  --pad: 8px;
  --clip: polygon(
    18px 0,
    calc(100% - 18px) 0,
    100% 18px,
    100% calc(100% - 18px),
    calc(100% - 18px) 100%,
    18px 100%,
    0 calc(100% - 18px),
    0 18px
  );
}
.cf-steel .pc-frame {
  background:
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.18) 0 2px,
      transparent 2px 6px
    ),
    linear-gradient(135deg, var(--fa), var(--fb), var(--fc), var(--fb));
}

.cf-gold {
  --fa: #fff1a8;
  --fb: #b45309;
  --fc: #facc15;
  --glow: rgba(250, 204, 21, 0.5);
  --pad: 9px;
}
.cf-gold .pc-frame {
  background: linear-gradient(
    135deg,
    var(--fa),
    var(--fb),
    var(--fc),
    var(--fb)
  );
  box-shadow: inset 0 0 0 2px rgba(120, 53, 15, 0.6);
}

.cf-holo .pc-frame {
  background: conic-gradient(
    from 0deg,
    #f0abfc,
    #6366f1,
    #22d3ee,
    #facc15,
    #f0abfc
  );
  animation: pc-hue 8s linear infinite;
}

.cf-frost {
  --fa: #f0f9ff;
  --fb: #38bdf8;
  --fc: #1d4ed8;
  --glow: rgba(125, 211, 252, 0.6);
  --ro: 0;
  --ri: 8px;
  --pad: 9px;
  --clip: polygon(
    0 5%,
    4% 0,
    10% 3.5%,
    18% 0,
    26% 3%,
    34% 0,
    42% 3.5%,
    50% 0,
    58% 3.5%,
    66% 0,
    74% 3%,
    82% 0,
    90% 3.5%,
    96% 0,
    100% 5%,
    100% 95%,
    96% 100%,
    90% 96.5%,
    82% 100%,
    74% 97%,
    66% 100%,
    58% 96.5%,
    50% 100%,
    42% 96.5%,
    34% 100%,
    26% 97%,
    18% 100%,
    10% 96.5%,
    4% 100%,
    0 95%
  );
}

.cf-flame {
  --fa: #fde047;
  --fb: #f97316;
  --fc: #b91c1c;
  --glow: rgba(249, 115, 22, 0.7);
  --pad: 8px;
  animation: pc-flame 1.6s ease-in-out infinite;
}
.cf-flame .pc-frame {
  background: linear-gradient(0deg, #7f1d1d, #f97316 45%, #fde047);
}

.cf-emerald {
  --fa: #a7f3d0;
  --fb: #10b981;
  --fc: #065f46;
  --glow: rgba(16, 185, 129, 0.55);
  --ro: 150px 150px 20px 20px;
  --ri: 144px 144px 14px 14px;
  --pad: 8px;
}

.cf-shadow {
  --fa: #3b2a52;
  --fb: #0f0a1a;
  --fc: #6b21a8;
  --glow: rgba(88, 28, 135, 0.8);
  --ro: 4px;
  --ri: 2px;
  --pad: 9px;
  --clip: polygon(
    0 2%,
    5% 0,
    12% 2%,
    22% 0,
    35% 1.5%,
    48% 0,
    60% 2%,
    75% 0,
    88% 1.5%,
    100% 0,
    99% 14%,
    100% 30%,
    98.5% 50%,
    100% 72%,
    99% 88%,
    100% 100%,
    86% 98.5%,
    70% 100%,
    55% 98%,
    38% 100%,
    22% 98.5%,
    8% 100%,
    0 99%,
    1% 80%,
    0 60%,
    1.5% 40%,
    0 20%
  );
}
.cf-shadow .pc-frame {
  background: linear-gradient(160deg, #1a1030, #3b2a52 50%, #0a0612);
}

.cf-neon {
  --fa: #22d3ee;
  --fb: #e879f9;
  --fc: #22d3ee;
  --glow: rgba(34, 211, 238, 0.85);
  --ro: 0;
  --ri: 0;
  --pad: 4px;
  --clip: polygon(
    26px 0,
    100% 0,
    100% calc(100% - 26px),
    calc(100% - 26px) 100%,
    0 100%,
    0 26px
  );
  animation: pc-neon 2.4s ease-in-out infinite;
}

.cf-royal {
  --glow: rgba(168, 85, 247, 0.7);
  --ro: 34px;
  --ri: 26px;
  --pad: 10px;
}
.cf-royal .pc-frame {
  background: linear-gradient(
    120deg,
    #fde68a,
    #a855f7,
    #22d3ee,
    #fde68a,
    #a855f7
  );
  background-size: 300% 300%;
  animation: pc-shift 5s linear infinite;
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.35);
}

@keyframes pc-hue {
  to {
    filter: hue-rotate(360deg);
  }
}

@keyframes pc-flame {
  0%,
  100% {
    filter: drop-shadow(0 0 16px rgba(249, 115, 22, 0.7));
  }
  50% {
    filter: drop-shadow(0 0 34px rgba(253, 224, 71, 0.95));
  }
}

@keyframes pc-neon {
  0%,
  100% {
    filter: drop-shadow(0 0 10px #22d3ee) drop-shadow(0 0 22px #e879f9);
  }
  50% {
    filter: drop-shadow(0 0 4px #22d3ee) drop-shadow(0 0 10px #e879f9);
  }
}

@keyframes pc-shift {
  to {
    background-position: 300% 0;
  }
}

.ce-shine .pc-fx::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 40%;
  left: -60%;
  background: linear-gradient(
    100deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  transform: skewX(-18deg);
  animation: pc-sweep 3.2s ease-in-out infinite;
}

@keyframes pc-sweep {
  60%,
  100% {
    left: 130%;
  }
}

.ce-pulse {
  animation: pc-pulse 2s ease-in-out infinite;
}

@keyframes pc-pulse {
  50% {
    filter: drop-shadow(0 0 40px var(--fb)) brightness(1.15);
  }
}

.ce-sparkles .pc-fx i {
  background: #fff;
  clip-path: polygon(
    50% 0,
    62% 38%,
    100% 50%,
    62% 62%,
    50% 100%,
    38% 62%,
    0 50%,
    38% 38%
  );
  width: calc(var(--z) * 2.5);
  height: calc(var(--z) * 2.5);
  animation: pc-twinkle var(--t) ease-in-out var(--d) infinite;
}

@keyframes pc-twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.2) rotate(0);
  }
  50% {
    opacity: 1;
    transform: scale(1) rotate(90deg);
  }
}

.ce-snow .pc-fx i {
  top: -10px !important;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 6px #fff;
  animation: pc-fall var(--t) linear var(--d) infinite;
}

@keyframes pc-fall {
  from {
    transform: translate(0, 0);
    opacity: 0;
  }
  10% {
    opacity: 0.95;
  }
  to {
    transform: translate(24px, 400px);
    opacity: 0.2;
  }
}

.ce-embers .pc-fx i {
  top: auto !important;
  bottom: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, #fde047, #f97316 60%, transparent);
  box-shadow: 0 0 8px #f97316;
  animation: pc-rise var(--t) ease-in var(--d) infinite;
}

@keyframes pc-rise {
  from {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  to {
    transform: translate(-18px, -380px) scale(0.2);
    opacity: 0;
  }
}

.ce-glitch .pc-art {
  animation: pc-glitch 2.8s steps(1) infinite;
}

.ce-glitch .pc-fx {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.18) 0 1px,
    transparent 1px 3px
  );
}

@keyframes pc-glitch {
  0%,
  86%,
  100% {
    transform: none;
    filter: none;
  }
  88% {
    transform: translate(-4px, 1px);
    filter: drop-shadow(4px 0 #f0f) drop-shadow(-4px 0 #0ff);
  }
  91% {
    transform: translate(5px, -2px) skewX(2deg);
    filter: drop-shadow(-4px 0 #f0f) drop-shadow(4px 0 #0ff) hue-rotate(40deg);
  }
  94% {
    transform: translate(-2px, 2px);
    filter: drop-shadow(3px 0 #0ff);
  }
}

.ce-holo .pc-fx {
  background: linear-gradient(
    115deg,
    rgba(255, 0, 128, 0.35),
    rgba(255, 220, 0, 0.3),
    rgba(0, 255, 200, 0.35),
    rgba(120, 80, 255, 0.35)
  );
  background-size: 250% 250%;
  mix-blend-mode: color-dodge;
  opacity: 0.55;
  animation: pc-holo 5s ease-in-out infinite;
}

@keyframes pc-holo {
  50% {
    background-position: 100% 100%;
  }
}

.ce-tilt .pc-fx {
  background: radial-gradient(
    circle at var(--mx) var(--my),
    rgba(255, 255, 255, 0.4),
    transparent 45%
  );
}
</style>
