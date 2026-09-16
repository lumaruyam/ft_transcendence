/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   oauth.service.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: luli <luli@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/15 21:02:09 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/15 23:09:55 by luli             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: OAuth2 login flow (GitHub/GitLab), covering the OAuth minor module and feeding the credential source Track 3 needs for Octokit/GitLab API calls.
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { Prisma, type User } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";
import type { OAuthProviderConfig } from "../../config/env.js";
import { hashPassword } from "./password.service.js";

export type OAuthProvider = "github" | "gitlab";

// Set once via initOAuthService, called from app.ts's buildApp right after initJwtService —
// same pattern, so this module doesn't reach into env.ts directly and app.ts stays the one
// place loadConfig()'s result gets handed out.
// stateSecret signs the short-lived state CSRF token (see generateState/verifyState below).
// app.ts passes config.jwtSecret for this — reusing the session-JWT secret rather than adding
// a new required env var, since there's no server-side session store to keep a separate secret
// in sync with anyway. Named `stateSecret` here (not `jwtSecret`) so swapping in a dedicated
// secret later, if ever wanted, is a one-line change at the call site, not a rename here.
export interface OAuthServiceConfig {
	github: OAuthProviderConfig;
	gitlab: OAuthProviderConfig;
	stateSecret: string;
}

let serviceConfig: OAuthServiceConfig | undefined;

export function initOAuthService(config: OAuthServiceConfig): void {
	serviceConfig = config;
}

function getConfig(): OAuthServiceConfig {
	if (!serviceConfig) {
		throw new Error("OAuth service not configured");
	}
	return serviceConfig;
}

export class OAuthNotConfiguredError extends Error {
	constructor(provider: OAuthProvider) {
		super(`OAuth provider "${provider}" into configured. set ${provider.toUpperCase()}_CLIENT_ID / ` +
			`${provider.toUpperCase()}_CLIENT_SECRET / ${provider.toUpperCase()}_OAUTH_REDIRECT_URI (see .env.example)`
		);
		this.name = "OAuthNotConfiguredError";
	}
}

export class OAuthExchangeError extends Error {
	constructor(reason: string) {
		super(`OAuth exchange failed: ${reason}`);
		this.name = "OauthExchangeError";
	}
}

// OAuthStateError covers a missing, expired, malformed, or provider-mismatched state param
export class OAuthStateError extends Error {
	constructor(reason: string) {
		super(`OAuth state chech failed: ${reason}`);
		this.name = "OAuthStateError";
	}
}

export class OAuthAccountConflictError extends Error {
	constructor(reason: string) {
		super(reason);
		this.name = "OAuthAccountConflictError";
	}
}

function getProviderConfig(provider: OAuthProvider): OAuthProviderConfig {
	const config = getConfig()[provider];
	if (!config.clientId || !config.clientSecret || !config.redirectUri) {
		throw new OAuthNotConfiguredError(provider);
	}
	return config;
}

// --- CSRF state token ----------------------------------------------------------------------
// There's no server-side session store (auth is stateless JWT — permissions.middleware.ts), so
// the state param can't be stashed server-side and compared on return the usual way. Instead
// it's a short-lived, self-contained signed token: we sign {provider, nonce} here, hand it to
// the provider as state, and the provider hands it straight back unmodified on the callback.
// Verifying the signature + expiry + provider match gives the same CSRF guarantee (an attacker
// can't forge a valid state without stateSecret) without needing anywhere to store it.
const STATE_TTL_SECONDS = 600; // 10 minutes
const STATE_TYP = "oauth_state";

interface OAuthStateClaims {
	typ: typeof STATE_TYP;
	provider: OAuthProvider;
	nonce: string; // nonce = number used once
}

function generateState(provider: OAuthProvider): string {
	const claims: OAuthStateClaims = { typ: STATE_TYP, provider, nonce: randomBytes(16).toString("hex") };
	return jwt.sign(claims, getConfig().stateSecret, { expiresIn: STATE_TTL_SECONDS });
}

