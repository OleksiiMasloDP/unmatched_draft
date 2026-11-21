<template>
  <teleport to="body">
    <transition name="auth-fade">
      <div v-if="authModal.open" class="auth-overlay" @mousedown.self="close">
        <form
          class="auth-box"
          role="dialog"
          aria-modal="true"
          @submit.prevent="submit"
        >
          <button
            type="button"
            class="auth-close"
            :aria-label="L.close"
            @click="close"
          >
            ×
          </button>

          <h2 class="auth-title">{{ title }}</h2>
          <p v-if="subtitle" class="auth-sub">{{ subtitle }}</p>

          <template v-if="mode === 'signin' || mode === 'signup'">
            <button
              type="button"
              class="auth-google"
              :disabled="authBusy"
              @click="google"
            >
              <svg viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
                />
              </svg>
              {{ L.google }}
            </button>
            <div class="auth-or">
              <span>{{ L.or }}</span>
            </div>
          </template>

          <label v-if="mode !== 'recovery'" class="auth-label">
            {{ L.email }}
            <input
              v-model.trim="email"
              class="auth-input"
              type="email"
              autocomplete="email"
              required
              :disabled="authBusy"
            />
          </label>

          <label v-if="mode !== 'forgot'" class="auth-label">
            {{ mode === "recovery" ? L.newPassword : L.password }}
            <input
              v-model="password"
              class="auth-input"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="
                mode === 'signin' ? 'current-password' : 'new-password'
              "
              minlength="8"
              required
              :disabled="authBusy"
            />
          </label>

          <label v-if="mode !== 'forgot'" class="auth-check">
            <input v-model="showPassword" type="checkbox" />
            <span>{{ L.showPassword }}</span>
          </label>

          <p v-if="error" class="auth-msg is-error">{{ error }}</p>
          <p v-if="info" class="auth-msg is-ok">{{ info }}</p>

          <button
            type="submit"
            class="auth-submit"
            :disabled="authBusy || !canSubmit"
          >
            {{ authBusy ? "…" : submitLabel }}
          </button>

          <div class="auth-links">
            <template v-if="mode === 'signin'">
              <button type="button" @click="go('forgot')">
                {{ L.forgot }}
              </button>
              <button type="button" @click="go('signup')">
                {{ L.toSignup }}
              </button>
            </template>
            <template v-else-if="mode === 'signup'">
              <button type="button" @click="go('signin')">
                {{ L.toSignin }}
              </button>
            </template>
            <template v-else-if="mode === 'forgot'">
              <button type="button" @click="go('signin')">
                {{ L.toSignin }}
              </button>
            </template>
          </div>

          <p v-if="mode === 'signup'" class="auth-note">{{ L.syncNote }}</p>
        </form>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useDraftState } from "../composables/useDraftState";
import {
  authBusy,
  authModal,
  closeAuth,
  sendPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
} from "../cloud/useAuth";

const { lang } = useDraftState();

