<script lang="ts">
  import AuthLayout from "../auth/AuthLayout.svelte";
  import PasswordField from "../auth/PasswordField.svelte";
  import { login, storeAuthSession, AuthApiError } from "../auth/authClient";
  import { startOAuthLogin } from "../auth/oauthFlow";
  import { validateEmail } from "../auth/validation";
  import Icon from "../shared/ui/Icon.svelte";
  import { nextFromUrl, signupUrl } from "../shared/session";

  const next = nextFromUrl();

  let email = $state("");
  let password = $state("");
  let emailError = $state<string | null>(null);
  let passwordError = $state<string | null>(null);
  let formError = $state<string | null>(null);
  let busy = $state(false);

  async function onSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    formError = null;
    emailError = validateEmail(email);
    passwordError = password ? null : "Entrez votre mot de passe.";
    if (emailError || passwordError) {
      document.getElementById(emailError ? "email" : "password")?.focus();
      return;
    }

    busy = true;
    try {
      storeAuthSession(await login({ email: email.trim().toLowerCase(), password }));
      window.location.href = next;
    } catch (err) {
      busy = false;
      if (err instanceof AuthApiError && err.status === 401) {
        formError = "E-mail ou mot de passe incorrect.";
        password = "";
        document.getElementById("password")?.focus();
      } else if (err instanceof AuthApiError && err.status === 429) {
        formError = "Trop de tentatives. Patientez une minute puis réessayez.";
      } else if (err instanceof AuthApiError && err.status === 0) {
        formError = err.message;
      } else {
        formError = "Connexion impossible pour le moment. Réessayez dans un instant.";
      }
    }
  }
</script>

<AuthLayout>
  <form class="form" onsubmit={onSubmit} novalidate>
    <header>
      <h1>Content de vous revoir</h1>
      <p class="sub">Connectez-vous pour retrouver vos projets.</p>
    </header>

    {#if formError}
      <div class="alert" role="alert"><Icon name="alert" size={17} /> <span>{formError}</span></div>
    {/if}

    <div class="field">
      <label for="email">Adresse e-mail</label>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        id="email"
        class="input"
        type="email"
        bind:value={email}
        autocomplete="email"
        autofocus
        aria-invalid={emailError ? "true" : undefined}
        aria-describedby={emailError ? "email-error" : undefined}
        onblur={() => email && (emailError = validateEmail(email))}
      />
      {#if emailError}<span class="field-error" id="email-error">{emailError}</span>{/if}
    </div>

    <PasswordField id="password" bind:value={password} autocomplete="current-password" error={passwordError} />

    <div class="row">
      <a href="/forgot-password">Mot de passe oublié ?</a>
    </div>

    <button type="submit" class="btn btn-primary btn-block" disabled={busy}>
      {#if busy}<span class="spinner"></span> Connexion…{:else}Se connecter{/if}
    </button>

    <div class="or"><span>ou</span></div>

    <button type="button" class="btn btn-block" disabled={busy} onclick={() => startOAuthLogin(next === "/app" ? undefined : next)}>
      <Icon name="github" size={18} /> Continuer avec GitHub
    </button>

    <p class="switch">Pas encore de compte ? <a href={signupUrl(next)}>Créer un compte</a></p>
  </form>
</AuthLayout>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: min(400px, 100%);
  }
  .sub {
    margin-top: 6px;
    color: var(--text-soft);
  }
  .row {
    display: flex;
    justify-content: flex-end;
    margin-top: -8px;
    font-size: 0.86rem;
  }
  .or {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-faint);
    font-size: 0.82rem;
  }
  .or::before,
  .or::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--line);
  }
  .switch {
    text-align: center;
    color: var(--text-soft);
    font-size: 0.92rem;
    margin-top: 4px;
  }
</style>
