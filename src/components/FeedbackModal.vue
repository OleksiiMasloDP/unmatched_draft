<template>
  <teleport to="body">
    <transition name="fb-fade">
      <div v-if="isOpen" class="fb-overlay" @mousedown.self="closeFeedback">
        <form
          class="fb-box"
          role="dialog"
          aria-modal="true"
          @submit.prevent="send"
        >
          <button
            type="button"
            class="fb-close"
            :aria-label="L.close"
            @click="closeFeedback"
          >
            ×
          </button>

          <h2 class="fb-title">{{ L.title }}</h2>
          <p class="fb-sub">{{ L.sub }}</p>

          <div class="fb-types">
            <button
              v-for="tp in types"
              :key="tp.key"
              type="button"
              class="fb-type"
              :class="{ 'is-on': type === tp.key }"
              @click="type = tp.key"
            >
              {{ tp.icon }} {{ L.types[tp.key] }}
            </button>
          </div>

          <label class="fb-label">
            {{ L.section }}
            <select v-model="section" class="fb-input">
              <option v-for="s in sections" :key="s" :value="s">
                {{ L.sections[s] }}
              </option>
            </select>
          </label>

          <label class="fb-label">
            {{ L.message }}
            <textarea
              v-model="message"
              class="fb-input"
              rows="4"
              :placeholder="L.messagePh"
            ></textarea>
          </label>

          <label v-if="type === 'bug'" class="fb-label">
            {{ L.steps }}
            <textarea
              v-model="steps"
              class="fb-input"
              rows="3"
              :placeholder="L.stepsPh"
            ></textarea>
          </label>

          <label class="fb-label">
            {{ L.contact }}
            <input
              v-model="contact"
              class="fb-input"
              type="text"
              :placeholder="L.contactPh"
            />
          </label>

          <label class="fb-check">
            <input v-model="attach" type="checkbox" />
            <span>{{ L.attach }}</span>
          </label>

          <div class="fb-actions">
            <button
              type="submit"
              class="fb-btn fb-btn-primary"
              :disabled="!canSend || status === 'sending' || status === 'sent'"
            >
              {{
                status === "sending"
                  ? L.sending
                  : FEEDBACK.web3formsKey
                    ? L.send
                    : L.sendMail
              }}
            </button>
            <button
              type="button"
              class="fb-btn"
              :disabled="!canSend"
              @click="copy"
            >
              {{ copied ? L.copied : L.copy }}
            </button>
            <a
              v-if="FEEDBACK.telegram"
              class="fb-btn"
              :href="`https://t.me/${FEEDBACK.telegram}`"
              target="_blank"
              rel="noopener"
              @click="canSend && copy()"
            >
              Telegram
            </a>
          </div>

          <p v-if="status === 'sent'" class="fb-status is-ok">{{ L.sent }}</p>
          <p v-else-if="status === 'error'" class="fb-status is-bad">
            {{ L.error }}
            <a :href="mailto">{{ L.viaMail }}</a>
          </p>
          <p v-else class="fb-hint">
            {{
              FEEDBACK.web3formsKey
                ? L.hintSend
                : L.hintMail.replace("{email}", FEEDBACK.email)
            }}
          </p>
        </form>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useDraftState } from "../composables/useDraftState";
import { useFeedback } from "../composables/useFeedback";
import { FEEDBACK } from "../feedbackConfig";

const { lang } = useDraftState();
const { isOpen, preset, closeFeedback } = useFeedback();
const route = useRoute();

