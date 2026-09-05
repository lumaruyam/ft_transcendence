// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: adding/removing members within a project, part of the Organization system major module. TS equivalent of backend/internal/projects/members.go (Go skeleton, removed).
import type { ProjectMember } from "@prisma/client";
import type { Role } from "../permissions/roles.service.js"

// addMember adds a user to a project with a given role.
export async function addMember(projectId: string, userId: string, role: Role): Promise<void> {
  // TODO: verify the target user exists; verify the caller is an admin of the project (enforced upstream)
  // TODO: insert the project_members row via permissions' assignRole
}

// removeMember removes a user's membership from a project.
export async function removeMember(projectId: string, userId: string): Promise<void> {
  // TODO: delete the project_members row via prisma; disallow removing the last remaining admin
}

// listMembers returns every member of a project along with their role, for the members management view.
export async function listMembers(projectId: string): Promise<ProjectMember[]> {
  // TODO: prisma.projectMember.findMany({ where: { projectId }, include: { user: true } })
  return [];
}
