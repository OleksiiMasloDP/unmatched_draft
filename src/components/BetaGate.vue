<template>
  <slot v-if="unlocked" />
  <div v-else class="beta-gate">
    <form class="beta-card" @submit.prevent="submit">
      <h2>BETA</h2>
      <p class="beta-text">
        Цей розділ доступний лише тестерам. Введіть пароль.<br />
        This section is for testers only. Enter the password.
      </p>
      <input
        v-model="password"
        class="beta-input"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
      />
      <p v-if="error" class="beta-error">{{ error }}</p>
      <button class="beta-btn" type="submit" :disabled="busy || !password">
        Увійти / Enter
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { unlocked, tryUnlock } from "../betaAccess.js";

const password = ref("");
const error = ref("");
const busy = ref(false);

async function submit() {
  error.value = "";
  busy.value = true;
  try {
    if (!(await tryUnlock(password.value))) {
      error.value = "Невірний пароль / Wrong password";
    }
  } catch {
    error.value = "Потрібне https-з'єднання / https is required";
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.beta-gate {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.beta-card {
  width: 100%;
  max-width: 360px;
  padding: 28px 24px;
  text-align: center;
  color: var(--text-main, #f8fafc);
  background: var(--bg-dark, #0f172a);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 14px;
}
.beta-card h2 {
  margin: 0 0 10px;
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--color-warning, #facc15);
}
.beta-text {
  margin: 0 0 14px;
  font-size: 0.9rem;
  color: var(--text-muted, #cbd5e1);
}
.beta-input {
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 12px;
  color: var(--text-light, #f1f5f9);
  background: var(--bg-slate, #1e293b);
  border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.15));
  border-radius: 8px;
}
.beta-error {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: var(--color-danger, #ef4444);
}
.beta-btn {
  width: 100%;
  padding: 10px;
  font-weight: 700;
  color: #fff;
  background: var(--color-player, #4f7cff);
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}
.beta-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