function verifyState(state: string | undefined, expectedProvider: OAuthProvider): void {
	if (!state) {
		throw new OAuthStateError("missing state parameter");
	}
	let decoded: unknown;
	try {
		decoded = jwt.verify(state, getConfig().stateSecret);
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			throw new OAuthStateError("state has expired. the login attempt took too long, please try again");
		}
		throw new OAuthStateError("state is invalid or the token was modified");
	}
	if (
		typeof decoded !== "object" || decoded === null || (decoded as Partial<OAuthStateClaims>).typ !== STATE_TYP
	) {
		throw new OAuthStateError("state token has an unexpected shape");
	}
	const claims = decoded as OAuthStateClaims;
	if (claims.provider !== expectedProvider) {
		throw new OAuthStateError("state was not issued for this provider");
	}
}

// --- provider endpoints ------------------------------------------------------------------
// GitLab endpoints below assume gitlab.com — there's no configurable base URL in env.ts for
// self-hosted GitLab instances; add one (e.g. GITLAB_BASE_URL) if that's ever needed.
const AUTHORIZE_URL: Record<OAuthProvider, string> = {
	github: "https://github.com/login/oauth/authorize",
	gitlab: "https://gitlab.com/oauth/authorize",
};

const TOKEN_URL: Record<OAuthProvider, string> = {
	github: "https://github.com/login/oauth/access_token",
	gitlab: "https://gitlab.com/oauth/token",
}

const USER_URL: Record<OAuthProvider, string> = {
	github: "https://api.github.com/user",
	gitlab: "https://gitlab.com/api/v4/user",
}

const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

// repo / api are what Track 3's git module needslater (via Octokit / @gitbeaker/rest) to link
// branches and register webhooks on the user's behalf
const SCOPES: Record<OAuthProvider, string> = {
	github: "read:user user:email repo",
	gitlab: "read_user api",
};

// getOAuthRedirectUrl builds the provider consent-screen URL the frontend redirects the user to
export function getOAuthRedirectUrl(provider: "github" | "gitlab"): string {
	const config = getProviderConfig(provider);

	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		scopre: SCOPES[provider],
		state: generateState(provider),
	});
	if (provider === "gitlab") {
		// GitHub defaults to the "code" response type while GitLab requires it explicitly
		params.set("response_type", "code");
	}

	return `${AUTHORIZE_URL[provider]}?${params.toString()}`;
}

// token exchange + profile fetch

interface ExchangedToken {
	accessToken: string;
}

