<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the board area — the columns side by side and the "add a list" input. -->
<script lang="ts">
  import AddForm from "./AddForm.svelte";
  import ListColumn from "./ListColumn.svelte";
  import type { BoardStore } from "./boardStore.svelte";

  let { store }: { store: BoardStore } = $props();
</script>

<div class="board">
  {#if store.board}
    {#each store.board.lists as list (list.id)}
      <ListColumn {store} {list} />
    {/each}

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
  .add-list {
    width: 16rem;
    flex-shrink: 0;
  }
  .empty {
    color: var(--text-muted);
    font-size: 0.9rem;
  }
</style>
