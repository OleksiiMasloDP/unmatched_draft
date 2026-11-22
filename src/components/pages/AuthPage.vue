<template>
  <div class="ap">
    <AuthBackdrop :variant="bg" />

    <div v-if="demo" class="ap-demo">{{ L.demo }}</div>

    <div class="ap-card">
      <aside class="ap-brand">
        <div class="ap-logo">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <defs>
              <linearGradient id="apg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#facc15" />
                <stop offset="1" stop-color="#ef4444" />
              </linearGradient>
            </defs>
            <path
              d="M24 3 42 10v14c0 10-7.5 17.5-18 21C13.5 41.500 6 34 6 24V10z"
              fill="url(#apg)"
            />
            <path
              d="M24 12 L26.600 20.400 L35 21 L28.500 26.500 L30.600 35 L24 30.400 L17.400 35 L19.500 26.500 L13 21 L21.400 20.400z"
              fill="#1a1204"
            />
          </svg>
          <span>Unmatched Draft</span>
        </div>

        <h1 class="ap-headline">{{ L.headline }}</h1>
        <p class="ap-lead">{{ L.lead }}</p>

        <div class="ap-fan" aria-hidden="true">
          <img
            v-for="(card, index) in cards"
            :key="card"
            :src="asset(card)"
            :class="'ap-fan-card ap-fan-' + index"
            alt=""
          />
        </div>

        <ul class="ap-perks">
          <li v-for="perk in L.perks" :key="perk.title">
            <span class="ap-perk-icon">{{ perk.icon }}</span>
            <span>
              <strong>{{ perk.title }}</strong>
              <small>{{ perk.text }}</small>
            </span>
          </li>
        </ul>
      </aside>

      <form class="ap-form" novalidate @submit.prevent="submit">
        <div v-if="mode !== 'forgot'" class="ap-tabs" role="tablist">
          <span
            class="ap-tab-glider"
            :class="{ right: mode === 'signup' }"
          ></span>
          <button
            type="button"
            role="tab"
            :aria-selected="mode === 'signin'"
            :class="{ on: mode === 'signin' }"
            @click="go('signin')"
          >
            {{ L.tabSignin }}
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="mode === 'signup'"
            :class="{ on: mode === 'signup' }"
            @click="go('signup')"
          >
            {{ L.tabSignup }}
          </button>
        </div>

        <h2 class="ap-title">{{ title }}</h2>
        <p class="ap-sub">{{ subtitle }}</p>

        <template v-if="mode !== 'forgot'">
          <button
            type="button"
            class="ap-google"
            :disabled="authBusy"
            @click="google"
          >
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.600 20.100H42V20H24v8h11.300c-1.600 4.700-6.100 8-11.300 8-6.600 0-12-5.400-12-12s5.400-12 12-12c3.100 0 5.800 1.200 8 3l5.700-5.700C34 6.100 29.300 4 24 4 12.900 4 4 12.900 4 24s8.900 20 20 20 20-8.900 20-20c0-1.300-.1-2.600-.4-3.900z"
              />
              <path
                fill="#FF3D00"
                d="M6.300 14.700l6.600 4.800C14.700 15.100 19 12 24 12c3.100 0 5.800 1.200 8 3l5.700-5.700C34 6.100 29.300 4 24 4 16.300 4 9.700 8.300 6.300 14.700z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.200 0 9.900-2 13.400-5.200l-6.200-5.200C29.200 35.100 26.700 36 24 36c-5.200 0-9.600-3.300-11.300-7.900l-6.500 5C9.500 39.600 16.200 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.600 20.100H42V20H24v8h11.300c-.8 2.200-2.200 4.200-4.100 5.600l6.200 5.200C37 39.200 44 34 44 24c0-1.300-.1-2.600-.4-3.900z"
              />
            </svg>
            {{ L.google }}
          </button>
          <div class="ap-or">
            <span>{{ L.or }}</span>
          </div>
        </template>

        <label class="ap-field">
          <span class="ap-label">{{ L.email }}</span>
          <span
            class="ap-input-wrap"
            :class="{ bad: emailTouched && !emailOk }"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            <input
              v-model.trim="email"
              type="email"
              autocomplete="email"
              placeholder="name@example.com"
              :disabled="authBusy"
              @blur="emailTouched = true"
            />
          </span>
        </label>

        <label v-if="mode !== 'forgot'" class="ap-field">
          <span class="ap-label">
            {{ L.password }}
            <button
              v-if="mode === 'signin'"
              type="button"
              class="ap-inline"
              @click="go('forgot')"
            >
              {{ L.forgot }}
            </button>
          </span>
          <span class="ap-input-wrap" :class="{ bad: passTouched && !passOk }">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="10" width="16" height="11" rx="3" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              :autocomplete="
                mode === 'signin' ? 'current-password' : 'new-password'
              "
              placeholder="••••••••"
              :disabled="authBusy"
              @blur="passTouched = true"
            />
            <button
              type="button"
              class="ap-eye"
              :aria-label="L.showPassword"
              @click="showPassword = !showPassword"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"
                />
                <circle cx="12" cy="12" r="3" />
                <path v-if="showPassword" d="M4 4l16 16" />
              </svg>
            </button>
          </span>
          <span v-if="mode === 'signup'" class="ap-meter">
            <span class="ap-meter-bars">
              <i
                v-for="n in 4"
                :key="n"
                :class="{ on: n <= strength.score }"
                :style="{ '--c': strength.color }"
              ></i>
            </span>
            <small>{{ password ? strength.label : L.passHint }}</small>
          </span>
        </label>

        <p v-if="error" class="ap-msg is-error">{{ error }}</p>
        <p v-if="info" class="ap-msg is-ok">{{ info }}</p>

        <button
          type="submit"
          class="ap-submit"
          :disabled="authBusy || !canSubmit"
        >
          <span v-if="authBusy" class="ap-spin"></span>
          {{ authBusy ? L.wait : submitLabel }}
        </button>

        <button
          v-if="mode === 'forgot'"
          type="button"
          class="ap-back"
          @click="go('signin')"
        >
          ← {{ L.back }}
        </button>

        <p v-if="mode === 'signup'" class="ap-note">{{ L.syncNote }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthBackdrop from "../AuthBackdrop.vue";
import { useDraftState } from "../../composables/useDraftState";
import { authDemo as demo } from "../../cloud/client";
import {
  authBusy,
  sendPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
  user,
} from "../../cloud/useAuth";

const { lang } = useDraftState();
const route = useRoute();
const router = useRouter();

const cards = [
  "images/cards/Medusa/gaze_of_stone.webp",
  "images/cards/King Arthur/excalibur.webp",
  "images/cards/Sinbad/exploit.webp",
];
const asset = (path) => `${import.meta.env.BASE_URL}${path}`;

const dict = {
  en: {
    demo: "Preview mode: no real accounts yet",
    headline: "Your drafts, everywhere",
    lead: "One free account keeps your progress safe and in sync between phone and computer.",
    perks: [
      {
        icon: "☁️",
        title: "Cloud sync",
        text: "Drafts, formats and decks on any device",
      },
      {
        icon: "🗡",
        title: "Roguelike runs",
        text: "Continue a run where you stopped",
      },
      { icon: "🔒", title: "Private", text: "Only you can see your data" },
    ],
    tabSignin: "Sign in",
    tabSignup: "Sign up",
    signinTitle: "Welcome back",
    signupTitle: "Create your account",
    forgotTitle: "Reset password",
    signinSub: "Sign in to pick up where you left off.",
    signupSub: "Free, takes about ten seconds.",
    forgotSub: "We will email you a link to set a new password.",
    google: "Continue with Google",
    or: "or with email",
    email: "Email",
    password: "Password",
    passHint: "At least 8 characters",
    showPassword: "Show password",
    submitSignin: "Sign in",
    submitSignup: "Create account",
    submitForgot: "Send link",
    wait: "One moment…",
    forgot: "Forgot password?",
    back: "Back to sign in",
    syncNote:
      "Your drafts, custom formats and saved decks are stored in your account.",
    confirmSent:
      "Almost done! Check your inbox and confirm your email to finish signing up.",
    resetSent: "If this email is registered, a reset link is on its way.",
    strength: ["Too short", "Weak", "Okay", "Good", "Strong"],
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
    demo: "Режим перегляду: справжніх акаунтів ще немає",
    headline: "Ваші драфти скрізь",
    lead: "Один безкоштовний акаунт зберігає прогрес і синхронізує його між телефоном і комп'ютером.",
    perks: [
      {
        icon: "☁️",
        title: "Хмарна синхронізація",
        text: "Драфти, формати й колоди на будь-якому пристрої",
      },
      {
        icon: "🗡",
        title: "Забіги Роуглайку",
        text: "Продовжуйте забіг з того ж місця",
      },
      { icon: "🔒", title: "Приватно", text: "Ваші дані бачите лише ви" },
    ],
    tabSignin: "Вхід",
    tabSignup: "Реєстрація",
    signinTitle: "З поверненням",
    signupTitle: "Створіть акаунт",
    forgotTitle: "Скидання пароля",
    signinSub: "Увійдіть, щоб продовжити з того місця, де зупинились.",
    signupSub: "Безкоштовно, займе секунд десять.",
    forgotSub: "Ми надішлемо на пошту посилання для нового пароля.",
    google: "Продовжити з Google",
    or: "або через пошту",
    email: "Пошта",
    password: "Пароль",
    passHint: "Щонайменше 8 символів",
    showPassword: "Показати пароль",
    submitSignin: "Увійти",
    submitSignup: "Створити акаунт",
    submitForgot: "Надіслати посилання",
    wait: "Хвилинку…",
    forgot: "Забули пароль?",
    back: "Назад до входу",
    syncNote:
      "Драфти, власні формати й збережені колоди зберігаються у вашому акаунті.",
    confirmSent:
      "Майже готово! Перевірте пошту й підтвердьте адресу, щоб завершити реєстрацію.",
    resetSent: "Якщо ця пошта зареєстрована, посилання вже в дорозі.",
    strength: ["Закороткий", "Слабкий", "Непоганий", "Добрий", "Надійний"],
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

const bg = computed(() => {
  const value = Number(route.query.bg);
  return value >= 1 && value <= 5 ? value : 1;
});

const modes = ["signin", "signup", "forgot"];
const mode = ref(
  modes.includes(route.query.mode) ? route.query.mode : "signin",
);
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const emailTouched = ref(false);
const passTouched = ref(false);
const error = ref("");
const info = ref("");

const emailOk = computed(() => /^\S+@\S+\.\S+$/.test(email.value));
const passOk = computed(() => password.value.length >= 8);

const strength = computed(() => {
  const value = password.value;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-zа-яіїєґ]/.test(value) && /[A-ZА-ЯІЇЄҐ]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^\p{L}\d]/u.test(value) || value.length >= 14) score += 1;
  if (value.length < 8) score = 0;
  const colors = ["#ef4444", "#ef4444", "#f59e0b", "#84cc16", "#22c55e"];
  return {
    score,
    color: colors[score],
    label: L.value.strength[score],
  };
});

