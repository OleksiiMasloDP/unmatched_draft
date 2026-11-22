// Стан користувача та дії входу/реєстрації (Supabase Auth).
// Без ключів у .env (cloudEnabled = false) нічого не робить, а кнопки входу не показуються.
import { reactive, ref } from "vue";
import { cloudEnabled, getClient, redirectUrl } from "./client.js";
import { startSync, stopSync, clearLocalData } from "./sync.js";

export const user = ref(null);
export const authReady = ref(!cloudEnabled);
export const authBusy = ref(false);
export const authModal = reactive({ open: false, mode: "signin" }); // signin | signup | forgot | recovery

let initialized = false;

function setUser(next) {
  const previousId = user.value ? user.value.id : null;
  user.value = next;
  if (next && next.id !== previousId) {
    // не викликаємо Supabase прямо всередині колбека зміни стану
    setTimeout(() => startSync(next.id), 0);
  } else if (!next && previousId) {
    stopSync();
  }
}

export async function initAuth() {
  if (initialized || !cloudEnabled) return;
  initialized = true;
  const client = await getClient();
  if (!client) return;

  const { data } = await client.auth.getSession();
  setUser(data.session ? data.session.user : null);

  client.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      authModal.open = true;
      authModal.mode = "recovery";
    }
    setUser(session ? session.user : null);
  });
  authReady.value = true;
}

export function openAuth(mode = "signin") {
  authModal.mode = mode;
  authModal.open = true;
}

export function closeAuth() {
  authModal.open = false;
}

// Усі дії повертають { ok, code, message, ... } - текст помилки перекладає модалка.
async function run(action) {
  authBusy.value = true;
  try {
    const client = await getClient();
    if (!client) return { ok: false, code: "not_configured" };
    return await action(client);
  } catch (error) {
    return {
      ok: false,
      code: error instanceof TypeError ? "network" : "unknown",
      message: error && error.message,
    };
  } finally {
    authBusy.value = false;
  }
}

const fail = (error) => ({
  ok: false,
  code: error.code || error.name || "unknown",
  message: error.message,
});

export function signUp(email, password) {
  return run(async (client) => {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl() },
    });
    if (error) return fail(error);
    // Supabase не видає помилку для вже зареєстрованої пошти, а повертає порожні identities.
    if (
      data.user &&
      Array.isArray(data.user.identities) &&
      data.user.identities.length === 0
    ) {
      return { ok: false, code: "user_already_exists" };
    }
    return { ok: true, needsConfirm: !data.session };
  });
}

export function signIn(email, password) {
  return run(async (client) => {
    const { error } = await client.auth.signInWithPassword({ email, password });
    return error ? fail(error) : { ok: true };
  });
}

export function signInWithGoogle() {
  return run(async (client) => {
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl() },
    });
    return error ? fail(error) : { ok: true };
  });
}

export function sendPasswordReset(email) {
  return run(async (client) => {
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl(),
    });
    return error ? fail(error) : { ok: true };
  });
}

export function updatePassword(password) {
  return run(async (client) => {
    const { error } = await client.auth.updateUser({ password });
    return error ? fail(error) : { ok: true };
  });
}

export async function signOut() {
  const client = await getClient();
  if (client) await client.auth.signOut();
  stopSync();
  clearLocalData(); // спільний пристрій: дані акаунта лишаються лише в хмарі
  user.value = null;
}
