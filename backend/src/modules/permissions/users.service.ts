/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   users.service.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/09 21:34:46 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/13 21:47:36 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: admin-facing user CRUD required by the Advanced permissions major module
import type { User } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";
import { transferProjectOwnership, NotAProjectMemberError } from "../projects/projects.service.js";

export interface UpdateUserInput {
	name?: string;
	avatar?: string;
}

// listUsers returns all users, for the admin user-management view
export async function listUsers(): Promise<User[]> {
	return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

// getUser fetches a single user by ID
export async function getUser(id: string): Promise<User | null> {
	return prisma.user.findUnique({ where: { id }});
}

// updateUser applies an admin edit to a user's account (role changes go through assignRole, not here)
export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
	return prisma.user.update({ where: { id }, data: input });
}

export class UserNotFoundError extends Error {
	constructor() {
		super("user not found");
		this.name = "UserNotFoundError";
	}
}

export class TransferTargetRequiredError extends Error {
	constructor(public readonly projectIds: string[]) {
		super("transferTo is required: user owns oine or more shared Projects");
		this.name = "TransferTargetRequiredError";
	}
}

export class TransferTargetIsSelfError extends Error {
	constructor() {
		super("transferTo cannot be the user being deleted");
		this.name = "TransferTargetSelfError";
	}
}

// transferTo is a member ID (userId) to hand ownership to for any shared project this user
// owns. Required only if the user owns at least one project with other members
export interface DeleteUserOptions {
	trensferTo?: string;
}


// deleteUser removes a user account, for admin moderation
// @team: deleteUser currently works but has unresolved edge cases.
// What happens to Notes, Attachments, Notifications, ApiKeys, and owned Projects?
// Options:
// - Reassign (keep data, transfer ownership)
// - Soft delete (add deleted_at, filter queries)
// - Cascade (delete everything)
// - Restrict (only delete if no related data)
export async function deleteUser(id: string): Promise<void> {
	await prisma.user.delete({ where: { id }});
}