const title = computed(
  () =>
    ({
      signin: L.value.signinTitle,
      signup: L.value.signupTitle,
      forgot: L.value.forgotTitle,
    })[mode.value],
);
const subtitle = computed(
  () =>
    ({
      signin: L.value.signinSub,
      signup: L.value.signupSub,
      forgot: L.value.forgotSub,
    })[mode.value],
);
const submitLabel = computed(
  () =>
    ({
      signin: L.value.submitSignin,
      signup: L.value.submitSignup,
      forgot: L.value.submitForgot,
    })[mode.value],
);
const canSubmit = computed(() =>
  mode.value === "forgot" ? emailOk.value : emailOk.value && passOk.value,
);

const explain = (result) =>
  L.value.errors[result.code] || L.value.errors.unknown;

function go(next) {
  mode.value = next;
  error.value = "";
  info.value = "";
  password.value = "";
  passTouched.value = false;
  showPassword.value = false;
  router.replace({ name: "auth", query: { ...route.query, mode: next } });
}

function finish() {
  router.replace({ name: "home" });
}

async function submit() {
  emailTouched.value = true;
  passTouched.value = true;
  if (!canSubmit.value) return;
  error.value = "";
  info.value = "";
  let result;
  if (mode.value === "signin") {
    result = await signIn(email.value, password.value);
    if (result.ok) return finish();
  } else if (mode.value === "signup") {
    result = await signUp(email.value, password.value);
    if (result.ok) {
      if (!result.needsConfirm) return finish();
      info.value = L.value.confirmSent;
      password.value = "";
      return;
    }
  } else {
    result = await sendPasswordReset(email.value);
    if (result.ok) {
      info.value = L.value.resetSent;
      return;
    }
  }
  error.value = explain(result);
}

