<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: a title that is edited in place (list and card titles). Enter or leaving the
     field saves, Escape cancels. While it isn't being edited it follows `value`, so a rename made
     by another participant shows up live. -->
<script lang="ts">
  let {
    value,
    editable,
    label,
    onsave,
  }: {
    value: string;
    editable: boolean;
    label: string;
    // resolves false when the server refused, so the old title comes back
    onsave: (title: string) => Promise<boolean>;
  } = $props();

  let draft = $state("");
  let focused = $state(false);

  $effect(() => {
    if (!focused) draft = value;
  });

  async function commit(): Promise<void> {
    focused = false;
    const title = draft.trim();
    if (!title || title === value) {
      draft = value;
      return;
    }
    if (!(await onsave(title))) draft = value;
  }

  function onkeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }): void {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      draft = value;
      event.currentTarget.blur();
    }
  }
</script>

<input
  bind:value={draft}
  readonly={!editable}
  aria-label={label}
  onfocus={() => (focused = true)}
  onblur={commit}
  {onkeydown}
/>

<style>
  input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    color: var(--text);
    font: inherit;
    padding: 2px 4px;
  }
  input:focus {
    outline: 2px solid var(--accent);
    border-radius: 6px;
  }
  input:read-only {
    cursor: default;
    outline: none;
  }
</style>
