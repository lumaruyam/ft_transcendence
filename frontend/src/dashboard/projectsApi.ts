// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: frontend API calls backing the /app dashboard (project list).

export interface ProjectSummary {
  id: string;
  name: string;
  role: string;
}

// listMyProjects loads every project the logged-in user belongs to.
export async function listMyProjects(): Promise<ProjectSummary[]> {
  // TODO: GET /api/projects via the shared apiClient once apiRequest is implemented —
  // backend/src/modules/projects/projects.routes.ts's listProjectsHandler is also still a stub.
  throw new Error("not implemented");
}
