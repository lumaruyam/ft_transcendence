<script lang="ts">
  import { deleteProject, transferOwnership } from "../api/projectsApi";
  import type { Member, Project } from "../api/types";
  import { confirmDialog } from "../shared/confirm.svelte";
  import { errorMessage } from "../shared/errors";
  import { toast } from "../shared/toast.svelte";
  import Icon from "../shared/ui/Icon.svelte";

  let {
    project,
    members,
    isOwner,
    userId,
    onchange,
  }: { project: Project; members: Member[]; isOwner: boolean; userId: string | null; onchange: (project: Project) => void } = $props();

  // the new owner must already be a member (they become admin)
  const candidates = $derived(members.filter((m) => m.userId !== userId));
  let newOwner = $state("");
  let busy = $state(false);

  async function onTransfer(): Promise<void> {
    const target = members.find((m) => m.userId === newOwner);
    if (!target) return;
    const ok = await confirmDialog({
      title: `Transférer la propriété à ${target.user.name} ?`,
      message: "Cette personne deviendra propriétaire du projet. Vous resterez administrateur, mais vous ne pourrez plus supprimer le projet.",
      confirmLabel: "Transférer",
      danger: true,
    });
    if (!ok) return;
    busy = true;
    try {
      onchange(await transferOwnership(project.id, target.userId));
      newOwner = "";
      toast(`${target.user.name} est maintenant propriétaire`, { kind: "success" });
    } catch (err) {
      toast(errorMessage(err), { kind: "error" });
    } finally {
      busy = false;
    }
  }

  async function onDelete(): Promise<void> {
    const ok = await confirmDialog({
      title: "Supprimer ce projet ?",
      message: "Le tableau, les notes, le tableau blanc et les fichiers seront supprimés pour tous les membres. Cette action est définitive.",
      confirmLabel: "Supprimer définitivement",
      danger: true,
      requireText: project.name,
    });
    if (!ok) return;
    busy = true;
    try {
      await deleteProject(project.id);
      window.location.href = "/app";
    } catch (err) {
      busy = false;
      toast(errorMessage(err), { kind: "error" });
    }
  }
</script>

<header class="section-head">
  <h2>Zone sensible</h2>
  <p>Des actions importantes, qui demandent toujours une confirmation.</p>
</header>

{#if !isOwner}
  <div class="panel">
    <p class="muted"><Icon name="lock" size={16} /> Seul le propriétaire du projet peut le supprimer ou en transférer la propriété.</p>
  </div>
{:else}
  <div class="panel panel-danger">
    <h3>Transférer la propriété</h3>
    <p class="muted">Confiez le projet à un autre membre. Il faut qu'il en fasse déjà partie.</p>
    {#if candidates.length === 0}
      <p class="hint">Invitez d'abord quelqu'un dans le projet.</p>
    {:else}
      <div class="inline">
        <select class="input" bind:value={newOwner} aria-label="Nouveau propriétaire">
          <option value="">Choisir un membre…</option>
          {#each candidates as member (member.userId)}<option value={member.userId}>{member.user.name} — {member.user.email}</option>{/each}
        </select>
        <button type="button" class="btn btn-danger" disabled={!newOwner || busy} onclick={onTransfer}>Transférer</button>
      </div>
    {/if}
  </div>

  <div class="panel panel-danger">
    <h3>Supprimer le projet</h3>
    <p class="muted">Tout ce que contient « {project.name} » disparaîtra pour tout le monde.</p>
    <div><button type="button" class="btn btn-danger" disabled={busy} onclick={onDelete}><Icon name="trash" size={16} /> Supprimer le projet</button></div>
  </div>
{/if}

<style>
  .muted {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-soft);
  }
  .inline {
    display: flex;
    gap: 10px;
  }
  .inline select {
    flex: 1;
    min-width: 0;
  }
  @media (max-width: 560px) {
    .inline {
      flex-direction: column;
    }
  }
</style>
