// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: the Kanban-specific WebSocket message handler, built on the shared connection wrapper, updating the DOM to match incoming broadcasts.

// connectKanbanSocket opens (or reuses) the WS connection for a project and wires up Kanban message handling.
function connectKanbanSocket(projectId: string): void {
  // TODO: open the connection via frontend/src/api/wsClientWrapper.ts's createWebSocketConnection
  // TODO: register onMessage(handleKanbanEvent)
}

// handleKanbanEvent applies an incoming "card_created"/"card_updated"/"card_moved"/"card_deleted" event to the DOM/state.
function handleKanbanEvent(event: { type: string; payload: unknown }): void {
  // TODO: switch on event.type and patch local board state accordingly, without a full re-fetch
  // TODO: this must stay correct under concurrent multi-user edits per the mandatory multi-user requirement
}
