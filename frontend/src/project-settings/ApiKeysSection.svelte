<script lang="ts">
  import { onMount } from "svelte";
  import { createApiKey, listApiKeys, revokeApiKey } from "../api/projectsApi";
  import type { ApiKeyRow, Project } from "../api/types";
  import { confirmDialog } from "../shared/confirm.svelte";
  import { errorMessage } from "../shared/errors";
  import { formatDate } from "../shared/format";
  import { toast } from "../shared/toast.svelte";
  import CopyField from "../shared/ui/CopyField.svelte";
  import Icon from "../shared/ui/Icon.svelte";

  let { project, isAdmin }: { project: Project; isAdmin: boolean } = $props();

  let keys = $state<ApiKeyRow[] | null>(null);
  let loadFailed = $state(false);
  let rateLimit = $state("");
  let busy = $state(false);
  let error = $state<string | null>(null);
  let fresh = $state<string | null>(null);

  const example = $derived(
    `curl -H "X-API-Key: ${fresh ?? "tk_votre_cle"}" \\\n  ${location.origin}/api/projects/${project.id}/cards`
  );

  onMount(() => {
    if (isAdmin) void load();
  });

  async function load(): Promise<void> {
    loadFailed = false;
    try {
      keys = await listApiKeys(project.id);
    } catch {
      loadFailed = true;
    }
  }

  async function onCreate(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    error = null;
    const limit = rateLimit.trim() === "" ? undefined : Number(rateLimit);
    if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > 10000)) {
      error = "La limite doit être un entier entre 1 et 10 000 requêtes par minute.";
      return;
    }
    busy = true;
    try {
      fresh = (await createApiKey(project.id, limit)).key;
      rateLimit = "";
      await load();
    } catch (err) {
      error = errorMessage(err);
    } finally {
      busy = false;
    }
  }

  async function revoke(key: ApiKeyRow): Promise<void> {
    const ok = await confirmDialog({
      title: "Révoquer cette clé ?",
      message: "Les scripts qui l'utilisent cesseront immédiatement de fonctionner.",
      confirmLabel: "Révoquer",
      danger: true,
    });
    if (!ok) return;
    try {
      await revokeApiKey(project.id, key.id);
      toast("Clé révoquée");
    } catch (err) {
      toast(errorMessage(err), { kind: "error" });
    }
    await load();
  }
</script>

<header class="section-head">
  <h2>Clés API</h2>
  <p>Pour lire et modifier les cartes de ce projet depuis un script ou un autre outil, sans passer par l'interface.</p>
</header>

{#if !isAdmin}
  <div class="panel"><p class="muted">Seuls les administrateurs peuvent gérer les clés API.</p></div>
{:else}
  {#if fresh}
    <div class="panel fresh" role="status">
      <div class="row-between">
        <strong><Icon name="check" size={16} /> Clé créée</strong>
        <button type="button" class="icon-btn" aria-label="Fermer" onclick={() => (fresh = null)}><Icon name="x" size={16} /></button>
      </div>
      <CopyField value={fresh} label="Clé API" />
      <p class="hint warn">Copiez-la maintenant : elle ne sera plus jamais affichée. Si vous la perdez, créez-en une nouvelle.</p>
    </div>
  {/if}

  <form class="panel" onsubmit={onCreate}>
    <h3>Nouvelle clé</h3>
    <div class="field narrow">
      <label for="rate">Limite de requêtes par minute</label>
      <input id="rate" class="input" type="number" min="1" max="10000" step="1" inputmode="numeric" placeholder="Valeur par défaut" bind:value={rateLimit} />
    </div>
    {#if error}<span class="field-error" role="alert">{error}</span>{/if}
    <div><button type="submit" class="btn btn-primary" disabled={busy}>{#if busy}<span class="spinner"></span>{:else}<Icon name="key" size={16} />{/if} Créer une clé</button></div>
  </form>

  <div class="panel list">
    <h3>Clés actives</h3>
    {#if loadFailed}
      <p class="muted">Impossible de charger les clés. <button type="button" class="linklike" onclick={load}>Réessayer</button></p>
    {:else if keys === null}
      <div class="skeleton line"></div>
    {:else if keys.length === 0}
      <p class="muted">Aucune clé pour l'instant.</p>
    {:else}
      {#each keys as key (key.id)}
        <div class="row">
          <Icon name="key" size={18} />
          <div class="info">
            <div>Clé <code>…{key.id.slice(-6)}</code></div>
            <div class="sub">Créée le {formatDate(key.createdAt)} · {key.rateLimit} requêtes/minute</div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick={() => revoke(key)}>Révoquer</button>
        </div>
      {/each}
    {/if}
  </div>

  <div class="panel">
    <h3>Exemple</h3>
    <pre><code>{example}</code></pre>
    <span class="hint">Autres routes : <code>POST</code>, <code>PUT</code> et <code>DELETE</code> sur <code>/api/projects/{"{id}"}/cards</code>.</span>
  </div>
{/if}

<style>
  .narrow {
    max-width: 280px;
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
    color: var(--text-soft);
  }
  .info {
    flex: 1;
    min-width: 0;
    color: var(--text);
    font-size: 0.92rem;
  }
  .sub {
    font-size: 0.8rem;
    color: var(--text-faint);
  }
  .line {
    height: 48px;
  }
  pre {
    margin: 0;
    padding: 14px 16px;
    border-radius: var(--radius);
    background: var(--bg-sunken);
    overflow-x: auto;
    font-size: 0.84rem;
  }
  .linklike {
    border: none;
    background: none;
    color: var(--accent);
    text-decoration: underline;
    padding: 0;
  }
</style>
