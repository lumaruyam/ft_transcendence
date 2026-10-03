// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the Fastify preHandlers/constraint that authenticate public API requests by API key
// (the API-key counterpart of permissions.middleware.ts's JWT-based requireAuth)

import type { FastifyRequest, FastifyReply, FastifyServerOptions } from "fastify";
import type { ApiKey } from "@prisma/client";
import { validateApiKey } from "./apikeys.service.js";

// PUBLIC_API_KEY_HEADER is the header an external client presents its key in
export const PUBLIC_API_KEY_HEADER = "x-api-key";

declare module "fastify" {
	interface FastifyRequest {
		apiKey? : ApiKey; // apiKey is the validated key row, set by requireApiKey
	}
}

// requireApiKey rejects requests without a valid API key
export async function requireApiKey(request: FastifyRequest, reply: FastifyReply): Promise<void> {
	const header = request.headers[PUBLIC_API_KEY_HEADER];
	const presented = Array.isArray(header) ? header[0] : header;

	if (!presented || presented.trim() === "") {
		reply.code(401).send({ error: "missing_api_key" });
		return;
	}

	const apiKey = await validateApiKey(presented.trim());
	if (!apiKey) {
		reply.code(401).send({ error: "invalid_api_key" });
		return;
	}

	request.apiKey = apiKey;
	request.userId = apiKey.userId as string;
}
