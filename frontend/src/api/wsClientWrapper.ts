// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the low-level, feature-agnostic Socket.IO connection wrapper (connect/reconnect/emit) that Track 2 Person B's Kanban-specific client builds on.
//
// Stack pivot note: the backend's real-time layer is Socket.IO (backend/src/modules/kanban/hub.ts), not a
// raw WebSocket server, so this wrapper is built on the `socket.io-client` package rather than the native
// browser WebSocket API — Socket.IO's own protocol (rooms, auto-reconnect, fallback transports) requires
// its matching client.
import { io, Socket } from "socket.io-client";

type MessageHandler = (event: string, data: unknown) => void;

// createSocketConnection opens a Socket.IO connection to the backend hub and returns a handle for emitting/subscribing.
function createSocketConnection(url: string, authToken: string): {
  emit: (event: string, data: unknown) => void;
  onAny: (handler: MessageHandler) => void;
  disconnect: () => void;
} {
  // TODO: call io(url, { auth: { token: authToken } }) — Socket.IO's built-in reconnection (with backoff) replaces
  //       the manual reconnect logic a raw WebSocket wrapper would need
  // TODO: expose emit/onAny/disconnect so feature-specific clients (e.g. kanban/wsClient.ts) don't touch the raw Socket instance
  throw new Error("not implemented");
}
