/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   roles.service.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/09 20:34:29 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/09 21:31:17 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: role definitions and role assignment for the Advanced permissions major module

import { prisma } from "../../db/prisma/client.js";

// Role is one of the project-scoped roles stored on project_members.role
export type Role = "admin" | "member" | "viewer";

export const ROLES: Record<"ADMIN" | "MEMBER" | "VIEWER", Role> = {
	ADMIN: "admin",
	MEMBER: "member",
	VIEWER: "viewer",
};

// ROLE_RANK orders roles from least to most privileged, so permissions.middleware.ts's requireRole
export const ROLE_RANK: Record<Role, number> = {
	viewer: 0,
	member: 1,
	admin: 2,
};

// assignRole sets or updates a user's role within a project
// only an existing admin should be able to call this
export async function assignRole(projectId: string, userId: string, role: Role): Promise<void> {
	await prisma.projectMember.upsert({
		where: { projectId_userId: { projectId, userId } },
		create: { projectId, userId, role },
		update: { role },
	});
}

// getUserRole looks up a user's role within a project, used by requireRole and by frontend view-gating
export async function getUserRole(projectId: string, userId: string): Promise<Role | null> {
	const member = await prisma.projectMember.findUnique({
		where: { projectId_userId: { projectId, userId } },
	});
	return (member?.role as Role | undefined) ?? null;
}
