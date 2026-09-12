/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   projects.routes.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/12 15:44:50 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/12 22:06:49 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: Fastify route handlers for project (organization) CRUD and membership management.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth, requireRole } from "../permissions/permissions.middleware.js";
import { ROLES, ROLE_RANK, type Role } from "../permissions/roles.service.js";
import { createProject, getProject, updateProject, deleteProject, listProjectsForUser, transferProjectOwnership, InvalidProjectInputError, NotAProjectMemberError, type CreateProjectInput, type UpdateProjectInput, } from "./projects.service.js";
import { addMember, removeMember, listMembers } from "./members.service.js";

// Every path below that carries a project ID uses :projectId
export async function registerProjectsRoutes(app: FastifyInstance): Promise<void> {
	app.get("/", { preHandler: requireAuth }, listProjectsHandler);
	app.post("/", { preHandler: requireAuth }, createProjectHandler);
	app.get("/:projectId", { preHandler: requireAuth }, getProjectHandler);
	app.put("/:projectId", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, updateProjectHandler);
	app.delete("/:projectId", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, deleteProjectHandler);

	app.get("/:projectId/members", { preHandler: requireAuth }, listMembersHandler);
	app.post("/:projectId/members", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, addMemberHandler);
	app.delete("/:projectId/members/:userId", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, removeMemberHandler);
	app.post("/:projectId/transfer-ownership", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, transferOwnershipHandler);
}

// listProjectsHandler returns every project the caller belongs to
async function listProjectsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const projects = await listProjectsForUser(request.userId as string);
	reply.code(200).send({ projects });
}

// createProjectHandler creates a new project owned by the caller
async function createProjectHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const body = request.body as Partial<CreateProjectInput> | undefined;

	try {
		const project = await createProject(request.userId as string, { name: body?.name ?? "" });
		reply.code(201).send({ project });
	} catch (err) {
		if (err instanceof InvalidProjectInputError) {
			reply.code(400).send({ error: "invalid_input", details: err.details });
			return;
		}
		throw err;
	}
}

// getProjectHandler fetches a single project by :projectId param
async function getProjectHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };
	const project = await getProject(projectId);
	if (!project) {
		reply.code(404).send({ error: "project_not_found" });
		return;
	}
	reply.code(200).send({ project });
}

// updateProjectHandler edits a project's name (admin only)
async function updateProjectHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };
	const body = request.body as Partial<UpdateProjectInput> | undefined;

	try {
		const project = await updateProject(projectId, { name: body?.name });
		reply.code(200).send({ project });
	} catch (err) {
		if (err instanceof InvalidProjectInputError) {
			reply.code(400).send({ error: "invalid_input", details: err.details });
			return;
		}
		throw err;
	}
}

// deleteProjectHandler deletes a project (admin only)
async function deleteProjectHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };
	await deleteProject(projectId);
	reply.code(204).send();
}

// listMembersHandler returns a project's members and their roles
async function listMembersHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };
	const members = await listMembers(projectId);
	reply.code(200).send({ members });
}

// addMemberHandler adds a user to the project with a given role (admin only)
async function addMemberHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };
	const body = request.body as { userId?: string; role?: Role } | undefined;

	if (!body?.userId || !body?.role || !(body.role in ROLE_RANK)) {
		reply.code(400).send({ error: "invalid_input", details: ["userId and a valid role are required"] });
		return;
	}
	await addMember(projectId, body.userId, body.role);
	reply.code(204).send();
}

// removeMemberHandler removes a user from the project (admin only).
async function removeMemberHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId, userId } = request.params as { projectId: string; userId: string };
	await removeMember(projectId, userId);
	reply.code(204).send();
}

async function transferOwnershipHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { projectId } = request.params as { projectId: string };
	const body = request.body as { newOwnerId?: string } | undefined;

	if (!body?.newOwnerId) {
		reply.code(400).send({ error: "invalid_input", details: ["newOwnerId is required"]});
		return;
	}

	try {
		const project = await transferProjectOwnership(projectId, body.newOwnerId);
		reply.code(200).send({ project });
	} catch (err) {
		if (err instanceof NotAProjectMemberError) {
			reply.code(409).send({ error: "not_a_project_member"});
			return;
		}
		throw err;
	}
}