const dict = {
  en: {
    title: "Report a bug / feedback",
    sub: "Found a bug or have an idea? Describe it — it helps a lot.",
    close: "Close",
    types: { bug: "Bug", idea: "Idea", other: "Other" },
    section: "Where did it happen?",
    sections: {
      home: "Home page",
      draft: "Draft",
      formats: "Formats",
      maps: "Hero map guide",
      matchups: "Matchups",
      guide: "Character guides",
      "pack-draft": "Pack Draft",
      game: "Game",
      other: "Something else",
    },
    message: "What happened?",
    messagePh: "Describe the problem or idea…",
    steps: "How to reproduce (optional)",
    stepsPh: "1) … 2) … 3) …",
    contact: "How to reach you (optional)",
    contactPh: "Nickname / Telegram",
    attach: "Attach technical info (page, browser, screen size)",
    send: "Send",
    sendMail: "Send by email",
    sending: "Sending…",
    sent: "Thank you! Your message was sent.",
    error: "Could not send the message.",
    viaMail: "Send by email instead",
    hintSend: "The message goes straight to the author's email.",
    hintMail:
      "If your mail app did not open, copy the text and send it to {email}.",
    copy: "Copy text",
    copied: "Copied ✔",
    fType: "Type",
    fSection: "Section",
    fSteps: "Steps",
    fContact: "Contact",
  },
  ua: {
    title: "Повідомити про баг / фідбек",
    sub: "Знайшли баг або маєте ідею? Опишіть — це дуже допомагає.",
    close: "Закрити",
    types: { bug: "Баг", idea: "Ідея", other: "Інше" },
    section: "Де це сталося?",
    sections: {
      home: "Головна",
      draft: "Драфт",
      formats: "Формати",
      maps: "Мапи героїв",
      matchups: "Матчапи",
      guide: "Гайди по персонажах",
      "pack-draft": "Pack Draft",
      game: "Гра",
      other: "Інше",
    },
    message: "Що сталося?",
    messagePh: "Опишіть проблему або ідею…",
    steps: "Як відтворити (необов'язково)",
    stepsPh: "1) … 2) … 3) …",
    contact: "Як із вами зв'язатися (необов'язково)",
    contactPh: "Нік / Telegram",
    attach: "Додати технічну інформацію (сторінка, браузер, розмір екрана)",
    send: "Надіслати",
    sendMail: "Надіслати поштою",
    sending: "Надсилаю…",
    sent: "Дякую! Повідомлення надіслано.",
    error: "Не вдалося надіслати повідомлення.",
    viaMail: "Надіслати поштою",
    hintSend: "Повідомлення прийде автору на пошту.",
    hintMail:
      "Якщо поштова програма не відкрилась, скопіюйте текст і надішліть на {email}.",
    copy: "Скопіювати текст",
    copied: "Скопійовано ✔",
    fType: "Тип",
    fSection: "Розділ",
    fSteps: "Кроки",
    fContact: "Контакт",
  },
};
const L = computed(() => dict[lang.value] || dict.en);

const types = [
  { key: "bug", icon: "🐞" },
  { key: "idea", icon: "💡" },
  { key: "other", icon: "💬" },
];
const sections = [
  "home",
  "draft",
  "formats",
  "maps",
  "matchups",
  "guide",
  "pack-draft",
  "game",
  "other",
];

const routeSection = () =>
  ({
    home: "home",
    main: "draft",
    formats: "formats",
    maps: "maps",
    matchups: "matchups",
    guide: "guide",
    "pack-draft": "pack-draft",
    game: "game",
  })[route.name] || "other";

const CONTACT_KEY = "feedback_contact";
const readContact = () => {
  try {
    return localStorage.getItem(CONTACT_KEY) || "";
  } catch {
    return "";
  }
};

const type = ref("bug");
const section = ref("other");
const message = ref("");
const steps = ref("");
const contact = ref(readContact());
const attach = ref(true);
const copied = ref(false);
const status = ref(""); // "", "sending", "sent", "error"
let copiedTimer = null;

watch(isOpen, (open) => {
  if (!open) return;
  type.value = preset.value.type;
  section.value = preset.value.section || routeSection();
  message.value = "";
  steps.value = "";
  copied.value = false;
  status.value = "";
});

watch(contact, (value) => {
  try {
    localStorage.setItem(CONTACT_KEY, value);
  } catch {
    // не критично
  }
});

const canSend = computed(() => message.value.trim().length > 0);

function buildText() {
  const l = L.value;
  const lines = [
    `**${l.fType}:** ${l.types[type.value]}`,
    `**${l.fSection}:** ${l.sections[section.value]}`,
    "",
    `### ${l.message}`,
    message.value.trim(),
  ];
  if (type.value === "bug" && steps.value.trim()) {
    lines.push("", `### ${l.fSteps}`, steps.value.trim());
  }
  if (contact.value.trim()) {
    lines.push("", `**${l.fContact}:** ${contact.value.trim()}`);
  }
  if (attach.value) {
    lines.push(
      "",
      "---",
      `Page: ${window.location.href}`,
      `Browser: ${navigator.userAgent}`,
      `Screen: ${window.innerWidth}x${window.innerHeight} (dpr ${window.devicePixelRatio})`,
      `Lang: ${lang.value}`,
      `Time: ${new Date().toISOString()}`,
    );
  }
  return lines.join("\n");
}

