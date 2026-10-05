<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the left sidebar — a link back to the dashboard, retractable, closed by default.
     The choice is remembered per browser. -->
<script lang="ts">
  const STORAGE_KEY = "ft_sidebar_collapsed";

  function readCollapsed(): boolean {
    try {
      // no stored preference means closed by default
      return localStorage.getItem(STORAGE_KEY) !== "0";
    } catch {
      return true;
    }
  }

  let collapsed = $state(readCollapsed());

  function toggle(): void {
    collapsed = !collapsed;
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // storage disabled, the choice just won't survive a reload
    }
  }
</script>

<aside class="sidebar" class:collapsed>
  <a class="home" href="/app" aria-label="Retour à mes projets">
    <span class="badge">T</span>
    <span class="label">Transcendance</span>
  </a>

  <button type="button" class="toggle" aria-label="Réduire ou agrandir la barre latérale" onclick={toggle}>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 6 9 12 15 18"></polyline>
    </svg>
  </button>
</aside>

<style>
  .sidebar {
    width: 240px;
    flex-shrink: 0;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border);
    position: relative;
    transition: width 0.18s ease, background-color 0.15s ease, border-color 0.15s ease;
  }
  .sidebar.collapsed {
    width: 72px;
  }
  .toggle {
    position: absolute;
    top: 50%;
    right: -18px;
    transform: translateY(-50%);
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.18s ease, background-color 0.15s ease, color 0.15s ease;
    z-index: 5;
  }
  .toggle:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .collapsed .toggle {
    transform: translateY(-50%) rotate(180deg);
  }
  .home {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 6px 12px 12px;
    padding: 6px;
    border-radius: 14px;
    text-decoration: none;
    color: var(--text);
    transition: background-color 0.15s ease, margin 0.18s ease, padding 0.18s ease;
  }
  .home:hover {
    background: var(--border);
  }
  /* Collapsed: only the badge shows, centered. The hover highlight moves onto the badge itself. */
  .collapsed .home {
    justify-content: center;
    margin: 6px 8px 12px;
    padding: 4px;
  }
  .collapsed .home:hover {
    background: none;
  }
  .badge {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 14px;
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.15rem;
    transition: border-radius 0.15s ease, filter 0.15s ease;
  }
  .collapsed .home:hover .badge {
    border-radius: 30%;
    filter: brightness(1.15);
  }
  .label {
    font-weight: 700;
    font-size: 0.95rem;
    white-space: nowrap;
  }
  .collapsed .label {
    display: none;
  }
</style>
