// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: rate limiting for the Public API major module, per the api_keys.rate_limit column. TS equivalent of backend/internal/publicapi/ratelimit.go (Go skeleton, removed).
import type { FastifyRequest, FastifyReply } from "fastify";

// rateLimitMiddleware enforces the per-key rate limit before a public API handler runs. Register as a preHandler.
export async function rateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: extract the validated ApiKey from request context (set by the API key auth preHandler)
  // TODO: call checkRateLimit and reply.code(429) if exceeded
  // TODO: consider using the @fastify/rate-limit plugin instead of a hand-rolled counter, keyed by API key ID
}

// checkRateLimit checks and increments the request count for an API key within the current window.
export async function checkRateLimit(apiKeyId: string): Promise<boolean> {
  // TODO: implement a token-bucket or fixed-window counter, likely backed by an in-memory store or Redis
  // TODO: compare current usage against the key's configured rateLimit
  return true;
}
