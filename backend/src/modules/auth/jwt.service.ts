// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: issuing and validating JWT session tokens (e.g. via `jsonwebtoken` or `jose`), used by every authenticated request across all tracks. TS equivalent of backend/internal/auth/jwt.go (Go skeleton, removed).

export interface JwtClaims {
  userId: string;
  exp: number;
}

// generateJwt issues a signed session token for a freshly authenticated user (email/password or OAuth).
export function generateJwt(userId: string): string {
  // TODO: build JwtClaims with an expiry (e.g. 24h) and sign with config.jwtSecret via jsonwebtoken/jose
  // TODO: pull the signing secret from src/config/env.ts, never hardcode it
  throw new Error("not implemented");
}

// validateJwt parses and verifies a token presented on an incoming request, for use by permissions.middleware.ts.
export function validateJwt(token: string): JwtClaims {
  // TODO: verify signature/expiry
  // TODO: throw a typed error distinguishing "expired" from "invalid" so route handlers can respond appropriately
  throw new Error("not implemented");
}

// refreshJwt issues a new token ahead of expiry so long sessions don't force a re-login mid-use.
export function refreshJwt(token: string): string {
  // TODO: validate the existing token, then issue a new one with a rolled-forward expiry
  throw new Error("not implemented");
}
