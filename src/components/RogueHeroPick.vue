<template>
  <div class="rpick">
    <div class="rpick-head">
      <h2 class="rpick-title">{{ t("rogueChooseHero") }}</h2>
      <p class="rpick-hint">{{ t("rogueChooseHeroHint") }}</p>
    </div>
    <div class="rpick-grid">
      <article
        v-for="(hero, index) in heroes"
        :key="hero.id"
        class="rpick-card"
        :style="{ '--delay': index * 120 + 'ms' }"
        tabindex="0"
        @click="emit('select', hero.id)"
        @keydown.enter="emit('select', hero.id)"
      >
        <div class="rpick-portrait">
          <img
            v-if="hero.image && !failed[hero.id]"
            :src="assetUrl(hero.image)"
            :alt="hero.name"
            @error="failed[hero.id] = true"
          />
          <div v-else class="rpick-fallback">{{ hero.name.charAt(0) }}</div>
          <h3 class="rpick-name">{{ hero.name }}</h3>
        </div>
        <div class="rpick-body">
          <div class="rpick-stats">
            <span class="rpick-chip is-hp">❤ {{ hero.hp }}</span>
            <span class="rpick-chip">👣 {{ hero.move }}</span>
            <span class="rpick-chip">
              {{ hero.attack === "melee" ? "⚔️" : "🏹" }}
              {{ t("packAttack" + capitalized(hero.attack)) }}
            </span>
            <span v-if="hero.sidekick" class="rpick-chip">
              🛡 {{ hero.sidekick.name }}
            </span>
          </div>
          <div class="rpick-passive">
            <div class="rpick-passive-name">{{ hero.passive.name }}</div>
            <p class="rpick-passive-text">
              {{ hero.passive.text[lang] || hero.passive.text.en }}
            </p>
          </div>
          <span class="rpick-btn">{{ t("rogueTakeHero") }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { useDraftState } from "../composables/useDraftState";

defineProps({
  heroes: { type: Array, required: true },
});

const emit = defineEmits(["select"]);

const { t, lang } = useDraftState();
const failed = reactive({});

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
const capitalized = (value) => value.charAt(0).toUpperCase() + value.slice(1);
</script>

<style scoped>
.rpick {
  max-width: 1040px;
  margin: 0 auto;
  padding: 8px 0 24px;
}

.rpick-head {
  text-align: center;
  margin-bottom: 24px;
}

.rpick-title {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  background: linear-gradient(90deg, var(--color-info), var(--color-player));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.rpick-hint {
  margin: 6px 0 0;
  color: var(--text-dim);
}

.rpick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.rpick-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid var(--border-medium);
  border-radius: 18px;
  background: var(--bg-card);
  cursor: pointer;
  outline: none;
  animation: rpick-in 0.5s both;
  animation-delay: var(--delay);
  transition:
    transform 0.25s,
    border-color 0.25s,
    box-shadow 0.25s;
}

.rpick-card:hover,
.rpick-card:focus-visible {
  transform: translateY(-8px);
  border-color: var(--color-info);
  box-shadow:
    0 14px 36px rgba(0, 0, 0, 0.55),
    0 0 26px rgba(var(--color-info-rgb), 0.25);
}

.rpick-portrait {
  position: relative;
  aspect-ratio: 4 / 4.4;
  overflow: hidden;
  background: #11151c;
}

.rpick-portrait::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 50%, rgba(11, 15, 25, 0.95));
  pointer-events: none;
}

.rpick-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  transition: transform 0.5s;
}

.rpick-card:hover .rpick-portrait img {
  transform: scale(1.06);
}

.rpick-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 80px;
  font-weight: 900;
  opacity: 0.35;
}

.rpick-name {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 12px;
  z-index: 1;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 900;
  line-height: 1.1;
  text-shadow: 0 2px 8px #000;
}

.rpick-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 12px;
  padding: 14px 16px 16px;
}

.rpick-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rpick-chip {
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.rpick-chip.is-hp {
  background: rgba(var(--color-opponent-rgb), 0.2);
  color: #ff9aa9;
}

.rpick-passive {
  flex: 1;
  padding: 10px 12px;
  border-left: 3px solid var(--color-info);
  border-radius: 0 10px 10px 0;
  background: rgba(var(--color-info-rgb), 0.07);
}

.rpick-passive-name {
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--color-info);
}

.rpick-passive-text {
  margin: 4px 0 0;
  font-size: 0.84rem;
  line-height: 1.4;
  color: var(--text-muted);
}

.rpick-btn {
  padding: 10px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    var(--color-player),
    var(--color-player-dark)
  );
  font-weight: 800;
  letter-spacing: 1px;
  text-align: center;
  text-transform: uppercase;
  transition: filter 0.2s;
}

.rpick-card:hover .rpick-btn {
  filter: brightness(1.2);
}

@keyframes rpick-in {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 560px) {
  .rpick-title {
    font-size: 1.4rem;
  }

  .rpick-portrait {
    aspect-ratio: 16 / 10;
  }
}
</style>
