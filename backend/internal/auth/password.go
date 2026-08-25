// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: hashing and verifying passwords for the mandatory email/password baseline (general requirements section 1).
package auth

// HashPassword generates a salted hash for a plaintext password before it is stored on the User record.
func HashPassword(plaintext string) (hash string, salt string, err error) {
	// TODO: generate a cryptographically random salt
	// TODO: hash plaintext+salt with bcrypt or argon2 (never store the plaintext password)
	// TODO: return hash and salt separately for storage in users.password_hash / users.password_salt
	return "", "", nil
}

// VerifyPassword checks a login attempt's plaintext password against the stored hash and salt.
func VerifyPassword(plaintext string, storedHash string, storedSalt string) (bool, error) {
	// TODO: recompute the hash from plaintext+storedSalt and compare against storedHash using a constant-time comparison
	// TODO: return false (not an error) on a simple mismatch so callers can return a generic "invalid credentials" response
	return false, nil
}
