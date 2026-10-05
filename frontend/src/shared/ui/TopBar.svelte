<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the top bar shell shared by the dashboard and the kanban page. The caller
     fills the left (logo + title) and right (participants, profile menu, ...) areas. -->
<script lang="ts">
  import type { Snippet } from "svelte";

  let { left, right }: { left: Snippet; right: Snippet } = $props();
</script>

<header class="topbar">
  <div class="left">{@render left()}</div>
  <div class="right">{@render right()}</div>
</header>

<style>
  .topbar {
    height: 56px;
    flex-shrink: 0;
    background: var(--bg-topbar);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }
  .left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
</style>
