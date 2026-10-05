<!-- Owner: Track 2 (Person A — Kanban CRUD and UI)
     Responsible for: the top bar profile menu — user initials, theme toggle, profile / board
     settings links and logout. projectId is optional so the dashboard can reuse it without a
     board settings link. -->
<script lang="ts">
  import Dropdown from "./Dropdown.svelte";
  import { currentTheme, toggleTheme } from "../theme";
  import { initials } from "../initials";
  import { getStoredUser, logout } from "../../auth/authClient";

  let { projectId }: { projectId?: string } = $props();

  const user = getStoredUser();
  let open = $state(false);
  let dark = $state(currentTheme() === "dark");

  function onToggleTheme(): void {
    dark = toggleTheme() === "dark";
  }

  async function onLogout(): Promise<void> {
    await logout();
    window.location.href = "/login";
  }
</script>

<svelte:window onclick={() => (open = false)} />

<div class="profile-menu">
  <button
    type="button"
    class="avatar-btn"
    aria-label="Menu du profil"
    onclick={(e) => {
      e.stopPropagation();
      open = !open;
    }}
  >
    {user ? initials(user.name) : "?"}
  </button>

  <Dropdown {open}>
    <!-- clicks inside the panel must not reach the window listener that closes it -->
    <div role="presentation" onclick={(e) => e.stopPropagation()}>
      {#if user}
        <div class="who">
          <div class="who-name">{user.name}</div>
          <div class="who-email">{user.email}</div>
        </div>
        <div class="divider"></div>
      {/if}

      <div class="theme-row">
        <span>Thème sombre</span>
        <button
          type="button"
          class="switch"
          class:on={dark}
          role="switch"
          aria-checked={dark}
          aria-label="Thème sombre"
          onclick={onToggleTheme}
        >
          <span class="knob"></span>
        </button>
      </div>

      <div class="divider"></div>

      <a class="item" href="/settings">Paramètres du profil</a>
      {#if projectId}
        <a class="item" href={`/app/${projectId}/settings`}>Paramètres du board</a>
      {/if}

      <div class="divider"></div>
      <button type="button" class="item danger" onclick={onLogout}>Se déconnecter</button>
    </div>
  </Dropdown>
</div>

<style>
  .profile-menu {
    position: relative;
  }
  .avatar-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    border: none;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.85rem;
    transition: filter 0.15s ease;
  }
  .avatar-btn:hover {
    filter: brightness(1.12);
  }
  .who {
    padding: 6px 8px;
  }
  .who-name {
    font-weight: 600;
    font-size: 0.85rem;
  }
  .who-email {
    font-size: 0.72rem;
    color: var(--text-muted);
  }
  .divider {
    height: 1px;
    background: var(--border);
    margin: 6px 4px;
  }
  .theme-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px;
    font-size: 0.85rem;
  }
  .switch {
    width: 36px;
    height: 20px;
    border-radius: 10px;
    background: var(--border);
    border: none;
    position: relative;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .switch.on {
    background: var(--accent);
  }
  .knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    transition: left 0.15s ease;
  }
  .switch.on .knob {
    left: 18px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px;
    border: none;
    border-radius: 6px;
    background: none;
    color: var(--text);
    font: inherit;
    font-size: 0.85rem;
    text-align: left;
    text-decoration: none;
    cursor: pointer;
  }
  .item:hover {
    background: var(--border);
  }
  .item.danger:hover {
    color: var(--danger);
  }
</style>
