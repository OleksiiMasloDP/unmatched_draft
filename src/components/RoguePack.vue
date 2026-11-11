<template>
  <div ref="root" class="rpack" :class="{ 'is-open': opened, 'is-dim': dim }">
    <button
      v-if="!opened"
      class="rpack-wrap"
      :style="{ '--a': theme.colors[0], '--b': theme.colors[1] }"
      :disabled="locked"
      @click="emit('open', pack.id)"
    >
      <span class="rpack-shine"></span>
      <span class="rpack-icon">{{ theme.icon }}</span>
      <span class="rpack-name">{{ theme.name[lang] }}</span>
      <span class="rpack-count">{{ t("roguePackCards") }}</span>
      <span class="rpack-open">{{ t("roguePackOpen") }}</span>
    </button>
    <div v-else class="rpack-fan">
      <div v-for="card in cards" :key="card.id" class="rpack-fan-card">
        <PackCard :card="card" />
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import gsap from "gsap";
import { useDraftState } from "../composables/useDraftState";
import { getCard } from "../gameDecks";
import { themes } from "../rogueData";
import PackCard from "./PackCard.vue";

const props = defineProps({
  pack: { type: Object, required: true },
  opened: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  dim: { type: Boolean, default: false },
});

const emit = defineEmits(["open"]);

const { t, lang } = useDraftState();
const root = ref(null);
let context = null;

const theme = computed(() => themes.find((item) => item.id === props.pack.id));
const cards = computed(() => props.pack.cards.map(getCard).filter(Boolean));

function idle() {
  context?.revert();
  if (!root.value || props.opened) return;
  context = gsap.context(() => {
    gsap.to(".rpack-wrap", {
      y: -8,
      rotation: 1.5,
      repeat: -1,
      yoyo: true,
      duration: 1.6 + Math.random() * 0.6,
      ease: "sine.inOut",
    });
    gsap.fromTo(
      ".rpack-shine",
      { xPercent: -140 },
      {
        xPercent: 140,
        repeat: -1,
        repeatDelay: 1.4,
        duration: 1.3,
        ease: "power1.inOut",
      },
    );
  }, root.value);
}

async function burst() {
  context?.revert();
  await nextTick();
  if (!root.value) return;
  context = gsap.context(() => {
    const items = gsap.utils.toArray(".rpack-fan-card");
    const spread = items.length - 1 || 1;
    items.forEach((el, i) => {
      const k = i / spread - 0.5;
      gsap.fromTo(
        el,
        { scale: 0.2, opacity: 0, y: 80, rotation: 0 },
        {
          scale: 1,
          opacity: 1,
          y: Math.abs(k) * 22,
          rotation: k * 8,
          duration: 0.7,
          delay: i * 0.12,
          ease: "back.out(1.8)",
        },
      );
    });
    gsap.fromTo(
      root.value,
      { filter: "brightness(2.2)" },
      { filter: "brightness(1)", duration: 0.8 },
    );
  }, root.value);
}

watch(
  () => props.opened,
  (value) => (value ? burst() : idle()),
);

onMounted(async () => {
  await nextTick();
  if (props.opened) burst();
  else idle();
});

onBeforeUnmount(() => context?.revert());
</script>

<style scoped>
.rpack {
  display: flex;
  justify-content: center;
  transition: opacity 0.4s;
}

.rpack.is-dim {
  opacity: 0.35;
}

.rpack-wrap {
  position: relative;
  overflow: hidden;
  width: 190px;
  height: 270px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border: 3px solid rgba(255, 255, 255, 0.35);
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(155deg, var(--a), var(--b));
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.45),
    0 0 36px var(--a);
  clip-path: polygon(
    0 6px,
    6% 0,
    12% 6px,
    18% 0,
    24% 6px,
    30% 0,
    36% 6px,
    42% 0,
    48% 6px,
    54% 0,
    60% 6px,
    66% 0,
    72% 6px,
    78% 0,
    84% 6px,
    90% 0,
    96% 6px,
    100% 0,
    100% calc(100% - 6px),
    96% 100%,
    90% calc(100% - 6px),
    84% 100%,
    78% calc(100% - 6px),
    72% 100%,
    66% calc(100% - 6px),
    60% 100%,
    54% calc(100% - 6px),
    48% 100%,
    42% calc(100% - 6px),
    36% 100%,
    30% calc(100% - 6px),
    24% 100%,
    18% calc(100% - 6px),
    12% 100%,
    6% calc(100% - 6px),
    0 100%
  );
  cursor: pointer;
}

.rpack-wrap:disabled {
  cursor: default;
}

.rpack-wrap:not(:disabled):hover {
  filter: brightness(1.12);
}

.rpack-shine {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 35%,
    rgba(255, 255, 255, 0.5) 50%,
    transparent 65%
  );
  pointer-events: none;
}

.rpack-icon {
  font-size: 64px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
}

.rpack-name {
  font-size: 1.15rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
}

.rpack-count {
  font-size: 0.8rem;
  font-weight: 700;
  opacity: 0.9;
}

.rpack-open {
  margin-top: 8px;
  padding: 3px 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.rpack-fan {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
}

.rpack-fan-card {
  width: 190px;
}
</style>
