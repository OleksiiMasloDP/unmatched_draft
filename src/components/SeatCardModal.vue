<template>
  <Teleport to="body">
    <div class="sc" @click.self="$emit('close')">
      <div class="sc-flip">
        <ProfileCard v-bind="card" />
        <button type="button" class="sc-back" @click="$emit('close')">
          ← {{ back }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import ProfileCard from "./ProfileCard.vue";

defineProps({
  card: { type: Object, required: true },
  back: { type: String, default: "" },
});
const emit = defineEmits(["close"]);

const onKey = (event) => {
  if (event.key === "Escape") emit("close");
};
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<style>
.sc {
  position: fixed;
  inset: 0;
  z-index: 5900;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 6, 14, 0.75);
  backdrop-filter: blur(4px);
  animation: sc-fade 0.25s ease-out both;
}

.sc-flip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  animation: sc-flip 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.sc-back {
  padding: 9px 22px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.8);
  color: #fff;
  font-weight: 800;
}

@keyframes sc-fade {
  from {
    opacity: 0;
  }
}

@keyframes sc-flip {
  from {
    opacity: 0;
    transform: perspective(900px) rotateY(-90deg) scale(0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sc,
  .sc-flip {
    animation-duration: 0.01s !important;
  }
}
</style>
