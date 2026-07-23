<template>
  <button class="clear-filter-btn">
    <svg
      class="btn-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
    {{ t("clearFilter") }}
  </button>
</template>

<script setup>
import { useDraftState } from "../../composables/useDraftState";
const { t } = useDraftState();
</script>

<style scoped>
.clear-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 79, 79, 0.1);
  border: 1px solid rgba(255, 79, 79, 0.2);
  color: #ff5f5f;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.clear-filter-btn:hover {
  background: rgba(255, 79, 79, 0.2);
  border-color: rgba(255, 79, 79, 0.4);
  transform: translateY(-1px);
}

.clear-filter-btn:active {
  transform: translateY(0);
}

.btn-icon {
  width: 14px;
  height: 14px;
}
</style>
