// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: Fastify route handlers for project (organization) CRUD and membership management.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth, requireRole } from "../permissions/permissions.middleware";
import { ROLES } from "../permissions/roles.service";
import { createProject, getProject, updateProject, deleteProject, listProjectsForUser } from "./projects.service";
import { addMember, removeMember, listMembers } from "./members.service";

export function registerProjectsRoutes(app: FastifyInstance): void {
  app.get("/", { preHandler: requireAuth }, listProjectsHandler);
  app.post("/", { preHandler: requireAuth }, createProjectHandler);
  app.get("/:id", { preHandler: requireAuth }, getProjectHandler);
  app.put("/:id", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, updateProjectHandler);
  app.delete("/:id", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, deleteProjectHandler);

  app.get("/:id/members", { preHandler: requireAuth }, listMembersHandler);
  app.post("/:id/members", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, addMemberHandler);
  app.delete("/:id/members/:userId", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, removeMemberHandler);
}

// listProjectsHandler returns every project the caller belongs to.
async function listProjectsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call listProjectsForUser(request.userId)
}

// createProjectHandler creates a new project owned by the caller.
async function createProjectHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: decode body { name } → call createProject(request.userId, input)
}

// getProjectHandler fetches a single project by :id param.
async function getProjectHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call getProject(request.params.id); 404 if null
}

// updateProjectHandler edits a project's name (admin only).
async function updateProjectHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: decode body { name? } → call updateProject(request.params.id, input)
}

// deleteProjectHandler deletes a project (admin only).
async function deleteProjectHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call deleteProject(request.params.id)
}

// listMembersHandler returns a project's members and their roles.
async function listMembersHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call listMembers(request.params.id)
}

// addMemberHandler adds a user to the project with a given role (admin only).
async function addMemberHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: decode body { userId, role } → call addMember(request.params.id, userId, role)
}

// removeMemberHandler removes a user from the project (admin only).
async function removeMemberHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call removeMember(request.params.id, request.params.userId)
}
