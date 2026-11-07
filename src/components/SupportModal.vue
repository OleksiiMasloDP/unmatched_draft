<template>
  <teleport to="body">
    <transition name="sp-fade">
      <div v-if="isOpen" class="sp-overlay" @mousedown.self="closeSupport">
        <div class="sp-box" role="dialog" aria-modal="true">
          <button
            type="button"
            class="sp-close"
            :aria-label="L.close"
            @click="closeSupport"
          >
            ×
          </button>
          <h2 class="sp-title">{{ L.title }}</h2>
          <p class="sp-sub">{{ L.sub }}</p>

          <div class="sp-list">
            <template v-for="item in items" :key="item.key">
              <a
                v-if="item.type === 'link'"
                class="sp-item"
                :href="item.value"
                target="_blank"
                rel="noopener"
              >
                <span class="sp-icon">{{ item.icon }}</span>
                <span class="sp-name">{{ L.methods[item.key] }}</span>
                <span class="sp-go">→</span>
              </a>
              <button v-else type="button" class="sp-item" @click="copy(item)">
                <span class="sp-icon">{{ item.icon }}</span>
                <span class="sp-name">
                  {{ L.methods[item.key] }}
                  <small>{{ item.value }}</small>
                </span>
                <span class="sp-go">{{
                  copied === item.key ? L.copied : L.copy
                }}</span>
              </button>
            </template>
            <p v-if="!items.length" class="sp-empty">{{ L.empty }}</p>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { useSupport } from "../composables/useSupport";
import { SUPPORT } from "../supportConfig";

const { lang } = useDraftState();
const { isOpen, closeSupport } = useSupport();
const copied = ref("");
let copiedTimer;

const TEXT = {
  ua: {
    title: "Підтримати розробника",
    sub: "Проєкт безкоштовний і робиться у вільний час. Якщо він вам подобається, можна віддячити будь-яким зручним способом.",
    close: "Закрити",
    copy: "Копіювати",
    copied: "Скопійовано",
    empty: "Способи підтримки скоро з'являться.",
    methods: {
      monobank: "Банка Monobank",
      card: "Номер картки",
      paypal: "PayPal",
      kofi: "Ko-fi",
      usdt: "USDT",
    },
  },
  en: {
    title: "Support the developer",
    sub: "The project is free and built in spare time. If you like it, you can say thanks in any way that suits you.",
    close: "Close",
    copy: "Copy",
    copied: "Copied",
    empty: "Ways to support are coming soon.",
    methods: {
      monobank: "Monobank jar",
      card: "Card number",
      paypal: "PayPal",
      kofi: "Ko-fi",
      usdt: "USDT",
    },
  },
};

const L = computed(() => TEXT[lang.value] || TEXT.en);

const KINDS = [
  { key: "monobank", type: "link", icon: "🐱" },
  { key: "card", type: "copy", icon: "💳" },
  { key: "paypal", type: "link", icon: "🅿️" },
  { key: "kofi", type: "link", icon: "☕" },
  { key: "usdt", type: "copy", icon: "🪙" },
];

const items = computed(() =>
  KINDS.filter((kind) => SUPPORT[kind.key]).map((kind) => ({
    ...kind,
    value: SUPPORT[kind.key],
  })),
);

async function copy(item) {
  try {
    await navigator.clipboard.writeText(item.value);
  } catch {
    return;
  }
  copied.value = item.key;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => (copied.value = ""), 1800);
}

function onKey(e) {
  if (e.key === "Escape" && isOpen.value) closeSupport();
}
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  clearTimeout(copiedTimer);
});
</script>

<style scoped>
.sp-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(5, 8, 15, 0.72);
  backdrop-filter: blur(4px);
}

.sp-box {
  position: relative;
  width: 100%;
  max-width: 440px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 24px 22px 20px;
  color: var(--text-main, #f8fafc);
  background: var(--bg-dark, #0f172a);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 18px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
}

.sp-close {
  position: absolute;
  top: 10px;
  right: 14px;
  font-size: 1.6rem;
  line-height: 1;
  color: var(--text-dim, #94a3b8);
  background: none;
  border: 0;
  cursor: pointer;
}

.sp-close:hover {
  color: #fff;
}

.sp-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 800;
}

.sp-sub {
  margin: 0 0 16px;
  font-size: 0.88rem;
  color: var(--text-muted, #cbd5e1);
}

.sp-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  color: var(--text-main, #f8fafc);
  text-align: left;
  text-decoration: none;
  background: var(--bg-slate, #1e293b);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 12px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}

.sp-item:hover {
  border-color: var(--color-warning);
  transform: translateY(-1px);
}

.sp-icon {
  flex: none;
  font-size: 1.4rem;
}

.sp-name {
  flex: 1;
  min-width: 0;
  font-weight: 700;
}

.sp-name small {
  display: block;
  overflow: hidden;
  color: var(--text-dim, #94a3b8);
  font-size: 0.78rem;
  font-weight: 600;
  text-overflow: ellipsis;
}

.sp-go {
  flex: none;
  color: var(--color-warning);
  font-size: 0.8rem;
  font-weight: 800;
}

.sp-empty {
  margin: 0;
  color: var(--text-dim, #94a3b8);
  font-size: 0.9rem;
  text-align: center;
}

.sp-fade-enter-active,
.sp-fade-leave-active {
  transition: opacity 0.2s ease;
}

.sp-fade-enter-from,
.sp-fade-leave-to {
  opacity: 0;
}
</style>
