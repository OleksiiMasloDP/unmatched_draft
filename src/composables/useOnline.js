import { reactive, computed, ref } from "vue";

const ROOM_PREFIX = "unmatched-draft-";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const JOIN_TIMEOUT = 15000;

const net = reactive({
  status: "idle",
  role: null,
  seat: null,
  code: "",
  error: "",
});

const MODE_KEY = "unmatched_play_mode";

function loadMode() {
  try {
    return localStorage.getItem(MODE_KEY) === "online" ? "online" : "local";
  } catch {
    return "local";
  }
}

const mode = ref(loadMode());

function setMode(next) {
  mode.value = next;
  try {
    localStorage.setItem(MODE_KEY, next);
  } catch {
    return;
  }
}

const messageListeners = new Map();
const eventListeners = { connected: new Set(), closed: new Set() };

let transport = null;
let session = 0;

const online = computed(
  () => net.role !== null && ["connected", "closed"].includes(net.status),
);

function makeCode() {
  return Array.from(
    { length: 5 },
    () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
  ).join("");
}

function useBroadcastTransport() {
  try {
    return (
      new URLSearchParams(window.location.search).get("transport") ===
        "broadcast" ||
      localStorage.getItem("unmatched_transport") === "broadcast"
    );
  } catch {
    return false;
  }
}

function broadcastTransport(role, code, handlers) {
  const id = Math.random().toString(36).slice(2);
  const channel = new BroadcastChannel(`unmatched-room-${code}`);
  let peerId = null;
  let helloTimer = null;
  let timeoutTimer = null;

  const post = (message) => channel.postMessage({ from: id, ...message });

  channel.onmessage = ({ data }) => {
    if (!data || data.from === id) return;

    if (data.kind === "hello" && role === "host") {
      if (peerId && peerId !== data.from) {
        post({ kind: "busy", to: data.from });
        return;
      }
      const isNew = !peerId;
      peerId = data.from;
      post({ kind: "welcome", to: peerId });
      if (isNew) handlers.onOpen();
      return;
    }

    if (data.to !== id && data.kind !== "bye" && data.kind !== "data") return;

    if (data.kind === "welcome" && role === "guest" && !peerId) {
      peerId = data.from;
      clearInterval(helloTimer);
      clearTimeout(timeoutTimer);
      handlers.onOpen();
    } else if (data.kind === "busy") {
      clearInterval(helloTimer);
      clearTimeout(timeoutTimer);
      handlers.onError("room-full");
    } else if (data.kind === "bye" && data.from === peerId) {
      handlers.onClose();
    } else if (data.kind === "data" && data.from === peerId) {
      handlers.onMessage(data.data);
    }
  };

  if (role === "host") {
    queueMicrotask(() => handlers.onReady());
  } else {
    helloTimer = setInterval(() => post({ kind: "hello" }), 300);
    post({ kind: "hello" });
    timeoutTimer = setTimeout(() => {
      clearInterval(helloTimer);
      handlers.onError("peer-unavailable");
    }, 5000);
  }

  return {
    send: (message) => post({ kind: "data", data: message }),
    close: () => {
      clearInterval(helloTimer);
      clearTimeout(timeoutTimer);
      if (peerId) post({ kind: "bye" });
      channel.close();
    },
  };
}

async function peerTransport(role, code, handlers) {
  const { Peer } = await import("peerjs");
  let connection = null;
  let timeoutTimer = null;
  const peer = role === "host" ? new Peer(ROOM_PREFIX + code) : new Peer();

  const attach = (next) => {
    connection = next;
    next.on("open", () => {
      clearTimeout(timeoutTimer);
      handlers.onOpen();
    });
    next.on("data", (data) => handlers.onMessage(data));
    next.on("close", () => handlers.onClose());
    next.on("error", (error) => handlers.onError(error.type || String(error)));
  };

  peer.on("error", (error) => handlers.onError(error.type || String(error)));

  if (role === "host") {
    peer.on("open", () => handlers.onReady());
    peer.on("connection", (next) => {
      if (connection) {
        next.on("open", () => next.close());
        return;
      }
      attach(next);
    });
  } else {
    peer.on("open", () => {
      attach(
        peer.connect(ROOM_PREFIX + code, {
          reliable: true,
          serialization: "json",
        }),
      );
    });
    timeoutTimer = setTimeout(
      () => handlers.onError("peer-unavailable"),
      JOIN_TIMEOUT,
    );
  }

  return {
    send: (message) => {
      if (connection && connection.open) connection.send(message);
    },
    close: () => {
      clearTimeout(timeoutTimer);
      try {
        if (connection) connection.close();
      } catch {
        connection = null;
      }
      peer.destroy();
    },
  };
}

function emit(event, payload) {
  for (const listener of eventListeners[event]) listener(payload);
}

function receive(message) {
  if (!message || typeof message.t !== "string") return;
  const listeners = messageListeners.get(message.t);
  if (!listeners) return;
  for (const listener of listeners) listener(message.p);
}

function teardown() {
  if (transport) {
    try {
      transport.close();
    } catch {
      transport = null;
    }
  }
  transport = null;
}

async function start(role, code) {
  teardown();
  session += 1;
  const mine = session;
  net.role = role;
  net.seat = role === "host" ? "p1" : "p2";
  net.code = code;
  net.error = "";
  net.status = role === "host" ? "creating" : "joining";

  const handlers = {
    onReady: () => {
      if (mine === session) net.status = "hosting";
    },
    onOpen: () => {
      if (mine !== session) return;
      net.status = "connected";
      emit("connected", { role });
    },
    onMessage: (message) => {
      if (mine === session) receive(message);
    },
    onClose: () => {
      if (mine !== session || net.status === "closed") return;
      net.status = "closed";
      emit("closed", { remote: true, role });
    },
    onError: (error) => {
      if (mine !== session) return;
      if (net.status === "connected") return;
      net.status = "error";
      net.error = String(error);
    },
  };

  try {
    transport = useBroadcastTransport()
      ? broadcastTransport(role, code, handlers)
      : await peerTransport(role, code, handlers);
  } catch (error) {
    if (mine === session) {
      net.status = "error";
      net.error = String(error && error.message ? error.message : error);
    }
  }
}

async function host() {
  await start("host", makeCode());
}

async function retryHost() {
  await start("host", makeCode());
}

async function join(code) {
  const clean = String(code || "")
    .trim()
    .toUpperCase();
  if (!clean) return;
  await start("guest", clean);
}

function leave() {
  const wasActive = net.role !== null;
  const role = net.role;
  session += 1;
  teardown();
  net.status = "idle";
  net.role = null;
  net.seat = null;
  net.code = "";
  net.error = "";
  if (wasActive) emit("closed", { remote: false, role });
}

function send(type, payload) {
  if (transport) {
    transport.send(JSON.parse(JSON.stringify({ t: type, p: payload ?? null })));
  }
}

function on(type, listener) {
  if (!messageListeners.has(type)) messageListeners.set(type, new Set());
  messageListeners.get(type).add(listener);
  return () => messageListeners.get(type).delete(listener);
}

function onEvent(event, listener) {
  eventListeners[event].add(listener);
  return () => eventListeners[event].delete(listener);
}

export function useOnline() {
  return {
    net,
    mode,
    setMode,
    online,
    isHost: computed(() => online.value && net.role === "host"),
    isGuest: computed(() => online.value && net.role === "guest"),
    mySeat: computed(() => (online.value ? net.seat : null)),
    host,
    retryHost,
    join,
    leave,
    send,
    on,
    onEvent,
  };
}
