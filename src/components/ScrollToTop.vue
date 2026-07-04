<template>
  <Transition name="fade">
    <button 
      v-if="isVisible" 
      @click="scrollToTop" 
      class="scroll-top-btn"
      aria-label="Вгору"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="arrow-icon">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isVisible = ref(false);

// Перевіряємо, чи проскролив користувач достатньо вниз
function handleScroll() {
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
  isVisible.value = currentScroll > 300;
}

// Плавний скрол на саму гору
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

// Слухач подій при монтуванні компонента
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
});

// Чистимо за собою слухач, коли компонент знищується
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.scroll-top-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 99;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.arrow-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.2s ease;
}

.scroll-top-btn:hover {
  background: #27374d;
  border-color: rgba(59, 255, 0, 0.75);
  color: rgba(59, 255, 0, 1);
  box-shadow: 0 4px 16px rgba(59, 255, 0, 0.25);
  transform: translateY(-2px);
}

.scroll-top-btn:hover .arrow-icon {
  transform: translateY(-2px);
}

.scroll-top-btn:active {
  transform: translateY(0);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(15px) scale(0.9);
}
</style>