/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   jwt.service.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/07 21:42:51 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/08 20:10:26 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: issuing and validating JWT session tokens (e.g. via `jsonwebtoken` or `jose`), used by every authenticated request across all tracks. TS equivalent of backend/internal/auth/jwt.go (Go skeleton, removed).

import jwt, { type SignOptions } from "jsonwebtoken";
import { loadConfig } from "../../config/env.js";

const config = loadConfig();

const TOKEN_TTL: SignOptions["expiresIn"] = "24h";

export interface JwtClaims {
	userId: string;
	exp: number;
}

export class JwtExpiredError extends Error {
	constructor() {
		super("JWT has expired");
		this.name = "JwtExpiredError";
	}
}

export class JwtInvalidError extends Error {
	constructor(reason?: string) {
		super(reason ? `JWT is invalid: ${reason}` : "JWT is invalid");
		this.name = "JwtInvalidError";
	}
}

// generateJwt issues a signed session token for a freshly authenticated user.
export function generateJwt(userId: string): string {
	return jwt.sign({ userId }, config.jwtSecret, { expiresIn: TOKEN_TTL });
}

// validateJwt parses and verifies a token presented on an incoming request, for use by permissions.middleware.ts.
export function validateJwt(token: string): JwtClaims {
	try {
		const decoded = jwt.verify(token, config.jwtSecret);
		if (typeof decoded === "string" || typeof decoded.userId !== "string" || typeof decoded.exp !== "number")
		{
			throw new JwtInvalidError("unexpected token payload shape");
		}
	return { userId: decoded.userId, exp: decoded.exp };
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			throw new JwtExpiredError();
		}
		if (err instanceof JwtInvalidError) {
			throw err;
		}
		if (err instanceof jwt.JsonWebTokenError) {
			throw new JwtInvalidError(err.message);
		}
		throw new JwtInvalidError("could not be verified");
	}
}

// refreshJwt issues a new token ahead of expiry so long sessions don't force a re-login mid-use.
export function refreshJwt(token: string): string {
	const claims = validateJwt(token);
	return generateJwt(claims.userId);
}
