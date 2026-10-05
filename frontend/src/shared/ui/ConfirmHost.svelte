<script lang="ts">
  import { confirmState, answerConfirm } from "../confirm.svelte";

  let dialog: HTMLDialogElement;
  let typed = $state("");

  const options = $derived(confirmState.options);
  const unlocked = $derived(!options?.requireText || typed.trim() === options.requireText);

  $effect(() => {
    if (options && !dialog.open) {
      typed = "";
      dialog.showModal();
    } else if (!options && dialog.open) {
      dialog.close();
    }
  });
</script>

<dialog
  class="modal"
  bind:this={dialog}
  aria-labelledby="confirm-title"
  oncancel={(event) => {
    event.preventDefault();
    answerConfirm(false);
  }}
  onclick={(event) => {
    if (event.target === dialog) answerConfirm(false);
  }}
>
  {#if options}
    <form
      onsubmit={(event) => {
        event.preventDefault();
        if (unlocked) answerConfirm(true);
      }}
    >
      <h2 id="confirm-title">{options.title}</h2>
      {#if options.message}<p class="message">{options.message}</p>{/if}
      {#if options.requireText}
        <div class="field">
          <label for="confirm-text">Tapez <strong>{options.requireText}</strong> pour confirmer</label>
          <!-- svelte-ignore a11y_autofocus -->
          <input id="confirm-text" class="input" bind:value={typed} autocomplete="off" autofocus />
        </div>
      {/if}
      <div class="actions">
        <!-- danger: focus Cancel so a stray Enter cannot confirm -->
        <!-- svelte-ignore a11y_autofocus -->
        <button type="button" class="btn btn-ghost" autofocus={options.danger && !options.requireText} onclick={() => answerConfirm(false)}>Annuler</button>
        <!-- svelte-ignore a11y_autofocus -->
        <button
          type="submit"
          class="btn {options.danger ? 'btn-danger' : 'btn-primary'}"
          disabled={!unlocked}
          autofocus={!options.danger && !options.requireText}
        >
          {options.confirmLabel ?? "Confirmer"}
        </button>
      </div>
    </form>
  {/if}
</dialog>

<style>
  dialog {
    width: min(430px, calc(100vw - 24px));
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 24px;
  }
  .message {
    color: var(--text-soft);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 6px;
  }
</style>
