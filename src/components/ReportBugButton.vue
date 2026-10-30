<template>
  <button type="button" class="report-bug" @click="openFeedback({ section })">
    <span class="report-bug-icon">🐞</span>
    <span>{{ lang === "ua" ? "Повідомити про баг" : "Report a bug" }}</span>
  </button>
</template>

<script setup>
import { useDraftState } from "../composables/useDraftState";
import { useFeedback } from "../composables/useFeedback";

defineProps({
  section: {
    type: String,
    default: undefined,
  },
});

const { lang } = useDraftState();
const { openFeedback } = useFeedback();
</script>

<style scoped>
.report-bug {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border: 2px solid var(--color-warning);
  border-radius: 10px;
  background: transparent;
  color: var(--color-warning);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease,
    color 0.2s ease;
}

.report-bug:hover {
  color: #fff;
  box-shadow: 0 0 14px rgba(250, 204, 21, 0.45);
  transform: translateY(-1px);
}

.report-bug:hover .report-bug-icon {
  animation: bug-wiggle 0.5s ease;
}

@keyframes bug-wiggle {
  25% {
    transform: rotate(-18deg);
  }
  75% {
    transform: rotate(18deg);
  }
}
</style>
