// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the JWT-authenticated endpoints project admins use to issue, list and revoke API keys

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth, requireRole } from "../permisssions/permissions.middleware.js";
import { issueApiKey, revokeApiKey, listApiKeys, stripKeyHash, InvalidApiKeyInputError, ApiKeyNotFoundError } from "./apikeys.service.js";
import { validateIssueApiKeyBody } from "./publicapi.validation.js";


