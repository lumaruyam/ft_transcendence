// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: create/edit/delete for projects (organizations) — the Organization system major module. Unclaimed by any other track in docs/github-workflow.md, grouped here since it underpins the permissions/project_members model Track 1 already owns. TS equivalent of backend/internal/projects/projects.go (Go skeleton, removed).
import type { Project } from "@prisma/client";

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
