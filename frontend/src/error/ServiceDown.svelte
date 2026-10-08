<!-- Polls /api/health and reloads when the backend is back. -->
<script lang="ts">
  import CenterPage from "../shared/ui/CenterPage.svelte";

  let attempts = $state(0);
  let checking = $state(false);

  async function check(): Promise<void> {
    if (checking) return;
    checking = true;
    try {
      const res = await fetch("/api/health", { headers: { accept: "application/json" } });
      if (res.ok) {
        window.location.reload();
        return;
      }
    } catch {
      // still down
    }
    attempts++;
    checking = false;
  }

  $effect(() => {
    const timer = setInterval(check, 5000);
    return () => clearInterval(timer);
  });
</script>

<CenterPage>
  <div class="mark" aria-hidden="true"><span class="pulse"></span></div>
  <h1>Le service reprend son souffle</h1>
  <p>Nous n'arrivons pas à joindre le serveur. Vos données sont en sécurité — cette page se rechargera d'elle-même dès que tout est rétabli.</p>
  <div class="actions">
    <button type="button" class="btn btn-primary" disabled={checking} onclick={check}>
      {#if checking}<span class="spinner"></span> Vérification…{:else}Réessayer maintenant{/if}
    </button>
  </div>
  {#if attempts > 0}<p class="faint">Tentative {attempts} — nouvelle vérification dans quelques secondes.</p>{/if}
</CenterPage>

<style>
  .mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--warn-soft);
  }
  .pulse {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--warn);
    animation: breathe 2.2s ease-in-out infinite;
  }
  @keyframes breathe {
    50% {
      transform: scale(1.5);
      opacity: 0.5;
    }
  }
  p {
    color: var(--text-soft);
    max-width: 44ch;
  }
  .faint {
    color: var(--text-faint);
    font-size: 0.85rem;
  }
  .actions {
    margin-top: 6px;
  }
</style>
