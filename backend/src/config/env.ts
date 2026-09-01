// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: loading and validating environment configuration (DB DSN, JWT secret, OAuth client IDs, port), read from .env per the mandatory .env/.env.example requirement.

import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
	nodeEnv: "development" | "production" | "test";
	host: string;
	port: number;
	databaseUrl: string;
	jwtSecret: string;
	oauthGithub: OAuthProviderConfig;
	oauthGitlab: OAuthProviderConfig;
	gitWebhookSecret: string;
	publicApiRateLimitDefault: number;
  // rateLimit configures the @fastify/rate-limit plugin registered globally in app.ts.
  // globalMax/globalWindowMs are the site-wide default applied to every route; the invite join
  // route (POST /api/projects/invites/:token/join) overrides these with its own dedicated,
  // stricter policy — see modules/projects/invites.ts's INVITE_JOIN_RATE_LIMIT — rather than
  // reading inviteJoinMax/inviteJoinWindowMs from here, so that policy stays a fixed, reviewable
  // constant next to the route it protects instead of an env-tunable value.
	rateLimit: {
		globalMax: number;
		globalWindowMs: number;
	};
}

// OAuthProviderConfig holds what oauth.service.ts needs per provider: the app credentials
// (getOAuthRedirectUrl/handleOAuthCallback) plus the callback URL registered with the
// provider (getOAuthRedirectUrl builds the authorize URL's redirect_uri param from this,
// rather than hardcoding or re-deriving it from the incoming request).
export interface OAuthProviderConfig {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (value === undefined || value.trim() === "")
	{
		throw new Error(`Missing required environment variable: ${name} (see .env.example)`);
	}
	return value;
}

function optionalEnv(name: string, defaultValue: string): string {
	const value = process.env[name];
	return value === undefined || value.trim() === "" ? defaultValue : value;
}

function optionalIntEnv(name: string, defaultValue: number): number {
	const raw = process.env[name];
	if (raw === undefined || raw.trim() === "")
	{
		return defaultValue;
	}
	const parsed = Number.parseInt(raw, 10);
	if (Number.isNaN(parsed))
	{
		throw new Error(`Environment variable ${name} must be an integer, got "${raw}"`);
	}
	return parsed;
}

function loadOAuthProviderConfig(prefix: "GITHUB" | "GITLAB"): OAuthProviderConfig {
	return {
		clientId: requireEnv(`${prefix}_CLIENT_ID`),
		clientSecret: requireEnv(`${prefix}_CLIENT_SECRET`),
		redirectUri: requireEnv(`${prefix}_OAUTH_REDIRECT_URI`),
	};
}

// loadConfig reads process.env (populated from .env via dotenv), validates required vars, and returns a typed config object.
export function loadConfig(): AppConfig {
	const nodeEnv = optionalEnv("NODE_ENV", "development");
	if (nodeEnv !== "development" && nodeEnv !== "production" && nodeEnv !== "test") {
		throw new Error (`Environment variable NODE_ENV must be one of "development", "test", "production", got "${nodeEnv}"`);
	}

	return {
		nodeEnv,
		host: optionalEnv("HOST", "0.0.0.0"),
		port: optionalIntEnv("PORT", 3000),
		databaseUrl: requireEnv("DATABASE_URL"),
		jwtSecret: requireEnv("JWT_SECRET"),
		oauthGithub: loadOAuthProviderConfig("GITHUB"),
		oauthGitlab: loadOAuthProviderConfig("GITLAB"),
		gitWebhookSecret: requireEnv("GIT_WEBHOOK_SECRET"),
		publicApiRateLimitDefault: optionalIntEnv("PUBLIC_API_RATE_LIMIT_DEFAULT", 100),
		rateLimit: {
			globalMax: optionalIntEnv("RATE_LIMIT_GLOBAL_MAX", 300),
			globalWindowMs: optionalIntEnv("RATE_LIMIT_GLOBAL_WINDOW_MS", 60000),
		},
	};
}