async function exchangeCodeForToken(provider: OAuthProvider, code: string): Promise<ExchangedToken> {
	const config = getProviderConfig(provider);

	const body: Record<string, string> = {
		client_id: config.clientId,
		client_secret: config.clientSecret,
		code,
		redirect_uri: config.redirectUri,
	};
	if (provider == "gitlab") {
		body.grant_type = "authorization_code";
	}

	const response = await fetch(TOKEN_URL[provider], {
		method: "POST",
		headers: { "Content_Type": "application/json", Accept: "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new OAuthExchangeError(`${provider} token endpoint returned ${response.status}`);
	}

	const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
	if (!data.access_token) {
		throw new OAuthExchangeError(data.error_description ?? data.error ?? "no access_token in provider response");
	}

	return { accessToken: data.access_token };
}

interface function OAuthProfile {
	oauthId: string;
	email: string;
	name: string;
	avater: string | null;
}

async function fetchGitHubProfile(accessToken: string): Promise<OAuthProfile> {
	const authHeaders = { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" };

	const userRes = await fetch(USER_URL.github, { headers: authHeaders });
	if (!usersRes.ok) {
		throw new OAuthExchangeError(`Github profile fetch returned ${userRes.status}`);
	}
	const user = (await userRes.json()) as {
		id: number;
		username: string;
		name: string | null;
		email: string | null;
		avater_url: string | null;
	};

	if (!user.email) {
		throw new OAuthExchangeError("GitLab did not return an email for this account");
	}

	return {
		oauthId: String(user.id),
		email: user.email.toLowerCase(),
		name: user.name ?? user.username,
		avater: user.avater_url,
	};
}

async function fetchGitLabProfile(accessToken: string): Promise<OAuthProfile> {
	const userRes = await fetch(USER_URL.gitlab, { headers: { Authrization: `Bearer ${accessToken}` } });
	if (!userRes.ok) {
		throw new OAuthExchangeError(`GitLab profile fetch returned ${userRes.status}`);
	}
	const user = (await userRes.json()) as {
		id: number;
		username: string;
		name: string | null;
		email: string | null;
		avater_url: string | null;
	};

	if (!user.email) {
		throw new OAuthExchangeError("GitLab did not return email for this account");
	}

	return {
		oauthId: String(user.id),
		email: user.email.toLowerCase(),
		name: user.name ?? user.username,
		avater: user.avatar_url,
	};
}

async function fetchProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile> {
	return provider === "github" ? fetchGitHubProfile(accessToken) : fetchGitLabProfile(accessToken);
}

async function exchangeAndFetchProfile(provider: OAuthProvider, code: string): Promise<{ accessToken: string; profile: OAuthProfile }> {
	const { accessToken } = await exchangeCodeForToken(provider, code);
	const profile = await fetchProfile(provider, accessToken);
	return { accessToken, profile };
}

async function randomUnusablePassword(): Promise<{ hash: string; salt: string }> {
	return hashPassword(randomBytes(32).toString("hex"));
}

// handleOAuthCallback exchanges the provider's auth code for a token, creates/links the User, and returns them.
export async function handleOAuthCallback(provider: OAuthProvider, code: string, state: string): Promise<User> {
	verifyState(state, provider);

	const { accessToken, profile } = await exchangeAndFetchProfile(provider, code);

	// 1. Already linked to this provider identity
	const existingByIdentity = await prisma.user.findFirst({
		where: { oauthProvider: provider, oauthId: profile.oauthId },
	});
	if (existingByIdentity) {
		return prisma.user.update({
			where: { id: existingByIdentity.id },
			data: { oauthAccessToken: accessToken,
				   avatar: profile.avatar ?? existingByIdentity.avatar,
			},
		});
	}
	return prisma.user.update({
		where: { id: existingByEmail.id },
		data: {
			oauthProvider: provider,
			oauthId: profile.oauthId,
			oauthAccessToken: accessToken,
			avatar: profile.avatar ?? existingByEmail.avatar,
			},
		});
	}

	const { hash, salt } = await randomUnusablePassword();
	try {
		return await prisma.user.create({
			data: {
				email: profile.email,
				name: profile.name,
				avatar: profile.avatar,
				passwordHash: hash,
				passwordSalt: salt,
				oauthProvider: provider,
				oauthId: profile.oauthId,
				oauthAccessToken: accessToken,
			},
		});
	} catch (err) {
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
			throw new OAuthAccountConflictError(`account ${profile.email} was just created by a concurrent request`);
		}
		throw err;
	}
}

// linkOAuthAccount attaches an OAuth identity to an already-authenticated user (adding OAuth on top of email/password)
export async function linkOAuthAccount(userId: string, provider: OAuthProvider, code: string): Promise<void> {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new OAuthAccountConflictError(`no user with id ${userId}`);
	}

	const { accessToken, profile } = await exchangeAndFetchProfile(provider, code);

	if (user.oauthProvider && (user.oauthProvider !== provider || user.oauthId !== profile.oauthId)) {
		throw new OAuthAccountConflictError(`user ${userId} already has a ${user.oauthProvider} identity linked, unlink it first`);
	}

	await prisma.user.update({
		where: { id: userId },
		data: {
			oauthProvider: provider,
			oauthId: profile.oauthId,
			oauthAccessToken: accessToken,
		},
	});
}
  // TODO: verify the OAuth identity isn't already linked to a different account
  // TODO: update the user's oauthProvider/oauthId fields via prisma.user.update
}
