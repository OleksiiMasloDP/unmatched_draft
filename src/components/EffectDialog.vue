<template>
  <div class="fx-wrap" :class="{ 'is-blocking': blocking }">
    <div class="fx-dialog" :class="'side-' + entry.player">
      <button
        type="button"
        class="fx-close"
        :title="t('combatHide')"
        :aria-label="t('combatHide')"
        @click="emit('close')"
      >
        {{ blocking ? "👁" : "✕" }}
      </button>

      <div class="fx-head">{{ head }}</div>

      <div class="fx-body">
        <PackCard v-if="card" class="fx-card" :card="card" />
        <div class="fx-info">
          <div v-if="card" class="fx-name">{{ card.name }}</div>

          <ul v-if="lines.length || picks.length" class="fx-lines">
            <li v-for="(pick, index) in picks" :key="'p' + index">
              <span class="fx-label">{{ t("schemeChoice") }}:</span>
              {{ pick }}
            </li>
            <li v-for="(line, index) in lines" :key="'l' + index">
              <img
                v-if="line.card && line.card.image"
                class="fx-thumb"
                :src="line.card.image"
                :alt="line.card.name"
              />
              <span>{{ line.text }}</span>
            </li>
          </ul>
          <p v-else-if="!prompt" class="fx-empty">{{ t("effectNothing") }}</p>

          <div v-if="prompt" class="fx-prompt">
            <div class="fx-prompt-title">{{ prompt.title }}</div>

            <template v-if="prompt.kind === 'cards'">
              <div v-if="cards.length" class="fx-cards">
                <PackCard
                  v-for="option in cards"
                  :key="option.id"
                  :card="option"
                  :selected="selection.includes(option.id)"
                  :clickable="mine"
                  @select="emit('toggle', $event)"
                />
              </div>
              <div class="fx-actions">
                <button
                  type="button"
                  class="fx-btn is-primary"
                  :disabled="!mine || selection.length < prompt.min"
                  @click="emit('confirm')"
                >
                  {{ selection.length ? t("gameConfirm") : t(prompt.skip) }}
                  <template v-if="prompt.max > 1">
                    ({{ selection.length }}/{{ prompt.max }})
                  </template>
                </button>
              </div>
            </template>

            <div v-else-if="prompt.kind === 'confirm'" class="fx-actions">
              <button
                type="button"
                class="fx-btn is-primary"
                :disabled="!mine"
                @click="emit('answer', true)"
              >
                {{ t("gameYes") }}
              </button>
              <button
                type="button"
                class="fx-btn"
                :disabled="!mine"
                @click="emit('answer', false)"
              >
                {{ t("gameNo") }}
              </button>
            </div>

            <div v-else-if="prompt.kind === 'choice'" class="fx-actions">
              <button
                v-for="choice in prompt.choices"
                :key="choice.value"
                type="button"
                class="fx-btn is-primary"
                :disabled="!mine"
                @click="emit('answer', choice.value)"
              >
                {{ t(choice.label) }}
              </button>
            </div>

            <p v-if="!mine" class="fx-wait">{{ waitText }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { getCard } from "../gameDecks";
import PackCard from "./PackCard.vue";

const props = defineProps({
  entry: { type: Object, required: true },
  lines: { type: Array, default: () => [] },
  picks: { type: Array, default: () => [] },
  prompt: { type: Object, default: null },
  cards: { type: Array, default: () => [] },
  selection: { type: Array, default: () => [] },
  mine: { type: Boolean, default: false },
  blocking: { type: Boolean, default: false },
  playerLabel: { type: String, default: "" },
});

const emit = defineEmits(["answer", "toggle", "confirm", "close"]);
const { t } = useDraftState();

const card = computed(() => getCard(props.entry.cardId));

const head = computed(() => {
  const keys = {
    scheme: "effectHeadScheme",
    immediate: "effectHeadImmediate",
    after: "effectHeadAfter",
  };
  return t(keys[props.entry.kind] || "effectHeadAfter").replace(
    "{player}",
    props.playerLabel,
  );
});

const waitText = computed(() =>
  t("effectWaiting").replace("{player}", props.playerLabel),
);
</script>

<style scoped>
.fx-wrap {
  position: fixed;
  top: 84px;
  right: 16px;
  z-index: 1400;
  width: min(430px, calc(100vw - 24px));
  animation: fx-in 0.3s ease;
}

.fx-wrap.is-blocking {
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  padding: 12px;
  background: rgba(var(--bg-dark-rgb), 0.78);
  backdrop-filter: blur(3px);
}

.fx-dialog {
  position: relative;
  width: 100%;
  max-width: 620px;
  max-height: calc(100dvh - 24px);
  padding: 14px 16px 16px;
  overflow-y: auto;
  border: 2px solid var(--border-strong);
  border-radius: 16px;
  background: linear-gradient(180deg, #1e293b, #0f172a);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

.fx-wrap:not(.is-blocking) .fx-dialog {
  max-width: none;
}

.fx-dialog.side-p1 {
  border-color: var(--color-player);
}

.fx-dialog.side-p2 {
  border-color: var(--color-opponent);
}

.fx-close {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  background: rgba(var(--bg-dark-rgb), 0.8);
  color: var(--text-light);
  font-size: 14px;
  cursor: pointer;
}

.fx-head {
  margin: 0 36px 10px 0;
  color: var(--color-warning);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}

.fx-body {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.fx-card {
  width: 190px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55);
}

.fx-name {
  margin-bottom: 8px;
  color: var(--text-white);
  font-size: 17px;
  font-weight: 800;
}

.fx-lines {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.fx-lines li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-light);
  font-size: 13px;
  font-weight: 600;
}

.fx-label {
  color: var(--text-dim);
}

.fx-thumb {
  flex: 0 0 auto;
  width: 34px;
  border-radius: 4px;
}

.fx-empty {
  margin: 0;
  color: var(--text-dim);
  font-size: 13px;
}

.fx-prompt {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(var(--color-info-rgb), 0.5);
  border-radius: 12px;
  background: rgba(var(--color-info-rgb), 0.08);
}

.fx-prompt-title {
  margin-bottom: 8px;
  color: var(--text-white);
  font-size: 14px;
  font-weight: 800;
}

.fx-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
  max-height: 34dvh;
  margin-bottom: 8px;
  padding: 4px;
  overflow-y: auto;
}

.fx-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fx-btn {
  flex: 0 0 auto;
  padding: 8px 18px;
  border: 2px solid var(--border-strong);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-white);
  font-size: 12.5px;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
}

.fx-btn.is-primary {
  border-color: var(--color-proceed);
  background: linear-gradient(
    135deg,
    var(--color-proceed),
    var(--color-proceed-dark)
  );
}

.fx-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fx-wait {
  margin: 8px 0 0;
  color: var(--color-warning);
  font-size: 12.5px;
  font-weight: 700;
}

@keyframes fx-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 575px) {
  .fx-body {
    grid-template-columns: 120px minmax(0, 1fr);
    gap: 10px;
  }

  .fx-card {
    width: 120px;
  }

  .fx-wrap:not(.is-blocking) {
    top: 70px;
    right: 8px;
    left: 8px;
    width: auto;
  }
}
</style>
