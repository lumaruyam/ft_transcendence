<script lang="ts">
  import { removeMember, setMemberRole } from "../api/projectsApi";
  import type { Member, Project, Role } from "../api/types";
  import { confirmDialog } from "../shared/confirm.svelte";
  import { errorMessage } from "../shared/errors";
  import { ROLE_HINT, ROLE_LABEL } from "../shared/format";
  import { toast } from "../shared/toast.svelte";
  import Avatar from "../shared/ui/Avatar.svelte";
  import Icon from "../shared/ui/Icon.svelte";

  let {
    project,
    members = $bindable(),
    isAdmin,
    userId,
    onchange,
  }: { project: Project; members: Member[]; isAdmin: boolean; userId: string | null; onchange: () => void | Promise<void> } = $props();

  const ROLES: Role[] = ["admin", "member", "viewer"];

  let busyId = $state<string | null>(null);

  async function changeRole(member: Member, role: Role): Promise<void> {
    if (role === member.role) return;
    const previous = member.role;
    member.role = role;
    busyId = member.userId;
    try {
      await setMemberRole(project.id, member.userId, role);
      toast(`${member.user.name} est maintenant ${ROLE_LABEL[role].toLowerCase()}`, { kind: "success" });
    } catch (err) {
      member.role = previous;
      toast(errorMessage(err), { kind: "error" });
    } finally {
      busyId = null;
    }
  }

  async function remove(member: Member): Promise<void> {
    const self = member.userId === userId;
    const ok = await confirmDialog({
      title: self ? "Quitter le projet ?" : `Retirer ${member.user.name} ?`,
      message: self
        ? "Vous perdrez l'accès à ce projet. Il faudra une nouvelle invitation pour y revenir."
        : "Cette personne perdra l'accès au projet. Elle pourra le rejoindre à nouveau avec une invitation.",
      confirmLabel: self ? "Quitter" : "Retirer",
      danger: true,
    });
    if (!ok) return;
    busyId = member.userId;
    try {
      await removeMember(project.id, member.userId);
      if (self) {
        window.location.href = "/app";
        return;
      }
      members = members.filter((m) => m.userId !== member.userId);
      toast(`${member.user.name} a été retiré du projet`);
    } catch (err) {
      toast(errorMessage(err), { kind: "error" });
      await onchange();
    } finally {
      busyId = null;
    }
  }
</script>

<header class="section-head">
  <h2>Membres</h2>
  <p>{members.length} personne{members.length > 1 ? "s" : ""} travaillent sur ce projet.</p>
</header>

<div class="panel list">
  {#each members as member (member.userId)}
    {@const isOwner = member.userId === project.ownerId}
    <div class="row">
      <Avatar name={member.user.name} id={member.userId} src={member.user.avatar} size={38} />
      <div class="who">
        <div class="name">
          <span class="selectable">{member.user.name}</span>
          {#if member.userId === userId}<span class="chip">Vous</span>{/if}
          {#if isOwner}<span class="chip chip-accent">Propriétaire</span>{/if}
        </div>
        <div class="email selectable">{member.user.email}</div>
      </div>

      {#if isAdmin && !isOwner}
        <select
          class="input role"
          aria-label={`Rôle de ${member.user.name}`}
          value={member.role}
          disabled={busyId === member.userId}
          onchange={(e) => changeRole(member, e.currentTarget.value as Role)}
        >
          {#each ROLES as role (role)}<option value={role}>{ROLE_LABEL[role]}</option>{/each}
        </select>
        <button type="button" class="icon-btn" aria-label={`Retirer ${member.user.name}`} title="Retirer du projet" disabled={busyId === member.userId} onclick={() => remove(member)}>
          <Icon name="trash" size={17} />
        </button>
      {:else}
        <span class="role-static">{ROLE_LABEL[member.role]}</span>
        {#if member.userId === userId && !isOwner}
          <button type="button" class="btn btn-ghost btn-sm" onclick={() => remove(member)}>Quitter</button>
        {/if}
      {/if}
    </div>
  {/each}
</div>

<div class="panel legend">
  <div class="label">Ce que chaque rôle permet</div>
  {#each ROLES as role (role)}
    <div class="legend-row"><strong>{ROLE_LABEL[role]}</strong><span>{ROLE_HINT[role]}</span></div>
  {/each}
  {#if isAdmin}
    <p class="hint">Pour faire entrer quelqu'un, créez un lien dans <a href="#invitations">Invitations</a>.</p>
  {/if}
</div>

<style>
  .list {
    gap: 0;
    padding: 6px 10px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 6px;
    border-bottom: 1px solid var(--line);
  }
  .row:last-child {
    border-bottom: none;
  }
  .who {
    flex: 1;
    min-width: 0;
  }
  .name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
  .email {
    font-size: 0.84rem;
    color: var(--text-faint);
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .role {
    width: 150px;
    min-height: 36px;
    padding-top: 5px;
    padding-bottom: 5px;
  }
  .role-static {
    font-size: 0.9rem;
    color: var(--text-soft);
  }
  .legend {
    gap: 8px;
  }
  .legend-row {
    display: grid;
    grid-template-columns: 130px 1fr;
    gap: 12px;
    font-size: 0.88rem;
  }
  .legend-row span {
    color: var(--text-soft);
  }
  @media (max-width: 600px) {
    .row {
      flex-wrap: wrap;
    }
    .who {
      flex-basis: calc(100% - 60px);
    }
    .role {
      flex: 1;
      margin-left: 50px;
    }
    .legend-row {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }
</style>
