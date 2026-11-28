<template>
  <div
    class="pc"
    :class="['cf-' + frame, 'ce-' + effect]"
    :style="tiltStyle"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <span class="pc-back"></span>
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
    <span class="pc-brk"></span>
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
  hazard: [
    { pos: "bl", name: "skullCrossedBones", metal: "gold", size: "34px" },
    { pos: "tr", name: "boltSpellCast", metal: "gold", size: "30px" },
  ],
  punk: [
    { pos: "tr", name: "boltSpellCast", metal: "silver", size: "32px" },
    { pos: "bl", name: "boltSpellCast", metal: "silver", size: "32px" },
  ],
  chrome: [
    { pos: "bottom", name: "crossedSwords", metal: "silver", size: "36px" },
  ],
  gold: [
    { pos: "top", name: "laurels", metal: "gold", size: "48px" },
    { pos: "bl", name: "coinsPile", metal: "gold", size: "26px" },
    { pos: "br", name: "coinsPile", metal: "gold", size: "26px" },
  ],
  holo: [{ pos: "top", name: "pentacle", metal: "silver", size: "34px" }],
  toxic: [
    { pos: "top", name: "waterDrop", metal: "silver", size: "36px" },
    { pos: "tr", name: "skullCrossedBones", metal: "silver", size: "28px" },
  ],
  frost: [
    { pos: "tr", name: "waterDrop", metal: "silver", size: "30px" },
    { pos: "bl", name: "waterDrop", metal: "silver", size: "30px" },
  ],
  inferno: [
    { pos: "tl", name: "candleFlame", metal: "ruby", size: "36px" },
    { pos: "tr", name: "candleFlame", metal: "ruby", size: "36px" },
    { pos: "bl", name: "candleFlame", metal: "gold", size: "28px" },
    { pos: "br", name: "candleFlame", metal: "gold", size: "28px" },
  ],
  void: [
    { pos: "top", name: "skullCrossedBones", metal: "silver", size: "42px" },
    { pos: "bl", name: "ghost", metal: "silver", size: "28px" },
    { pos: "br", name: "ghost", metal: "silver", size: "28px" },
  ],
  neon: [
    { pos: "br", name: "boltSpellCast", metal: "silver", size: "32px" },
    { pos: "tr", name: "boltSpellCast", metal: "silver", size: "26px" },
  ],
  "gm-bronze": [
    { pos: "bottom", name: "crossedSwords", metal: "gold", size: "36px" },
  ],
  "gm-steel": [
    { pos: "top", name: "crossedSwords", metal: "silver", size: "40px" },
  ],
  "gm-ornate": [
    { pos: "top", name: "laurels", metal: "gold", size: "48px" },
    { pos: "bl", name: "coinsPile", metal: "gold", size: "26px" },
    { pos: "br", name: "coinsPile", metal: "gold", size: "26px" },
  ],
  "gm-obsidian": [
    { pos: "top", name: "skullCrossedBones", metal: "silver", size: "40px" },
  ],
  "gm-bone": [
    { pos: "top", name: "skullCrossedBones", metal: "silver", size: "36px" },
  ],
  "gm-rune": [{ pos: "top", name: "pentacle", metal: "silver", size: "38px" }],
  "gm-blood": [
    { pos: "tl", name: "candleFlame", metal: "ruby", size: "34px" },
    { pos: "tr", name: "candleFlame", metal: "ruby", size: "34px" },
  ],
  "gm-crystal": [
    { pos: "top", name: "waterDrop", metal: "silver", size: "40px" },
  ],
  "gm-wood": [{ pos: "bottom", name: "castle", metal: "gold", size: "38px" }],
  "gm-arcane": [{ pos: "top", name: "pentacle", metal: "gold", size: "40px" }],
  "uv-cyan": [
    { pos: "tr", name: "boltSpellCast", metal: "silver", size: "30px" },
  ],
  "uv-pink": [
    { pos: "br", name: "boltSpellCast", metal: "silver", size: "30px" },
  ],
  "mg-gold": [{ pos: "top", name: "laurels", metal: "gold", size: "44px" }],
  "ac-ember": [
    { pos: "tl", name: "candleFlame", metal: "ruby", size: "32px" },
    { pos: "tr", name: "candleFlame", metal: "ruby", size: "32px" },
  ],
  "ac-lamp": [{ pos: "top", name: "waterDrop", metal: "silver", size: "36px" }],
  royal: [
    { pos: "top", name: "castle", metal: "gold", size: "56px" },
    { pos: "bl", name: "laurels", metal: "gold", size: "34px" },
    { pos: "br", name: "laurels", metal: "gold", size: "34px" },
  ],
};

