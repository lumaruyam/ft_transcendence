// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: rendering the /app dashboard's project list into the DOM.
import type { ProjectSummary } from "./projectsApi";

export function renderProjectList(root: HTMLElement, projects: ProjectSummary[]): void {
  root.innerHTML = "";

  if (projects.length === 0) {
    const empty = document.createElement("p");
    empty.className = "project-list-empty";
    empty.textContent = "Aucun projet pour l'instant.";
    root.appendChild(empty);
    return;
  }

  for (const project of projects) {
    root.appendChild(renderProjectCard(project));
  }
}

function renderProjectCard(project: ProjectSummary): HTMLElement {
  const link = document.createElement("a");
  link.className = "project-card";
  link.href = `/app/${project.id}`;

  const name = document.createElement("span");
  name.className = "project-card-name";
  name.textContent = project.name;

  const role = document.createElement("span");
  role.className = "project-card-role";
  role.textContent = project.role;

  link.append(name, role);
  return link;
}