async function google() {
  error.value = "";
  const result = await signInWithGoogle();
  if (!result.ok) error.value = explain(result);
  else if (demo) finish();
}

watch(user, (value) => {
  if (value) finish();
});

onMounted(() => {
  if (user.value) finish();
});
</script>

<style scoped>
.ap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 32px 16px 56px;
  overflow: hidden;
}

.ap-demo {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 2;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #facc15;
  white-space: nowrap;
  background: rgba(250, 204, 21, 0.12);
  border: 1px solid rgba(250, 204, 21, 0.4);
  border-radius: 999px;
  transform: translateX(-50%);
}

.ap-card {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  width: 100%;
  max-width: 980px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 28px;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(18px);
}

.ap-brand {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 38px 36px;
  background:
    radial-gradient(
      circle at 20% 0%,
      rgba(79, 124, 255, 0.35),
      transparent 55%
    ),
    radial-gradient(
      circle at 100% 100%,
      rgba(239, 68, 68, 0.3),
      transparent 55%
    ),
    rgba(255, 255, 255, 0.03);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.ap-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.05rem;
  font-weight: 800;
  color: #f8fafc;
}

.ap-logo svg {
  width: 34px;
  height: 34px;
  filter: drop-shadow(0 4px 12px rgba(250, 204, 21, 0.4));
}

