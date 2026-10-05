// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: frontend API calls backing the /app dashboard (project list and creation).
import { apiRequest } from "../api/apiClient";

export interface ProjectSummary {
  id: string;
  name: string;
}

// listMyProjects returns the projects the logged-in user is a member of
export async function listMyProjects(): Promise<ProjectSummary[]> {
  const { projects } = await apiRequest<{ projects: ProjectSummary[] }>({ method: "GET", path: "/projects" });
  return projects;
}

export async function createProject(name: string): Promise<ProjectSummary> {
  const { project } = await apiRequest<{ project: ProjectSummary }>({ method: "POST", path: "/projects", body: { name } });
  return project;
}
