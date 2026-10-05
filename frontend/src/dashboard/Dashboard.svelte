<!-- Owner: Track 1 (Foundation, Auth, and API infrastructure)
     Responsible for: the /app page — the logged-in user's projects, and a form to create a new one. -->
<script lang="ts">
  import { onMount } from "svelte";
  import { ApiError } from "../api/apiClient";
  import TopBar from "../shared/ui/TopBar.svelte";
  import ProfileMenu from "../shared/ui/ProfileMenu.svelte";
  import { createProject, listMyProjects, type ProjectSummary } from "./projectsApi";

  let projects = $state<ProjectSummary[] | null>(null);
  let loadFailed = $state(false);
  let name = $state("");
  let formError = $state<string | null>(null);

  onMount(async () => {
    try {
      projects = await listMyProjects();
    } catch {
      loadFailed = true;
    }
  });

  async function onCreate(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const wanted = name.trim();
    if (!wanted) return;
    formError = null;
    try {
      const project = await createProject(wanted);
      projects = [project, ...(projects ?? [])];
      name = "";
    } catch (err) {
      formError = err instanceof ApiError && err.details.length > 0 ? err.details.join(", ") : "Impossible de créer le projet.";
    }
  }
</script>

<TopBar>
  {#snippet left()}
    <div class="badge">T</div>
    <div class="title">Transcendance</div>
  {/snippet}
  {#snippet right()}
    <ProfileMenu />
  {/snippet}
</TopBar>

<main>
  <h1>Mes projets</h1>

  <form class="create" onsubmit={onCreate}>
    <input bind:value={name} placeholder="Nom du nouveau projet" aria-label="Nom du nouveau projet" maxlength="100" />
    <button type="submit" disabled={!name.trim()}>Créer</button>
  </form>
  {#if formError}
    <p class="error" role="alert">{formError}</p>
  {/if}

  <div class="list">
    {#if loadFailed}
      <p class="muted">Impossible de charger vos projets pour le moment.</p>
    {:else if projects === null}
      <p class="muted">Chargement…</p>
    {:else if projects.length === 0}
      <p class="muted">Aucun projet pour l'instant.</p>
    {:else}
      {#each projects as project (project.id)}
        <a class="project" href={`/app/${project.id}`}>{project.name}</a>
      {/each}
    {/if}
  </div>
</main>

<style>
  .badge {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }
  .title {
    font-weight: 600;
    font-size: 0.95rem;
  }
  main {
    padding: 1.5rem;
    background: var(--bg-main);
    min-height: calc(100vh - 56px);
  }
  h1 {
    font-size: 1.25rem;
    margin-bottom: 1.25rem;
  }
  .create {
    display: flex;
    gap: 0.5rem;
    max-width: 32rem;
    margin-bottom: 1rem;
  }
  .create input {
    flex: 1;
    min-width: 0;
    background: var(--bg-input);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font: inherit;
    padding: 0.55rem 0.7rem;
  }
  .create input:focus {
    outline: 2px solid var(--accent);
  }
  .create button {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0 1rem;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  .create button:hover:not(:disabled) {
    background: var(--accent-hover);
  }
  .create button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 32rem;
  }
  .project {
    padding: 1rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    text-decoration: none;
    color: var(--text);
    transition: border-color 0.15s ease;
  }
  .project:hover {
    border-color: var(--accent);
  }
  .muted {
    color: var(--text-muted);
    font-size: 0.9rem;
  }
  .error {
    color: var(--danger);
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
</style>
