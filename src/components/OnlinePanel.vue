<template>
  <div class="online-panel">
    <div class="online-head">
      <span class="online-title">{{ t("onlineTitle") }}</span>
      <span v-if="net.status === 'connected'" class="online-status is-ok">
        {{ replaceSeat("onlineConnected") }}
      </span>
    </div>

    <div v-if="net.role === null" class="online-actions">
      <button class="btn btn-primary btn-sm action-btn" @click="hostRoom">
        {{ t("onlineHost") }}
      </button>
      <input
        v-model="code"
        class="form-control form-control-sm search-field online-code"
        :placeholder="t('onlineCodePlaceholder')"
        maxlength="8"
        @keyup.enter="joinRoom"
      />
      <button
        class="btn btn-success btn-sm action-btn"
        :disabled="!code.trim()"
        @click="joinRoom"
      >
        {{ t("onlineJoin") }}
      </button>
    </div>

    <template v-else>
      <p v-if="net.status === 'creating'" class="online-line">
        {{ t("onlineCreating") }}
      </p>
      <p v-else-if="net.status === 'joining'" class="online-line">
        {{ t("onlineJoining") }}
      </p>
      <div v-else-if="net.status === 'hosting'" class="online-line">
        <div>{{ t("onlineWaiting") }}</div>
        <div class="online-share">
          <span class="online-room">{{ net.code }}</span>
          <button class="btn btn-sm action-btn" @click="copyLink">
            {{ copied ? t("onlineCopied") : t("onlineCopyLink") }}
          </button>
        </div>
      </div>
      <p v-else-if="net.status === 'closed'" class="online-line is-bad">
        {{ t("onlineClosed") }}
      </p>
      <p v-else-if="net.status === 'error'" class="online-line is-bad">
        {{ t("onlineError").replace("{error}", errorText) }}
      </p>

      <div class="online-actions">
        <button class="btn btn-danger btn-sm action-btn" @click="leave">
          {{ t("onlineLeave") }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDraftState } from "../composables/useDraftState";
import { useOnline } from "../composables/useOnline";

const { t } = useDraftState();
const { net, host, join, leave } = useOnline();
const route = useRoute();
const router = useRouter();

const code = ref("");
const copied = ref(false);

const errorText = computed(() => {
  if (net.error === "peer-unavailable") return t("onlineErrorNotFound");
  if (net.error === "room-full") return t("onlineErrorFull");
  return net.error;
});

const replaceSeat = (key) =>
  t(key).replace(
    "{player}",
    t(net.seat === "p1" ? "packPlayer1" : "packPlayer2"),
  );

function hostRoom() {
  host();
}

function joinRoom() {
  join(code.value);
}

async function copyLink() {
  const href = router.resolve({
    name: route.name,
    query: { join: net.code },
  }).href;
  try {
    await navigator.clipboard.writeText(new URL(href, location.origin).href);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    copied.value = false;
  }
}

onMounted(() => {
  const target = route.query.join;
  if (typeof target === "string" && target && net.role === null) {
    code.value = target.toUpperCase();
    join(target);
  }
});
</script>

<style scoped>
.online-panel {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-light);
  background: rgba(var(--bg-slate-rgb), 0.8);
}

.online-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}

.online-title {
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.online-status.is-ok {
  color: var(--color-success-light);
  font-size: 13px;
  font-weight: 700;
}

.online-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.online-code {
  width: 140px;
  text-transform: uppercase;
}

.online-line {
  margin: 0 0 8px;
  color: var(--text-muted);
  font-size: 13px;
}

.online-line.is-bad {
  color: var(--color-danger);
}

.online-share {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}

.online-room {
  color: var(--text-white);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 4px;
}
</style>
