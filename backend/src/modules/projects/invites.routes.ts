// Owner: Track 2 (Person A — Kanban CRUD and UI, extended to Organization system / projects & members)
// Responsible for: mounting the project invite-link routes and their auth/role preHandlers. Advanced permissions
// alignment: creation/revocation require an admin project_members role; join requires only a logged-in user — the
// invite token is the one-time credential that produces membership, not a substitute for ongoing role checks.
import type { FastifyInstance } from "fastify";
import { createProjectInvite, joinProjectByInvite, revokeProjectInvite } from "./invites.controller";
import { requireAuth, requireProjectRole } from "../permissions/permissions.middleware";
import { ROLES } from "../permissions/roles.service";

// registerProjectInviteRoutes mounts the invite endpoints, called from app.ts.
//
// Path note: these use an explicit /api/v1/ prefix per the product spec for this feature. The existing publicapi
// routes (backend/src/modules/publicapi/publicapi.routes.ts) are currently unversioned (/api/projects,
// /api/projects/{id}/cards). TODO: Track 1 + Tech Lead should decide whether to (a) adopt /api/v1/ across the whole
// API for consistency, or (b) keep invites unversioned to match the rest — flagged in docs/api-spec.md rather than
// silently resolved here.
export function registerProjectInviteRoutes(app: FastifyInstance): void {
  // TODO: requireProjectRole([ROLES.ADMIN]) needs the target project's ID resolved from request.params.projectId —
  //       confirm the middleware reads params consistently across all three routes below
  app.post("/api/v1/projects/:projectId/invites", {
    preHandler: [requireAuth, requireProjectRole([ROLES.ADMIN])],
    handler: createProjectInvite,
  });

  // TODO: requireAuth only here — deliberately no project-role check, since the caller isn't a project member yet.
  //       This is the sanctioned exception to "all project access gated by project_members role checks" (product
  //       requirement 4): the join action itself is how membership begins, so there is nothing to check yet.
  app.post("/api/v1/projects/invites/:token/join", {
    preHandler: [requireAuth],
    handler: joinProjectByInvite,
  });

  app.delete("/api/v1/projects/:projectId/invites/:inviteId", {
    preHandler: [requireAuth, requireProjectRole([ROLES.ADMIN])],
    handler: revokeProjectInvite,
  });

  // TODO: register this function from app.ts alongside the other projects.routes / kanban.routes groups
}
