<!-- Owner: Track 1 (Foundation, Auth, and API infrastructure)
     Responsible for: the public landing page. -->
<script lang="ts">
  import { getStoredToken } from "../auth/authClient";
  import BoardArt from "../shared/ui/BoardArt.svelte";
  import Icon from "../shared/ui/Icon.svelte";
  import Logo from "../shared/ui/Logo.svelte";
  import ThemeSwitch from "../shared/ui/ThemeSwitch.svelte";

  const signedIn = getStoredToken() !== null;

  const FEATURES = [
    { icon: "columns", title: "Un tableau vivant", text: "Les cartes bougent sous vos yeux : ce que fait l'équipe apparaît à l'instant, avec la liste de qui est en ligne." },
    { icon: "branch", title: "Branché sur Git", text: "Une branche, une pull request : la carte qui y est liée avance toute seule, et l'équipe est prévenue." },
    { icon: "note", title: "Notes et tableau blanc", text: "Un espace pour écrire, un autre pour dessiner. Dans le même projet, sans changer d'outil." },
    { icon: "search", title: "Tout se retrouve", text: "Un raccourci, Ctrl K, et vous cherchez dans les cartes, les notes et les fichiers du projet." },
    { icon: "users", title: "Une équipe, des rôles", text: "Administrateurs, membres, lecteurs. On invite avec un simple lien, qu'on peut révoquer d'un clic." },
    { icon: "key", title: "Ouvert aux scripts", text: "Une API publique à clé, limitée en débit, pour relier vos cartes au reste de vos outils." },
  ];

  type Health = "checking" | "up" | "degraded" | "down";
  let health = $state<Health>("checking");

  $effect(() => {
    fetch("/api/health", { headers: { accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const body = (await res.json()) as { db?: string };
        health = body.db === "up" ? "up" : "degraded";
      })
      .catch(() => (health = "down"));
  });

  const HEALTH_TEXT: Record<Health, string> = {
    checking: "Vérification du service…",
    up: "Service opérationnel",
    degraded: "Service dégradé",
    down: "Service injoignable",
  };
</script>

<div class="page">
  <header>
    <a class="brand" href="/"><Logo size={32} /><span>Transcendance</span></a>
    <nav>
      <a class="link" href="#fonctionnalites">Fonctionnalités</a>
      <ThemeSwitch compact />
      {#if signedIn}
        <a class="btn btn-primary btn-sm" href="/app">Mes projets</a>
      {:else}
        <a class="btn btn-ghost btn-sm" href="/login">Connexion</a>
        <a class="btn btn-primary btn-sm" href="/signup">Créer un compte</a>
      {/if}
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="copy">
        <p class="eyebrow">Gestion de projet collaborative</p>
        <h1>Avancez ensemble,<br /><em>sans le bruit.</em></h1>
        <p class="lead">
          Un tableau, des notes et un tableau blanc partagés, qui se mettent à jour en direct. Un outil calme, pensé pour que
          l'équipe passe son temps à faire, pas à gérer l'outil.
        </p>
        <div class="cta">
          {#if signedIn}
            <a class="btn btn-primary" href="/app">Ouvrir mes projets <Icon name="arrowRight" size={17} /></a>
          {:else}
            <a class="btn btn-primary" href="/signup">Commencer gratuitement <Icon name="arrowRight" size={17} /></a>
            <a class="btn" href="/login">J'ai déjà un compte</a>
          {/if}
        </div>
      </div>
      <div class="art"><BoardArt /></div>
    </section>

    <section id="fonctionnalites" class="features">
      <h2>Tout ce qu'il faut, rien de superflu</h2>
      <div class="grid">
        {#each FEATURES as feature (feature.title)}
          <article>
            <span class="icon"><Icon name={feature.icon} size={20} /></span>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        {/each}
      </div>
    </section>

    <section class="closing">
      <h2>Prêt à travailler au calme ?</h2>
      <p>Créez un projet en quelques secondes, invitez votre équipe avec un lien.</p>
      <a class="btn btn-primary" href={signedIn ? "/app" : "/signup"}>{signedIn ? "Ouvrir mes projets" : "Créer un compte"}</a>
    </section>
  </main>

  <footer>
    <span class="status" class:ok={health === "up"} class:warn={health === "degraded"} class:err={health === "down"}>
      <span class="dot"></span>{HEALTH_TEXT[health]}
    </span>
    <span class="links"><a href="/legal/terms">Conditions</a><a href="/legal/privacy">Confidentialité</a></span>
  </footer>
</div>

<style>
  .page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 28px;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 0;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--text);
    text-decoration: none;
    font-family: var(--font-serif);
    font-size: 1.3rem;
    font-weight: 600;
  }
  nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .link {
    margin-right: 8px;
    color: var(--text-soft);
    font-size: 0.92rem;
    text-decoration: none;
  }
  .link:hover {
    color: var(--text);
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    align-items: center;
    gap: 56px;
    padding: 72px 0 96px;
  }
  .eyebrow {
    margin-bottom: 18px;
    color: var(--accent);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  h1 {
    font-size: clamp(2.5rem, 5.4vw, 4rem);
    line-height: 1.08;
    letter-spacing: -0.025em;
  }
  h1 em {
    color: var(--accent);
    font-style: italic;
  }
  .lead {
    max-width: 46ch;
    margin: 22px 0 32px;
    color: var(--text-soft);
    font-size: 1.1rem;
    line-height: 1.65;
  }
  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .cta .btn {
    min-height: 46px;
    padding: 0 22px;
  }
  .art {
    padding: 0 8px;
  }
  .features {
    padding: 40px 0 80px;
    border-top: 1px solid var(--line);
  }
  .features h2 {
    max-width: 18ch;
    margin-bottom: 40px;
    font-size: clamp(1.7rem, 3.4vw, 2.3rem);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
    gap: 36px 40px;
  }
  article .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    margin-bottom: 14px;
    border-radius: 12px;
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  article p {
    margin-top: 6px;
    color: var(--text-soft);
  }
  .closing {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 64px 24px;
    border-radius: 28px;
    background: var(--bg-sunken);
    text-align: center;
  }
  .closing p {
    margin-bottom: 8px;
    color: var(--text-soft);
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 40px 0 32px;
    font-size: 0.84rem;
    color: var(--text-faint);
  }
  .links {
    display: flex;
    gap: 18px;
  }
  .links a {
    color: var(--text-faint);
  }
  .status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-faint);
  }
  .ok .dot {
    background: var(--online);
  }
  .warn .dot {
    background: var(--warn);
  }
  .err .dot {
    background: var(--danger);
  }
  @media (max-width: 860px) {
    .hero {
      grid-template-columns: 1fr;
      gap: 40px;
      padding: 40px 0 64px;
    }
    .link {
      display: none;
    }
  }
  @media (max-width: 520px) {
    .page {
      padding: 0 16px;
    }
    nav .btn-ghost {
      display: none;
    }
  }
</style>
