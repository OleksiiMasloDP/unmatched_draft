export class Room {
  constructor(state) {
    this.state = state;
  }

  sockets(role) {
    return this.state
      .getWebSockets(role)
      .filter((socket) => socket.readyState === 1);
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const role = new URL(request.url).searchParams.get("role");
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    if (role === "host") {
      if (this.sockets("host").length) {
        this.state.acceptWebSocket(server, ["rejected"]);
        server.send(JSON.stringify({ t: "error", e: "unavailable-id" }));
        server.close(1000, "taken");
      } else {
        this.state.acceptWebSocket(server, ["host"]);
        server.send(JSON.stringify({ t: "ready" }));
      }
    } else if (!this.sockets("host").length) {
      this.state.acceptWebSocket(server, ["rejected"]);
      server.send(JSON.stringify({ t: "error", e: "peer-unavailable" }));
      server.close(1000, "no host");
    } else if (this.sockets("guest").length) {
      this.state.acceptWebSocket(server, ["rejected"]);
      server.send(JSON.stringify({ t: "error", e: "room-full" }));
      server.close(1000, "full");
    } else {
      this.state.acceptWebSocket(server, ["guest"]);
      const open = JSON.stringify({ t: "open" });
      server.send(open);
      for (const host of this.sockets("host")) host.send(open);
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket, message) {
    const [tag] = this.state.getTags(socket);
    if (tag !== "host" && tag !== "guest") return;
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }
    if (parsed.t === "ping") {
      socket.send(JSON.stringify({ t: "pong" }));
      return;
    }
    if (parsed.t !== "msg") return;
    const target = tag === "host" ? "guest" : "host";
    for (const other of this.sockets(target)) other.send(message);
  }

  webSocketClose(socket) {
    this.release(socket);
  }

  webSocketError(socket) {
    this.release(socket);
  }

  release(socket) {
    const [tag] = this.state.getTags(socket);
    if (tag !== "host" && tag !== "guest") return;
    const target = tag === "host" ? "guest" : "host";
    for (const other of this.sockets(target)) {
      other.send(JSON.stringify({ t: "closed" }));
      if (tag === "host") other.close(1000, "host left");
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/room\/([A-Z0-9]{3,12})$/);
    if (!match) {
      return new Response("unmatched-draft relay", { status: 200 });
    }
    const id = env.ROOM.idFromName(match[1]);
    return env.ROOM.get(id).fetch(request);
  },
};