const dict = {
  en: {
    close: "Close",
    signinTitle: "Sign in",
    signupTitle: "Create account",
    forgotTitle: "Reset password",
    recoveryTitle: "New password",
    signinSub: "Your drafts, formats and decks follow you to any device.",
    signupSub: "Free. Continue a draft on your phone right where you stopped.",
    forgotSub: "We will email you a link to set a new password.",
    recoverySub: "Choose a new password for your account.",
    google: "Continue with Google",
    or: "or",
    email: "Email",
    password: "Password (min. 8 characters)",
    newPassword: "New password (min. 8 characters)",
    showPassword: "Show password",
    submitSignin: "Sign in",
    submitSignup: "Create account",
    submitForgot: "Send link",
    submitRecovery: "Save password",
    forgot: "Forgot password?",
    toSignup: "Create account",
    toSignin: "I already have an account",
    syncNote:
      "Your drafts, custom formats and saved decks are stored in your account.",
    confirmSent:
      "Almost done! Check your inbox and confirm your email to finish signing up.",
    resetSent: "If this email is registered, a reset link is on its way.",
    passwordSaved: "Password updated. You are signed in.",
    errors: {
      invalid_credentials: "Wrong email or password.",
      email_not_confirmed: "Confirm your email first: we sent you a link.",
      user_already_exists: "This email is already registered. Try signing in.",
      weak_password: "Password is too weak. Use at least 8 characters.",
      over_request_rate_limit: "Too many attempts. Please wait a minute.",
      over_email_send_rate_limit: "Too many emails sent. Please wait a minute.",
      network: "No connection. Check your internet and try again.",
      not_configured: "Accounts are not configured on this site yet.",
      unknown: "Something went wrong. Please try again.",
    },
  },
  ua: {
    close: "Закрити",
    signinTitle: "Вхід",
    signupTitle: "Створити акаунт",
    forgotTitle: "Скидання пароля",
    recoveryTitle: "Новий пароль",
    signinSub:
      "Ваші драфти, формати й колоди підуть за вами на будь-який пристрій.",
    signupSub: "Безкоштовно. Продовжуйте драфт на телефоні з того ж місця.",
    forgotSub: "Ми надішлемо на пошту посилання для нового пароля.",
    recoverySub: "Оберіть новий пароль для вашого акаунта.",
    google: "Увійти через Google",
    or: "або",
    email: "Пошта",
    password: "Пароль (мін. 8 символів)",
    newPassword: "Новий пароль (мін. 8 символів)",
    showPassword: "Показати пароль",
    submitSignin: "Увійти",
    submitSignup: "Створити акаунт",
    submitForgot: "Надіслати посилання",
    submitRecovery: "Зберегти пароль",
    forgot: "Забули пароль?",
    toSignup: "Створити акаунт",
    toSignin: "Я вже маю акаунт",
    syncNote:
      "Драфти, власні формати й збережені колоди зберігаються у вашому акаунті.",
    confirmSent:
      "Майже готово! Перевірте пошту й підтвердьте адресу, щоб завершити реєстрацію.",
    resetSent: "Якщо ця пошта зареєстрована, посилання вже в дорозі.",
    passwordSaved: "Пароль змінено. Ви увійшли.",
    errors: {
      invalid_credentials: "Невірна пошта або пароль.",
      email_not_confirmed:
        "Спочатку підтвердьте пошту: ми надсилали посилання.",
      user_already_exists: "Ця пошта вже зареєстрована. Спробуйте увійти.",
      weak_password:
        "Пароль надто простий. Використайте щонайменше 8 символів.",
      over_request_rate_limit: "Забагато спроб. Зачекайте хвилину.",
      over_email_send_rate_limit: "Забагато листів. Зачекайте хвилину.",
      network: "Немає зв'язку. Перевірте інтернет і спробуйте ще раз.",
      not_configured: "Акаунти на цьому сайті ще не налаштовані.",
      unknown: "Щось пішло не так. Спробуйте ще раз.",
    },
  },
};
const L = computed(() => dict[lang.value] || dict.en);

const mode = computed(() => authModal.mode);
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const error = ref("");
const info = ref("");

const title = computed(
  () =>
    ({
      signin: L.value.signinTitle,
      signup: L.value.signupTitle,
      forgot: L.value.forgotTitle,
      recovery: L.value.recoveryTitle,
    })[mode.value],
);
const subtitle = computed(
  () =>
    ({
      signin: L.value.signinSub,
      signup: L.value.signupSub,
      forgot: L.value.forgotSub,
      recovery: L.value.recoverySub,
    })[mode.value],
);
const submitLabel = computed(
  () =>
    ({
      signin: L.value.submitSignin,
      signup: L.value.submitSignup,
      forgot: L.value.submitForgot,
      recovery: L.value.submitRecovery,
    })[mode.value],
);

const canSubmit = computed(() => {
  if (mode.value === "recovery") return password.value.length >= 8;
  if (mode.value === "forgot") return email.value.includes("@");
  return email.value.includes("@") && password.value.length >= 8;
});

