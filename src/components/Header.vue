<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-left">
        <button class="burger-btn" @click="isMenuOpen = !isMenuOpen" :class="{ 'is-active': isMenuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div class="logo-wrapper" @click="navigate('main')">
          <span class="engine-title-text char-title-bold engine-title-desktop">UNMATCHED</span>
          <span class="logo-accent">DRAFT</span>
        </div>
      </div>

      <div class="header-right">
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
          <li class="menu-section-title">{{ t('navigation') }}</li>
          <li>
            <button class="menu-item" @click="navigate('maps')">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/>
                <line x1="15" y1="6" x2="15" y2="21"/>
              </svg>
              <span>{{ t('heroMapGuide') }}</span>
            </button>
          </li>
        </ul>
      </nav>
    </transition>

    <div v-if="isMenuOpen" class="menu-overlay" @click="isMenuOpen = false"></div>
  </header>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  lang: {
    type: String,
    default: 'ua'
  },
  t: {
    type: Function,
    default: (key) => key
  }
});

const emit = defineEmits(['update:lang', 'navigate']);
const isMenuOpen = ref(false);

const changeLang = (newLang) => {
  emit('update:lang', newLang);
};

const navigate = (screenName) => {
  isMenuOpen.value = false;
  emit('navigate', screenName);
};
</script>

<style scoped>
.app-header {
  width: 100%;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 1100;
  user-select: none;
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
  flex-direction: column;
  justify-content: space-between;
  width: 20px;
  height: 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.burger-btn span {
  width: 100%;
  height: 2px;
  background-color: #f1f5f9;
  border-radius: 2px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.burger-btn.is-active span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.burger-btn.is-active span:nth-child(2) { opacity: 0; }
.burger-btn.is-active span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

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

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: #cbd5e1;
  text-align: left;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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

.slide-enter-active, .slide-leave-active { 
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
}
.slide-enter-from, .slide-leave-to { 
  transform: translateY(-10px); 
  opacity: 0; 
}

@media (max-width: 1023px) {
  .engine-title-desktop { font-size: 16px; }
  .logo-accent { font-size: 16px; }
  .burger-menu { left: 16px; right: 16px; width: auto; }
}
</style>