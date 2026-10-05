<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the top bar participants widget — a stack of avatars with the first few project
     members, expanding into the full list with who is online right now (live, from the socket). -->
<script lang="ts">
  import Dropdown from "../shared/ui/Dropdown.svelte";
  import { initials } from "../shared/initials";
  import type { BoardStore } from "./boardStore.svelte";

  let { store }: { store: BoardStore } = $props();

  const VISIBLE = 3;
  const COLORS = ["#5865f2", "#eb459e", "#23a55a", "#f0b132", "#e8590c", "#1098ad"];

  let open = $state(false);

  // the same user always gets the same color
  function colorFor(userId: string): string {
    let hash = 0;
    for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return COLORS[hash % COLORS.length];
  }

  // online members first, then alphabetical
  const sorted = $derived(
    [...store.members].sort(
      (a, b) =>
        Number(store.online.has(b.userId)) - Number(store.online.has(a.userId)) ||
        a.user.name.localeCompare(b.user.name)
    )
  );
</script>

<svelte:window onclick={() => (open = false)} />

<div class="participants">
  <button
    type="button"
    class="stack"
    aria-label={`${store.members.length} participants`}
    aria-expanded={open}
    onclick={(e) => {
      e.stopPropagation();
      open = !open;
    }}
  >
    {#each sorted.slice(0, VISIBLE) as member (member.userId)}
      {@render avatar(member.user.name, member.userId)}
    {/each}
    {#if sorted.length > VISIBLE}
      <span class="more">+{sorted.length - VISIBLE}</span>
    {/if}
  </button>

  <Dropdown {open}>
    <div role="presentation" onclick={(e) => e.stopPropagation()}>
      <div class="section-title">{store.members.length} participants</div>
      {#each sorted as member (member.userId)}
        <div class="item">
          {@render avatar(member.user.name, member.userId)}
          <div class="info">
            <div>{member.user.name}</div>
            <div class="status">{store.online.has(member.userId) ? "En ligne" : "Hors ligne"} · {member.role}</div>
          </div>
        </div>
      {/each}
    </div>
  </Dropdown>
</div>

{#snippet avatar(name: string, userId: string)}
  <span class="avatar" style:background={colorFor(userId)} title={name}>
    {initials(name)}
    <span class="dot" class:online={store.online.has(userId)}></span>
  </span>
{/snippet}

<style>
  .participants {
    position: relative;
  }
  .stack {
    display: flex;
    align-items: center;
    padding: 4px 10px 4px 4px;
    border: none;
    border-radius: 20px;
    background: var(--bg-elevated);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .stack:hover {
    background: var(--border);
  }
  .avatar {
    position: relative;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 700;
    color: #fff;
    border: 2px solid var(--bg-topbar);
    margin-left: -8px;
  }
  .stack .avatar:first-child {
    margin-left: 0;
  }
  .dot {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 2px solid var(--bg-topbar);
    background: var(--offline);
  }
  .dot.online {
    background: var(--online);
  }
  .more {
    width: 28px;
    height: 28px;
    margin-left: -8px;
    border-radius: 50%;
    background: var(--border);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 700;
    border: 2px solid var(--bg-topbar);
  }
  .section-title {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    padding: 6px 8px 4px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 6px;
    font-size: 0.85rem;
  }
  .item:hover {
    background: var(--border);
  }
  .item .avatar {
    margin-left: 0;
    border-color: var(--bg-elevated);
  }
  .info {
    display: flex;
    flex-direction: column;
  }
  .status {
    font-size: 0.7rem;
    color: var(--text-muted);
  }
</style>
