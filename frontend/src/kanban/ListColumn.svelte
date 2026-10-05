<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: one column of the board — editable title, delete button, its cards and the
     "add a card" input. The header is the drag handle to reorder lists; the column accepts dropped
     cards, with a line showing where the card will land. -->
<script lang="ts">
  import AddForm from "./AddForm.svelte";
  import CardItem from "./CardItem.svelte";
  import InlineTitle from "./InlineTitle.svelte";
  import { insertionIndex, othersBefore } from "./dnd";
  import type { BoardStore } from "./boardStore.svelte";
  import type { List } from "./types";

  let { store, list }: { store: BoardStore; list: List } = $props();

  let column: HTMLElement;
  let cardsEl: HTMLElement;
  // index (among the cards without the dragged one) where a dragged card would land, null when none is over us
  let dropIndex = $state<number | null>(null);

  const cardIds = $derived(list.cards.map((c) => c.id));
  const othersCount = $derived(cardIds.filter((id) => id !== store.drag?.id).length);

  function onHeaderDragStart(event: DragEvent): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData("text/plain", list.id);
    event.dataTransfer.effectAllowed = "move";
    // drag the whole column, not just its header
    event.dataTransfer.setDragImage(column, 20, 20);
    store.drag = { kind: "list", id: list.id };
  }

  function onDragOver(event: DragEvent): void {
    if (store.drag?.kind !== "card" || !store.canEdit) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    dropIndex = insertionIndex(cardsEl, "[data-id]", event.clientY, "y", store.drag.id);
  }

  function onDragLeave(event: DragEvent): void {
    // only reset when the pointer leaves the column, not when it moves between its children
    if (!column.contains(event.relatedTarget as Node | null)) dropIndex = null;
  }

  function onDrop(event: DragEvent): void {
    if (store.drag?.kind !== "card" || !store.canEdit) return;
    event.preventDefault();
    const cardId = store.drag.id;
    const index = dropIndex ?? othersCount;
    dropIndex = null;
    store.drag = null;
    void store.moveCard(cardId, list.id, index);
  }
</script>

<!-- the column is a drop zone for cards: dragging has no keyboard equivalent here, the card dialog
     offers a "move to list" menu for that -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
  class="column"
  class:dragging={store.drag?.kind === "list" && store.drag.id === list.id}
  data-id={list.id}
  bind:this={column}
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  ondrop={onDrop}
>
  <header draggable={store.canEdit} ondragstart={onHeaderDragStart} ondragend={() => (store.drag = null)}>
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

  <div class="cards" role="list" bind:this={cardsEl}>
    {#each list.cards as card, i (card.id)}
      {#if dropIndex !== null && card.id !== store.drag?.id && othersBefore(cardIds, i, store.drag?.id) === dropIndex}
        <div class="drop-line"></div>
      {/if}
      <CardItem {store} {card} />
    {/each}
    {#if dropIndex !== null && dropIndex >= othersCount}
      <div class="drop-line"></div>
    {/if}
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
    transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.12s ease;
  }
  .column.dragging {
    opacity: 0.45;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-weight: 600;
    font-size: 0.95rem;
  }
  header[draggable="true"] {
    cursor: grab;
  }
  .cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
    /* keeps an empty list droppable */
    min-height: 2rem;
  }
  .drop-line {
    height: 3px;
    border-radius: 2px;
    background: var(--accent);
    flex-shrink: 0;
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
