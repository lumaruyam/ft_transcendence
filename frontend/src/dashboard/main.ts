import { listMyProjects } from "./projectsApi";
import { renderProjectList } from "./projectListView";

async function init(): Promise<void> {
  const root = document.getElementById("project-list-root");
  if (!root) return;

  try {
    const projects = await listMyProjects();
    renderProjectList(root, projects);
  } catch {
    // projectsApi.ts's listMyProjects is still a stub — show the empty state until it's wired.
    renderProjectList(root, []);
  }
}

init();
