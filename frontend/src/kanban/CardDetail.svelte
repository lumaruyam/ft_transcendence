<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the card detail dialog — title, description, which list the card is in (changing
     it moves the card, a keyboard-friendly alternative to drag-and-drop), the Git branch / PR linked by
     the git integration, and delete. It follows live updates of the card and closes if the card is
     deleted by someone else. -->
<script lang="ts">
  import InlineTitle from "./InlineTitle.svelte";
  import type { BoardStore } from "./boardStore.svelte";

  let { store }: { store: BoardStore } = $props();

  let dialog: HTMLDialogElement;
  const open = $derived(store.openCard);

  // description draft: follows the card until the user starts typing
  let description = $state("");
  let editingDescription = $state(false);

  $effect(() => {
    if (!editingDescription) description = open?.card.description ?? "";
  });

  // open / close the native dialog when a card gets selected / unselected
  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  async function saveDescription(): Promise<void> {
    editingDescription = false;
    if (!open || description === (open.card.description ?? "")) return;
    if (!(await store.editCard(open.card.id, { description }))) description = open.card.description ?? "";
  }

  async function onMove(event: Event & { currentTarget: HTMLSelectElement }): Promise<void> {
    if (!open) return;
    const target = store.board?.lists.find((l) => l.id === event.currentTarget.value);
    // moving into another list puts the card at the end of it
    if (target && target.id !== open.list.id) await store.moveCard(open.card.id, target.id, target.cards.length);
  }

  async function onDelete(): Promise<void> {
    if (!open) return;
    const id = open.card.id;
    store.openCardId = null;
    await store.removeCard(id);
  }

  // PR links come from webhook payloads: only link real http(s) URLs
  function safeUrl(url: string | null | undefined): string | null {
    try {
      const parsed = new URL(url ?? "");
      return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
    } catch {
      return null;
    }
  }
</script>

<dialog
  bind:this={dialog}
  aria-label="Détail de la carte"
  onclose={() => (store.openCardId = null)}
  onclick={(event) => {
    // a click on the backdrop (the dialog element itself, not its content) closes it
    if (event.target === dialog) dialog.close();
  }}
>
  {#if open}
    <div class="content">
      <div class="title">
        <InlineTitle
          value={open.card.title}
          editable={store.canEdit}
          label="Titre de la carte"
          onsave={(title) => store.editCard(open.card.id, { title })}
        />
        <button type="button" class="close" aria-label="Fermer" onclick={() => dialog.close()}>×</button>
      </div>

      <label class="field">
        <span>Liste</span>
        <select value={open.list.id} disabled={!store.canEdit} onchange={onMove}>
          {#each store.board?.lists ?? [] as list (list.id)}
            <option value={list.id}>{list.title}</option>
          {/each}
        </select>
      </label>

      <label class="field">
        <span>Description</span>
        <textarea
          bind:value={description}
          readonly={!store.canEdit}
          rows="6"
          placeholder={store.canEdit ? "Ajouter une description…" : ""}
          onfocus={() => (editingDescription = true)}
          onblur={saveDescription}
        ></textarea>
      </label>

      {#if open.card.linkedBranch || open.card.linkedPrUrl}
        <div class="git">
          {#if open.card.linkedBranch}
            <div><span class="muted">Branche</span> <code>{open.card.linkedBranch}</code></div>
          {/if}
          {#if safeUrl(open.card.linkedPrUrl)}
            <div><span class="muted">Pull request</span> <a href={safeUrl(open.card.linkedPrUrl)} target="_blank" rel="noopener noreferrer">{open.card.linkedPrUrl}</a></div>
          {/if}
        </div>
      {/if}

      {#if store.canEdit}
        <div class="footer">
          <button type="button" class="delete" onclick={onDelete}>Supprimer la carte</button>
        </div>
      {/if}
    </div>
  {/if}
</dialog>

<style>
  dialog {
    margin: auto;
    width: min(32rem, calc(100vw - 2rem));
    padding: 0;
    background: var(--bg-elevated);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-lg);
  }
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
  .content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 1.25rem 1.25rem;
  }
  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.1rem;
    font-weight: 600;
  }
  .close {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 1.3rem;
    line-height: 1;
    cursor: pointer;
  }
  .close:hover {
    color: var(--text);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  select,
  textarea {
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font: inherit;
    font-size: 0.9rem;
    padding: 0.5rem 0.65rem;
  }
  textarea {
    resize: vertical;
  }
  select:focus,
  textarea:focus {
    outline: 2px solid var(--accent);
  }
  .git {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.85rem;
    overflow-wrap: anywhere;
  }
  .muted {
    color: var(--text-muted);
  }
  a {
    color: var(--accent);
  }
  .footer {
    display: flex;
    justify-content: flex-end;
  }
  .delete {
    background: none;
    border: 1px solid var(--danger);
    border-radius: 6px;
    color: var(--danger);
    font: inherit;
    font-size: 0.85rem;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
  }
  .delete:hover {
    background: var(--danger);
    color: #fff;
  }
</style>
