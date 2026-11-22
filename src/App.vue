<template>
  <div v-if="!isAppReady" class="app-preloader">
    <div class="preloader-spinner"></div>
  </div>
  <div v-else class="app-wrapper">
    <Header :lang="lang" :t="t" @update:lang="lang = $event" />

    <main class="content">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>

    <ScrollToTop />
    <FeedbackModal />
    <SupportModal />
    <AuthModal />
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick, watch } from "vue";
import { useRoute } from "vue-router";
import { applySeo } from "./seo.js";
import { useDraftState } from "./composables/useDraftState";
import Header from "./components/Header.vue";
import ScrollToTop from "./components/ScrollToTop.vue";
import FeedbackModal from "./components/FeedbackModal.vue";
import SupportModal from "./components/SupportModal.vue";
import AuthModal from "./components/AuthModal.vue";
import { initAuth } from "./cloud/useAuth";
import { registerSyncable } from "./cloud/sync";

const { lang, t, loadChars, loadMaps, loadFromStorage, resetAll } =
  useDraftState();

const currentRoute = useRoute();

// title/description/canonical/robots під поточну сторінку й мову
watch(
  [() => currentRoute.name, lang],
  ([name, language]) => applySeo(name, language),
  { immediate: true },
);

let bsModalInstance = null;
const isAppReady = ref(false);

const DRAFT_STORAGE_KEY = "unmatched_draft_state_v4";
registerSyncable({
  name: "draft",
  docKey: "draft",
  storageKey: DRAFT_STORAGE_KEY,
  toRemote: (raw) => {
    if (!raw) return null;
    const state = JSON.parse(raw);
    delete state.lang;
    return state;
  },
  fromRemote: (value) =>
    value == null ? null : JSON.stringify({ ...value, lang: lang.value }),
  apply: (raw) => {
    if (raw) loadFromStorage();
    else resetAll();
  },
});

onMounted(async () => {
  try {
    await Promise.all([loadChars(), loadMaps()]);

    loadFromStorage();

    await new Promise((resolve) => setTimeout(resolve, 50));
  } catch (error) {
    console.error("Помилка під час завантаження даних додатка:", error);
  } finally {
    isAppReady.value = true;
    setTimeout(() => initAuth(), 300);
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
