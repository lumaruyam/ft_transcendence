<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: one card in a list — editable title, a button opening its detail, delete
     button, and the drag source for moving it between lists. -->
<script lang="ts">
  import InlineTitle from "./InlineTitle.svelte";
  import type { BoardStore } from "./boardStore.svelte";
  import type { Card } from "./types";

  let { store, card }: { store: BoardStore; card: Card } = $props();

  function onDragStart(event: DragEvent): void {
    if (!event.dataTransfer) return;
    // Firefox only starts a drag when some data is set
    event.dataTransfer.setData("text/plain", card.id);
    event.dataTransfer.effectAllowed = "move";
    store.drag = { kind: "card", id: card.id };
  }
</script>

<div
  class="card"
  class:dragging={store.drag?.id === card.id}
  data-id={card.id}
  role="listitem"
  draggable={store.canEdit}
  ondragstart={onDragStart}
  ondragend={() => (store.drag = null)}
>
  <InlineTitle
    value={card.title}
    editable={store.canEdit}
    label="Titre de la carte"
    onsave={(title) => store.editCard(card.id, { title })}
  />
  <button type="button" class="action" aria-label="Ouvrir la carte" onclick={() => (store.openCardId = card.id)}>⋯</button>
  {#if store.canEdit}
    <button type="button" class="action delete" aria-label="Supprimer la carte" onclick={() => store.removeCard(card.id)}>
      ×
    </button>
  {/if}
</div>

<style>
  .card {
    display: flex;
    align-items: center;
    padding: 0.35rem 0.25rem 0.35rem 0.4rem;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 6px;
    /* Inset rather than a drop shadow — cards read as set into the column, not floating above it. */
    box-shadow: var(--shadow-inset);
    transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.12s ease;
  }
  .card[draggable="true"] {
    cursor: grab;
  }
  .card:hover {
    border-color: var(--accent);
  }
  .card.dragging {
    opacity: 0.4;
  }
  .action {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-muted);
    opacity: 0;
    font-size: 1rem;
    line-height: 1;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    border-radius: 5px;
    transition: opacity 0.12s ease, background-color 0.12s ease, color 0.12s ease;
  }
  /* Hidden until you hover the card (or tab to the button), not shown at rest. */
  .card:hover .action,
  .action:focus-visible {
    opacity: 0.6;
  }
  .action:hover {
    opacity: 1;
    background: var(--border);
  }
  .action.delete:hover {
    color: var(--danger);
  }
</style>
