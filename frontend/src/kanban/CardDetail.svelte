<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the card dialog: title, description (autosaved), list, git info and delete. -->
<script lang="ts">
  import { toast } from "../shared/toast.svelte";
  import { formatDateTime, timeAgo } from "../shared/format";
  import Icon from "../shared/ui/Icon.svelte";
  import InlineTitle from "./InlineTitle.svelte";
  import type { BoardStore } from "./boardStore.svelte";

  let { store }: { store: BoardStore } = $props();

  const AUTOSAVE_MS = 900;

  let dialog: HTMLDialogElement;
  const open = $derived(store.openCard);

  // description draft: mirrors the card until the user types
  let description = $state("");
  let typing = $state(false);
  let saveState = $state<"idle" | "saving" | "saved">("idle");
  let timer: ReturnType<typeof setTimeout> | undefined;
  let savedTimer: ReturnType<typeof setTimeout> | undefined;
  // card the draft belongs to
  let draftCardId: string | null = null;

  const dirty = $derived(!!open && description !== (open.card.description ?? ""));

  // not typing: follow the card, including live edits
  $effect(() => {
    if (!typing) description = open?.card.description ?? "";
  });

  // another card opened: reset the draft
  $effect(() => {
    void open?.card.id;
    typing = false;
    saveState = "idle";
  });

  $effect(() => {
    draftCardId = open?.card.id ?? null;
  });

  // open or close the dialog with the selected card
  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  // autosave shortly after the last keystroke
  $effect(() => {
    void description;
    clearTimeout(timer);
    if (dirty && typing) timer = setTimeout(() => void save(), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  });

  async function save(): Promise<void> {
    clearTimeout(timer);
    const card = open?.card;
    if (!card || card.id !== draftCardId || description === (card.description ?? "")) return;
    saveState = "saving";
    const ok = await store.editCard(card.id, { description });
    if (ok) {
      typing = false;
      saveState = "saved";
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => (saveState = "idle"), 2200);
    } else {
      saveState = "idle";
    }
  }

  async function close(): Promise<void> {
    await save();
    store.openCardId = null;
  }

  async function onMove(event: Event & { currentTarget: HTMLSelectElement }): Promise<void> {
    if (!open) return;
    const target = store.board?.lists.find((l) => l.id === event.currentTarget.value);
    // moving to another list puts the card last
    if (target && target.id !== open.list.id) await store.moveCard(open.card.id, target.id, target.cards.length);
  }

  function onDelete(): void {
    if (open) store.removeCard(open.card.id);
  }

  async function copyLink(): Promise<void> {
    if (!open || !store.project) return;
    const url = `${location.origin}/app/${store.project.id}?card=${open.card.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Lien de la carte copié", { kind: "success" });
    } catch {
      toast("Copie impossible : copiez l'adresse depuis la barre du navigateur.", { kind: "error" });
    }
  }

  function onKeydownInDescription(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void save();
    }
  }

  // only link http(s) URLs
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
  class="modal"
  bind:this={dialog}
  aria-label="Détail de la carte"
  oncancel={(event) => {
    // Escape: save first, then close
    event.preventDefault();
    void close();
  }}
  onclose={() => (store.openCardId = null)}
  onclick={(event) => {
    // a click on the backdrop closes it
    if (event.target === dialog) void close();
  }}
>
  {#if open}
    <div class="head">
      <span class="where">Dans la liste <strong>{open.list.title}</strong></span>
      <div class="head-actions">
        <button type="button" class="icon-btn" aria-label="Copier le lien de la carte" title="Copier le lien" onclick={copyLink}>
          <Icon name="link" size={17} />
        </button>
        <button type="button" class="icon-btn" aria-label="Fermer" onclick={close}><Icon name="x" size={18} /></button>
      </div>
    </div>

    <div class="body">
      <div class="main">
        <InlineTitle
          large
          value={open.card.title}
          editable={store.canEdit}
          label="Titre de la carte"
          onsave={(title) => store.editCard(open.card.id, { title })}
        />

        <div class="field">
          <div class="label-row">
            <label for="card-description">Description</label>
            <span class="save" aria-live="polite">
              {#if saveState === "saving"}Enregistrement…{:else if saveState === "saved"}<Icon name="check" size={13} /> Enregistré{:else if dirty && store.canEdit}Modifications non enregistrées{/if}
            </span>
          </div>
          <textarea
            id="card-description"
            class="input"
            bind:value={description}
            readonly={!store.canEdit}
            rows="7"
            placeholder={store.canEdit ? "Ajoutez du contexte, des liens, des critères d'acceptation…" : "Aucune description."}
            oninput={() => (typing = true)}
            onblur={() => void save()}
            onkeydown={onKeydownInDescription}
          ></textarea>
          {#if store.canEdit}<span class="hint">Enregistrement automatique · <kbd>Ctrl</kbd> + <kbd>Entrée</kbd> pour enregistrer tout de suite</span>{/if}
        </div>

        {#if open.card.linkedBranch || open.card.linkedPrUrl}
          <div class="git">
            <div class="label">Git</div>
            {#if open.card.linkedBranch}
              <div class="git-row"><Icon name="branch" size={16} /> <code>{open.card.linkedBranch}</code></div>
            {/if}
            {#if safeUrl(open.card.linkedPrUrl)}
              <a class="git-row" href={safeUrl(open.card.linkedPrUrl)} target="_blank" rel="noopener noreferrer">
                <Icon name="external" size={16} /> <span>Pull request</span>
              </a>
            {/if}
          </div>
        {/if}
      </div>

      <aside class="side">
        <div class="field">
          <label for="card-list">Liste</label>
          <select id="card-list" class="input" value={open.list.id} disabled={!store.canEdit} onchange={onMove}>
            {#each store.board?.lists ?? [] as list (list.id)}
              <option value={list.id}>{list.title}</option>
            {/each}
          </select>
        </div>

        {#if open.card.status && open.card.status.toLowerCase() !== "todo"}
          <div class="field">
            <span class="label">Statut</span>
            <span class="chip chip-accent status">{open.card.status}</span>
          </div>
        {/if}

        <div class="dates">
          {#if open.card.createdAt}<div><Icon name="clock" size={14} /> Créée le {formatDateTime(open.card.createdAt)}</div>{/if}
          {#if open.card.updatedAt && open.card.updatedAt !== open.card.createdAt}<div>Modifiée {timeAgo(open.card.updatedAt)}</div>{/if}
        </div>

        {#if store.canEdit}
          <button type="button" class="btn btn-danger btn-sm del" onclick={onDelete}><Icon name="trash" size={15} /> Supprimer</button>
        {:else}
          <div class="chip">Lecture seule</div>
        {/if}
      </aside>
    </div>
  {/if}
</dialog>

<style>
  dialog {
    width: min(760px, calc(100vw - 24px));
    max-height: calc(100vh - 32px);
    overflow: auto;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px 0 24px;
  }
  .where {
    font-size: 0.82rem;
    color: var(--text-faint);
  }
  .where strong {
    color: var(--text-soft);
    font-weight: 650;
  }
  .head-actions {
    display: flex;
    gap: 2px;
  }
  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 210px;
    gap: 28px;
    padding: 12px 24px 24px;
  }
  .main {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 6px;
  }
  .label-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }
  .save {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.78rem;
    color: var(--text-faint);
  }
  textarea {
    min-height: 140px;
  }
  .git {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }
  .git-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.88rem;
    overflow-wrap: anywhere;
  }
  .status {
    align-self: flex-start;
  }
  .dates {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.8rem;
    color: var(--text-faint);
  }
  .dates div {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .del {
    align-self: flex-start;
    margin-top: 4px;
  }
  @media (max-width: 640px) {
    .body {
      grid-template-columns: 1fr;
      gap: 18px;
    }
  }
</style>
