// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: server-side revocation of session tokens. A JWT carries the User.tokenVersion it was issued with;
// logout and password change bump the version, so every token issued earlier stops working at once.

import { prisma } from "../../db/prisma/client.js";

// isSessionCurrent is false for a deleted user and for a token issued before the last revocation
export async function isSessionCurrent(userId: string, tokenVersion: number): Promise<boolean> {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { tokenVersion: true } });
	return user !== null && user.tokenVersion === tokenVersion;
}

// revokeSessions invalidates every token of the user (all devices) and returns the new version
export async function revokeSessions(userId: string): Promise<number> {
	const user = await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } }, select: { tokenVersion: true } });
	return user.tokenVersion;
}
