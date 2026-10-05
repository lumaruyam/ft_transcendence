<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: one card in a list — editable title and delete button. -->
<script lang="ts">
  import InlineTitle from "./InlineTitle.svelte";
  import type { BoardStore } from "./boardStore.svelte";
  import type { Card } from "./types";

  let { store, card }: { store: BoardStore; card: Card } = $props();
</script>

<div class="card">
  <InlineTitle
    value={card.title}
    editable={store.canEdit}
    label="Titre de la carte"
    onsave={(title) => store.editCard(card.id, { title })}
  />
  {#if store.canEdit}
    <button type="button" class="delete" aria-label="Supprimer la carte" onclick={() => store.removeCard(card.id)}>
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
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }
  .card:hover {
    border-color: var(--accent);
  }
  .delete {
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
    margin-right: 0.15rem;
    transition: opacity 0.12s ease, background-color 0.12s ease, color 0.12s ease;
  }
  /* Hidden until you hover the card (or tab to the button), not shown at rest. */
  .card:hover .delete,
  .delete:focus-visible {
    opacity: 0.6;
  }
  .delete:hover {
    opacity: 1;
    background: var(--border);
    color: var(--danger);
  }
</style>
