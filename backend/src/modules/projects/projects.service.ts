// Owner: Track 2 (Person A — Kanban CRUD and UI, extended to Organization system / projects & members)
// Responsible for: create/edit/delete for projects (organizations) — the Organization system major module — plus
// audit-aware membership helpers. Reassigned from Track 1 to Track 2 Person A (see TODO.md) since it's the closest
// existing owner of project-level CRUD/UI work; permissions enforcement itself stays with Track 1's
// modules/permissions/. TS equivalent of backend/internal/projects/projects.go (Go skeleton, removed).
import type { Project, ProjectMember } from "@prisma/client";
import type { Role } from "../permissions/roles.service";

export interface CreateProjectInput {
  name: string;
}

export interface UpdateProjectInput {
  name?: string;
}

// createProject creates a new project (organization) and makes the creator its owner/admin member.
export async function createProject(ownerId: string, input: CreateProjectInput): Promise<Project> {
  // TODO: validate input.name (required, length limits) — backend half of dual validation requirement
  // TODO: prisma.project.create with ownerId, then prisma.projectMember.create for ownerId with role "admin" (ideally in a $transaction)
  throw new Error("not implemented");
}

// getProject fetches a project by ID, checking the caller is a member (enforced by permissions middleware upstream).
export async function getProject(id: string): Promise<Project | null> {
  // TODO: prisma.project.findUnique
  return null;
}

// updateProject edits a project's editable fields (name, etc.).
export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  // TODO: validate and apply changes via prisma.project.update; only admins should reach this (enforced via requireRole)
  throw new Error("not implemented");
}

// deleteProject removes a project and cascades to its boards/lists/cards/notes/attachments.
export async function deleteProject(id: string): Promise<void> {
  // TODO: decide and implement cascade delete or soft-delete strategy — Prisma's onDelete: Cascade in schema.prisma handles the FK cascade for boards/notes/attachments/api keys
}

// listProjectsForUser returns every project a given user is a member of, for the project switcher UI.
export async function listProjectsForUser(userId: string): Promise<Project[]> {
  // TODO: prisma.project.findMany({ where: { members: { some: { userId } } } })
  return [];
}

// --- Membership helpers (audit-aware wrappers around members.service.ts) ---
// These add createdBy/removedBy audit parameters on top of members.service.ts's addMember/removeMember/listMembers.
// Requested alongside the invite-link flow (see invites.service.ts's joinProjectFromInvite, which inserts membership
// directly rather than going through these — an invite join has no separate "admin who added them" to record).
// TODO: team should decide whether to keep both members.service.ts and these wrappers long-term, or consolidate into
// one file — kept separate here to avoid rewriting members.service.ts's existing signatures mid-scaffold.

// addProjectMember adds a user to a project with a given role, recording who performed the action.
export async function addProjectMember(
  projectId: string,
  userId: string,
  role: Role,
  addedBy: string
): Promise<void> {
  // TODO: verify addedBy has an admin project_members role for projectId (belt-and-suspenders on top of the
  //       requireProjectRole preHandler enforced upstream at the route level)
  // TODO: delegate to members.service.ts's addMember(projectId, userId, role) for the actual insert
  // TODO: audit logging: record addedBy somewhere durable if the team wants a trail beyond app logs (same open TODO
  //       as invites.service.ts's revokeProjectInvite)
}

// removeProjectMember removes a user's membership from a project, recording who performed the action.
export async function removeProjectMember(
  projectId: string,
  userId: string,
  removedBy: string
): Promise<void> {
  // TODO: verify removedBy has an admin project_members role for projectId
  // TODO: delegate to members.service.ts's removeMember(projectId, userId); disallow removing the last remaining
  //       admin (same rule members.service.ts already notes)
  // TODO: audit logging: record removedBy
}

// listProjectMembers returns every member of a project, for the members management view.
export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  // TODO: delegate to members.service.ts's listMembers(projectId) — kept here too so callers that only import
  //       projects.service.ts (e.g. a future project-detail aggregate endpoint) don't also need members.service.ts
  return [];
}
