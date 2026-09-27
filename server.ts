import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import { SESSION_COOKIE } from "@/src/server/auth/constants";
import { authenticateSessionToken } from "@/src/server/auth/session-token";
import { realtimeHub } from "@/src/server/realtime/hub";
function cookieValue(header: string | undefined, name: string) {
  for (const entry of header?.split(";") ?? []) {
    const [key, ...value] = entry.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}
async function main() {
  const dev = process.env.NODE_ENV !== "production";
  const hostname = process.env.HOSTNAME ?? "0.0.0.0";
  const port = Number(process.env.PORT ?? 3000);
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();
  await app.prepare();
  const server = createServer((request, response) => handle(request, response));
  const websocketServer = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });
  server.on("upgrade", async (request, socket, head) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
      if (url.pathname !== "/api/realtime") {
        socket.destroy();
        return;
      }
      const configuredOrigin = process.env.APP_URL ? new URL(process.env.APP_URL).origin : null;
      const requestOrigin = request.headers.origin;
      if (configuredOrigin && requestOrigin && requestOrigin !== configuredOrigin) {
        socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }
      const token = cookieValue(request.headers.cookie, SESSION_COOKIE);
      const user = token ? await authenticateSessionToken(token) : null;
      if (!user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }
      websocketServer.handleUpgrade(request, socket, head, (websocket) =>
        websocketServer.emit("connection", websocket, user.id),
      );
    } catch {
      socket.destroy();
    }
  });
  websocketServer.on("connection", (websocket: WebSocket, userId: string) => {
    const id = randomUUID();
    const peer = {
      id,
      userId,
      isAlive: true,
      send: (data: string) => {
        if (websocket.bufferedAmount > 1_000_000) {
          websocket.close(4002, "Realtime backpressure limit exceeded");
          return;
        }
        if (websocket.readyState === WebSocket.OPEN) websocket.send(data);
      },
      close: (code: number, reason: string) => websocket.close(code, reason),
      ping: () => websocket.ping(),
    };
    realtimeHub.connect(peer);
    websocket.on("message", (data) => realtimeHub.message(id, data.toString()));
    websocket.on("pong", () => {
      peer.isAlive = true;
    });
    websocket.on("close", () => realtimeHub.disconnect(id));
    websocket.on("error", () => realtimeHub.disconnect(id));
  });
  const heartbeat = setInterval(() => realtimeHub.heartbeat(), 30_000);
  heartbeat.unref();
  server.listen(port, hostname, () =>
    console.log(`Trading platform listening on http://${hostname}:${port}`),
  );
  const shutdown = () => {
    clearInterval(heartbeat);
    websocketServer.close();
    server.close(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
void main().catch((error) => {
  console.error("Failed to start trading platform", error);
  process.exit(1);
});