.ap-headline {
  margin: 10px 0 0;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1.1;
  color: #f8fafc;
}

.ap-lead {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.5;
}

.ap-fan {
  position: relative;
  height: 170px;
  margin: 8px 0 26px;
}

.ap-fan-card {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 112px;
  border-radius: 10px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55);
  transform-origin: 50% 120%;
  transition: transform 0.4s ease;
}

.ap-fan-0 {
  transform: translateX(-50%) rotate(-14deg) translateX(-64px);
}

.ap-fan-1 {
  z-index: 1;
  transform: translateX(-50%) translateY(-10px);
}

.ap-fan-2 {
  transform: translateX(-50%) rotate(14deg) translateX(64px);
}

.ap-card:hover .ap-fan-0 {
  transform: translateX(-50%) rotate(-20deg) translateX(-78px);
}

.ap-card:hover .ap-fan-2 {
  transform: translateX(-50%) rotate(20deg) translateX(78px);
}

.ap-perks {
  display: grid;
  gap: 12px;
  padding: 0;
  margin: auto 0 0;
  list-style: none;
}

.ap-perks li {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ap-perk-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 1.1rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

.ap-perks strong {
  display: block;
  font-size: 0.92rem;
  color: #f8fafc;
}

.ap-perks small {
  color: #94a3b8;
  font-size: 0.8rem;
}

.ap-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 38px 36px;
}

.ap-tabs {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
}

