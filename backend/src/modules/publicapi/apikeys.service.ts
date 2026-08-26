// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: API key issuance/validation for the Public API major module. TS equivalent of backend/internal/publicapi/apikeys.go (Go skeleton, removed).
import type { ApiKey } from "@prisma/client";

// issueApiKey generates a new API key scoped to a project, for external/script access to the public endpoints.
export async function issueApiKey(projectId: string): Promise<{ apiKey: ApiKey; plaintextKey: string }> {
  // TODO: generate a cryptographically random key (crypto.randomBytes), store only its hash (keyHash) via prisma
  // TODO: return the plaintext key exactly once to the caller — it can't be recovered later
  throw new Error("not implemented");
}

// revokeApiKey disables a previously issued key.
export async function revokeApiKey(keyId: string): Promise<void> {
  // TODO: delete or mark the api_keys row revoked via prisma
}

// validateApiKey checks an incoming request's API key header against stored key hashes.
export async function validateApiKey(presentedKey: string): Promise<ApiKey | null> {
  // TODO: hash presentedKey and look up a matching api_keys row via prisma
  // TODO: return null if not found/revoked, used by the public API auth middleware
  return null;
}