function explain(result) {
  const table = L.value.errors;
  return table[result.code] || table.unknown;
}

function reset() {
  error.value = "";
  info.value = "";
  password.value = "";
  showPassword.value = false;
}

function go(next) {
  reset();
  authModal.mode = next;
}

function close() {
  closeAuth();
  reset();
}

watch(
  () => authModal.open,
  (open) => {
    if (open) reset();
  },
);

async function submit() {
  error.value = "";
  info.value = "";
  let result;
  if (mode.value === "signin") {
    result = await signIn(email.value, password.value);
    if (result.ok) return close();
  } else if (mode.value === "signup") {
    result = await signUp(email.value, password.value);
    if (result.ok) {
      if (result.needsConfirm) {
        info.value = L.value.confirmSent;
        password.value = "";
        return;
      }
      return close();
    }
  } else if (mode.value === "forgot") {
    result = await sendPasswordReset(email.value);
    if (result.ok) {
      info.value = L.value.resetSent;
      return;
    }
  } else {
    result = await updatePassword(password.value);
    if (result.ok) {
      info.value = L.value.passwordSaved;
      setTimeout(close, 1200);
      return;
    }
  }
  error.value = explain(result);
}

async function google() {
  error.value = "";
  const result = await signInWithGoogle();
  if (!result.ok) error.value = explain(result);
}

function onKey(event) {
  if (event.key === "Escape" && authModal.open) close();
}
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>

<style scoped>
.auth-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(5, 8, 15, 0.75);
  backdrop-filter: blur(4px);
}
.auth-box {
  position: relative;
  width: 100%;
  max-width: 400px;
  max-height: 94vh;
  overflow-y: auto;
  padding: 28px 24px 22px;
  color: var(--text-main, #f8fafc);
  background: var(--bg-dark, #0f172a);
  border: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 18px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55);
}
.auth-close {
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
.auth-close:hover {
  color: #fff;
}
.auth-title {
  margin: 0 0 4px;
  font-size: 1.35rem;
  font-weight: 800;
}
.auth-sub {
  margin: 0 0 16px;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-muted, #cbd5e1);
}
.auth-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  font-weight: 700;
  color: #111827;
  background: #fff;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
}
.auth-google svg {
  width: 20px;
  height: 20px;
}
.auth-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.auth-or {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-dim, #94a3b8);
}
.auth-or::before,
.auth-or::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--border-medium, rgba(255, 255, 255, 0.12));
}
.auth-label {
  display: block;
  margin-bottom: 12px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted, #cbd5e1);
}
.auth-input {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 10px 12px;
  font-size: 0.95rem;
  color: var(--text-light, #f1f5f9);
  background: var(--bg-slate, #1e293b);
  border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.15));
  border-radius: 8px;
}
.auth-input:focus {
  outline: 2px solid rgba(var(--color-player-rgb, 79, 124, 255), 0.6);
  outline-offset: 0;
}
.auth-check {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.78rem;
  color: var(--text-dim, #94a3b8);
  cursor: pointer;
}
.auth-msg {
  margin: 0 0 12px;
  padding: 8px 10px;
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: 8px;
}
.auth-msg.is-error {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
}
.auth-msg.is-ok {
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.4);
}
.auth-submit {
  width: 100%;
  padding: 11px 14px;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(90deg, var(--color-player, #4f7cff), #7c3aed);
  border: 0;
  border-radius: 10px;
  cursor: pointer;
}
.auth-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.auth-links {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 14px;
}
.auth-links button {
  padding: 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-player, #4f7cff);
  background: none;
  border: 0;
  cursor: pointer;
}
.auth-links button:hover {
  text-decoration: underline;
}
.auth-note {
  margin: 14px 0 0;
  font-size: 0.75rem;
  color: var(--text-dim, #94a3b8);
}
.auth-fade-enter-active,
.auth-fade-leave-active {
  transition: opacity 0.2s ease;
}
.auth-fade-enter-from,
.auth-fade-leave-to {
  opacity: 0;
}
</style>
