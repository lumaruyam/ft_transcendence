// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: role definitions and role assignment for the Advanced permissions major module. TS equivalent of backend/internal/permissions/roles.go (Go skeleton, removed).

// Role is one of the project-scoped roles stored on project_members.role.
export type Role = "admin" | "member" | "viewer";

export const ROLES: Record<"ADMIN" | "MEMBER" | "VIEWER", Role> = {
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
};

// assignRole sets or updates a user's role within a project.
export async function assignRole(projectId: string, userId: string, role: Role): Promise<void> {
  // TODO: upsert the (project_id, user_id) row in project_members via prisma.projectMember.upsert
  // TODO: only an existing admin should be able to call this — enforce via requireRole in the calling route
}

// getUserRole looks up a user's role within a project, used by requireRole and by frontend view-gating.
export async function getUserRole(projectId: string, userId: string): Promise<Role | null> {
  // TODO: query project_members for (project_id, user_id) via prisma; return null if the user isn't a member
  return null;
}
