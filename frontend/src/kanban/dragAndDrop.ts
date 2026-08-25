// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: drag-and-drop UI for moving and reordering cards across lists.

// initDragAndDrop wires up drag handlers on the board's DOM (or Svelte component), for both card and list reordering.
function initDragAndDrop(boardContainer: HTMLElement): void {
  // TODO: attach dragstart/dragover/drop handlers (or a Svelte DnD library) to card and list elements
  // TODO: on drop, compute the new list/position and call moveCard / reorderLists optimistically, then reconcile with the server response
}

// handleCardDrop computes the target list/position from a drop event and triggers the card move.
function handleCardDrop(cardId: string, targetListId: string, targetIndex: number): void {
  // TODO: call moveCard(cardId, targetListId, targetIndex) from cardApi.ts
  // TODO: rely on the incoming WS broadcast (Track 2 Person B) to reconcile if another user moved the same card concurrently
}
