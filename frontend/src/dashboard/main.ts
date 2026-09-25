import { listMyProjects } from "./projectsApi";
import { renderProjectList } from "./projectListView";
import { initTheme } from "../kanban/theme";
import { renderProfileMenu } from "../kanban/profileMenu";

function renderTopBar(container: HTMLElement): void {
  const left = document.createElement("div");
  left.className = "topbar-left";

  const badge = document.createElement("div");
  badge.className = "brand-badge";
  badge.textContent = "T"; // TODO: swap for the real app logo once one exists

  const title = document.createElement("div");
  title.className = "topbar-title";
  title.textContent = "Transcendance";

  left.append(badge, title);
  container.appendChild(left);

  const right = document.createElement("div");
  right.className = "topbar-right";
  renderProfileMenu(right); // no projectId, this page is not scoped to a project
  container.appendChild(right);
}

async function init(): Promise<void> {
  initTheme();

  const topbar = document.getElementById("topbar");
  const root = document.getElementById("project-list-root");
  if (!topbar || !root) return;

  renderTopBar(topbar);

  try {
    const projects = await listMyProjects();
    renderProjectList(root, projects);
  } catch {
    renderProjectList(root, []);
  }
}

init();
