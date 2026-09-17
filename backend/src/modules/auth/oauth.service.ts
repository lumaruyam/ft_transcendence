/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   oauth.service.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/15 21:02:09 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/17 22:49:22 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: OAuth2 login flow (GitHub only), covering the OAuth minor module and feeding the credential source Track 3 needs for Octokit API calls.
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { Prisma, type User } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";
import type { OAuthProviderConfig } from "../../config/env.js";
import { hashPassword } from "./password.service.js";

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
	constructor() {
		super("OAuth provider github is not configured. set GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET / GITHUB_OAUTH_REDIRECT_URI (see .env.example)");
		this.name = "OAuthNotConfiguredError";
	}
}

export class OAuthExchangeError extends Error {
	constructor(reason: string) {
		super(`OAuth exchange failed: ${reason}`);
		this.name = "OAuthExchangeError";
	}
}

// OAuthStateError covers a missing, expired, malformed, or provider-mismatched state param
export class OAuthStateError extends Error {
	constructor(reason: string) {
		super(`OAuth state check failed: ${reason}`);
		this.name = "OAuthStateError";
	}
}

export class OAuthAccountConflictError extends Error {
	constructor(reason: string) {
		super(reason);
		this.name = "OAuthAccountConflictError";
	}
}

function getGithubConfig(): OAuthProviderConfig {
	const config = getConfig().github;
	if (!config.clientId || !config.clientSecret || !config.redirectUri) {
		throw new OAuthNotConfiguredError();
	}
	return config;
}

// --- CSRF state token ----------------------------------------------------------------------
// There's no server-side session store (auth is stateless JWT — permissions.middleware.ts), so
// the state param can't be stashed server-side and compared on return the usual way. Instead
// it's a short-lived, self-contained signed token: we sign {nonce} here, hand it to
// the provider as state, and the provider hands it straight back unmodified on the callback.
// Verifying the signature + expiry match gives the same CSRF guarantee (an attacker
// can't forge a valid state without stateSecret) without needing anywhere to store it.
const STATE_TTL_SECONDS = 600; // 10 minutes
const STATE_TYP = "oauth_state";

interface OAuthStateClaims {
	typ: typeof STATE_TYP;
	nonce: string; // nonce = number used once
}

function generateState(): string {
	const claims: OAuthStateClaims = { typ: STATE_TYP, nonce: randomBytes(16).toString("hex") };
	return jwt.sign(claims, getConfig().stateSecret, { expiresIn: STATE_TTL_SECONDS });
}

function verifyState(state: string | undefined): void {
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
}

// --- GitHub endpoints ------------------------------------------------------------------
const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

const TOKEN_URL = "https://github.com/login/oauth/access_token";

const USER_URL = "https://api.github.com/user";

// repo / api are what Track 3's git module needslater (via Octokit / @gitbeaker/rest) to link
// branches and register webhooks on the user's behalf
const SCOPE = "read:user user:email repo";

// getOAuthRedirectUrl builds the provider consent-screen URL the frontend redirects the user to
export function getOAuthRedirectUrl(): string {
	const config = getGithubConfig();

	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: config.redirectUri,
		scope: SCOPE,
		state: generateState(),
	});

	return `${AUTHORIZE_URL}?${params.toString()}`;
}

// token exchange + profile fetch

interface ExchangedToken {
	accessToken: string;
}

async function exchangeCodeForToken(code: string): Promise<ExchangedToken> {
	const config = getGithubConfig();

	const body = {
		client_id: config.clientId,
		client_secret: config.clientSecret,
		code,
		redirect_uri: config.redirectUri,
	};

	const response = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new OAuthExchangeError(`github token endpoint returned ${response.status}`);
	}

	const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
	if (!data.access_token) {
		throw new OAuthExchangeError(data.error_description ?? data.error ?? "no access_token in provider response");
	}

	return { accessToken: data.access_token };
}

interface OAuthProfile {
	oauthId: string;
	email: string;
	name: string;
	avatar: string | null;
}

async function fetchGitHubProfile(accessToken: string): Promise<OAuthProfile> {
	const authHeaders = { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json" };

	const userRes = await fetch(USER_URL, { headers: authHeaders });
	if (!userRes.ok) {
		throw new OAuthExchangeError(`GitHub profile fetch returned ${userRes.status}`);
	}
	const user = (await userRes.json()) as {
		id: number;
		login: string;
		name: string | null;
		email: string | null;
		avatar_url: string | null;
	};

	if (!user.email) {
		throw new OAuthExchangeError("GitHub did not return an email for this account");
	}

	return {
		oauthId: String(user.id),
		email: user.email.toLowerCase(),
		name: user.name ?? user.login,
		avatar: user.avatar_url,
	};
}

async function randomUnusablePassword(): Promise<{ hash: string; salt: string }> {
	return hashPassword(randomBytes(32).toString("hex"));
}

// handleOAuthCallback exchanges the provider's auth code for a token, creates/links the User, and returns them.
export async function handleOAuthCallback(code: string, state: string): Promise<User> {
	verifyState(state);

	const { accessToken } = await exchangeCodeForToken(code);
	const profile = await fetchGitHubProfile(accessToken);

	// 1. Already linked to this provider identity
	const existingByIdentity = await prisma.user.findFirst({
		where: { oauthProvider: "github", oauthId: profile.oauthId },
	});
	if (existingByIdentity) {
		return prisma.user.update({
			where: { id: existingByIdentity.id },
			data: { oauthAccessToken: accessToken,
				   avatar: profile.avatar ?? existingByIdentity.avatar
			},
		});
	}
	const existingByEmail = await prisma.user.findUnique({
		where: { email: profile.email }
	});
	if (existingByEmail) {
		return prisma.user.update({
			where: { id: existingByEmail.id },
			data: {
				oauthProvider: "github",
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
				oauthProvider: "github",
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
export async function linkOAuthAccount(userId: string, code: string): Promise<void> {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		throw new OAuthAccountConflictError(`no user with id ${userId}`);
	}

	const { accessToken } = await exchangeCodeForToken(code);
	const profile = await fetchGitHubProfile(accessToken);

	if (user.oauthProvider && (user.oauthProvider !== "github" || user.oauthId !== profile.oauthId)) {
		throw new OAuthAccountConflictError(`user ${userId} already has a ${user.oauthProvider} identity linked, unlink it first`);
	}

	await prisma.user.update({
		where: { id: userId },
		data: {
			oauthProvider: "github",
			oauthId: profile.oauthId,
			oauthAccessToken: accessToken
		},
	});
}
