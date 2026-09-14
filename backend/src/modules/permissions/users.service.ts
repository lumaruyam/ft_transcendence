/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   users.service.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/09 21:34:46 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/14 22:19:28 by lulmaruy         ###   ########.fr       */
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
		super("transferTo is required: user owns one or more shared projects");
		this.name = "TransferTargetRequiredError";
	}
}

export class TransferTargetIsSelfError extends Error {
	constructor() {
		super("transferTo cannot be the user being deleted");
		this.name = "TransferTargetIsSelfError";
	}
}

// transferTo is a member ID (userId) to hand ownership to for any shared project this user
// owns. Required only if the user owns at least one project with other members
export interface DeleteUserOptions {
	transferTo?: string;
}


// deleteUser removes a user account and transfer owner if there's another member
// in the project, then delete the user
export async function deleteUser(id: string, options: DeleteUserOptions = {}): Promise<void> {
	const user = await prisma.user.findUnique({ where: { id } });
	if (!user) {
		throw new UserNotFoundError();
	}

	if (options.transferTo === id) {
		throw new TransferTargetIsSelfError();
	}

	const ownedProjects = await prisma.project.findMany({
		where: { ownerId: id },
		include: { members: true },
	});
	const sharedProjects = ownedProjects.filter((p) => p.members.some((m) => m.userId !== id));
	const soloProjects = ownedProjects.filter((p) => !p.members.some((m) => m.userId !== id));

	if (sharedProjects.length > 0) {
		if (!options.transferTo) {
			throw new TransferTargetRequiredError(sharedProjects.map((p) => p.id));
		}
		for (const project of sharedProjects) {
			const isMember = project.members.some((m) => m.userId === options.transferTo);
			if (!isMember) {
				throw new NotAProjectMemberError(options.transferTo, project.id);
			}
		}
	}

	await prisma.$transaction(async (tx) => {
		for (const project of sharedProjects) {
			await transferProjectOwnership(project.id, options.transferTo as string, tx);
			await tx.note.updateMany({
				where: { projectId: project.id, updatedBy: id },
				data: { updatedBy: options.transferTo as string },
			});
			await tx.attachment.updateMany({
				where: { projectId: project.id, uploadedBy: id },
				data: { uploadedBy: options.transferTo as string },
			});
		}

		for (const project of soloProjects) {
			await tx.project.delete({ where: { id: project.id } });
		}

		await tx.notification.deleteMany({ where: { userId: id } });
		await tx.apiKey.deleteMany({ where: { userId: id } });
		await tx.user.delete({ where: { id } });
	});
}
