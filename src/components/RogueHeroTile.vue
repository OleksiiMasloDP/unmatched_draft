<template>
  <div
    class="rhero"
    :class="['is-' + side, { 'is-clickable': clickable, 'is-open': open }]"
    @click="clickable && emit('select', hero.id)"
  >
    <div class="rhero-portrait">
      <img
        v-if="hero.image && !failed"
        :src="assetUrl(hero.image)"
        :alt="hero.name"
        @error="failed = true"
      />
      <div v-else class="rhero-fallback">{{ hero.name.charAt(0) }}</div>
      <span v-if="tag" class="rhero-tag">{{ tag }}</span>
      <div class="rhero-name">{{ hero.name }}</div>
    </div>
    <div class="rhero-stats">
      <span class="rhero-chip is-hp">❤ {{ hpValue ?? hero.hp }}</span>
      <span class="rhero-chip">👣 {{ hero.move }}</span>
      <span class="rhero-chip">
        {{ hero.attack === "melee" ? "⚔️" : "🏹" }}
        {{ t("packAttack" + capitalized(hero.attack)) }}
      </span>
      <span v-if="hero.sidekick" class="rhero-chip">
        🛡 {{ hero.sidekick.name }}
      </span>
    </div>
    <button type="button" class="rhero-toggle" @click.stop="open = !open">
      <span>{{ open ? "▾" : "▸" }} {{ hero.passive.name }}</span>
    </button>
    <p v-if="open" class="rhero-text">
      {{ hero.passive.text[lang] || hero.passive.text.en }}
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useDraftState } from "../composables/useDraftState";

defineProps({
  hero: { type: Object, required: true },
  hpValue: { type: Number, default: null },
  side: { type: String, default: "me" },
  tag: { type: String, default: "" },
  clickable: { type: Boolean, default: false },
});

const emit = defineEmits(["select"]);

const { t, lang } = useDraftState();
const open = ref(false);
const failed = ref(false);

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;
const capitalized = (value) => value.charAt(0).toUpperCase() + value.slice(1);
</script>

<style scoped>
.rhero {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid var(--border-medium);
  border-radius: 14px;
  background: rgba(var(--bg-slate-rgb), 0.85);
  transition:
    transform 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}

.rhero.is-me {
  border-color: rgba(var(--color-info-rgb), 0.7);
}

.rhero.is-foe {
  border-color: rgba(255, 77, 109, 0.7);
}

.rhero.is-clickable {
  cursor: pointer;
}

.rhero.is-clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
  border-color: var(--color-info);
}

.rhero-portrait {
  position: relative;
  height: 150px;
  background: #11151c;
}

.rhero-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}

.rhero-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 56px;
  font-weight: 900;
  opacity: 0.4;
}

.rhero-portrait::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 45%, rgba(0, 0, 0, 0.85));
  pointer-events: none;
}

.rhero-name {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 8px;
  z-index: 1;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.1;
  text-shadow: 0 2px 6px #000;
}

.rhero-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
  padding: 2px 9px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.65);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.is-foe .rhero-tag {
  color: #ff7b8f;
}

.rhero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 8px 10px 4px;
}

.rhero-chip {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.07);
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.rhero-chip.is-hp {
  background: rgba(255, 77, 109, 0.2);
  color: #ff9aa9;
}

.rhero-toggle {
  margin: 4px 10px 8px;
  padding: 5px 8px;
  border: 1px dashed var(--border-medium);
  border-radius: 8px;
  background: none;
  color: var(--text-light);
  font-size: 0.74rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.rhero-text {
  margin: 0 10px 10px;
  font-size: 0.76rem;
  line-height: 1.35;
  color: var(--text-dim);
}

@media (max-width: 560px) {
  .rhero-portrait {
    height: 104px;
  }

  .rhero-name {
    font-size: 0.9rem;
  }
}
</style>
