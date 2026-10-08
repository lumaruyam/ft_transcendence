<script lang="ts">
  import { onMount } from "svelte";
  import { createInvite, listInvites, revokeInvite } from "../api/projectsApi";
  import type { Invite, Project, Role } from "../api/types";
  import { confirmDialog } from "../shared/confirm.svelte";
  import { errorMessage } from "../shared/errors";
  import { ROLE_HINT, ROLE_LABEL, formatDate } from "../shared/format";
  import { toast } from "../shared/toast.svelte";
  import CopyField from "../shared/ui/CopyField.svelte";
  import Icon from "../shared/ui/Icon.svelte";

  let { project, isAdmin }: { project: Project; isAdmin: boolean } = $props();

  const EXPIRY: { label: string; days: number | null }[] = [
    { label: "Jamais", days: null },
    { label: "1 jour", days: 1 },
    { label: "7 jours", days: 7 },
    { label: "30 jours", days: 30 },
  ];

  let invites = $state<Invite[] | null>(null);
  let loadFailed = $state(false);

  let role = $state<Role>("member");
  let expiryDays = $state<number | null>(7);
  let maxUses = $state("");
  let busy = $state(false);
  let error = $state<string | null>(null);
  // the token only exists in the creation response: keep the link visible
  let fresh = $state<{ url: string; role: Role } | null>(null);

  onMount(() => {
    if (isAdmin) void load();
  });

  async function load(): Promise<void> {
    loadFailed = false;
    try {
      invites = await listInvites(project.id);
    } catch {
      loadFailed = true;
    }
  }

  async function onCreate(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    error = null;
    const uses = maxUses.trim() === "" ? undefined : Number(maxUses);
    if (uses !== undefined && (!Number.isInteger(uses) || uses < 1)) {
      error = "Le nombre d'utilisations doit être un entier d'au moins 1.";
      return;
    }
    busy = true;
    try {
      const { token } = await createInvite(project.id, {
        role,
        maxUses: uses,
        expiresAt: expiryDays ? new Date(Date.now() + expiryDays * 86_400_000).toISOString() : undefined,
      });
      fresh = { url: `${location.origin}/invite/${token}`, role };
      maxUses = "";
      await load();
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  async function revoke(invite: Invite): Promise<void> {
    const ok = await confirmDialog({
      title: "Révoquer ce lien ?",
      message: "Il ne pourra plus être utilisé. Les personnes qui l'ont déjà utilisé restent membres du projet.",
      confirmLabel: "Révoquer",
      danger: true,
    });
    if (!ok) return;
    try {
      await revokeInvite(project.id, invite.id);
      toast("Lien révoqué");
      await load();
    } catch (err) {
      toast(errorMessage(err), { kind: "error" });
      await load();
    }
  }

  function status(invite: Invite): { label: string; tone: "ok" | "off" } {
    if (invite.revokedAt) return { label: "Révoqué", tone: "off" };
    if (invite.expiresAt && new Date(invite.expiresAt).getTime() <= Date.now()) return { label: "Expiré", tone: "off" };
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) return { label: "Épuisé", tone: "off" };
    return { label: "Actif", tone: "ok" };
  }
</script>

<header class="section-head">
  <h2>Invitations</h2>
  <p>Un lien suffit pour faire entrer quelqu'un : envoyez-le, la personne se connecte (ou crée un compte) et rejoint le projet.</p>
</header>

{#if !isAdmin}
  <div class="panel"><p class="muted">Seuls les administrateurs peuvent créer et gérer les liens d'invitation.</p></div>
{:else}
  {#if fresh}
    <div class="panel fresh" role="status">
      <div class="row-between">
        <strong><Icon name="check" size={16} /> Lien créé — rôle « {ROLE_LABEL[fresh.role]} »</strong>
        <button type="button" class="icon-btn" aria-label="Fermer" onclick={() => (fresh = null)}><Icon name="x" size={16} /></button>
      </div>
      <CopyField value={fresh.url} label="Lien d'invitation" />
      <p class="hint warn">Copiez-le maintenant : pour votre sécurité, ce lien ne sera plus affiché ensuite.</p>
    </div>
  {/if}

  <form class="panel" onsubmit={onCreate}>
    <h3>Créer un lien</h3>
    <div class="grid">
      <div class="field">
        <label for="inv-role">Rôle donné</label>
        <select id="inv-role" class="input" bind:value={role}>
          {#each ["admin", "member", "viewer"] as r (r)}<option value={r}>{ROLE_LABEL[r as Role]}</option>{/each}
        </select>
      </div>
      <div class="field">
        <label for="inv-exp">Expire</label>
        <select id="inv-exp" class="input" bind:value={expiryDays}>
          {#each EXPIRY as option (option.label)}<option value={option.days}>{option.label}</option>{/each}
        </select>
      </div>
      <div class="field">
        <label for="inv-uses">Utilisations max.</label>
        <input id="inv-uses" class="input" type="number" min="1" step="1" inputmode="numeric" placeholder="Illimité" bind:value={maxUses} />
      </div>
    </div>
    <span class="hint">{ROLE_HINT[role]}.</span>
    {#if error}<span class="field-error" role="alert">{error}</span>{/if}
    <div><button type="submit" class="btn btn-primary" disabled={busy}>{#if busy}<span class="spinner"></span>{:else}<Icon name="link" size={16} />{/if} Créer le lien</button></div>
  </form>

  <div class="panel list">
    <h3>Liens existants</h3>
    {#if loadFailed}
      <p class="muted">Impossible de charger les invitations. <button type="button" class="linklike" onclick={load}>Réessayer</button></p>
    {:else if invites === null}
      <div class="skeleton line"></div>
    {:else if invites.length === 0}
      <p class="muted">Aucun lien pour l'instant.</p>
    {:else}
      {#each invites as invite (invite.id)}
        {@const st = status(invite)}
        <div class="row" class:off={st.tone === "off"}>
          <span class="chip" class:chip-accent={st.tone === "ok"}>{st.label}</span>
          <div class="info">
            <div><strong>{ROLE_LABEL[invite.role]}</strong> · créé le {formatDate(invite.createdAt)}</div>
            <div class="sub">
              {invite.useCount}{invite.maxUses !== null ? ` / ${invite.maxUses}` : ""} utilisation{invite.useCount > 1 ? "s" : ""}
              · {invite.expiresAt ? `expire le ${formatDate(invite.expiresAt)}` : "n'expire pas"}
            </div>
          </div>
          {#if st.tone === "ok"}
            <button type="button" class="btn btn-ghost btn-sm" onclick={() => revoke(invite)}>Révoquer</button>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
{/if}

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 14px;
  }
  .fresh {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent-soft) 40%, var(--surface));
  }
  .fresh strong {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--accent-strong);
  }
  .hint.warn {
    color: var(--warn);
  }
  .muted {
    color: var(--text-soft);
  }
  .list {
    gap: 4px;
  }
  .list h3 {
    margin-bottom: 8px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 0;
    border-top: 1px solid var(--line);
  }
  .row.off .info {
    opacity: 0.6;
  }
  .chip {
    min-width: 64px;
    justify-content: center;
  }
  .info {
    flex: 1;
    min-width: 0;
    font-size: 0.92rem;
  }
  .sub {
    font-size: 0.8rem;
    color: var(--text-faint);
  }
  .line {
    height: 48px;
  }
  .linklike {
    border: none;
    background: none;
    color: var(--accent);
    text-decoration: underline;
    padding: 0;
  }
</style>
