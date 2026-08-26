// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: admin-facing user CRUD required by the Advanced permissions major module. TS equivalent of backend/internal/permissions/userCrud.go (Go skeleton, removed).
import type { User } from "@prisma/client";

export interface UpdateUserInput {
  name?: string;
  avatar?: string;
}

// listUsers returns all users, for the admin user-management view.
export async function listUsers(): Promise<User[]> {
  // TODO: query all users via prisma.user.findMany; consider pagination once the user count grows
  return [];
}

// getUser fetches a single user by ID.
export async function getUser(id: string): Promise<User | null> {
  // TODO: prisma.user.findUnique, return null if absent (route layer turns this into 404)
  return null;
}

// updateUser applies an admin edit to a user's account (role changes go through assignRole, not here).
export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  // TODO: validate input fields, apply changes via prisma.user.update
  throw new Error("not implemented");
}

// deleteUser removes a user account, for admin moderation.
export async function deleteUser(id: string): Promise<void> {
  // TODO: cascade-consider: what happens to their cards/notes/attachments — reassign or soft-delete per team decision
}
