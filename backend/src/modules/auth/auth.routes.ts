// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: Fastify route handlers for signup/login/logout — the mandatory baseline user management required regardless of chosen modules. TS equivalent of backend/internal/auth/handlers.go (Go skeleton, removed).
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// registerAuthRoutes mounts /api/auth/signup, /api/auth/login, /api/auth/logout on the given
// Fastify instance, called from app.ts. Canonical API base path is /api (not /api/v1) — matches
// frontend/src/auth/{loginForm,signupForm}.ts, which already call these under /api/auth/*.
export function registerAuthRoutes(app: FastifyInstance): void {
  app.post("/api/auth/signup", signupHandler);
  app.post("/api/auth/login", loginHandler);
  app.post("/api/auth/logout", logoutHandler);
}

// signupHandler creates a new user with a hashed/salted password.
async function signupHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: decode and validate the request body via auth.validation.ts — backend half of the mandatory dual validation requirement
  // TODO: reject if the email is already registered
  // TODO: call hashPassword and insert a new User row via prisma
  // TODO: issue a JWT via generateJwt and return it to the client
}

// loginHandler authenticates an email/password pair and returns a session token.
async function loginHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: look up the user by email via prisma
  // TODO: call verifyPassword; return a generic "invalid credentials" error on failure (don't leak which field was wrong)
  // TODO: issue a JWT via generateJwt
}

// logoutHandler invalidates the caller's current session.
async function logoutHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: clear the session cookie / instruct the client to drop the token (blocklist if server-side session tracking is added)
}
