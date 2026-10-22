// Shared by the end-to-end suites: a tiny checker (each suite prints PASS / FAIL lines and exits non-zero on a failure) and
// the configuration they build the real application with.
import type { AppConfig } from "../../src/config/env.js";

export let failures = 0;

export function check(name: string, ok: boolean, details = ""): void {
	console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + details}`);
	if (!ok) failures++;
}

export function report(): void {
	console.log(failures === 0 ? "\nALL PASSED" : `\n${failures} FAILED`);
}

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// The application configuration the suites use: no OAuth app, limits high enough not to get in the way of a test.
export function testConfig(): AppConfig {
	return {
		nodeEnv: "test",
		host: "127.0.0.1",
		port: 0,
		databaseUrl: process.env.DATABASE_URL as string,
		jwtSecret: "jwt-secret-for-tests",
		oauthGithub: { clientId: "", clientSecret: "", redirectUri: "" },
		oauthTokenEncryptionKey: "ab".repeat(32),
		signupAdminPassword: "",
		gitWebhookSecret: "test-webhook-secret",
		publicApiRateLimitDefault: 5000,
		rateLimit: { globalMax: 1_000_000, globalWindowMs: 60_000 },
	};
}
