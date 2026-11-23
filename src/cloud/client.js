// Supabase-клієнт створюється лише тоді, коли в .env задані ключі,
// і підвантажується окремим чанком, щоб не сповільнювати перше відкриття сайту.
const env = import.meta.env ?? {};
const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

const readDemoFlag = () => {
  try {
    const param = new URLSearchParams(window.location.search).get("authdemo");
    if (param === "1") localStorage.setItem("authDemo", "1");
    if (param === "0") localStorage.setItem("authDemo", "0");
    const stored = localStorage.getItem("authDemo");
    if (stored === "1") return true;
    return stored === null && String(env.BASE_URL || "").includes("/preview/");
  } catch {
    return false;
  }
};

const hasKeys = Boolean(URL && KEY);

export const authDemo = !hasKeys && readDemoFlag();

export const cloudEnabled = hasKeys || authDemo;

let clientPromise = null;
let testClient = null;

export function getClient() {
  if (testClient) return Promise.resolve(testClient);
  if (authDemo) {
    if (!clientPromise) {
      clientPromise = import("./demoClient.js").then(({ createDemoClient }) =>
        createDemoClient(),
      );
    }
    return clientPromise;
  }
  if (!cloudEnabled) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(URL, KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }),
    );
  }
  return clientPromise;
}

// Лише для тестів: підставити фальшивий клієнт.
export function setClientForTests(client) {
  testClient = client;
}

// Адреса, куди Supabase повертає користувача після входу через Google
// та після листів "підтвердити пошту" / "скинути пароль".
export function redirectUrl() {
  const base = env.BASE_URL || "/";
  return `${window.location.origin}${base}`;
}
