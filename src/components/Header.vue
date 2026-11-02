<template>
  <header class="app-header" :class="{ 'is-hidden': isHeaderHidden }">
    <div class="header-container">
      <div class="header-left">
        <button
          class="burger-btn"
          type="button"
          :aria-label="t('navigation')"
          :aria-expanded="isMenuOpen"
          @click="isMenuOpen = !isMenuOpen"
          :class="{ 'is-active': isMenuOpen }"
        >
          <span class="burger-lines">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        <router-link
          :to="{ name: 'home' }"
          class="logo-wrapper"
          @click="closeAll"
        >
          <span class="engine-title-text char-title-bold engine-title-desktop"
            >UNMATCHED</span
          >
          <span class="logo-accent">DRAFT</span>
        </router-link>
      </div>

      <nav class="desk-nav" :aria-label="t('navigation')">
        <template v-for="entry in nav" :key="entry.id">
          <router-link
            v-if="entry.type === 'link'"
            :to="{ name: entry.name }"
            class="desk-link"
            @click="closeAll"
          >
            <svg
              class="desk-icon"
              viewBox="0 0 24 24"
              v-html="icons[entry.icon]"
            ></svg>
            <span>{{ entry.label }}</span>
          </router-link>

          <div
            v-else
            class="desk-menu"
            :class="{
              'is-open': openMenu === entry.id,
              'is-current': entry.items.some(
                (item) => route.name === item.name,
              ),
            }"
            @mouseenter="openMenu = entry.id"
            @mouseleave="openMenu = null"
          >
            <button
              type="button"
              class="desk-link desk-trigger"
              :aria-expanded="openMenu === entry.id"
              @click="openMenu = openMenu === entry.id ? null : entry.id"
            >
              <svg
                class="desk-icon"
                viewBox="0 0 24 24"
                v-html="icons[entry.icon]"
              ></svg>
              <span>{{ entry.label }}</span>
              <svg class="desk-caret" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div class="desk-dropdown">
              <router-link
                v-for="item in entry.items"
                :key="item.name"
                :to="{ name: item.name }"
                class="desk-item"
                @click="closeAll"
              >
                <svg
                  class="desk-icon"
                  viewBox="0 0 24 24"
                  v-html="icons[item.icon]"
                ></svg>
                <span class="desk-item-text">
                  <span class="desk-item-title">{{ item.label }}</span>
                  <span v-if="item.hint" class="desk-item-hint">{{
                    item.hint
                  }}</span>
                </span>
                <span v-if="item.beta" class="menu-beta">{{
                  t("packBeta")
                }}</span>
              </router-link>
            </div>
          </div>
        </template>
      </nav>

      <div class="header-right">
        <button type="button" class="desk-report" @click="openReport">
          <svg class="desk-icon" viewBox="0 0 24 24" v-html="icons.bug"></svg>
          <span>{{
            lang === "ua" ? "Повідомити про баг" : "Report a bug"
          }}</span>
        </button>
        <div class="lang-switcher">
          <button
            v-for="langOption in ['en', 'ua']"
            :key="langOption"
            :class="['lang-btn', { active: lang === langOption }]"
            @click="changeLang(langOption)"
          >
            {{ langOption.toUpperCase() }}
          </button>
        </div>
      </div>
    </div>

    <transition name="slide">
      <nav v-if="isMenuOpen" class="burger-menu">
        <ul class="menu-list">
          <li class="menu-section-title">{{ t("navigation") }}</li>
          <li v-for="item in flatItems" :key="item.name">
            <router-link
              :to="{ name: item.name }"
              class="menu-item"
              @click="isMenuOpen = false"
            >
              <svg
                class="menu-icon"
                viewBox="0 0 24 24"
                v-html="icons[item.icon]"
              ></svg>
              <span>{{ item.label }}</span>
              <span v-if="item.beta" class="menu-beta">{{
                t("packBeta")
              }}</span>
            </router-link>
          </li>
          <li>
            <button
              type="button"
              class="menu-item menu-feedback"
              @click="openReport"
            >
              <svg
                class="menu-icon"
                viewBox="0 0 24 24"
                v-html="icons.bug"
              ></svg>
              <span>{{
                lang === "ua" ? "Повідомити про баг" : "Report a bug"
              }}</span>
            </button>
          </li>
        </ul>
      </nav>
    </transition>

    <div
      v-if="isMenuOpen"
      class="menu-overlay"
      @click="isMenuOpen = false"
    ></div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import { useFeedback } from "../composables/useFeedback";