.ap-tab-glider {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  background: linear-gradient(135deg, #4f7cff, #3b60d1);
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(79, 124, 255, 0.4);
  transition: transform 0.3s ease;
}

.ap-tab-glider.right {
  transform: translateX(100%);
}

.ap-tabs button {
  position: relative;
  z-index: 1;
  padding: 9px 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: #94a3b8;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color 0.2s ease;
}

.ap-tabs button.on {
  color: #fff;
}

.ap-title {
  margin: 6px 0 0;
  font-size: 1.55rem;
  font-weight: 900;
  color: #f8fafc;
}

.ap-sub {
  margin: -8px 0 4px;
  color: #94a3b8;
  font-size: 0.92rem;
}

.ap-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937;
  background: #fff;
  border: 0;
  border-radius: 14px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.ap-google:hover:not(:disabled) {
  box-shadow: 0 10px 24px rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}

.ap-google svg {
  width: 20px;
  height: 20px;
}

.ap-or {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #64748b;
  font-size: 0.8rem;
}

.ap-or::before,
.ap-or::after {
  flex: 1;
  height: 1px;
  content: "";
  background: rgba(255, 255, 255, 0.12);
}

.ap-field {
  display: grid;
  gap: 6px;
}

.ap-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #cbd5e1;
  font-size: 0.82rem;
  font-weight: 700;
}

.ap-inline {
  padding: 0;
  color: #7aa2ff;
  font-size: 0.8rem;
  font-weight: 700;
  background: none;
  border: 0;
  cursor: pointer;
}

.ap-inline:hover {
  text-decoration: underline;
}

.ap-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.ap-input-wrap:focus-within {
  border-color: #4f7cff;
  box-shadow: 0 0 0 4px rgba(79, 124, 255, 0.2);
}

.ap-input-wrap.bad {
  border-color: #ef4444;
}

.ap-input-wrap svg {
  flex: none;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: #94a3b8;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ap-input-wrap > input {
  flex: 1;
  min-width: 0;
  height: auto;
  padding: 13px 0;
  color: #f8fafc;
  font-size: 1rem;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0;
  outline: 0;
  box-shadow: none !important;
}

.ap-input-wrap > input:focus {
  outline: 0 !important;
  box-shadow: none !important;
  border: 0 !important;
}

.ap-input-wrap > input::placeholder {
  color: #64748b;
}

.ap-eye {
  display: grid;
  place-items: center;
  padding: 4px;
  background: none;
  border: 0;
  cursor: pointer;
}

.ap-eye:hover svg {
  stroke: #f8fafc;
}

.ap-meter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ap-meter-bars {
  display: flex;
  flex: 1;
  gap: 4px;
}

.ap-meter-bars i {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  transition: background 0.25s ease;
}

.ap-meter-bars i.on {
  background: var(--c);
}

.ap-meter small {
  min-width: 96px;
  color: #94a3b8;
  font-size: 0.76rem;
  text-align: right;
}

.ap-msg {
  margin: 0;
  padding: 10px 12px;
  font-size: 0.88rem;
  border-radius: 12px;
}

.ap-msg.is-error {
  color: #fecaca;
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.ap-msg.is-ok {
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.ap-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  color: #1a1204;
  font-size: 1rem;
  font-weight: 900;
  background: linear-gradient(135deg, #facc15, #f59e0b);
  border: 0;
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(250, 204, 21, 0.3);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    filter 0.2s ease;
}

.ap-submit:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.ap-submit:disabled {
  box-shadow: none;
  opacity: 0.5;
  cursor: not-allowed;
}

.ap-spin {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(26, 18, 4, 0.3);
  border-top-color: #1a1204;
  border-radius: 50%;
  animation: ap-rot 0.7s linear infinite;
}

@keyframes ap-rot {
  to {
    transform: rotate(360deg);
  }
}

.ap-back {
  padding: 4px;
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 700;
  background: none;
  border: 0;
  cursor: pointer;
}

.ap-back:hover {
  color: #f8fafc;
}

.ap-note {
  margin: 0;
  color: #64748b;
  font-size: 0.78rem;
  text-align: center;
}

@media (max-width: 820px) {
  .ap {
    align-items: flex-start;
    padding: 48px 12px 40px;
  }
  .ap-card {
    grid-template-columns: 1fr;
    border-radius: 22px;
  }
  .ap-brand {
    gap: 8px;
    padding: 22px 22px 18px;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .ap-headline {
    font-size: 1.45rem;
  }
  .ap-fan,
  .ap-perks {
    display: none;
  }
  .ap-form {
    padding: 24px 22px 28px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ap-fan-card,
  .ap-tab-glider {
    animation: none;
    transition: none;
  }
}
</style>
