<script lang="ts">
  import CenterPage from "../shared/ui/CenterPage.svelte";
  import { getStoredToken } from "../auth/authClient";
</script>

<CenterPage>
  <div class="code" aria-hidden="true">404</div>
  <h1>Cette page n'existe pas</h1>
  <p>Le lien est peut-être ancien, ou l'adresse contient une faute de frappe.</p>
  <div class="actions">
    <a class="btn btn-primary" href={getStoredToken() ? "/app" : "/"}>{getStoredToken() ? "Mes projets" : "Accueil"}</a>
    <button type="button" class="btn" onclick={() => history.back()}>Retour</button>
  </div>
</CenterPage>

<style>
  .code {
    font-family: var(--font-serif);
    font-size: clamp(4rem, 14vw, 7.5rem);
    line-height: 1;
    color: var(--line-strong);
    letter-spacing: -0.04em;
  }
  p {
    color: var(--text-soft);
    max-width: 38ch;
  }
  .actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }
</style>
