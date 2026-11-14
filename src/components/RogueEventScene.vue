<template>
  <div class="rev" :style="{ '--tint': tint }">
    <div class="rev-backdrop"></div>
    <img
      v-if="art"
      class="rev-art"
      :src="art"
      alt=""
      @error="$event.target.style.display = 'none'"
    />
    <span v-else-if="icon" class="rev-glyph">
      <RogueIcon :name="icon" metal="gold" size="100%" />
    </span>
    <div class="rev-body">
      <header class="rev-head">
        <span class="rev-badge">
          <RogueIcon :name="icon || 'uncertainty'" metal="gold" size="26px" />
        </span>
        <h2 class="rev-title">{{ title }}</h2>
      </header>
      <p class="rev-text">{{ text }}</p>
      <ul v-if="choices.length" class="rev-choices">
        <li v-for="(choice, i) in choices" :key="i">
          <button
            class="rev-choice"
            :class="{ 'is-blocked': choice.blocked }"
            :disabled="choice.blocked"
            @click="emit('choose', i)"
          >
            <span class="rev-choice-icon">
              <RogueIcon :name="choice.icon" metal="gold" size="22px" />
            </span>
            <span class="rev-choice-label">{{ choice.label }}</span>
            <span v-if="choice.tip.length" class="rev-tip">
              <span v-for="line in choice.tip" :key="line">{{ line }}</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import RogueIcon from "./RogueIcon.vue";

defineProps({
  title: { type: String, required: true },
  text: { type: String, required: true },
  icon: { type: String, default: "" },
  art: { type: String, default: "" },
  tint: { type: String, default: "#c98a2b" },
  choices: { type: Array, default: () => [] },
});

const emit = defineEmits(["choose"]);
</script>

<style scoped>
.rev {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  min-height: 380px;
  margin: 8px auto 18px;
  max-width: 920px;
  border: 1px solid rgba(255, 236, 200, 0.18);
  border-radius: 18px;
  background: #0b0d14;
  box-shadow:
    0 14px 40px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(0, 0, 0, 0.6);
}

.rev-backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    radial-gradient(
      ellipse at 85% 45%,
      color-mix(in srgb, var(--tint) 55%, transparent),
      transparent 60%
    ),
    radial-gradient(
      ellipse at 15% 100%,
      rgba(40, 70, 120, 0.45),
      transparent 55%
    ),
    linear-gradient(160deg, #0f1522, #07080d 70%);
}

.rev-art {
  position: absolute;
  top: 0;
  right: 0;
  z-index: -1;
  width: 62%;
  height: 100%;
  object-fit: cover;
  object-position: top;
  -webkit-mask-image: linear-gradient(to left, #000 45%, transparent);
  mask-image: linear-gradient(to left, #000 45%, transparent);
}

.rev-glyph {
  position: absolute;
  top: 50%;
  right: 4%;
  z-index: -1;
  display: block;
  width: 300px;
  height: 300px;
  transform: translateY(-50%);
  filter: drop-shadow(0 0 40px var(--tint));
}

.rev-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 620px;
  padding: 28px 28px 30px;
}

.rev-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rev-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 46px;
  height: 52px;
  border: 2px solid #8a6c43;
  border-radius: 8px 8px 22px 22px;
  background: linear-gradient(160deg, #2c2217, #0e0a06);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
}

.rev-title {
  margin: 0;
  color: #fff3d6;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

.rev-text {
  margin: 0;
  color: #e9e0cc;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1.05rem;
  line-height: 1.65;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.9);
}

.rev-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.rev-choice {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 16px 9px 10px;
  border: 0;
  border-left: 3px solid var(--tint);
  border-radius: 4px;
  background: linear-gradient(
    90deg,
    rgba(88, 60, 26, 0.88),
    rgba(38, 26, 14, 0.7)
  );
  color: #f6e8c9;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.15s,
    background 0.15s,
    color 0.15s;
}

.rev-choice:not(:disabled):hover,
.rev-choice:not(:disabled):focus-visible {
  transform: translateX(6px);
  background: linear-gradient(90deg, #d08b2e, #7a4a1b);
  color: #fff;
}

.rev-choice.is-blocked {
  background: rgba(40, 40, 46, 0.7);
  border-left-color: #55555f;
  color: #8a8a94;
  cursor: not-allowed;
}

.rev-choice-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 2px solid transparent;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 40%, #2b241b 0 55%, #0e0b08 100%) padding-box,
    linear-gradient(150deg, #fff3b0, #d9a520 45%, #7a5208 75%, #f7dc7a)
      border-box;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.9);
}

.rev-choice.is-blocked .rev-choice-icon {
  filter: grayscale(1);
}

.rev-tip {
  position: absolute;
  top: calc(100% + 6px);
  left: 52px;
  z-index: 10;
  display: none;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border: 1px solid rgba(180, 150, 255, 0.5);
  border-radius: 4px;
  background: rgba(24, 18, 40, 0.97);
  color: #f1ecff;
  font-family: system-ui, sans-serif;
  font-size: 0.85rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.7);
  pointer-events: none;
}

.rev-choice:hover .rev-tip,
.rev-choice:focus-visible .rev-tip {
  display: flex;
}

@media (max-width: 640px) {
  .rev {
    min-height: 0;
  }

  .rev-body {
    padding: 18px 14px 20px;
  }

  .rev-title {
    font-size: 1.35rem;
  }

  .rev-text {
    font-size: 0.98rem;
  }

  .rev-glyph {
    top: 14px;
    right: 8px;
    width: 110px;
    height: 110px;
    transform: none;
    opacity: 0.55;
  }

  .rev-art {
    width: 100%;
    opacity: 0.4;
  }
}
</style>
