/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   members.service.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/11 21:57:27 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/12 15:44:12 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: adding/removing members within a project, part of the Organization system major module
import type { ProjectMember } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";
import { assignRole, ROLE_RANK, type Role } from "../permissions/roles.service.js"

export class UserNotFoundError extends Error {
	constructor() {
		super("target user does not exist");
		this.name = "UserNotFoundError";
	}
}

export class LastAdminError extends Error {
	constructor() {
		super("cannot remove the project's last remaining admin");
		this.name = "LastAdminError";
	}
}

// addMember adds a user to a project with a given role.
export async function addMember(projectId: string, userId: string, role: Role): Promise<void> {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new UserNotFoundError();
	}
	await assignRole(projectId, userId, role);
}

// removeMember removes a user's membership from a project.
export async function removeMember(projectId: string, userId: string): Promise<void> {
	const target = await prisma.projectMember.findUnique({
		where: { projectId_userId: { projectId, userId } },
	});
	if (!target) {
		return;
	}

	if (target.role === "admin") {
		const adminCount = await prisma.projectMember.count({
			where: { projectId, role: "admin"},
		});
		if (adminCount <= 1) {
			throw new LastAdminError();
		}
	}
	await prisma.projectMember.delete({
		where: { projectId_userId: { projectId, userId } },
	});
}

// listMembers returns every member of a project along with their role, for the members management view.
export async function listMembers(projectId: string): Promise<ProjectMember[]> {
	const members = await prisma.projectMember.findMany({
		where: { projectId },
		include: { user: true },
	});
	return members.sort((a, b) => ROLE_RANK[b.role as Role] - ROLE_RANK[a.role as Role]);
}
