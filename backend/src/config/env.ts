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
}

// loadConfig reads process.env (populated from .env via dotenv), validates required vars, and returns a typed config object.
export function loadConfig(): AppConfig {
  // TODO: load dotenv in server.ts before this runs (e.g. `import "dotenv/config"`)
  // TODO: read each variable listed in .env.example, throwing a clear startup error if a required one is missing
  // TODO: coerce PORT and PUBLIC_API_RATE_LIMIT_DEFAULT to numbers
  throw new Error("not implemented");
}
