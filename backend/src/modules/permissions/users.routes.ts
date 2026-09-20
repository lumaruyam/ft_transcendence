/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   users.routes.ts                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/14 22:20:51 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/20 15:41:08 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: Fastify route handlers for user account deletion (deleteUser), part of the
// Advanced permissions major module.

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "./permissions.middleware.js";
import { deleteUser, UserNotFoundError, TransferTargetRequiredError, TransferTargetIsSelfError, LastAdminOfMembershipError } from "./users.service.js";
import { NotAProjectMemberError } from "../projects/projects.service.js";


export async function registerUserRoutes(app: FastifyInstance): Promise<void> {
	app.delete("/:userId", { preHandler: requireAuth }, deleteUserHandler);
}

async function deleteUserHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const { userId } = request.params as { userId: string };
	const body = request.body as { transferTo?: string } | undefined;

	if (userId !== request.userId) {
		reply.code(403).send({ error: "forbidden" });
		return;
	}

	try {
		await deleteUser(userId, { transferTo: body?.transferTo });
		reply.code(204).send();
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
		}
		throw err;
	}
}

