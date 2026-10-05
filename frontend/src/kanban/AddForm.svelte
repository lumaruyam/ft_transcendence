<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the "+ add a list / card" input. Submitting clears the field right away and
     puts the text back if the server refuses. -->
<script lang="ts">
  let {
    placeholder,
    onadd,
  }: {
    placeholder: string;
    onadd: (title: string) => Promise<boolean>;
  } = $props();

  let value = $state("");

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const title = value.trim();
    if (!title) return;
    value = "";
    if (!(await onadd(title))) value = title;
  }
</script>

<form onsubmit={submit}>
  <input bind:value {placeholder} aria-label={placeholder} />
</form>

<style>
  form {
    display: flex;
  }
  input {
    width: 100%;
    background: transparent;
    border: 1px dashed var(--border);
    border-radius: 6px;
    color: var(--text-muted);
    font: inherit;
    padding: 0.5rem 0.65rem;
  }
  input:focus {
    outline: none;
    border-color: var(--accent);
    color: var(--text);
  }
</style>
