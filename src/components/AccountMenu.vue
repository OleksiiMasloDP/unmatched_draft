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
        :aria-label="L.account"
        :aria-expanded="open"
        @click="open = !open"
      >
        {{ initial }}
        <span class="acc-dot"></span>
      </button>

      <transition name="acc-pop">
        <div v-if="open" class="acc-panel">
          <p class="acc-email" :title="user.email">{{ user.email }}</p>
          <p class="acc-status" :class="'is-' + syncStatus">
            <span class="acc-status-dot"></span>{{ statusText }}
          </p>
          <button type="button" class="acc-item" @click="doSync">
            ↻ {{ L.syncNow }}
          </button>
          <button type="button" class="acc-item is-danger" @click="doSignOut">
            ⎋ {{ L.signout }}
          </button>
        </div>
      </transition>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { cloudEnabled } from "../cloud/client";
import { authReady, openAuth, signOut, user } from "../cloud/useAuth";
import { lastSyncedAt, syncNow, syncStatus } from "../cloud/sync";

const props = defineProps({
  lang: { type: String, default: "ua" },
});

const dict = {
  en: {
    signin: "Sign in",
    account: "Account",
    syncNow: "Sync now",
    signout: "Sign out",
    syncing: "Syncing…",
    synced: "Synced",
    offline: "Offline: will retry",
    error: "Sync error: will retry",
    idle: "Waiting",
  },
  ua: {
    signin: "Увійти",
    account: "Акаунт",
    syncNow: "Синхронізувати",
    signout: "Вийти",
    syncing: "Синхронізація…",
    synced: "Синхронізовано",
    offline: "Немає зв'язку, повторю",
    error: "Помилка синхронізації, повторю",
    idle: "Очікування",
  },
};
const L = computed(() => dict[props.lang] || dict.en);

const open = ref(false);
const root = ref(null);

const initial = computed(() =>
  user.value && user.value.email ? user.value.email[0].toUpperCase() : "?",
);

const statusText = computed(() => {
  const status = syncStatus.value;
  if (status === "synced" && lastSyncedAt.value) {
    const time = new Date(lastSyncedAt.value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${L.value.synced} · ${time}`;
  }
  return L.value[status] || L.value.idle;
});

async function doSync() {
  await syncNow();
}

async function doSignOut() {
  open.value = false;
  await signOut();
}

function onPointer(event) {
  if (open.value && root.value && !root.value.contains(event.target)) {
    open.value = false;
  }
}
function onKey(event) {
  if (event.key === "Escape") open.value = false;
}
onMounted(() => {
  document.addEventListener("pointerdown", onPointer, true);
  document.addEventListener("keydown", onKey);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointer, true);
  document.removeEventListener("keydown", onKey);
});
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

.acc-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 230px;
  padding: 10px;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.55);
}

.acc-email {
  margin: 2px 6px 4px;
  font-size: 13px;
  font-weight: 800;
  color: #f1f5f9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.acc-status {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 6px 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: #94a3b8;
}

.acc-status-dot {
  width: 8px;
  height: 8px;
  background: #94a3b8;
  border-radius: 50%;
}
.acc-status.is-synced .acc-status-dot {
  background: #22c55e;
}
.acc-status.is-syncing .acc-status-dot {
  background: #facc15;
}
.acc-status.is-offline .acc-status-dot,
.acc-status.is-error .acc-status-dot {
  background: #ef4444;
}

.acc-item {
  display: block;
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  font-size: 13px;
  font-weight: 700;
  color: #cbd5e1;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}
.acc-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}
.acc-item.is-danger:hover {
  color: #fca5a5;
}

.acc-pop-enter-active,
.acc-pop-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.acc-pop-enter-from,
.acc-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
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
