<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: one column of the board — editable title, delete button, its cards and the
     "add a card" input. -->
<script lang="ts">
  import AddForm from "./AddForm.svelte";
  import CardItem from "./CardItem.svelte";
  import InlineTitle from "./InlineTitle.svelte";
  import type { BoardStore } from "./boardStore.svelte";
  import type { List } from "./types";

  let { store, list }: { store: BoardStore; list: List } = $props();
</script>

<section class="column">
  <header>
    <InlineTitle
      value={list.title}
      editable={store.canEdit}
      label="Titre de la liste"
      onsave={(title) => store.renameList(list.id, title)}
    />
    {#if store.canEdit}
      <button type="button" class="delete" aria-label="Supprimer la liste" onclick={() => store.removeList(list.id)}>
        ×
      </button>
    {/if}
  </header>

  <div class="cards">
    {#each list.cards as card (card.id)}
      <CardItem {store} {card} />
    {/each}
  </div>

  {#if store.canEdit}
    <AddForm placeholder="+ Ajouter une carte" onadd={(title) => store.addCard(list.id, title)} />
  {/if}
</section>

<style>
  .column {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 16rem;
    flex-shrink: 0;
    max-height: 100%;
    background: linear-gradient(180deg, var(--highlight), transparent 40%), var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.75rem;
    /* Soft, large-radius shadow — an ambient "panel floats a little" cue, not a hard contact shadow. */
    box-shadow: var(--shadow-lg);
    transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-weight: 600;
    font-size: 0.95rem;
  }
  .cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
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
    transition: opacity 0.12s ease, background-color 0.12s ease, color 0.12s ease;
  }
  header:hover .delete,
  .delete:focus-visible {
    opacity: 0.6;
  }
  .delete:hover {
    opacity: 1;
    background: var(--border);
    color: var(--danger);
  }
</style>
