<template>
  <div class="as">
    <h1 class="as-title">{{ L.title }}</h1>
    <p class="as-sub">{{ L.sub }}</p>

    <div class="as-grid">
      <router-link
        v-for="item in items"
        :key="item.id"
        class="as-tile"
        :to="{ name: 'auth', query: { bg: item.id, mode: 'signup' } }"
      >
        <AuthBackdrop :variant="item.id" />
        <div class="as-mock">
          <i class="as-mock-tabs"></i>
          <i class="as-mock-btn is-white"></i>
          <i class="as-mock-field"></i>
          <i class="as-mock-field"></i>
          <i class="as-mock-btn is-gold"></i>
        </div>
        <div class="as-label">
          <strong>{{ item.id }}. {{ L.names[item.id - 1] }}</strong>
          <span>{{ L.notes[item.id - 1] }}</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import AuthBackdrop from "../AuthBackdrop.vue";
import { useDraftState } from "../../composables/useDraftState";

const { lang } = useDraftState();

const items = [1, 2, 3, 4, 5].map((id) => ({ id }));

const dict = {
  en: {
    title: "Sign-in page backgrounds",
    sub: "Five moods. Tap one to see it on the full page.",
    names: ["Aurora", "Constellation", "Card rain", "Retro arena", "Embers"],
    notes: [
      "Slow glowing color clouds",
      "Stars that link up and follow your cursor",
      "Hero cards drifting upward in depth",
      "Neon grid racing toward a sunset",
      "Sparks rising from a forge",
    ],
  },
  ua: {
    title: "Фони сторінки входу",
    sub: "П'ять настроїв. Натисніть на один, щоб побачити його на повній сторінці.",
    names: ["Аврора", "Сузір'я", "Дощ із карт", "Ретро-арена", "Іскри"],
    notes: [
      "Повільні кольорові хмари, що світяться",
      "Зірки, що з'єднуються й тягнуться до курсору",
      "Карти героїв пливуть угору на різній глибині",
      "Неонова сітка мчить до заходу сонця",
      "Іскри здіймаються з кузні",
    ],
  },
};
const L = computed(() => dict[lang.value] || dict.en);
</script>

<style scoped>
.as {
  max-width: 1100px;
  padding: 36px 16px 64px;
  margin: 0 auto;
}

.as-title {
  margin: 0 0 6px;
  font-size: 1.9rem;
  font-weight: 900;
  color: #f8fafc;
}

.as-sub {
  margin: 0 0 24px;
  color: #94a3b8;
}

.as-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.as-tile {
  position: relative;
  display: block;
  height: 340px;
  overflow: hidden;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.as-tile:hover {
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  transform: translateY(-4px);
}

.as-mock {
  position: absolute;
  top: 24px;
  left: 50%;
  display: grid;
  gap: 9px;
  width: 190px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  transform: translateX(-50%);
}

.as-mock i {
  display: block;
  height: 22px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.as-mock-tabs {
  height: 20px !important;
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
  display: grid;
  gap: 2px;
  padding: 36px 18px 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.78));
}

.as-label strong {
  color: #f8fafc;
  font-size: 1.05rem;
}

.as-label span {
  color: #cbd5e1;
  font-size: 0.85rem;
}
</style>
