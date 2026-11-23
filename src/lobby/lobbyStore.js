import { computed, reactive, ref, watch } from "vue";
import { useOnline } from "../composables/useOnline";
import { authDemo } from "../cloud/client";
import { user } from "../cloud/useAuth";
import { profile } from "../profile/profileStore";

const KEY = "unmatchedLobbyTables";
const GUEST_KEY = "unmatchedGuestName";
const TTL = 30000;
const BEAT = 10000;

const { net, host, join, leave, setMode } = useOnline();

export const lobby = reactive({ list: [] });
export const mine = ref(null);

const demoEnabled = () => {
  try {
    return (
      authDemo ||
      new URLSearchParams(window.location.search).get("lobbydemo") === "1"
    );
  } catch {
    return false;
  }
};

const demoTables = () => {
  const now = Date.now();
  return [
    ["Evening duels", "Mira", false, "open", 2],
    ["Newbies welcome", "Oleh", false, "open", 5],
    ["Roguelike warmup", "Kate", true, "open", 9],
    ["Ranked practice", "Dmytro", true, "playing", 14],
    ["Sinbad vs everyone", "Anton", false, "open", 1],
    ["Late night draft", "Sofia", true, "open", 22],
  ].map(([name, hostName, hasPassword, status, minutes], index) => ({
    id: `demo-${index}`,
    code: "DEMO",
    name,
    hostName,
    hasPassword,
    passHash: "",
    status,
    demo: true,
    createdAt: now - minutes * 60000,
    updatedAt: now,
  }));
};

const read = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY)) || [];
    const now = Date.now();
    return list.filter((item) => now - item.updatedAt < TTL);
  } catch {
    return [];
  }
};

const write = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    return;
  }
};

let channel = null;
try {
  channel = new BroadcastChannel("unmatched-lobby");
} catch {
  channel = null;
}

export const refresh = () => {
  const real = read();
  const all = demoEnabled() ? [...real, ...demoTables()] : real;
  lobby.list = all.sort((a, b) => b.createdAt - a.createdAt);
};

const commit = (list) => {
  write(list);
  if (channel) channel.postMessage("changed");
  refresh();
};

const upsert = (record) => {
  const list = read().filter((item) => item.id !== record.id);
  list.push(record);
  commit(list);
};

const drop = (id) => {
  commit(read().filter((item) => item.id !== id));
};

if (channel) channel.onmessage = refresh;
try {
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) refresh();
  });
} catch {
  channel = null;
}

const hash = async (text, salt) => {
  const raw = `${salt}:${text}`;
  try {
    const bytes = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return btoa(unescape(encodeURIComponent(raw)));
  }
};

const guestName = () => {
  try {
    let name = localStorage.getItem(GUEST_KEY);
    if (!name) {
      name = `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem(GUEST_KEY, name);
    }
    return name;
  } catch {
    return "Guest";
  }
};

export const playerName = computed(() =>
  user.value && profile.nick ? profile.nick : guestName(),
);

export const createTable = async ({ name, password, kind }) => {
  const clean = String(name || "")
    .trim()
    .slice(0, 32);
  if (!clean) return false;
  const id = Math.random().toString(36).slice(2, 10);
  const pass = String(password || "");
  mine.value = {
    id,
    code: "",
    name: clean,
    kind: kind || "game",
    hostName: playerName.value,
    hasPassword: Boolean(pass),
    passHash: pass ? await hash(pass, id) : "",
    status: "open",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  setMode("online");
  await host();
  return true;
};

export const closeMine = () => {
  if (mine.value) drop(mine.value.id);
  mine.value = null;
  leave();
};

export const joinTable = async (table, password) => {
  if (table.demo) return { ok: false, reason: "demo" };
  if (table.status !== "open") return { ok: false, reason: "closed" };
  if (table.hasPassword) {
    const attempt = await hash(String(password || ""), table.id);
    if (attempt !== table.passHash) return { ok: false, reason: "password" };
  }
  setMode("online");
  await join(table.code);
  return { ok: true };
};

watch(
  () => [net.status, net.code],
  ([status, code]) => {
    const table = mine.value;
    if (!table) return;
    if (status === "hosting" && code) {
      table.code = code;
      table.status = "open";
      table.updatedAt = Date.now();
      upsert({ ...table });
    } else if (status === "connected") {
      table.status = "playing";
      table.updatedAt = Date.now();
      upsert({ ...table });
    } else if (["idle", "closed", "error"].includes(status)) {
      drop(table.id);
      mine.value = null;
    }
  },
);

setInterval(() => {
  const table = mine.value;
  if (table && table.code) {
    table.updatedAt = Date.now();
    upsert({ ...table });
  } else {
    refresh();
  }
}, BEAT);

try {
  window.addEventListener("beforeunload", () => {
    if (mine.value) drop(mine.value.id);
  });
} catch {
  channel = null;
}

refresh();
