// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: presence indicators (who's currently viewing this project) and reconnection handling, on top of Socket.IO.

// handlePresenceEvent updates the presence indicator UI on an incoming "joined"/"left" event.
function handlePresenceEvent(event: { userId: string; status: "joined" | "left" }): void {
  // TODO: add/remove the user from the visible "online now" avatar list
}

// handleReconnect re-fetches current board state after the Socket.IO client's "connect" event fires again, rather than assuming it resumed cleanly.
async function handleReconnect(projectId: string): Promise<void> {
  // TODO: hook this into the socket's "connect" event (fired again on Socket.IO's automatic reconnect)
  // TODO: re-fetch the board via boardApi.fetchBoard and reconcile local state
  // TODO: re-emit "join_project" to rejoin the project's Socket.IO room
}
