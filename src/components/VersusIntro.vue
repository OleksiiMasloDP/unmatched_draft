<template>
  <Teleport to="body">
    <div class="vs" @click="$emit('close')">
      <div class="vs-stage">
        <div class="vs-side vs-left">
          <ProfileCard v-bind="left" />
          <b class="vs-hero">{{ leftHero }}</b>
        </div>
        <div class="vs-mid">
          <span class="vs-flash"></span>
          <span class="vs-text">VS</span>
        </div>
        <div class="vs-side vs-right">
          <ProfileCard v-bind="right" />
          <b class="vs-hero">{{ rightHero }}</b>
        </div>
      </div>
      <button type="button" class="vs-skip" @click.stop="$emit('close')">
        {{ skip }}
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import ProfileCard from "./ProfileCard.vue";

defineProps({
  left: { type: Object, required: true },
  right: { type: Object, required: true },
  leftHero: { type: String, default: "" },
  rightHero: { type: String, default: "" },
  skip: { type: String, default: "" },
});
const emit = defineEmits(["close"]);

let timer = 0;
onMounted(() => {
  timer = window.setTimeout(() => emit("close"), 4200);
});
onBeforeUnmount(() => window.clearTimeout(timer));
</script>

<style>
.vs {
  position: fixed;
  inset: 0;
  z-index: 6000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(30, 20, 60, 0.92),
    rgba(4, 6, 14, 0.97)
  );
  animation: vs-fade 0.35s ease-out both;
  overflow: hidden;
}

.vs-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
}

.vs-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.vs-left {
  animation: vs-in-left 0.7s cubic-bezier(0.2, 0.9, 0.25, 1.1) both;
}

.vs-right {
  animation: vs-in-right 0.7s cubic-bezier(0.2, 0.9, 0.25, 1.1) 0.1s both;
}

.vs-hero {
  color: #fff;
  font-size: 1.15rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-shadow: 0 2px 10px #000;
  animation: vs-fade 0.5s ease-out 0.7s both;
}

.vs-mid {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 110px;
}

.vs-text {
  position: relative;
  font-size: 4rem;
  font-weight: 900;
  font-style: italic;
  color: #facc15;
  text-shadow:
    0 0 24px rgba(250, 204, 21, 0.85),
    0 4px 0 #7c2d12;
  animation: vs-slam 0.55s cubic-bezier(0.2, 1.4, 0.3, 1) 0.55s both;
}

.vs-flash {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.95),
    rgba(250, 204, 21, 0.4) 40%,
    transparent 70%
  );
  animation: vs-burst 0.7s ease-out 0.6s both;
}

.vs-skip {
  position: absolute;
  right: 18px;
  bottom: 18px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.4);
  color: #e2e8f0;
  font-weight: 700;
}

@keyframes vs-fade {
  from {
    opacity: 0;
  }
}

@keyframes vs-in-left {
  from {
    opacity: 0;
    transform: translateX(-70vw) rotate(-14deg);
  }
}

@keyframes vs-in-right {
  from {
    opacity: 0;
    transform: translateX(70vw) rotate(14deg);
  }
}

@keyframes vs-slam {
  from {
    opacity: 0;
    transform: scale(4);
  }
}

@keyframes vs-burst {
  from {
    opacity: 1;
    transform: scale(0.1);
  }
  to {
    opacity: 0;
    transform: scale(2.2);
  }
}

@media (max-width: 760px) {
  .vs-stage {
    flex-direction: column;
    gap: 0;
  }

  .vs-side {
    zoom: 0.55;
  }

  .vs-mid {
    height: 70px;
  }

  .vs-text {
    font-size: 3rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .vs *,
  .vs {
    animation-duration: 0.01s !important;
    animation-delay: 0s !important;
  }
}
</style>
