// Owner: Track 3 (Git integration)
// Responsible for: the webhook receiver endpoint for push, pull_request, and merge events — the core of the custom "Git/webhook integration" Major module. TS equivalent of backend/internal/git/webhook.go (Go skeleton, removed).
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// registerGitWebhookRoutes mounts the webhook receiver, called from app.ts. No JWT auth — HMAC signature verification instead.
export function registerGitWebhookRoutes(app: FastifyInstance): void {
  app.post("/webhooks/git", webhookReceiverHandler);
}

// webhookReceiverHandler receives GitHub/GitLab webhook POSTs registered by registerWebhook.
async function webhookReceiverHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: verify the request signature via verifyWebhookSignature before trusting the payload
  //       (GitHub: x-hub-signature-256 header; GitLab: x-gitlab-token header — branch on provider)
  // TODO: parse the event type (push/pull_request/merge) and dispatch to the matching process*Event function in eventProcessor.service.ts
  // TODO: log every received event via logWebhookEvent regardless of processing outcome
}

// verifyWebhookSignature validates the provider's HMAC signature header against the configured webhook secret.
export function verifyWebhookSignature(payload: Buffer, signature: string, secret: string): boolean {
  // TODO: compute HMAC-SHA256 of payload with secret (Node's `crypto` module), constant-time compare against signature (crypto.timingSafeEqual)
  return false;
}

// registerWebhook registers a webhook on the linked repository for push/pull_request/merge events.
export async function registerWebhook(repoUrl: string): Promise<void> {
  // TODO: Octokit repos.createWebhook (GitHub) or the GitLab client's project-hooks endpoint (GitLab),
  //       pointing at this server's /webhooks/git route
}
