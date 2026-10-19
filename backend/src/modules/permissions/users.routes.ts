// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: Fastify route handlers for user account deletion (deleteUser), part of the
// Advanced permissions major module.

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "./permissions.middleware.js";
import { getUser, getVisibleProfile, updateUser, deleteUser, UserNotFoundError, TransferTargetRequiredError, TransferTargetIsSelfError, LastAdminOfMembershipError } from "./users.service.js";
import { NotAProjectMemberError } from "../projects/projects.service.js";
import { validateDisplayName } from "../auth/auth.validation.js";
import { announceMembersChanged, evictFromProject } from "../kanban/membership.events.js";


export async function registerUserRoutes(app: FastifyInstance): Promise<void> {
	app.get("/me", { preHandler: requireAuth }, getMeHandler);
	app.patch("/me", { preHandler: requireAuth }, updateMeHandler);
	app.get("/:userId", { preHandler: requireAuth }, getUserHandler);
	app.delete("/:userId", { preHandler: requireAuth }, deleteUserHandler);
}

// getMeHandler returns the caller's own profile — GET /api/users/me. Same public shape as the `user`
// object in signup/login responses (never the password hash/salt). Used by frontend apiClient.getCurrentUser()
async function getMeHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const user = await getUser(request.userId as string);
	if (!user) {
		reply.code(404).send({ error: "user_not_found" });
		return;
	}
	reply.code(200).send({ id: user.id, email: user.email, name: user.name });
}

// updateMeHandler edits the caller's own display name — PATCH /api/users/me. The email is the login identity and
// is not editable here.
async function updateMeHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const body = request.body as { name?: unknown } | undefined;
	if (body === undefined || body === null || typeof body !== "object" || body.name === undefined) {
		reply.code(400).send({ error: "invalid_input", details: ["name is required"] });
		return;
	}
	const problem = validateDisplayName(body.name);
	if (problem) {
		reply.code(400).send({ error: "invalid_input", details: [problem] });
		return;
	}
	const user = await updateUser(request.userId as string, { name: (body.name as string).trim() });
	reply.code(200).send({ id: user.id, email: user.email, name: user.name });
}

// getUserHandler shows a profile to somebody allowed to see it — GET /api/users/:userId. Strangers get 404.
async function getUserHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { userId } = request.params as { userId: string };
	const profile = await getVisibleProfile(request.userId as string, userId);
	if (!profile) {
		reply.code(404).send({ error: "user_not_found" });
		return;
	}
	reply.code(200).send({ user: profile });
}

async function deleteUserHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { userId } = request.params as { userId: string };
	const body = request.body as { transferTo?: string } | undefined;

	if (userId !== request.userId) {
		reply.code(403).send({ error: "forbidden" });
		return;
	}

	try {
		const { leftProjectIds } = await deleteUser(userId, { transferTo: body?.transferTo });
		reply.code(204).send();
		// their open tabs leave the projects' rooms, and the people still there see the member list change
		for (const projectId of leftProjectIds) {
			await evictFromProject(projectId, userId);
			announceMembersChanged(projectId);
		}
		} catch (err) {
		if (err instanceof UserNotFoundError) {
			reply.code(404).send({ error: "user_not_found" });
			return;
		}
		if (err instanceof TransferTargetRequiredError) {
			reply.code(400).send({ error: "transfer_target_required", projectIds: err.projectIds });
			return;
		}
		if (err instanceof TransferTargetIsSelfError) {
		reply.code(400).send({ error: "invalid_transfer_target" });
		return;
		}
		if (err instanceof NotAProjectMemberError) {
			reply.code(409).send({ error: "transfer_target_not_a_member", projectId: err.projectId });
			return;
		}
		if (err instanceof LastAdminOfMembershipError) {
			reply.code(409).send({ error: "last_admin_of_membership", projectIds:err.projectIds })
			return;
		}
		throw err;
	}
}

