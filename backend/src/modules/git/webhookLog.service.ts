// Owner: Track 3 (Git integration)
// Responsible for: audit logging every webhook event received, so the automation chain is debuggable if a card doesn't move correctly. TS equivalent of backend/internal/git/webhookLog.go (Go skeleton, removed).
import {Prisma, type WebhookEvent } from "@prisma/client";
import { prisma} from '../../db/prisma/client.js';

export interface LogWebhookEvent {
  provider: string;
  repo: string;
  eventType: string;
  payload: unknown;
}

// logWebhookEvent records a received webhook event in webhook_events, regardless of whether processing succeeded.
export async function logWebhookEvent(input: LogWebhookEvent): Promise<WebhookEvent> {
  // TODO: prisma.webhookEvent.create with provider, repo, eventType, raw payload, and processedAt left null until processing completes
  //throw new Error("not implemented");
  return await prisma.webhookEvent.create({
    data: {
      provider: input.provider,
      repo: input.repo,
      eventType: input.eventType,
      // В Prisma тип поля Json требует приведения к Prisma.InputJsonValue
      payload: (input.payload as Prisma.InputJsonValue ) ?? {},
      processedAt: null,
    },
  });
}

export async function markWebhookProcessed(eventId: string): Promise<void> {
  try {
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        processedAt: new Date(), // time succes
      },
    });
  } catch (error) {
    console.error(`Failed to update processedAt for webhook ${eventId}:`, error);
  }}

// listWebhookEvents returns the audit log for a repo, for a debugging/admin view.
export async function listWebhookEvents(repoUrl: string): Promise<WebhookEvent[]> {
  // TODO: prisma.webhookEvent.findMany({ where: { repo: repoUrl }, orderBy: { createdAt: "desc" } })
  try{
    return await prisma.webhookEvent.findMany({
      where: {repo: repoUrl},
      orderBy: {createdAt: 'desc'},
    });
  }
  catch(error){
    console.error('Error of base', error);
    return[];
  }
}
