<!-- Top bar of signed-in pages. Notes and whiteboard can reuse it: <AppHeader {project} active="notes" /> -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import CommandPalette from "./CommandPalette.svelte";
  import Icon from "./Icon.svelte";
  import Logo from "./Logo.svelte";
  import NotificationsBell from "./NotificationsBell.svelte";
  import ProjectSwitcher from "./ProjectSwitcher.svelte";
  import UserMenu from "./UserMenu.svelte";
  import { isPageEnabled } from "../features";

  type HeaderTab = "board" | "notes" | "whiteboard" | "settings";

  let {
    project,
    active,
    extra,
  }: { project?: { id: string; name: string } | null; active?: HeaderTab; extra?: Snippet } = $props();

  let paletteOpen = $state(false);

  const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

  const tabs = $derived(
    project
      ? ([
          { key: "board", label: "Tableau", icon: "columns", href: `/app/${project.id}` },
          { key: "notes", label: "Notes", icon: "note", href: `/app/${project.id}/notes` },
          { key: "whiteboard", label: "Tableau blanc", icon: "board", href: `/app/${project.id}/whiteboard` },
          { key: "files", label: "Fichiers", icon: "folder", href: `/app/${project.id}/files` },
          { key: "settings", label: "Réglages", icon: "settings", href: `/app/${project.id}/settings` },
        ] as const)
      : []
  );

  function isTyping(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
  }

  function onKeydown(event: KeyboardEvent): void {
    if (!project) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      paletteOpen = !paletteOpen;
    } else if (event.key === "/" && !isTyping(event.target) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      paletteOpen = true;
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<header class="bar">
  <div class="left">
    <a class="brand" href="/app" aria-label="Transcendance — mes projets" title="Mes projets">
      <Logo size={30} />
      {#if !project}<span class="wordmark">Transcendance</span>{/if}
    </a>
    {#if project}
      <span class="sep" aria-hidden="true">/</span>
      <ProjectSwitcher current={project} />
    {/if}
  </div>

  {#if project}
    <nav class="tabs" aria-label="Pages du projet">
      {#each tabs as tab (tab.key)}
        {#if isPageEnabled(tab.key)}
          <a class="tab" class:active={active === tab.key} href={tab.href} aria-current={active === tab.key ? "page" : undefined}>
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
          </a>
        {:else}
          <span class="tab off" role="link" aria-disabled="true" title="Bientôt disponible">
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
          </span>
        {/if}
      {/each}
    </nav>
  {/if}

  <div class="right">
    {@render extra?.()}
    {#if project}
      <button type="button" class="search" onclick={() => (paletteOpen = true)} aria-label="Rechercher">
        <Icon name="search" size={16} />
        <span class="search-text">Rechercher</span>
        <kbd>{isMac ? "⌘" : "Ctrl"} K</kbd>
      </button>
    {/if}
    <NotificationsBell />
    <UserMenu />
  </div>
</header>

{#if project}
  <CommandPalette projectId={project.id} bind:open={paletteOpen} />
{/if}

<style>
  .bar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    grid-template-areas: "left tabs right";
    align-items: center;
    gap: 8px 16px;
    min-height: var(--header-h);
    padding: 6px 16px;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .left {
    grid-area: left;
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 4px;
    border-radius: 8px;
    color: var(--text);
    text-decoration: none;
  }
  .brand:hover {
    color: var(--accent);
  }
  .wordmark {
    font-family: var(--font-serif);
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .sep {
    color: var(--line-strong);
    font-size: 1.2rem;
    padding: 0 2px;
  }
  .tabs {
    grid-area: tabs;
    display: flex;
    gap: 2px;
    padding: 3px;
    background: var(--bg-sunken);
    border-radius: 12px;
  }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    border-radius: 9px;
    color: var(--text-soft);
    font-size: 0.88rem;
    font-weight: 550;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color 0.15s var(--ease), color 0.15s var(--ease);
  }
  .tab:hover {
    color: var(--text);
  }
  .tab.off {
    opacity: 0.42;
    cursor: not-allowed;
  }
  .tab.off:hover {
    color: var(--text-soft);
  }
  .tab.active {
    background: var(--surface-raised);
    color: var(--text);
    box-shadow: var(--shadow-sm);
  }
  .right {
    grid-area: right;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
  .search {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 8px 0 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface-raised);
    color: var(--text-faint);
    font-size: 0.88rem;
  }
  .search:hover {
    border-color: var(--line-strong);
    color: var(--text-soft);
  }
  .search kbd {
    font-size: 0.72rem;
  }

  @media (max-width: 1100px) {
    .search-text,
    .search kbd {
      display: none;
    }
    .search {
      width: 36px;
      padding: 0;
      justify-content: center;
      border-color: transparent;
      background: transparent;
    }
  }
  @media (max-width: 900px) {
    .bar {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas: "left right" "tabs tabs";
      padding: 6px 12px 8px;
    }
    .tabs {
      justify-self: stretch;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tab {
      flex: 1;
      justify-content: center;
    }
  }
  @media (max-width: 520px) {
    .tab:not(.active) span {
      display: none;
    }
    .sep {
      display: none;
    }
    .bar {
      gap: 8px;
      padding-inline: 8px;
    }
  }
</style>
