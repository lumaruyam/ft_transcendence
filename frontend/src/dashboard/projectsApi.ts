// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: frontend API calls backing the /app dashboard (project list).

export interface ProjectSummary {
  id: string;
  name: string;
  role: string;
}

// note: the backend endpoint is itself a temporary stub with hardcoded data
export async function listMyProjects(): Promise<ProjectSummary[]> {
  const res = await fetch("/api/my-projects");
  if (!res.ok) {
    throw new Error(`API error ${res.status} on /api/my-projects`);
  }
  return res.json();
}
