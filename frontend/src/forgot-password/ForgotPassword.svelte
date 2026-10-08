<script lang="ts">
  import AuthLayout from "../auth/AuthLayout.svelte";
  import { startOAuthLogin } from "../auth/oauthFlow";
  import Icon from "../shared/ui/Icon.svelte";
</script>

<AuthLayout>
  <div class="box">
    <header>
      <h1>Mot de passe oublié</h1>
      <p class="sub">La réinitialisation par e-mail n'est pas encore disponible sur cette instance.</p>
    </header>

    <div class="alert alert-info">
      <Icon name="info" size={17} />
      <span>Vos mots de passe ne sont jamais lisibles, même par nous : nous ne pouvons pas vous les renvoyer.</span>
    </div>

    <p class="help">Deux solutions pour retrouver l'accès :</p>
    <ul>
      <li>Si votre compte est lié à GitHub, connectez-vous avec GitHub.</li>
      <li>Sinon, demandez à la personne qui administre cette instance de vous aider.</li>
    </ul>

    <button type="button" class="btn btn-block" onclick={() => startOAuthLogin()}>
      <Icon name="github" size={18} /> Continuer avec GitHub
    </button>
    <a class="btn btn-ghost btn-block" href="/login"><Icon name="arrowLeft" size={16} /> Retour à la connexion</a>
  </div>
</AuthLayout>

<style>
  .box {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: min(400px, 100%);
  }
  .sub {
    margin-top: 6px;
    color: var(--text-soft);
  }
  .help {
    color: var(--text-soft);
    margin-bottom: -8px;
  }
  ul {
    padding-left: 20px;
    color: var(--text-soft);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
