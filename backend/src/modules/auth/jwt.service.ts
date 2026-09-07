/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   jwt.service.ts                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/07 21:42:51 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/07 22:01:52 by lulmaruy         ###   ########.fr       */
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
			throw new JwtInvalidError("unexpected token payload shape"); // to verify if we should use new
		}
	}
  // TODO: verify signature/expiry
  // TODO: throw a typed error distinguishing "expired" from "invalid" so route handlers can respond appropriately
  throw new Error("not implemented");
}

// refreshJwt issues a new token ahead of expiry so long sessions don't force a re-login mid-use.
export function refreshJwt(token: string): string {
  // TODO: validate the existing token, then issue a new one with a rolled-forward expiry
  throw new Error("not implemented");
}
