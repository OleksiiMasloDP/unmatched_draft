<template>
  <div
    class="pack-hero"
    :class="{ 'is-clickable': clickable, 'is-taken': Boolean(owner) }"
    @click="clickable && emit('select', hero.id)"
  >
    <div v-if="hero.image && !imageFailed" class="pack-hero-image">
      <img :src="hero.image" :alt="hero.name" @error="imageFailed = true" />
    </div>

    <div class="pack-hero-body">
      <div class="pack-hero-head">
        <div class="pack-hero-name">{{ hero.name }}</div>
        <span v-if="owner" class="pack-hero-owner" :class="'is-' + owner">
          {{ t(owner === "p1" ? "packPlayer1" : "packPlayer2") }}
        </span>
      </div>

      <div class="pack-hero-stats">
        <span>{{ t("packHp") }} {{ hero.hp }}</span>
        <span>{{ t("packMove") }} {{ hero.move }}</span>
        <span>{{ t("packAttack" + capitalized(hero.attack)) }}</span>
      </div>

      <div class="pack-hero-passive">
        <div class="pack-hero-passive-name">
          {{ t("packPassive") }}: {{ hero.passive.name }}
        </div>
        <p>{{ hero.passive.text[lang] || hero.passive.text.en }}</p>
      </div>

      <div class="pack-hero-sidekick">
        {{ t("packSidekick") }}:
        {{ hero.sidekick ? hero.sidekick.name : t("packNoSidekick") }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useDraftState } from "../composables/useDraftState";

defineProps({
  hero: {
    type: Object,
    required: true,
  },
  owner: {
    type: String,
    default: "",
  },
  clickable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select"]);

const { t, lang } = useDraftState();
const imageFailed = ref(false);

const capitalized = (value) => value.charAt(0).toUpperCase() + value.slice(1);
</script>

<style scoped>
.pack-hero {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: rgba(var(--bg-slate-rgb), 0.8);
  border: 1px solid var(--border-medium);
  border-radius: 14px;
  text-align: left;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.pack-hero.is-clickable {
  cursor: pointer;
}

.pack-hero.is-clickable:hover {
  transform: translateY(-3px);
  border-color: rgba(var(--color-player-rgb), 0.7);
  box-shadow: 0 0 18px rgba(var(--color-player-rgb), 0.35);
}

.pack-hero.is-taken {
  opacity: 0.6;
}

.pack-hero-image img {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.pack-hero-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
}

.pack-hero-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pack-hero-name {
  color: var(--text-white);
  font-size: 17px;
  font-weight: 800;
}

.pack-hero-owner {
  padding: 2px 8px;
  border-radius: 999px;
  color: var(--text-white);
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
}

.pack-hero-owner.is-p1 {
  background: var(--color-player);
}

.pack-hero-owner.is-p2 {
  background: var(--color-opponent);
}

.pack-hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  color: var(--text-light);
  font-size: 12px;
  font-weight: 700;
}

.pack-hero-passive-name {
  color: var(--color-info);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.pack-hero-passive p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.45;
}

.pack-hero-sidekick {
  color: var(--text-dim);
  font-size: 12px;
}
</style>