const ornaments = computed(() => frameOrnaments[props.frame] || []);

const particleKinds = [
  "sparkles",
  "snow",
  "embers",
  "lightning",
  "rain",
  "matrix",
  "fireflies",
  "confetti",
];
const hasParticles = computed(() => particleKinds.includes(props.effect));

const particles = computed(() =>
  Array.from({ length: 30 }, (_, index) => ({
    x: (index * 37 + 11) % 96,
    y: (index * 53 + 7) % 90,
    d: ((index * 0.43) % 4).toFixed(2),
    t: (3 + ((index * 7) % 5)).toFixed(1),
    z: 4 + ((index * 5) % 4) * 3,
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

.pc {
  --fa: #f0abfc;
  --fb: #6366f1;
  --fc: #22d3ee;
  --glow: rgba(168, 85, 247, 0.55);
  --ro: 22px;
  --ri: 17px;
  --clip: none;
  --pad: 6px;
  --ao: 12px;
  --ib: 16px;
  --back: transparent;
  --bo: 0;
  --bx: 9px;
  --by: 9px;
  --brk: 0;
  --brkc: #fff;
  --fbg: linear-gradient(135deg, var(--fa), var(--fb), var(--fc));
  position: relative;
  width: 280px;
  height: 400px;
  color: #fff;
  filter: drop-shadow(0 12px 30px var(--glow));
  transform: perspective(800px) rotateX(var(--rx, 0)) rotateY(var(--ry, 0));
  transition: transform 0.15s ease-out;
}

.pc-back {
  position: absolute;
  inset: 0;
  border-radius: var(--ro);
  clip-path: var(--clip);
  background: var(--back);
  opacity: var(--bo);
  transform: translate(var(--bx), var(--by));
}

.pc-brk {
  position: absolute;
  inset: -8px;
  pointer-events: none;
  opacity: var(--brk);
  z-index: 3;
  background:
    linear-gradient(var(--brkc), var(--brkc)) 0 0 / 22px 3px no-repeat,
    linear-gradient(var(--brkc), var(--brkc)) 0 0 / 3px 22px no-repeat,
    linear-gradient(var(--brkc), var(--brkc)) 100% 0 / 22px 3px no-repeat,
    linear-gradient(var(--brkc), var(--brkc)) 100% 0 / 3px 22px no-repeat,
    linear-gradient(var(--brkc), var(--brkc)) 0 100% / 22px 3px no-repeat,
    linear-gradient(var(--brkc), var(--brkc)) 0 100% / 3px 22px no-repeat,
    linear-gradient(var(--brkc), var(--brkc)) 100% 100% / 22px 3px no-repeat,
    linear-gradient(var(--brkc), var(--brkc)) 100% 100% / 3px 22px no-repeat;
}

.pc-frame {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  padding: var(--pad);
  border-radius: var(--ro);
  clip-path: var(--clip);
  background: var(--fbg);
}

.pc-ava {
  top: var(--ao);
  left: var(--ao);
}

.pc-info {
  padding-bottom: var(--ib);
}

.cf-hazard {
  --glow: rgba(250, 204, 21, 0.6);
  --ro: 0;
  --ri: 0;
  --pad: 12px;
  --clip: polygon(
    0 0,
    calc(100% - 32px) 0,
    100% 32px,
    100% 100%,
    32px 100%,
    0 calc(100% - 32px)
  );
  --fbg: repeating-linear-gradient(-45deg, #facc15 0 12px, #111 12px 24px);
  --back: #111;
  --bo: 1;
  --bx: 11px;
  --by: 11px;
  --brk: 1;
  --brkc: #facc15;
  --ib: 24px;
}

.cf-punk {
  --glow: rgba(255, 45, 149, 0.65);
  --ro: 0;
  --ri: 0;
  --pad: 6px;
  --ao: 34px;
  --clip: polygon(
    38px 0,
    100% 0,
    100% calc(100% - 38px),
    calc(100% - 38px) 100%,
    0 100%,
    0 38px
  );
  --fbg: linear-gradient(135deg, #ff2d95, #7c3aed 60%, #ff2d95);
  --back: #22d3ee;
  --bo: 1;
  --bx: -10px;
  --by: 10px;
  --brk: 1;
  --brkc: #22d3ee;
  --ib: 26px;
}

.cf-chrome {
  --glow: rgba(203, 213, 225, 0.5);
  --ro: 0;
  --ri: 0;
  --pad: 10px;
  --ao: 22px;
  --clip: polygon(
    20px 0,
    calc(100% - 20px) 0,
    100% 20px,
    100% calc(100% - 20px),
    calc(100% - 20px) 100%,
    20px 100%,
    0 calc(100% - 20px),
    0 20px
  );
  --fbg:
    repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.5) 0 2px,
      transparent 2px 7px
    ),
    linear-gradient(135deg, #f8fafc, #94a3b8 40%, #e2e8f0 60%, #64748b);
  --back: #1e293b;
  --bo: 1;
  --bx: 8px;
  --by: 8px;
  --ib: 24px;
}

.cf-gold {
  --glow: rgba(250, 204, 21, 0.6);
  --ro: 12px;
  --ri: 6px;
  --pad: 11px;
  --fbg:
    repeating-linear-gradient(
      135deg,
      rgba(120, 53, 15, 0.4) 0 6px,
      transparent 6px 12px
    ),
    linear-gradient(135deg, #fff1a8, #b45309 45%, #facc15 70%, #92400e);
  --back: #78350f;
  --bo: 1;
  --bx: 8px;
  --by: 8px;
  --brk: 1;
  --brkc: #fde68a;
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

.cf-toxic {
  --glow: rgba(132, 204, 22, 0.65);
  --ro: 0;
  --ri: 6px;
  --pad: 9px;
  --ib: 26px;
  --clip: polygon(
    0 0,
    100% 0,
    100% 97%,
    94% 97%,
    92% 100%,
    89% 97%,
    71% 97%,
    68.5% 99.5%,
    65% 97%,
    42% 97%,
    39% 100%,
    35% 97%,
    17% 97%,
    14% 99%,
    11% 97%,
    0 97%
  );
  --fbg:
    repeating-linear-gradient(
      -45deg,
      rgba(0, 0, 0, 0.4) 0 4px,
      transparent 4px 10px
    ),
    linear-gradient(160deg, #bef264, #65a30d 50%, #14532d);
  --back: #1a2e05;
  --bo: 1;
  --bx: 9px;
  --by: 9px;
  --brk: 1;
  --brkc: #a3e635;
}

.cf-frost {
  --glow: rgba(125, 211, 252, 0.7);
  --ro: 0;
  --ri: 6px;
  --pad: 10px;
  --ao: 24px;
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
  --fbg: linear-gradient(135deg, #f0f9ff, #38bdf8 50%, #1d4ed8);
  --back: #0c4a6e;
  --bo: 1;
  --bx: 9px;
  --by: 9px;
  --ib: 22px;
}

.cf-inferno {
  --glow: rgba(249, 115, 22, 0.8);
  --ro: 0;
  --ri: 0;
  --pad: 9px;
  --ao: 32px;
  --clip: polygon(
    0 8%,
    10% 3%,
    18% 7%,
    30% 0,
    40% 6%,
    50% 1%,
    60% 6%,
    72% 0,
    82% 7%,
    90% 3%,
    100% 8%,
    100% 100%,
    0 100%
  );
  --fbg: linear-gradient(0deg, #7f1d1d, #ea580c 45%, #fde047);
  --back: #450a0a;
  --bo: 1;
  --bx: 9px;
  --by: 9px;
  animation: pc-flame 1.6s ease-in-out infinite;
}

.cf-void {
  --glow: rgba(126, 34, 206, 0.85);
  --ro: 0;
  --ri: 2px;
  --pad: 10px;
  --ao: 16px;
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
  --fbg: linear-gradient(160deg, #1a1030, #5b21b6 50%, #0a0612);
  --back: #3b0764;
  --bo: 1;
  --bx: 9px;
  --by: 9px;
}

.cf-neon {
  --glow: rgba(34, 211, 238, 0.9);
  --ro: 0;
  --ri: 0;
  --pad: 5px;
  --ao: 36px;
  --clip: polygon(44px 0, 100% 0, 100% 100%, 0 100%, 0 44px);
  --fbg: linear-gradient(135deg, #22d3ee, #e879f9);
  --brk: 1;
  --brkc: #e879f9;
  --ib: 20px;
  animation: pc-neon 2.4s ease-in-out infinite;
}

.cf-royal {
  --glow: rgba(168, 85, 247, 0.8);
  --ro: 34px;
  --ri: 26px;
  --pad: 11px;
  --ao: 20px;
  --fbg: linear-gradient(120deg, #fde68a, #a855f7, #22d3ee, #fde68a, #a855f7);
  --back: #3b0764;
  --bo: 1;
  --bx: 8px;
  --by: 8px;
  --brk: 1;
  --brkc: #fde68a;
}

.cf-royal .pc-frame {
  background-size: 300% 300%;
  animation: pc-shift 5s linear infinite;
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
    filter: drop-shadow(0 0 38px rgba(253, 224, 71, 1));
  }
}

@keyframes pc-neon {
  0%,
  100% {
    filter: drop-shadow(0 0 12px #22d3ee) drop-shadow(0 0 26px #e879f9);
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
  width: 45%;
  left: -60%;
  background: linear-gradient(
    100deg,
    transparent,
    rgba(255, 255, 255, 0.65),
    transparent
  );
  transform: skewX(-18deg);
  animation: pc-sweep 2.8s ease-in-out infinite;
}

@keyframes pc-sweep {
  60%,
  100% {
    left: 130%;
  }
}

.ce-pulse {
  animation: pc-pulse 1.6s ease-in-out infinite;
}

@keyframes pc-pulse {
  50% {
    filter: drop-shadow(0 0 54px var(--fb)) brightness(1.25);
  }
}

.ce-sparkles .pc-fx i {
  background: #fff;
  filter: drop-shadow(0 0 5px #fde68a);
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
    transform: scale(1.1) rotate(90deg);
  }
}

.ce-snow .pc-fx i {
  top: -14px !important;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 8px #fff;
  animation: pc-fall var(--t) linear var(--d) infinite;
}

@keyframes pc-fall {
  from {
    transform: translate(0, 0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  to {
    transform: translate(30px, 420px);
    opacity: 0.2;
  }
}

.ce-embers .pc-fx i {
  top: auto !important;
  bottom: -14px;
  border-radius: 50%;
  background: radial-gradient(circle, #fff7ad, #f97316 55%, transparent);
  box-shadow: 0 0 12px #f97316;
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
    transform: translate(-22px, -400px) scale(0.2);
    opacity: 0;
  }
}

.ce-lightning .pc-fx::before {
  content: "";
  position: absolute;
  inset: 0;
  background: #cfe8ff;
  mix-blend-mode: overlay;
  opacity: 0;
  animation: pc-flash 3.5s steps(1) infinite;
}

.ce-lightning .pc-fx i {
  top: 0 !important;
  width: 14px;
  height: 75%;
  background: linear-gradient(#fff, #7dd3fc);
  filter: drop-shadow(0 0 8px #38bdf8);
  clip-path: polygon(
    60% 0,
    30% 30%,
    55% 32%,
    20% 62%,
    48% 64%,
    10% 100%,
    80% 55%,
    52% 53%,
    85% 28%,
    58% 26%,
    90% 0
  );
  opacity: 0;
  animation: pc-bolt 3.5s steps(1) var(--d) infinite;
}

.ce-lightning .pc-fx i:nth-child(n + 4) {
  display: none;
}

@keyframes pc-flash {
  0%,
  100% {
    opacity: 0;
  }
  2% {
    opacity: 0.9;
  }
  4% {
    opacity: 0;
  }
  6% {
    opacity: 0.7;
  }
  9% {
    opacity: 0;
  }
}

@keyframes pc-bolt {
  0%,
  100% {
    opacity: 0;
  }
  2%,
  6% {
    opacity: 1;
  }
  4% {
    opacity: 0;
  }
  9% {
    opacity: 0;
  }
}

.ce-rain .pc-fx i {
  top: -30px !important;
  width: 2px;
  height: calc(var(--z) * 3);
  background: linear-gradient(transparent, #bae6fd);
  animation: pc-rain 0.9s linear var(--d) infinite;
}

@keyframes pc-rain {
  from {
    transform: translate(0, 0);
    opacity: 0;
  }
  15% {
    opacity: 0.9;
  }
  to {
    transform: translate(-30px, 440px);
    opacity: 0.6;
  }
}

.ce-rain .pc-fx {
  background: linear-gradient(rgba(10, 30, 60, 0.3), rgba(10, 30, 60, 0.1));
}

.ce-matrix .pc-fx {
  background: rgba(0, 20, 0, 0.35);
}

.ce-matrix .pc-fx i {
  top: -120px !important;
  width: auto;
  height: auto;
  font: 700 12px monospace;
  color: #4ade80;
  text-shadow: 0 0 6px #22c55e;
  writing-mode: vertical-rl;
  letter-spacing: 2px;
  animation: pc-matrix var(--t) linear var(--d) infinite;
}

.ce-matrix .pc-fx i::before {
  content: "10110010 01101";
}

@keyframes pc-matrix {
  from {
    transform: translateY(0);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  to {
    transform: translateY(560px);
    opacity: 0.2;
  }
}

.ce-fireflies .pc-fx i {
  border-radius: 50%;
  background: radial-gradient(circle, #f7ffa6, #a3e635 55%, transparent);
  box-shadow: 0 0 14px #bef264;
  animation: pc-fly var(--t) ease-in-out var(--d) infinite;
}

@keyframes pc-fly {
  0%,
  100% {
    transform: translate(0, 0);
    opacity: 0.1;
  }
  25% {
    transform: translate(26px, -22px);
    opacity: 1;
  }
  50% {
    transform: translate(-14px, -42px);
    opacity: 0.3;
  }
  75% {
    transform: translate(-30px, -12px);
    opacity: 1;
  }
}

.ce-confetti .pc-fx i {
  top: -16px !important;
  height: calc(var(--z) * 1.6);
  background: #f43f5e;
  animation: pc-confetti var(--t) linear var(--d) infinite;
}

.ce-confetti .pc-fx i:nth-child(4n + 1) {
  background: #facc15;
}
.ce-confetti .pc-fx i:nth-child(4n + 2) {
  background: #22d3ee;
}
.ce-confetti .pc-fx i:nth-child(4n + 3) {
  background: #a3e635;
}

@keyframes pc-confetti {
  from {
    transform: translate(0, 0) rotate(0);
    opacity: 1;
  }
  to {
    transform: translate(36px, 430px) rotate(720deg);
    opacity: 0.8;
  }
}

.ce-aurora .pc-fx {
  mix-blend-mode: screen;
}

.ce-aurora .pc-fx::before,
.ce-aurora .pc-fx::after {
  content: "";
  position: absolute;
  inset: -20%;
  background: linear-gradient(
    115deg,
    transparent 25%,
    rgba(74, 222, 128, 0.75) 40%,
    rgba(96, 165, 250, 0.7) 55%,
    rgba(192, 132, 252, 0.7) 68%,
    transparent 80%
  );
  background-size: 220% 100%;
  filter: blur(18px);
  animation: pc-aurora 6s ease-in-out infinite alternate;
}

.ce-aurora .pc-fx::after {
  animation-duration: 9s;
  animation-direction: alternate-reverse;
  opacity: 0.7;
}

@keyframes pc-aurora {
  from {
    background-position: 0 0;
    transform: translateY(-6%) skewY(-4deg);
  }
  to {
    background-position: 100% 0;
    transform: translateY(8%) skewY(5deg);
  }
}

.ce-fog .pc-fx::before,
.ce-fog .pc-fx::after {
  content: "";
  position: absolute;
  left: -50%;
  width: 200%;
  height: 55%;
  background:
    radial-gradient(
      ellipse at 20% 50%,
      rgba(255, 255, 255, 0.55),
      transparent 55%
    ),
    radial-gradient(
      ellipse at 70% 60%,
      rgba(255, 255, 255, 0.45),
      transparent 55%
    );
  filter: blur(10px);
  animation: pc-fog 9s linear infinite;
}

.ce-fog .pc-fx::before {
  bottom: 0;
}

.ce-fog .pc-fx::after {
  top: 18%;
  opacity: 0.6;
  animation-duration: 14s;
  animation-direction: reverse;
}

@keyframes pc-fog {
  to {
    transform: translateX(25%);
  }
}

.ce-shock .pc-fx::before,
.ce-shock .pc-fx::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 45%;
  width: 60px;
  height: 60px;
  margin: -30px 0 0 -30px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 18px var(--fb);
  opacity: 0;
  animation: pc-shock 2.4s ease-out infinite;
}

.ce-shock .pc-fx::after {
  animation-delay: 1.2s;
}

@keyframes pc-shock {
  from {
    transform: scale(0.2);
    opacity: 1;
  }
  to {
    transform: scale(7);
    opacity: 0;
  }
}

.ce-scan .pc-fx {
  background:
    linear-gradient(rgba(34, 211, 238, 0.12) 1px, transparent 1px) 0 0 / 100%
      6px,
    linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px) 0 0 /
      6px 100%;
}

.ce-scan .pc-fx::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 36px;
  background: linear-gradient(
    transparent,
    rgba(34, 211, 238, 0.7),
    transparent
  );
  animation: pc-scan 2.2s linear infinite;
}

@keyframes pc-scan {
  from {
    top: -40px;
  }
  to {
    top: 100%;
  }
}

.ce-glitch .pc-art {
  animation: pc-glitch 2.2s steps(1) infinite;
}

.ce-glitch .pc-fx {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.22) 0 1px,
    transparent 1px 3px
  );
}

.ce-glitch .pc-fx::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 14%;
  top: 30%;
  background: rgba(255, 0, 255, 0.25);
  mix-blend-mode: screen;
  animation: pc-slice 2.2s steps(1) infinite;
}

@keyframes pc-slice {
  0%,
  80%,
  100% {
    opacity: 0;
  }
  84% {
    opacity: 1;
    top: 22%;
    transform: translateX(10px);
  }
  90% {
    opacity: 1;
    top: 58%;
    transform: translateX(-12px);
  }
}

@keyframes pc-glitch {
  0%,
  80%,
  100% {
    transform: none;
    filter: none;
  }
  82% {
    transform: translate(-6px, 1px);
    filter: drop-shadow(6px 0 #f0f) drop-shadow(-6px 0 #0ff);
  }
  86% {
    transform: translate(7px, -2px) skewX(3deg);
    filter: drop-shadow(-6px 0 #f0f) drop-shadow(6px 0 #0ff) hue-rotate(60deg);
  }
  92% {
    transform: translate(-3px, 2px);
    filter: drop-shadow(4px 0 #0ff) saturate(2);
  }
}

.ce-holo .pc-fx {
  background: linear-gradient(
    115deg,
    rgba(255, 0, 128, 0.45),
    rgba(255, 220, 0, 0.4),
    rgba(0, 255, 200, 0.45),
    rgba(120, 80, 255, 0.45)
  );
  background-size: 250% 250%;
  mix-blend-mode: color-dodge;
  opacity: 0.7;
  animation: pc-holo 4s ease-in-out infinite;
}

@keyframes pc-holo {
  50% {
    background-position: 100% 100%;
  }
}

.ce-tilt .pc-fx {
  background: radial-gradient(
    circle at var(--mx) var(--my),
    rgba(255, 255, 255, 0.5),
    transparent 45%
  );
}
</style>
