<!-- The backend has no profile edit endpoint: name and e-mail are read-only. -->
<script lang="ts">
  import { ApiError } from "../api/apiClient";
  import { deleteAccount } from "../api/accountApi";
  import { listMembers, listMyProjects } from "../api/projectsApi";
  import type { Member, Project } from "../api/types";
  import { clearAuthSession, getStoredUser, logout } from "../auth/authClient";
  import { confirmDialog } from "../shared/confirm.svelte";
  import { errorMessage } from "../shared/errors";
  import { ensureUser } from "../shared/session";
  import { toast } from "../shared/toast.svelte";
  import AppHeader from "../shared/ui/AppHeader.svelte";
  import Avatar from "../shared/ui/Avatar.svelte";
  import Icon from "../shared/ui/Icon.svelte";
  import ThemeSwitch from "../shared/ui/ThemeSwitch.svelte";

  let user = $state(getStoredUser());
  let busy = $state(false);

  // step to hand over projects before deleting the account
  let dialog: HTMLDialogElement;
  let handover = $state<{ projects: Project[]; candidates: Member["user"][]; reason: "transfer" | "last_admin" } | null>(null);
  let transferTo = $state("");

  $effect(() => {
    document.title = "Paramètres du compte — Transcendance";
    void ensureUser().then((u) => (user = u));
  });

  async function onLogout(): Promise<void> {
    await logout();
    window.location.href = "/login";
  }

  async function onDelete(): Promise<void> {
    if (!user) return;
    const ok = await confirmDialog({
      title: "Supprimer votre compte ?",
      message: "Votre compte sera supprimé définitivement. Vos projets partagés doivent d'abord avoir quelqu'un d'autre pour les administrer.",
      confirmLabel: "Supprimer mon compte",
      danger: true,
      requireText: user.email,
    });
    if (ok) await attemptDelete();
  }

  async function attemptDelete(target?: string): Promise<void> {
    if (!user) return;
    busy = true;
    try {
      await deleteAccount(user.id, target);
      clearAuthSession();
      window.location.href = "/";
    } catch (err) {
      busy = false;
      if (err instanceof ApiError && (err.code === "transfer_target_required" || err.code === "last_admin_of_membership")) {
        await openHandover(err);
      } else if (err instanceof ApiError && err.code === "transfer_target_not_a_member") {
        toast("Cette personne n'est pas membre de tous les projets concernés. Choisissez-en une autre.", { kind: "error" });
      } else {
        toast(errorMessage(err), { kind: "error" });
      }
    }
  }

  // projects blocking the deletion, and the members of all of them who could take over
  async function openHandover(err: ApiError): Promise<void> {
    const ids = Array.isArray(err.payload.projectIds) ? (err.payload.projectIds as string[]) : [];
    try {
      const all = await listMyProjects();
      const projects = all.filter((p) => ids.includes(p.id));
      const memberLists = await Promise.all(projects.map((p) => listMembers(p.id)));
      const common = memberLists
        .map((list) => list.filter((m) => m.userId !== user?.id).map((m) => m.user))
        .reduce<Member["user"][]>((acc, list, i) => (i === 0 ? list : acc.filter((u) => list.some((x) => x.id === u.id))), []);
      transferTo = "";
      handover = { projects, candidates: common, reason: err.code === "last_admin_of_membership" ? "last_admin" : "transfer" };
      dialog.showModal();
    } catch (loadErr) {
      toast(errorMessage(loadErr), { kind: "error" });
    }
  }

  function closeHandover(): void {
    dialog.close();
    handover = null;
  }
</script>

<AppHeader />

