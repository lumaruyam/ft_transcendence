// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the low-level, feature-agnostic Socket.IO connection wrapper (connect/reconnect/emit) that Track 2 Person B's Kanban-specific client builds on

import { io } from "socket.io-client";

type MessageHandler = (event: string, data: unknown) => void;

export interface SocketConnection {
	emit: (event: string, data: unknown) => void;
	onAny: (handler: MessageHandler) => void;// onAny receives every server event as (eventName, firstPayloadArgument)
	// onConnect fires on the first connect AND on every automatic reconnect. Socket.IO rooms live on the
	// server-side socket, so a reconnect lands in no room: feature clients must re-emit their join event
	// (e.g. kanban's "join_project") from this callback, not just once after creating the connection
	onConnect: (handler: () => void) => void;
	onConnectError: (handler: (error: Error) => void) => void;// onConnectError fires when a connection attempt fails
	disconnect: () => void;
}

// createSocketConnection opens a Socket.IO connection to the backend hub and returns a handle for emitting/subscribing
// url is the server origin (pass window.location.origin).
// The JWT travels in the handshake auth payload (socket.handshake.auth.token); hub.ts does not verify it
// yet (TODO there), so until it does, the backend accepts any connection.
export function createSocketConnection(url: string, authToken: string): SocketConnection {
	// Socket.IO's built-in reconnection (with backoff) replaces the manual reconnect logic a raw WebSocket wrapper would need
	const socket = io(url, { auth: { token: authToken }});

	return {
		emit: (event, data) => {
			socket.emit(event, data);
		},
		onAny: (handler) => {
			socket.onAny((event: string, ...args: unknown[]) => handler(event, args[0]));
		},
		onConnect: (handler) => {
			socket.on("connect", handler);
		},
		onConnectError: (handler) => {
			socket.on("connect_error", handler);
		},
		disconnect: () => {
			socket.disconnect();
		},
	};
}
