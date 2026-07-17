<template>
  <div v-if="!isAppReady" class="app-preloader">
    <div class="preloader-spinner"></div>
  </div>
  <div v-else class="app-wrapper">
    <Header
      :lang="lang"
      :t="t"
      @update:lang="lang = $event"
      @navigate="currentScreen = $event"
    />

    <main class="content">
      <component :is="screens[currentScreen]" />
    </main>

    <ScrollToTop />
  </div>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from "vue";
import { useDraftState } from "./composables/useDraftState";
import Header from "./components/Header.vue";
import HeroMapGuide from "./components/HeroMapGuide.vue";
import ScrollToTop from "./components/ScrollToTop.vue";
import DraftPage from "./components/DraftPage.vue";

const { lang, t, loadChars, loadMaps, loadFromStorage, resetAll } =
  useDraftState();

const screens = {
  main: DraftPage,
  maps: HeroMapGuide,
};

const currentScreen = ref(localStorage.getItem("active_screen") || "main");
watch(
  currentScreen,
  (newScreen) => {
    localStorage.setItem("active_screen", newScreen);
    if (typeof window.gtag === "function") {
      window.gtag("config", "G-6BTH35KNGC", {
        page_title: `Screen: ${newScreen}`,
        page_path: `/${newScreen}`,
      });
    }
  },
  { immediate: true },
);

let bsModalInstance = null;
const isAppReady = ref(false);

onMounted(async () => {
  try {
    await Promise.all([loadChars(), loadMaps()]);

    loadFromStorage();

    await new Promise((resolve) => setTimeout(resolve, 50));
  } catch (error) {
    console.error("Помилка під час завантаження даних додатка:", error);
  } finally {
    isAppReady.value = true;
  }

  nextTick(() => {
    const modalEl = document.getElementById("resetConfirmModal");
    if (modalEl && window.bootstrap) {
      bsModalInstance = new window.bootstrap.Modal(modalEl);
    }
  });
});

function cancelReset() {
  if (bsModalInstance) bsModalInstance.hide();
}
function confirmReset() {
  resetAll();
  if (bsModalInstance) bsModalInstance.hide();
}
</script>