const props = defineProps({
  lang: {
    type: String,
    default: "ua",
  },
  t: {
    type: Function,
    default: (key) => key,
  },
});

const emit = defineEmits(["update:lang"]);
const route = useRoute();
const isMenuOpen = ref(false);
const openMenu = ref(null);
const { openFeedback } = useFeedback();

const stroke =
  'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

const icons = {
  draft: `<g ${stroke}><path d="M14.5 4 20 9.5 9.5 20 4 14.5z" /><line x1="12" y1="7" x2="17" y2="12" /></g>`,
  maps: `<g ${stroke}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></g>`,
  matchups: `<g ${stroke}><line x1="12" y1="3" x2="12" y2="21" /><line x1="6" y1="7" x2="18" y2="7" /><path d="M6 7L3 15H9L6 7Z" /><path d="M18 7L15 15H21L18 7Z" /></g>`,
  guide: `<g ${stroke}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></g>`,
  formats: `<g ${stroke}><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /><circle cx="9" cy="6" r="2" fill="currentColor" /><circle cx="15" cy="12" r="2" fill="currentColor" /><circle cx="8" cy="18" r="2" fill="currentColor" /></g>`,
  pack: `<g ${stroke}><rect x="7" y="3" width="13" height="16" rx="2" /><path d="M4 7v12a2 2 0 0 0 2 2h10" /></g>`,
  game: `<g ${stroke}><path d="M14.5 17.5 3 6V3h3l11.5 11.5" /><path d="m13 19 6-6" /><path d="m16 16 4 4" /><path d="m19 21 2-2" /></g>`,
  library: `<g ${stroke}><path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19.5A2 2 0 0 0 6 21h13" /></g>`,
  play: `<g ${stroke}><polygon points="6 4 20 12 6 20 6 4" /></g>`,
  bug: `<g ${stroke}><path d="m8 2 1.9 1.9" /><path d="M14.1 3.9 16 2" /><path d="M9 7.13v-1a3 3 0 1 1 6 0v1" /><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" /><path d="M12 20v-9" /><path d="M6 13H2M3 21c0-2.1 1.7-3.9 3.8-4M20.97 5c0 2.1-1.6 3.8-3.5 4M22 13h-4M17.2 17c2.1.1 3.8 1.9 3.8 4" /></g>`,
};

const nav = computed(() => {
  const ua = props.lang === "ua";
  return [
    {
      type: "link",
      id: "draft",
      name: "main",
      icon: "draft",
      label: ua ? "Драфт" : "Draft",
    },
    {
      type: "menu",
      id: "guides",
      icon: "library",
      label: ua ? "Довідник" : "Guides",
      items: [
        {
          name: "guide",
          icon: "guide",
          label: props.t("guideTitle"),
        },
        {
          name: "matchups",
          icon: "matchups",
          label: props.t("matchupsTitle"),
        },
        {
          name: "maps",
          icon: "maps",
          label: props.t("heroMapGuide"),
        },
      ],
    },
    {
      type: "link",
      id: "formats",
      name: "formats",
      icon: "formats",
      label: props.t("formatsTitle"),
    },
    {
      type: "menu",
      id: "play",
      icon: "play",
      label: ua ? "Грати" : "Play",
      items: [
        {
          name: "pack-draft",
          icon: "pack",
          label: props.t("packDraftTitle"),
          beta: true,
        },
        {
          name: "game",
          icon: "game",
          label: props.t("gameTitle"),
          beta: true,
        },
      ],
    },
  ];
});

const flatItems = computed(() =>
  nav.value.flatMap((entry) =>
    entry.type === "link"
      ? [{ name: entry.name, icon: entry.icon, label: entry.label }]
      : entry.items,
  ),
);

function closeAll() {
  isMenuOpen.value = false;
  openMenu.value = null;
}

function openReport() {
  closeAll();
  openFeedback();
}

const changeLang = (newLang) => {
  emit("update:lang", newLang);
};

const isHeaderHidden = ref(false);

function handleScroll() {
  const currentScrollTop =
    window.pageYOffset || document.documentElement.scrollTop;

  if (currentScrollTop > 50) {
    isHeaderHidden.value = true;
  } else {
    isHeaderHidden.value = false;
  }
}

function handleOutsidePointer(event) {
  const target = event.target;
  const inside =
    target.closest &&
    (target.closest(".burger-menu") ||
      target.closest(".burger-btn") ||
      target.closest(".desk-menu"));
  if (inside) return;
  closeAll();
}

