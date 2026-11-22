<template>
  <section class="sb">
    <div class="sb-in">
      <div class="sb-text">
        <h2>{{ T.title }}</h2>
        <p>{{ T.text }}</p>
      </div>
      <div class="sb-actions">
        <a
          v-if="SUPPORT.monobank"
          class="sb-btn sb-btn-main"
          :href="SUPPORT.monobank"
          target="_blank"
          rel="noopener"
          >🐱 {{ T.jar }}</a
        >
        <button type="button" class="sb-btn" @click="openSupport()">
          ❤ {{ T.more }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useDraftState } from "../composables/useDraftState";
import { useSupport } from "../composables/useSupport";
import { SUPPORT } from "../supportConfig";

const { lang } = useDraftState();
const { openSupport } = useSupport();

const T = computed(() =>
  lang.value === "ua"
    ? {
        title: "Подобається проєкт?",
        text: "Він безкоштовний, без реклами й робиться у вільний час. Будь-яка сума допоможе оплатити хостинг і рухатись далі: нові герої, режими та бот.",
        jar: "Закинути на банку",
        more: "Інші способи",
      }
    : {
        title: "Enjoying the project?",
        text: "It is free, ad-free and built in spare time. Any amount helps cover hosting and keeps new heroes, modes and the bot coming.",
        jar: "Open the jar",
        more: "Other ways",
      },
);
</script>

<style scoped>
.sb {
  padding: 40px 16px;
}

.sb-in {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 28px;
  background: linear-gradient(
    135deg,
    rgba(250, 204, 21, 0.16),
    rgba(239, 68, 68, 0.12)
  );
  border: 1px solid rgba(250, 204, 21, 0.45);
  border-radius: 20px;
}

.sb-text {
  flex: 1 1 340px;
}

.sb-text h2 {
  margin: 0 0 6px;
  font-size: 1.4rem;
  font-weight: 800;
  color: #f8fafc;
}

.sb-text p {
  margin: 0;
  color: #cbd5e1;
  font-size: 0.95rem;
}

.sb-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.sb-btn {
  padding: 12px 20px;
  color: #facc15;
  font-size: 0.95rem;
  font-weight: 800;
  text-decoration: none;
  background: transparent;
  border: 1px solid rgba(250, 204, 21, 0.55);
  border-radius: 12px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.sb-btn:hover {
  background: rgba(250, 204, 21, 0.12);
  transform: translateY(-1px);
}

.sb-btn-main {
  color: #1a1204;
  background: #facc15;
  border-color: #facc15;
}

.sb-btn-main:hover {
  background: #fde047;
}
</style>
