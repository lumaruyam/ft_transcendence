<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the floating panel shared by the profile menu and the participants widget.
     It only positions and animates; the parent owns the `open` state. -->
<script lang="ts">
  import type { Snippet } from "svelte";

  let { open, children }: { open: boolean; children: Snippet } = $props();
</script>

<div class="dropdown" class:open>
  {@render children()}
</div>

<style>
  .dropdown {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    min-width: 240px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow);
    padding: 8px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px) scale(0.98);
    transition: opacity 0.12s ease, transform 0.12s ease;
    z-index: 50;
  }
  .dropdown.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0) scale(1);
  }
</style>
