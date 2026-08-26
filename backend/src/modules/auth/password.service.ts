// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: hashing and verifying passwords for the mandatory email/password baseline (general requirements section 1). TS equivalent of backend/internal/auth/password.go (Go skeleton, removed).

// HashPassword generates a salted hash for a plaintext password before it is stored on the User record.
export async function hashPassword(plaintext: string): Promise<{ hash: string; salt: string }> {
  // TODO: generate a cryptographically random salt (e.g. crypto.randomBytes)
  // TODO: hash plaintext+salt with bcrypt or argon2 (e.g. the `argon2` or `bcrypt` npm package) — never store the plaintext password
  // TODO: return hash and salt separately for storage in users.password_hash / users.password_salt
  throw new Error("not implemented");
}

// verifyPassword checks a login attempt's plaintext password against the stored hash and salt.
export async function verifyPassword(
  plaintext: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  // TODO: recompute the hash from plaintext+storedSalt and compare against storedHash using a constant-time comparison
  // TODO: return false (not a throw) on a simple mismatch so callers can return a generic "invalid credentials" response
  return false;
}
