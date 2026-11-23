<template>
  <div v-if="cloudEnabled && authReady" ref="root" class="acc">
    <button
      v-if="!user"
      type="button"
      class="acc-signin"
      @click="openAuth('signin')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4.500 21a7.500 7.500 0 0 1 15 0" />
        <circle class="acc-key" cx="19" cy="5" r="2.200" />
      </svg>
      <span class="acc-signin-text">{{ L.signin }}</span>
    </button>

    <template v-else>
      <button
        type="button"
        class="acc-avatar"
        :class="'is-' + syncStatus"
        :aria-label="L.profile"
        :title="user.email"
        @click="goProfile"
      >
        {{ initial }}
        <span class="acc-dot"></span>
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { cloudEnabled } from "../cloud/client";
import { authReady, openAuth, user } from "../cloud/useAuth";
import { syncStatus } from "../cloud/sync";

const router = useRouter();
const goProfile = () => {
  router.push({ name: "profile" });
};

const props = defineProps({
  lang: { type: String, default: "ua" },
});

const dict = {
  en: {
    profile: "My profile",
    signin: "Sign in",
    account: "Account",
    syncing: "Syncing…",
    synced: "Synced",
    offline: "Offline: will retry",
    error: "Sync error: will retry",
    idle: "Waiting",
  },
  ua: {
    profile: "Мій профіль",
    signin: "Увійти",
    account: "Акаунт",
    syncing: "Синхронізація…",
    synced: "Синхронізовано",
    offline: "Немає зв'язку, повторю",
    error: "Помилка синхронізації, повторю",
    idle: "Очікування",
  },
};
const L = computed(() => dict[props.lang] || dict.en);

const initial = computed(() =>
  user.value && user.value.email ? user.value.email[0].toUpperCase() : "?",
);
</script>

<style scoped>
.acc {
  position: relative;
  margin-right: 10px;
}

.acc-signin {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #4f7cff, #3b60d1);
  border: 0;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(79, 124, 255, 0.3);
}

.acc-signin svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.acc-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #4f7cff, #ff4f6d);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
}

.acc-dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 10px;
  height: 10px;
  background: #94a3b8;
  border: 2px solid #0f172a;
  border-radius: 50%;
}

.acc-avatar.is-synced .acc-dot {
  background: #22c55e;
}
.acc-avatar.is-syncing .acc-dot {
  background: #facc15;
  animation: acc-pulse 1s ease-in-out infinite;
}
.acc-avatar.is-offline .acc-dot,
.acc-avatar.is-error .acc-dot {
  background: #ef4444;
}

@keyframes acc-pulse {
  50% {
    opacity: 0.35;
  }
}

@media (max-width: 575px) {
  .acc-signin-text {
    display: none;
  }
  .acc-signin {
    padding: 8px;
  }
}
</style>
