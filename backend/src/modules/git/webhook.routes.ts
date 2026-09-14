// Owner: Track 3 (Git integration)
// Responsible for: the webhook receiver endpoint for push, pull_request, and merge events — the core of the custom "Git/webhook integration" Major module. TS equivalent of backend/internal/git/webhook.go (Go skeleton, removed).
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'node:crypto';

import{
	processPushEvent,
	processPullRequestEvent,
	processMergeEvent,
	type GitHubPullRequestPayload,
	type GitHubPushPayload
} from './eventProcessor.service.js';

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';
// registerGitWebhookRoutes mounts the webhook receiver, called from app.ts. No JWT auth — HMAC signature verification instead.

	// verifyWebhookSignature validates the provider's HMAC signature header against the configured webhook secret.
export function verifyWebhookSignature(payload: string, signature: string | undefined, secret: string): boolean {
// TODO: compute HMAC-SHA256 of payload with secret (Node's `crypto` module), constant-time compare against signature (crypto.timingSafeEqual)
if(!signature)
	return false;
const hmac = crypto.createHmac('sha256', secret); //create object-generator with algo sha-256
const digest = 'sha256=' + hmac.update(payload).digest('hex'); // give string to generator
const sigBuf = Buffer.from(signature); //string t array of bytes for func of secur
const digestBuf = Buffer.from(digest);
if(sigBuf.length !== digestBuf.length)
	return false;
return crypto.timingSafeEqual(sigBuf, digestBuf); //for secure of time we use func which have the same time

}

// registerWebhook registers a webhook on the linked repository for push/pull_request/merge events.
export function registerWebhookRoutes(app: FastifyInstance): void { //  app - server
app.post('/api/webhooks/git', async (request: FastifyRequest, reply: FastifyReply) => { //if post to address /api/..;
//async func(=>) run with every request; => - replace word "function"
	const signature = request.headers['x-hub-signature-256'] as string | undefined; //take hash
	const githubEvent = request.headers['x-github-event'] as string | undefined; // take type of event
	const rawBody = JSON.stringify(request.body); // convert obj to text

	if(!verifyWebhookSignature(rawBody, signature, WEBHOOK_SECRET))
		return reply.status(401).send({error: 'Invalid HMAC signature'});
	if(githubEvent === 'push' ){
		await processPushEvent(request.body as GitHubPushPayload);
	}
	else if(githubEvent === 'pull_request'){
		const prPayload = request.body as GitHubPullRequestPayload;
		if(prPayload.action === 'opened' || prPayload.action === 'reopened')
			await processPullRequestEvent(prPayload);
		else if(prPayload.action === 'closed' && prPayload.pull_request.merged)
			await processMergeEvent(prPayload);
	}
	return reply.status(200).send({status: 'ok'});
});

}
