// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: loading and validating environment configuration (DB DSN, JWT secret, OAuth client IDs, port), read from .env per the mandatory .env/.env.example requirement.

export interface AppConfig {
  nodeEnv: "development" | "production" | "test";
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  oauthGithub: { clientId: string; clientSecret: string };
  oauthGitlab: { clientId: string; clientSecret: string };
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

// loadConfig reads process.env (populated from .env via dotenv), validates required vars, and returns a typed config object.
export function loadConfig(): AppConfig {
  // TODO: load dotenv in server.ts before this runs (e.g. `import "dotenv/config"`)
  // TODO: read each variable listed in .env.example, throwing a clear startup error if a required one is missing
  // TODO: coerce PORT, PUBLIC_API_RATE_LIMIT_DEFAULT, RATE_LIMIT_GLOBAL_MAX, and RATE_LIMIT_GLOBAL_WINDOW_MS to numbers
  throw new Error("not implemented");
}
