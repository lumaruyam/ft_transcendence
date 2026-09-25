// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: the left sidebar shell, empty for now but retractable, closed by default
const STORAGE_KEY = "ft_sidebar_collapsed";

const CHEVRON_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"></polyline></svg>`;

const HOUSE_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"/><path d="M10 20v-6h4v6"/></svg>`;

function isCollapsed(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // no stored preference means closed by default
    return stored === null ? true : stored === "1";
  } catch {
    return true;
  }
}

function persistCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    // storage disabled, fold state just will not survive a reload
  }
}

export function renderSidebar(container: HTMLElement): void {
  container.classList.toggle("collapsed", isCollapsed());

  const home = document.createElement("a");
  home.className = "sidebar-home";
  home.href = "/app";
  home.setAttribute("aria-label", "Retour a l'accueil (/app)");

  const badge = document.createElement("span");
  badge.className = "sidebar-home-badge";
  badge.textContent = "T"; // TODO: swap for the real app logo once one exists

  const icon = document.createElement("span");
  icon.className = "sidebar-home-icon";
  icon.innerHTML = HOUSE_SVG;

  const label = document.createElement("span");
  label.className = "sidebar-home-label";
  label.textContent = "Transcendance";

  home.append(badge, icon, label);
  container.appendChild(home);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "sidebar-toggle";
  toggle.setAttribute("aria-label", "Reduire ou agrandir la barre laterale");
  toggle.innerHTML = CHEVRON_SVG;
  toggle.addEventListener("click", () => {
    const collapsed = container.classList.toggle("collapsed");
    persistCollapsed(collapsed);
  });
  container.appendChild(toggle);
}
