<template>
  <div class="as">
    <h1 class="as-title">{{ L.title }}</h1>
    <p class="as-sub">{{ L.sub }}</p>

    <h2 class="as-h2">{{ L.bgTitle }}</h2>
    <div class="as-grid">
      <button
        v-for="id in ids"
        :key="'b' + id"
        type="button"
        class="as-tile"
        :class="{ on: bg === id }"
        @click="bg = id"
      >
        <AuthBackdrop :variant="id" />
        <div class="as-mock">
          <i class="as-mock-tabs"></i>
          <i class="as-mock-btn is-white"></i>
          <i class="as-mock-field"></i>
          <i class="as-mock-btn is-gold"></i>
        </div>
        <span class="as-num">{{ id }}</span>
        <div class="as-label">
          <strong>{{ L.bgNames[id - 1] }}</strong>
        </div>
      </button>
    </div>

    <h2 class="as-h2">{{ L.panelTitle }}</h2>
    <div class="as-grid as-grid-panels">
      <button
        v-for="id in ids"
        :key="'p' + id"
        type="button"
        class="as-ptile"
        :class="{ on: panel === id }"
        @click="panel = id"
      >
        <span class="as-num">{{ id }}</span>
        <AuthPanel :variant="id" />
      </button>
    </div>

    <div class="as-bar">
      <span
        >{{ L.chosen }}: {{ L.bgShort }} {{ bg }} + {{ L.panelShort }}
        {{ panel }}</span
      >
      <router-link
        class="as-open"
        :to="{ name: 'auth', query: { bg, panel, mode: 'signup' } }"
      >
        {{ L.open }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import AuthBackdrop from "../AuthBackdrop.vue";
import AuthPanel from "../AuthPanel.vue";
import { useDraftState } from "../../composables/useDraftState";

const { lang } = useDraftState();

const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const bg = ref(1);
const panel = ref(1);

const dict = {
  en: {
    title: "Sign-in page: backgrounds and info block",
    sub: "Pick one background and one info block, then open the full page.",
    bgTitle: "Backgrounds (cards and art)",
    panelTitle: "Info block: why sign up",
    bgNames: [
      "Card rain",
      "Card rows",
      "Card carousel",
      "Portrait mosaic",
      "Flipping cards",
      "Card burst",
      "Depth parallax",
      "Art slideshow",
      "Card floor",
      "Portrait bubbles",
    ],
    chosen: "Selected",
    bgShort: "background",
    panelShort: "block",
    open: "Open full page",
  },
  ua: {
    title: "Сторінка входу: фони та інфоблок",
    sub: "Оберіть один фон і один інфоблок, потім відкрийте повну сторінку.",
    bgTitle: "Фони (карти та арти)",
    panelTitle: "Інфоблок: навіщо реєстрація",
    bgNames: [
      "Дощ із карт",
      "Рядки карт",
      "Карусель карт",
      "Мозаїка портретів",
      "Карти, що крутяться",
      "Роздача карт",
      "Паралакс глибини",
      "Слайд-шоу артів",
      "Підлога з карт",
      "Бульбашки героїв",
    ],
    chosen: "Обрано",
    bgShort: "фон",
    panelShort: "блок",
    open: "Відкрити повну сторінку",
  },
};
const L = computed(() => dict[lang.value] || dict.en);
</script>

<style scoped>
.as {
  max-width: 1200px;
  padding: 36px 16px 110px;
  margin: 0 auto;
}

.as-title {
  margin: 0 0 6px;
  font-size: 1.9rem;
  font-weight: 900;
  color: #f8fafc;
}

.as-sub {
  margin: 0 0 8px;
  color: #94a3b8;
}

.as-h2 {
  margin: 30px 0 14px;
  color: #f8fafc;
  font-size: 1.25rem;
  font-weight: 800;
}

.as-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.as-grid-panels {
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
}

.as-tile,
.as-ptile {
  position: relative;
  padding: 0;
  overflow: hidden;
  text-align: left;
  border: 2px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    border-color 0.2s ease,
    box-shadow 0.25s ease;
}

.as-tile {
  height: 300px;
  background: #070b18;
}

.as-ptile {
  min-height: 420px;
  background: #0b1224;
}

.as-tile:hover,
.as-ptile:hover {
  transform: translateY(-3px);
}

.as-tile.on,
.as-ptile.on {
  border-color: #facc15;
  box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.25);
}

.as-num {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #1a1204;
  font-weight: 900;
  background: #facc15;
  border-radius: 50%;
}

.as-mock {
  position: absolute;
  top: 30px;
  left: 50%;
  display: grid;
  gap: 9px;
  width: 170px;
  padding: 14px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  transform: translateX(-50%);
}

.as-mock i {
  display: block;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.as-mock-tabs {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 50%,
    #4f7cff 50%
  ) !important;
}

.as-mock-btn.is-white {
  background: #fff !important;
}

.as-mock-btn.is-gold {
  background: linear-gradient(135deg, #facc15, #f59e0b) !important;
}

.as-label {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  padding: 30px 16px 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
}

.as-label strong {
  color: #f8fafc;
  font-size: 1rem;
}

.as-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 16px;
  color: #e2e8f0;
  font-weight: 700;
  background: rgba(10, 15, 30, 0.92);
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px);
}

.as-open {
  padding: 10px 22px;
  color: #1a1204;
  font-weight: 900;
  text-decoration: none;
  background: linear-gradient(135deg, #facc15, #f59e0b);
  border-radius: 12px;
}
</style>
