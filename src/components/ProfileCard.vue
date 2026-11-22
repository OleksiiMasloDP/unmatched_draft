<template>
  <div
    class="pc"
    :class="['cf-' + frame, 'ce-' + effect]"
    :style="tiltStyle"
    @pointermove="onMove"
    @pointerleave="onLeave"
  >
    <div class="pc-in">
      <img class="pc-art" :src="art" alt="" />
      <span class="pc-fx"></span>
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
  --glow: rgba(168, 85, 247, 0.4);
  position: relative;
  width: 280px;
  height: 400px;
  box-sizing: border-box;
  padding: 6px;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--fa), var(--fb), var(--fc));
  box-shadow: 0 18px 50px var(--glow);
  transform: perspective(800px) rotateX(var(--rx, 0)) rotateY(var(--ry, 0));
  transition: transform 0.15s ease-out;
  color: #fff;
}

.pc-in {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 17px;
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
  padding: 44px 16px 14px;
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
  --fa: #e2e8f0;
  --fb: #64748b;
  --fc: #cbd5e1;
  --glow: rgba(148, 163, 184, 0.3);
}
.cf-gold {
  --fa: #fde68a;
  --fb: #b45309;
  --fc: #facc15;
  --glow: rgba(250, 204, 21, 0.4);
}
.cf-holo {
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
  --fa: #e0f2fe;
  --fb: #38bdf8;
  --fc: #1d4ed8;
  --glow: rgba(125, 211, 252, 0.5);
}
.cf-flame {
  --fa: #fde047;
  --fb: #f97316;
  --fc: #b91c1c;
  --glow: rgba(249, 115, 22, 0.6);
  animation: pc-flame 1.8s ease-in-out infinite;
}
.cf-emerald {
  --fa: #a7f3d0;
  --fb: #10b981;
  --fc: #065f46;
  --glow: rgba(16, 185, 129, 0.5);
}
.cf-neon {
  --fa: #22d3ee;
  --fb: #e879f9;
  --fc: #22d3ee;
  --glow: rgba(34, 211, 238, 0.6);
  box-shadow:
    0 0 0 1px #22d3ee,
    0 0 24px rgba(34, 211, 238, 0.7),
    0 0 50px rgba(232, 121, 249, 0.4);
}
.cf-royal {
  background: linear-gradient(120deg, #f0abfc, #6366f1, #22d3ee, #f0abfc);
  background-size: 300% 300%;
  animation: pc-shift 4s linear infinite;
}

@keyframes pc-hue {
  to {
    filter: hue-rotate(360deg);
  }
}

@keyframes pc-flame {
  50% {
    box-shadow: 0 0 60px rgba(251, 146, 60, 0.95);
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
    rgba(255, 255, 255, 0.45),
    transparent
  );
  transform: skewX(-18deg);
  animation: pc-sweep 3.4s ease-in-out infinite;
}

@keyframes pc-sweep {
  60%,
  100% {
    left: 130%;
  }
}

.ce-pulse {
  animation: pc-pulse 2.2s ease-in-out infinite;
}

@keyframes pc-pulse {
  50% {
    box-shadow: 0 0 70px var(--fb);
  }
}

.ce-sparkles .pc-fx {
  background:
    radial-gradient(circle, #fff 1px, transparent 2px) 12% 18% / 60px 60px,
    radial-gradient(circle, #fde68a 1.5px, transparent 2.5px) 40% 60% / 90px
      90px,
    radial-gradient(circle, #fff 1px, transparent 2px) 70% 30% / 70px 70px;
  animation: pc-twinkle 2.4s ease-in-out infinite;
}

@keyframes pc-twinkle {
  50% {
    opacity: 0.25;
    background-position:
      14% 22%,
      44% 56%,
      66% 34%;
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
