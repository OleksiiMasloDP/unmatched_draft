const KEY = "authDemoUser";

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY));
  } catch {
    return null;
  }
};

const writeUser = (user) => {
  try {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
  } catch {
    return;
  }
};

const wait = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

export function createDemoClient() {
  const listeners = new Set();
  const emit = (event, user) => {
    const session = user ? { user } : null;
    listeners.forEach((listener) => listener(event, session));
  };
  const makeUser = (email) => ({
    id: `demo-${email}`,
    email,
    identities: [{ id: email }],
  });
  const reject = (code, message) => ({
    data: {},
    error: { code, name: code, message },
  });

  return {
    functions: {
      async invoke(name, { body }) {
        await wait();
        if (name !== "tabletop-import") return { data: null, error: null };
        if (String(body.username).startsWith("missing")) {
          return {
            data: null,
            error: { context: { json: async () => ({ error: "not_found" }) } },
          };
        }
        return {
          data: {
            username: body.username,
            rating: 1545,
            deviation: 153,
            ratedMatches: 5,
            fighters: [
              { name: "Philippa", wins: 16, losses: 12, games: 28 },
              { name: "Wyatt Earp", wins: 14, losses: 7, games: 21 },
              { name: "Doctor Strange", wins: 14, losses: 7, games: 21 },
              { name: "Golden Bat", wins: 14, losses: 6, games: 20 },
              { name: "Winter Soldier", wins: 8, losses: 11, games: 19 },
            ],
          },
          error: null,
        };
      },
    },
    auth: {
      async getSession() {
        const user = readUser();
        return { data: { session: user ? { user } : null } };
      },
      onAuthStateChange(listener) {
        listeners.add(listener);
        return {
          data: {
            subscription: { unsubscribe: () => listeners.delete(listener) },
          },
        };
      },
      async signUp({ email }) {
        await wait();
        if (email.startsWith("taken"))
          return { data: { user: { identities: [] } }, error: null };
        return { data: { user: makeUser(email), session: null }, error: null };
      },
      async signInWithPassword({ email, password }) {
        await wait();
        if (password === "wrongpass")
          return reject("invalid_credentials", "Invalid login credentials");
        if (email.startsWith("unconfirmed"))
          return reject("email_not_confirmed", "Email not confirmed");
        const user = makeUser(email);
        writeUser(user);
        emit("SIGNED_IN", user);
        return { data: { user }, error: null };
      },
      async signInWithOAuth() {
        await wait();
        const user = makeUser("player@gmail.com");
        writeUser(user);
        emit("SIGNED_IN", user);
        return { data: {}, error: null };
      },
      async resetPasswordForEmail() {
        await wait();
        return { data: {}, error: null };
      },
      async updateUser() {
        await wait();
        return { data: {}, error: null };
      },
      async signOut() {
        writeUser(null);
        emit("SIGNED_OUT", null);
        return { error: null };
      },
    },
  };
}
