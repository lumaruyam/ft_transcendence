// health test: call the backend health endpoint and render the result, so opening
// /landing visually confirms the full round-trip (browser -> nginx -> backend -> Postgres).

interface HealthResponse {
  status: string;
  service: string;
  db: "up" | "down";
  time: string;
}

const box = document.getElementById("api-status");
const button = document.getElementById("api-retry");

async function checkApi(): Promise<void> {
  if (!box) return;
  box.className = "api-status pending";
  box.textContent = "checking backend…";

  try {
    const res = await fetch("/api/health", { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as HealthResponse;
    box.className = body.db === "up" ? "api-status ok" : "api-status warn";
    box.textContent = `backend: ${body.status} · db: ${body.db} · ${body.time}`;
  } catch (err) {
    box.className = "api-status err";
    const msg = err instanceof Error ? err.message : "unknown error";
    box.textContent = `backend unreachable — ${msg}`;
  }
}

button?.addEventListener("click", checkApi);
void checkApi();