function handleEscape(event) {
  if (event.key === "Escape") closeAll();
}

watch(
  () => route.fullPath,
  () => closeAll(),
);

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("pointerdown", handleOutsidePointer, true);
  document.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
  document.removeEventListener("pointerdown", handleOutsidePointer, true);
  document.removeEventListener("keydown", handleEscape);
});
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;

  width: 100%;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 1100;
  user-select: none;
}

.app-header.is-hidden {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}

.header-container {
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-wrapper {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.logo-accent {
  font-weight: 800;
  font-size: 18px;
  background: linear-gradient(135deg, #4f7cff, #ff4f6d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
}

.burger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: -8px 0 -8px -10px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  padding: 0;
}

.burger-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.burger-lines {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 22px;
  height: 16px;
}

.burger-lines span {
  width: 100%;
  height: 2px;
  background-color: #f1f5f9;
  border-radius: 2px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.burger-btn.is-active .burger-lines span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.burger-btn.is-active .burger-lines span:nth-child(2) {
  opacity: 0;
}
.burger-btn.is-active .burger-lines span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.burger-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 16px;
  width: 260px;
  background: rgba(30, 41, 59);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  padding: 12px 0;
}

.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-section-title {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #64748b;
  padding: 4px 16px 8px;
}

.menu-beta {
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid rgba(var(--color-info-rgb), 0.5);
  color: var(--color-info);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.menu-item {
  text-decoration: none;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  background: transparent;
  border: none;
  color: #cbd5e1;
  text-align: left;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-item.router-link-active {
  color: #4f7cff;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #4f7cff;
  padding-left: 20px;
}

.menu-icon {
  width: 16px;
  height: 16px;
  color: inherit;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(4, 6, 11, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: -1;
}

.lang-switcher {
  display: flex;
  background-color: rgba(30, 41, 59, 0.8);
  padding: 2px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.lang-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.lang-btn:hover {
  color: #f1f5f9;
}

.lang-btn.active {
  background: linear-gradient(135deg, #4f7cff, #3b60d1);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(79, 124, 255, 0.3);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

@media (max-width: 1023px) {
  .engine-title-desktop {
    font-size: 16px;
  }
  .logo-accent {
    font-size: 16px;
  }
  .burger-menu {
    left: 16px;
    right: 16px;
    width: auto;
  }
}
.desk-nav,
.desk-report {
  display: none;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.desk-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
@media (min-width: 1024px) {
  .burger-btn,
  .burger-menu,
  .menu-overlay {
    display: none;
  }
  .header-container {
    gap: 24px;
  }
  .desk-nav {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 4px;
  }
  .desk-link,
  .desk-report {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 14px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: #cbd5e1;
    font-size: 13.5px;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition:
      background 0.2s ease,
      color 0.2s ease,
      border-color 0.2s ease;
  }
  .desk-link:hover,
  .desk-menu.is-open > .desk-trigger {
    background: rgba(255, 255, 255, 0.06);
    color: #f1f5f9;
  }
  .desk-link.router-link-active,
  .desk-menu.is-current > .desk-trigger {
    color: #4f7cff;
    background: rgba(79, 124, 255, 0.12);
  }
  .desk-report {
    display: inline-flex;
    border-color: rgba(250, 204, 21, 0.45);
    color: #facc15;
    padding: 7px 12px;
    font-size: 12.5px;
  }
  .desk-report:hover {
    background: rgba(250, 204, 21, 0.1);
  }
  .desk-menu {
    position: relative;
  }
  .desk-caret {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.2s ease;
  }
  .desk-menu.is-open .desk-caret {
    transform: rotate(180deg);
  }
  .desk-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 250px;
    padding: 14px 8px 8px;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-6px);
    transition:
      opacity 0.18s ease,
      transform 0.18s ease,
      visibility 0.18s;
  }
  .desk-menu.is-open .desk-dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  .desk-dropdown::before {
    content: "";
    position: absolute;
    inset: 8px 0 0;
    z-index: -1;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    background: rgb(30, 41, 59);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.55);
  }
  .desk-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    color: #cbd5e1;
    font-size: 13.5px;
    font-weight: 700;
    text-decoration: none;
    transition: background 0.2s ease;
  }
  .desk-item:hover {
    background: rgba(79, 124, 255, 0.14);
    color: #f1f5f9;
  }
  .desk-item.router-link-active {
    color: #4f7cff;
  }
}
</style>
