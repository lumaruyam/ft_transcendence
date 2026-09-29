// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: Fastify route handlers for project (organization) CRUD and membership management.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth, requireRole } from "../permissions/permissions.middleware.js";
import { ROLES } from "../permissions/roles.service.js";
import { createProject, getProject, updateProject, deleteProject, listProjectsForUser } from "./projects.service.js";
import { addMember, removeMember, listMembers } from "./members.service.js";

// The "/projects" sub-namespace belongs here, not to app.ts — paths stay relative to whatever
// single boundary prefix app.ts registers this module with (currently "/api").
export async function registerProjectsRoutes(app: FastifyInstance): Promise<void> {
  // named my-projects instead of projects to avoid clashing with the public api list route
  app.get("/my-projects", { preHandler: requireAuth }, listProjectsHandler);
  app.post("/projects", { preHandler: requireAuth }, createProjectHandler);
  app.get("/projects/:id", { preHandler: requireAuth }, getProjectHandler);
  app.put("/projects/:id", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, updateProjectHandler);
  app.delete("/projects/:id", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, deleteProjectHandler);

  app.get("/projects/:id/members", { preHandler: requireAuth }, listMembersHandler);
  app.post("/projects/:id/members", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, addMemberHandler);
  app.delete("/projects/:id/members/:userId", { preHandler: [requireAuth, requireRole(ROLES.ADMIN)] }, removeMemberHandler);
}

// TEMPORARY STUB: returns hardcoded projects until listProjectsForUser is implemented
// real version also needs the caller role from project_members, not just the Project row
async function listProjectsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.send([
    { id: "22222222-2222-2222-2222-222222222222", name: "Test Project", role: "admin" },
    { id: "33333333-3333-3333-3333-333333333333", name: "Test Project 2", role: "member" },
  ]);
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
