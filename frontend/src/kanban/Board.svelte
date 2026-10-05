<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the board area — the columns side by side and the "add a list" input. It is also
     the drop zone for reordering the lists: a line shows where the dragged list will land. -->
<script lang="ts">
  import AddForm from "./AddForm.svelte";
  import ListColumn from "./ListColumn.svelte";
  import { insertionIndex, othersBefore } from "./dnd";
  import type { BoardStore } from "./boardStore.svelte";

  let { store }: { store: BoardStore } = $props();

  let boardEl: HTMLElement;
  // index (among the lists without the dragged one) where a dragged list would land, null when none is dragged
  let dropIndex = $state<number | null>(null);

  const listIds = $derived(store.board?.lists.map((l) => l.id) ?? []);
  const othersCount = $derived(listIds.filter((id) => id !== store.drag?.id).length);

  function onDragOver(event: DragEvent): void {
    if (store.drag?.kind !== "list" || !store.canEdit) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    dropIndex = insertionIndex(boardEl, "[data-id].column-slot", event.clientX, "x", store.drag.id);
  }

  function onDragLeave(event: DragEvent): void {
    if (!boardEl.contains(event.relatedTarget as Node | null)) dropIndex = null;
  }

  function onDrop(event: DragEvent): void {
    if (store.drag?.kind !== "list" || !store.canEdit) return;
    event.preventDefault();
    const listId = store.drag.id;
    const index = dropIndex ?? othersCount;
    dropIndex = null;
    store.drag = null;
    void store.moveList(listId, index);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="board"
  bind:this={boardEl}
  ondragover={onDragOver}
  ondragleave={onDragLeave}
  ondrop={onDrop}
>
  {#if store.board}
    {#each store.board.lists as list, i (list.id)}
      {#if dropIndex !== null && list.id !== store.drag?.id && othersBefore(listIds, i, store.drag?.id) === dropIndex}
        <div class="drop-line"></div>
      {/if}
      <div class="column-slot" data-id={list.id}>
        <ListColumn {store} {list} />
      </div>
    {/each}
    {#if dropIndex !== null && dropIndex >= othersCount}
      <div class="drop-line"></div>
    {/if}

    {#if store.canEdit}
      <div class="add-list">
        <AddForm placeholder="+ Ajouter une liste" onadd={(title) => store.addList(title)} />
      </div>
    {:else if store.board.lists.length === 0}
      <p class="empty">Ce board est vide.</p>
    {/if}
  {/if}
</div>

<style>
  .board {
    flex: 1;
    overflow: auto;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    padding: 1.25rem;
    background: var(--bg-main);
    transition: background-color 0.15s ease;
  }
  /* wraps a column so the list drop position can be measured on the slot; the column keeps its own width */
  .column-slot {
    display: flex;
    max-height: 100%;
  }
  .drop-line {
    width: 3px;
    align-self: stretch;
    border-radius: 2px;
    background: var(--accent);
    flex-shrink: 0;
  }
  .add-list {
    width: 16rem;
    flex-shrink: 0;
  }
  .empty {
    color: var(--text-muted);
    font-size: 0.9rem;
  }
</style>
