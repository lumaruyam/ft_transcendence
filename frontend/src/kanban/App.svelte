<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the kanban page shell — top bar, then either the board or a message explaining
     why there is none (loading, error, no access). -->
<script lang="ts">
  import { onMount } from "svelte";
  import TopBar from "../shared/ui/TopBar.svelte";
  import ProfileMenu from "../shared/ui/ProfileMenu.svelte";
  import Board from "./Board.svelte";
  import CardDetail from "./CardDetail.svelte";
  import Participants from "./Participants.svelte";
  import Sidebar from "./Sidebar.svelte";
  import type { BoardStore } from "./boardStore.svelte";

  let { store }: { store: BoardStore } = $props();

  onMount(() => {
    void store.start();
    return () => store.stop();
  });

  const title = $derived(store.project?.name ?? "Kanban");
</script>

<div class="shell">
  <Sidebar />

  <div class="main">
    <TopBar>
      {#snippet left()}
        <div class="logo">{title.trim().slice(0, 2).toUpperCase() || "?"}</div>
        <div class="title">{title}</div>
      {/snippet}
      {#snippet right()}
        <Participants {store} />
        <ProfileMenu projectId={store.project?.id} />
      {/snippet}
    </TopBar>

    {#if store.actionError}
      <div class="error" role="alert">
        <span>{store.actionError}</span>
        <button type="button" aria-label="Fermer" onclick={() => store.dismissError()}>×</button>
      </div>
    {/if}

    {#if store.accessDenied}
      <p class="message">Vous n'avez pas accès à ce projet.</p>
    {:else if store.loadState === "loading"}
      <p class="message">Chargement du board…</p>
    {:else if store.loadState === "error"}
      <p class="message">Impossible de charger le board pour le moment.</p>
    {:else}
      <Board {store} />
    {/if}
  </div>
</div>

<CardDetail {store} />

<style>
  .shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .logo {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 8px;
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.65rem;
  }
  .title {
    font-weight: 600;
    font-size: 0.95rem;
  }
  .message {
    padding: 1.5rem;
    color: var(--text-muted);
  }
  .error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 20px;
    background: var(--danger);
    color: #fff;
    font-size: 0.85rem;
  }
  .error button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 1.1rem;
    line-height: 1;
  }
</style>
