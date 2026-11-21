<template>
  <Teleport to="body">
    <div class="gr" :class="`is-${mode}`" role="dialog" aria-modal="true">
      <div class="gr-rays"></div>
      <div v-if="mode === 'win'" class="gr-confetti" aria-hidden="true">
        <span
          v-for="piece in confetti"
          :key="piece.id"
          class="gr-piece"
          :style="piece.style"
        ></span>
      </div>
      <div class="gr-body">
        <div class="gr-portrait">
          <img v-if="image" :src="image" :alt="heroName" />
        </div>
        <div class="gr-kicker">{{ kicker }}</div>
        <h2 class="gr-title">{{ title }}</h2>
        <div class="gr-sub">{{ subtitle }}</div>
        <div class="gr-actions">
          <button
            v-if="actionLabel"
            class="btn action-btn gr-btn"
            :class="mainClass"
            @click="$emit('action')"
          >
            {{ actionLabel }}
          </button>
          <button
            class="btn action-btn gr-btn gr-btn-ghost"
            @click="$emit('close')"
          >
            {{ closeLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  mode: { type: String, default: "win" },
  title: { type: String, required: true },
  kicker: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  heroName: { type: String, default: "" },
  image: { type: String, default: "" },
  actionLabel: { type: String, default: "" },
  closeLabel: { type: String, default: "" },
});

defineEmits(["action", "close"]);

const mainClass = computed(
  () =>
    ({ win: "btn-success", lose: "btn-danger", neutral: "btn-primary" })[
      props.mode
    ] || "btn-primary",
);

const colors = [
  "#f5c542",
  "#ff7a59",
  "#4ecdc4",
  "#a78bfa",
  "#ffffff",
  "#7bd88f",
];

const confetti = computed(() =>
  Array.from({ length: 48 }, (_, index) => {
    const seed = (index * 9301 + 49297) % 233280;
    const rand = (shift) => ((seed * (shift + 3)) % 1000) / 1000;
    return {
      id: index,
      style: {
        left: `${rand(1) * 100}%`,
        background: colors[index % colors.length],
        animationDelay: `${rand(2) * 2.5}s`,
        animationDuration: `${3.2 + rand(3) * 2.4}s`,
        width: `${6 + rand(4) * 6}px`,
        height: `${10 + rand(5) * 10}px`,
        "--drift": `${(rand(6) - 0.5) * 160}px`,
        "--spin": `${360 + rand(7) * 720}deg`,
      },
    };
  }),
);
</script>

<style scoped>
.gr {
  --gr-a: #f5c542;
  --gr-b: #b8741a;
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 1rem;
  background: radial-gradient(
    circle at 50% 38%,
    rgba(70, 48, 8, 0.94),
    rgba(10, 8, 4, 0.97) 70%
  );
  animation: gr-fade 0.5s ease both;
}

.gr.is-lose {
  --gr-a: #d9575f;
  --gr-b: #7a1f2a;
  background: radial-gradient(
    circle at 50% 38%,
    rgba(70, 16, 24, 0.94),
    rgba(10, 4, 6, 0.97) 70%
  );
}

.gr.is-neutral {
  --gr-a: #6aa7ff;
  --gr-b: #2a4a8f;
  background: radial-gradient(
    circle at 50% 38%,
    rgba(18, 36, 76, 0.94),
    rgba(4, 6, 12, 0.97) 70%
  );
}

.gr-rays {
  position: absolute;
  left: 50%;
  top: 38%;
  width: 160vmax;
  height: 160vmax;
  margin: -80vmax 0 0 -80vmax;
  background: repeating-conic-gradient(
    from 0deg,
    color-mix(in srgb, var(--gr-a) 22%, transparent) 0deg 8deg,
    transparent 8deg 20deg
  );
  mask-image: radial-gradient(circle, #000 0, transparent 45%);
  -webkit-mask-image: radial-gradient(circle, #000 0, transparent 45%);
  animation: gr-spin 60s linear infinite;
  pointer-events: none;
}

.is-lose .gr-rays {
  opacity: 0.35;
  animation-duration: 120s;
}

.gr-confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.gr-piece {
  position: absolute;
  top: -30px;
  border-radius: 2px;
  opacity: 0;
  animation-name: gr-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.gr-body {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #fff;
  max-width: 560px;
}

.gr-portrait {
  width: min(220px, 42vw);
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--gr-a);
  background: #111;
  box-shadow:
    0 0 0 8px color-mix(in srgb, var(--gr-a) 25%, transparent),
    0 0 60px color-mix(in srgb, var(--gr-a) 70%, transparent);
  animation: gr-pop 0.7s cubic-bezier(0.2, 1.4, 0.4, 1) 0.15s both;
}

.is-lose .gr-portrait img {
  filter: grayscale(0.85) brightness(0.7);
}

.gr-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  display: block;
}

.gr-kicker {
  margin-top: 1.4rem;
  font-size: 0.85rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--gr-a);
  animation: gr-rise 0.6s ease 0.45s both;
}

.gr-title {
  margin: 0.2rem 0 0;
  font-size: clamp(2.6rem, 11vw, 5.6rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.05;
  background: linear-gradient(180deg, #fff, var(--gr-a) 55%, var(--gr-b));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(
    0 4px 18px color-mix(in srgb, var(--gr-a) 55%, transparent)
  );
  animation: gr-title 0.8s cubic-bezier(0.2, 1.3, 0.4, 1) 0.55s both;
}

.gr-sub {
  margin-top: 0.5rem;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.82);
  animation: gr-rise 0.6s ease 0.9s both;
}

.gr-actions {
  margin-top: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: center;
  animation: gr-rise 0.6s ease 1.1s both;
}

.gr-btn {
  flex: 0 0 auto;
  min-width: 11rem;
}

.gr-btn-ghost {
  border: 2px solid var(--border-strong) !important;
  background: rgba(255, 255, 255, 0.08) !important;
  color: var(--text-white) !important;
}

.gr-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.16) !important;
}

@keyframes gr-fade {
  from {
    opacity: 0;
  }
}

@keyframes gr-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes gr-pop {
  from {
    opacity: 0;
    transform: scale(0.4);
  }
}

@keyframes gr-rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
}

@keyframes gr-title {
  from {
    opacity: 0;
    transform: scale(1.6);
    letter-spacing: 0.4em;
  }
}

@keyframes gr-fall {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) rotate(0);
  }
  10% {
    opacity: 1;
  }
  100% {
    opacity: 0.9;
    transform: translate3d(var(--drift), 110vh, 0) rotate(var(--spin));
  }
}

@media (prefers-reduced-motion: reduce) {
  .gr,
  .gr *,
  .gr-rays {
    animation: none !important;
  }
}
</style>