<main>
  <h1>Paramètres du compte</h1>

  <section class="panel profile">
    <Avatar name={user?.name ?? "?"} id={user?.id} size={64} />
    <div class="who">
      <div class="name selectable">{user?.name ?? "…"}</div>
      <div class="email selectable">{user?.email ?? ""}</div>
    </div>
  </section>
  <p class="hint">Le nom et l'adresse e-mail ne sont pas modifiables pour l'instant.</p>

  <section class="panel">
    <div>
      <h2>Apparence</h2>
      <p class="sub">« Auto » suit le réglage clair ou sombre de votre navigateur ; les deux autres choix le remplacent, sur cet appareil.</p>
    </div>
    <div class="theme"><ThemeSwitch /></div>
  </section>

  <section class="panel">
    <div class="row-between">
      <div>
        <h2>Session</h2>
        <p class="sub">Vous êtes connecté sur cet appareil.</p>
      </div>
      <button type="button" class="btn" onclick={onLogout}><Icon name="logout" size={16} /> Se déconnecter</button>
    </div>
  </section>

  <section class="panel panel-danger">
    <div class="row-between">
      <div>
        <h2>Supprimer mon compte</h2>
        <p class="sub">Action définitive. Vos données personnelles sont effacées.</p>
      </div>
      <button type="button" class="btn btn-danger" disabled={busy} onclick={onDelete}>
        {#if busy}<span class="spinner"></span>{:else}<Icon name="trash" size={16} />{/if} Supprimer
      </button>
    </div>
  </section>

  <nav class="legal"><a href="/legal/terms">Conditions d'utilisation</a><a href="/legal/privacy">Politique de confidentialité</a></nav>
</main>

<dialog class="modal" bind:this={dialog} aria-labelledby="handover-title" onclose={() => (handover = null)}>
  {#if handover}
    <form
      onsubmit={(e) => {
        e.preventDefault();
        if (transferTo) void attemptDelete(transferTo);
      }}
    >
      <h2 id="handover-title">À qui confier vos projets ?</h2>
      <p class="sub">
        {#if handover.reason === "last_admin"}
          Vous êtes le dernier administrateur de ces projets. Quelqu'un doit en prendre la responsabilité avant que votre compte disparaisse :
        {:else}
          Vous administrez ces projets avec d'autres personnes. Choisissez qui en deviendra propriétaire :
        {/if}
      </p>
      <ul>
        {#each handover.projects as project (project.id)}
          <li><Icon name="folder" size={15} /> <a href={`/app/${project.id}/settings#membres`}>{project.name}</a></li>
        {/each}
      </ul>

      {#if handover.candidates.length === 0}
        <div class="alert alert-warn">
          <Icon name="info" size={17} />
          <span>Aucun membre n'est présent dans tous ces projets à la fois. Invitez quelqu'un, ou transférez chaque projet depuis ses réglages (liens ci-dessus), puis revenez ici.</span>
        </div>
      {:else}
        <div class="field">
          <label for="transfer-to">Nouveau propriétaire</label>
          <select id="transfer-to" class="input" bind:value={transferTo}>
            <option value="">Choisir…</option>
            {#each handover.candidates as person (person.id)}<option value={person.id}>{person.name} — {person.email}</option>{/each}
          </select>
        </div>
      {/if}

      <div class="actions">
        <button type="button" class="btn btn-ghost" onclick={closeHandover}>Annuler</button>
        <button type="submit" class="btn btn-danger" disabled={!transferTo || busy}>Transférer et supprimer mon compte</button>
      </div>
    </form>
  {/if}
</dialog>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 640px;
    margin: 0 auto;
    padding: 40px 20px 80px;
  }
  main h1 {
    margin-bottom: 4px;
  }
  .profile {
    flex-direction: row;
    align-items: center;
    gap: 18px;
  }
  .name {
    font-family: var(--font-serif);
    font-size: 1.3rem;
    font-weight: 600;
  }
  .email {
    color: var(--text-soft);
  }
  .sub {
    margin-top: 4px;
    color: var(--text-soft);
    font-size: 0.92rem;
  }
  .theme {
    max-width: 340px;
  }
  .legal {
    display: flex;
    justify-content: center;
    gap: 22px;
    margin-top: 12px;
    font-size: 0.85rem;
  }
  .legal a {
    color: var(--text-faint);
  }
  dialog {
    width: min(480px, calc(100vw - 24px));
  }
  dialog form {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 24px;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }
</style>
