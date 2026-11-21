// Supabase-клієнт створюється лише тоді, коли в .env задані ключі,
// і підвантажується окремим чанком, щоб не сповільнювати перше відкриття сайту.
const env = import.meta.env ?? {};
const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(URL && KEY);

let clientPromise = null;
let testClient = null;

export function getClient() {
  if (testClient) return Promise.resolve(testClient);
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