const icons = { bug: "🐞", idea: "💡", other: "💬" };
const titleText = () => {
  const first = message.value.trim().split("\n")[0].slice(0, 70);
  return `${icons[type.value]} ${first}`;
};

async function send() {
  if (!canSend.value || status.value === "sending") return;

  // Без ключа сервісу відкриваємо поштову програму з готовим листом.
  if (!FEEDBACK.web3formsKey) {
    window.location.href = mailto.value;
    return;
  }

  status.value = "sending";
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        access_key: FEEDBACK.web3formsKey,
        subject: `Unmatched Draft · ${titleText()}`,
        from_name: contact.value.trim() || "Unmatched Draft",
        message: buildText(),
        botcheck: "",
      }),
    });
    const data = await res.json();
    status.value = data.success ? "sent" : "error";
  } catch {
    status.value = "error";
  }
}

async function copy() {
  const text = buildText();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
    } catch {
      // нічого не вдієш
    }
    area.remove();
  }
  copied.value = true;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => (copied.value = false), 2000);
}

const mailto = computed(
  () =>
    `mailto:${FEEDBACK.email}` +
    `?subject=${encodeURIComponent("Unmatched Draft · " + titleText())}` +
    `&body=${encodeURIComponent(buildText().slice(0, 1800))}`,
);

function onKey(e) {
  if (e.key === "Escape" && isOpen.value) closeFeedback();
}
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  clearTimeout(copiedTimer);
});
</script>

<style scoped>
.fb-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(5, 8, 15, 0.72);
  backdrop-filter: blur(4px);
}
.fb-box {
  position: relative;
  width: 100%;
  max-width: 520px;
  max-height: 92vh;
  overflow-y: auto;
  padding: 24px 22px 20px;
  color: var(--text-main, #f8fafc);
  background: var(--bg-dark, #0f172a);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 18px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
}
.fb-close {
  position: absolute;
  top: 10px;
  right: 14px;
  font-size: 1.6rem;
  line-height: 1;
  color: var(--text-dim, #94a3b8);
  background: none;
  border: 0;
  cursor: pointer;
}
.fb-close:hover {
  color: #fff;
}
.fb-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  font-weight: 800;
}
.fb-sub {
  margin: 0 0 14px;
  font-size: 0.88rem;
  color: var(--text-muted, #cbd5e1);
}
.fb-types {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.fb-type {
  flex: 1;
  padding: 8px 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted, #cbd5e1);
  background: var(--bg-slate, #1e293b);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 10px;
  cursor: pointer;
}
.fb-type.is-on {
  color: #fff;
  background: var(--color-player, #4f7cff);
  border-color: var(--color-player, #4f7cff);
}
.fb-label {
  display: block;
  margin-bottom: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted, #cbd5e1);
}
.fb-input {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 8px 10px;
  font-size: 0.92rem;
  font-weight: 400;
  color: var(--text-light, #f1f5f9);
  background: var(--bg-slate, #1e293b);
  border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.15));
  border-radius: 8px;
  resize: vertical;
}
.fb-input:focus {
  outline: 2px solid rgba(var(--color-player-rgb, 79, 124, 255), 0.6);
  outline-offset: 0;
}
.fb-check {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 0.82rem;
  color: var(--text-muted, #cbd5e1);
  cursor: pointer;
}
.fb-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.fb-btn {
  padding: 9px 14px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  color: var(--text-light, #f1f5f9);
  background: var(--bg-slate, #1e293b);
  border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.15));
  border-radius: 10px;
  cursor: pointer;
}
.fb-btn:hover:not(:disabled) {
  background: var(--bg-slate-hover, #27374d);
}
.fb-btn-primary {
  color: #fff;
  background: var(--color-player, #4f7cff);
  border-color: var(--color-player, #4f7cff);
}
.fb-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.fb-hint {
  margin: 12px 0 0;
  font-size: 0.78rem;
  color: var(--text-dim, #94a3b8);
}
.fb-status {
  margin: 12px 0 0;
  font-size: 0.85rem;
  font-weight: 700;
}
.fb-status.is-ok {
  color: var(--color-success-light, #4ade80);
}
.fb-status.is-bad {
  color: var(--color-danger, #ef4444);
}
.fb-status a {
  color: inherit;
  text-decoration: underline;
}
.fb-fade-enter-active,
.fb-fade-leave-active {
  transition: opacity 0.2s ease;
}
.fb-fade-enter-from,
.fb-fade-leave-to {
  opacity: 0;
}
</style>
