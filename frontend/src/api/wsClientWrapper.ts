// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: the low-level, feature-agnostic WebSocket connection wrapper
// (connect/reconnect/send). Originally planned under Track 1 in the file structure draft,
// consolidated here so all WS client logic has a single owner instead of being split
// across two people/tracks.

type MessageHandler = (data: unknown) => void;

// createWebSocketConnection opens a WS connection to the backend hub and returns a handle
// for sending/subscribing. Feature-specific clients (e.g. the Kanban client below) build on
// this rather than touching the raw socket directly.
function createWebSocketConnection(url: string): {
  send: (data: unknown) => void;
  onMessage: (handler: MessageHandler) => void;
  close: () => void;
} {
  // TODO: open the WebSocket, attach the auth token (query param or first message)
  // TODO: implement automatic reconnect with backoff on unexpected close
  // TODO: on reconnect, signal the caller so they can re-fetch current state rather than
  //       assuming the socket resumed cleanly, per the plan's reconnection-handling note
  throw new Error("not implemented");
}