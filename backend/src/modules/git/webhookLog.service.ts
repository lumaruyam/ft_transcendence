// Owner: Track 3 (Git integration)
// Responsible for: audit logging every webhook event received, so the automation chain is debuggable if a card doesn't move correctly. TS equivalent of backend/internal/git/webhookLog.go (Go skeleton, removed).
import type { WebhookEvent } from "@prisma/client";

export interface LogWebhookEventInput {
  provider: string;
  repo: string;
  eventType: string;
  payload: unknown;
}

// logWebhookEvent records a received webhook event in webhook_events, regardless of whether processing succeeded.
export async function logWebhookEvent(input: LogWebhookEventInput): Promise<WebhookEvent> {
  // TODO: prisma.webhookEvent.create with provider, repo, eventType, raw payload, and processedAt left null until processing completes
  throw new Error("not implemented");
}

// listWebhookEvents returns the audit log for a repo, for a debugging/admin view.
export async function listWebhookEvents(repoUrl: string): Promise<WebhookEvent[]> {
  // TODO: prisma.webhookEvent.findMany({ where: { repo: repoUrl }, orderBy: { createdAt: "desc" } })
  return [];
}
