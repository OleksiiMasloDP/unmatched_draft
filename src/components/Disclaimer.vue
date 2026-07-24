<template>
  <div v-if="isBannerVisible" class="disclaimer-banner">
    <div class="disclaimer-content">
      <div class="d-flex">
        <div class="disclaimer-header">
          <span class="disclaimer-icon">💡</span>
          <h4>{{ t(titleKey) }}</h4>
        </div>
        <button class="disclaimer-close-btn" @click="dismissBanner">
          {{ t("closeBtn") }}
        </button>
      </div>
      <p class="disclaimer-text">
        {{ t(textKey) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useDraftState } from "../composables/useDraftState.js";

const { t } = useDraftState();

const props = defineProps({
  titleKey: {
    type: String,
    required: true,
  },
  textKey: {
    type: String,
    required: true,
  },
  storageKey: {
    type: String,
    required: true,
  },
});

const isBannerVisible = ref(false);

onMounted(() => {
  const dismissed = localStorage.getItem(props.storageKey);
  if (!dismissed) {
    isBannerVisible.value = true;
  }
});

function dismissBanner() {
  isBannerVisible.value = false;
  localStorage.setItem(props.storageKey, "true");
}
</script>

<style scoped>
.disclaimer-banner {
  background: rgba(var(--bg-slate-rgb), 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid var(--border-light);
  padding: 16px;
  margin: 16px 0;
}

.disclaimer-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.disclaimer-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.disclaimer-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-white);
}

.disclaimer-icon {
  font-size: 1.2rem;
}

.disclaimer-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-light);
}

.disclaimer-close-btn {
  align-self: flex-end;
  background: var(--color-player);
  color: var(--text-white);
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.disclaimer-close-btn:hover {
  background: var(--color-player-dark, rgb(35, 65, 153));
}

.d-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
