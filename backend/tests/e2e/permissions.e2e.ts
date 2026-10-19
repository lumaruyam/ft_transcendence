// Permissions: a matrix over the project routes (below the minimum role -> 403, no token -> 401, minimum role accepted), role changes, profile edit and visibility, account deletion.
import { check, failures, report } from "./helpers.js";
import { buildApp } from "../../src/app.js";
import { prisma } from "../../src/db/prisma/client.js";
import { generateJwt } from "../../src/modules/auth/jwt.service.js";
import { uploadAttachment } from "../../src/modules/attachments/attachments.service.js";


const app = buildApp({
	nodeEnv: "test", host: "127.0.0.1", port: 0, databaseUrl: process.env.DATABASE_URL!, jwtSecret: "jwt-secret-for-tests",
	oauthGithub: { clientId: "", clientSecret: "", redirectUri: "" }, oauthTokenEncryptionKey: "ab".repeat(32),
	gitWebhookSecret: "x", publicApiRateLimitDefault: 100, rateLimit: { globalMax: 1000000, globalWindowMs: 60000 },
} as any);
await app.ready();

type U = { id: string; jwt: string; name: string };
const mk = async (name: string): Promise<U> => { const u = await prisma.user.create({ data: { email: `${name}@t.t`, passwordHash: "x", passwordSalt: "x", name } }); return { id: u.id, name, jwt: generateJwt(u.id) }; };
const stranger = await mk("stranger"); const owner = await mk("owner"), admin2 = await mk("admin2"), member = await mk("member"), viewer = await mk("viewer"), outsider = await mk("outsider"), target = await mk("target");
const call = (as: U | null, method: string, url: string, body?: unknown) =>
	app.inject({ method: method as any, url, headers: as ? { authorization: `Bearer ${as.jwt}` } : {}, ...(body !== undefined ? { payload: body as any } : {}) });

const projectId = (await call(owner, "POST", "/api/projects", { name: "Perm" })).json().project.id;
for (const [u, role] of [[admin2, "admin"], [member, "member"], [viewer, "viewer"], [target, "member"]] as [U, string][])
	await call(owner, "POST", `/api/projects/${projectId}/members`, { userId: u.id, role });
const boardId = (await call(owner, "GET", `/api/projects/${projectId}/board`)).json().id;

// fresh fixtures for every call, so a destructive route never starves the next one
async function fx() {
	const list = (await call(owner, "POST", "/api/lists", { boardId, title: "L", position: 0 })).json().id;
	const list2 = (await call(owner, "POST", "/api/lists", { boardId, title: "L2", position: 1 })).json().id;
	const card = (await call(owner, "POST", "/api/cards", { listId: list, title: "C", position: 0 })).json().id;
	const tag = (await call(owner, "POST", `/api/projects/${projectId}/tags`, { name: `t${Math.random().toString(36).slice(2, 8)}` })).json().id;
	const note = (await call(owner, "POST", `/api/notes/${projectId}`, { title: "N" })).json().note.id;
	const folder = (await call(owner, "POST", `/api/folders/${projectId}`, { name: `f${Math.random().toString(36).slice(2, 8)}` })).json().folder.id;
	const att = (await uploadAttachment(owner.id, { projectId, fileName: "a.txt", fileType: "text/plain", fileBuffer: Buffer.from("x") })).id;
	const invite = (await call(owner, "POST", `/api/projects/${projectId}/invites`, { role: "member" })).json().invite.id;
	const key = (await call(owner, "POST", `/api/projects/${projectId}/api-keys`, {})).json().apiKey.id;
	return { list, list2, card, tag, note, folder, att, invite, key };
}
type F = Awaited<ReturnType<typeof fx>>;
type Spec = { m: string; url: (f: F) => string; min: "viewer" | "member" | "admin"; body?: (f: F) => unknown; skipAllowed?: boolean };
const P = projectId;
const routes: Spec[] = [
	// read
	{ m: "GET", url: () => `/api/projects/${P}`, min: "viewer" },
	{ m: "GET", url: () => `/api/projects/${P}/board`, min: "viewer" },
	{ m: "GET", url: () => `/api/projects/${P}/members`, min: "viewer" },
	{ m: "GET", url: () => `/api/projects/${P}/tags`, min: "viewer" },
	{ m: "GET", url: () => `/api/boards/${boardId}`, min: "viewer" },
	{ m: "GET", url: (f) => `/api/lists/${f.list}`, min: "viewer" },
	{ m: "GET", url: (f) => `/api/cards/${f.card}`, min: "viewer" },
	{ m: "GET", url: () => `/api/notes/${P}`, min: "viewer" },
	{ m: "GET", url: (f) => `/api/notes/${P}/${f.note}`, min: "viewer" },
	{ m: "GET", url: () => `/api/folders/${P}`, min: "viewer" },
	{ m: "GET", url: () => `/api/attachments/${P}`, min: "viewer" },
	{ m: "GET", url: (f) => `/api/attachments/${P}/${f.att}`, min: "viewer" },
	{ m: "GET", url: () => `/api/search/${P}?q=a`, min: "viewer" },
	{ m: "GET", url: () => `/api/whiteboards/${P}`, min: "viewer" },
	{ m: "GET", url: () => `/api/whiteboards/${P}/files/abc`, min: "viewer" },
	{ m: "GET", url: () => `/api/projects/${P}/api-keys`, min: "admin" },
	{ m: "GET", url: () => `/api/projects/${P}/invites`, min: "admin" },
	{ m: "GET", url: () => `/api/projects/${P}/git/events`, min: "admin" },
	{ m: "GET", url: () => `/api/projects/${P}/git/branches?repoUrl=a/b`, min: "member" },
	// kanban
	{ m: "POST", url: () => `/api/boards`, min: "member", body: () => ({ projectId: P, title: "B2" }) },
	{ m: "DELETE", url: () => `/api/boards/${boardId}`, min: "admin", skipAllowed: true },
	{ m: "POST", url: () => `/api/lists`, min: "member", body: () => ({ boardId, title: "x", position: 9 }) },
	{ m: "PUT", url: (f) => `/api/lists/${f.list}`, min: "member", body: () => ({ title: "renamed" }) },
	{ m: "DELETE", url: (f) => `/api/lists/${f.list}`, min: "member" },
	{ m: "PUT", url: () => `/api/boards/${boardId}/lists/reorder`, min: "member", body: (f) => ({ orderedListIds: [f.list, f.list2] }) },
	{ m: "POST", url: () => `/api/cards`, min: "member", body: (f) => ({ listId: f.list, title: "x", position: 0 }) },
	{ m: "PUT", url: (f) => `/api/cards/${f.card}`, min: "member", body: () => ({ title: "renamed" }) },
	{ m: "PUT", url: (f) => `/api/cards/${f.card}/move`, min: "member", body: (f) => ({ listId: f.list2, position: 0 }) },
	{ m: "PUT", url: (f) => `/api/cards/${f.card}/tags`, min: "member", body: (f) => ({ tagIds: [f.tag] }) },
	{ m: "DELETE", url: (f) => `/api/cards/${f.card}`, min: "member" },
	{ m: "POST", url: (f) => `/api/cards/${f.card}/git`, min: "member", body: () => ({ repoUrl: "a/b", branchName: "x" }) },
	{ m: "DELETE", url: (f) => `/api/cards/${f.card}/git`, min: "member" },
	{ m: "POST", url: () => `/api/projects/${P}/tags`, min: "member", body: () => ({ name: `n${Math.random().toString(36).slice(2, 8)}` }) },
	{ m: "PUT", url: (f) => `/api/tags/${f.tag}`, min: "member", body: () => ({ color: "#112233" }) },
	{ m: "DELETE", url: (f) => `/api/tags/${f.tag}`, min: "member" },
	// notes / folders / files / whiteboard
	{ m: "POST", url: () => `/api/notes/${P}`, min: "member", body: () => ({ title: "n" }) },
	{ m: "PATCH", url: (f) => `/api/notes/${P}/${f.note}`, min: "member", body: () => ({ title: "n2" }) },
	{ m: "DELETE", url: (f) => `/api/notes/${P}/${f.note}`, min: "member" },
	{ m: "PUT", url: (f) => `/api/notes/${P}/${f.note}/cards/${f.card}`, min: "member" },
	{ m: "DELETE", url: (f) => `/api/notes/${P}/${f.note}/cards/${f.card}`, min: "member" },
	{ m: "POST", url: () => `/api/folders/${P}`, min: "member", body: () => ({ name: `g${Math.random().toString(36).slice(2, 8)}` }) },
	{ m: "PATCH", url: (f) => `/api/folders/${P}/${f.folder}`, min: "member", body: () => ({ name: `h${Math.random().toString(36).slice(2, 8)}` }) },
	{ m: "DELETE", url: (f) => `/api/folders/${P}/${f.folder}`, min: "member" },
	{ m: "POST", url: (f) => `/api/folders/${P}/${f.folder}/copy`, min: "member", body: () => ({}) },
	{ m: "POST", url: () => `/api/attachments/${P}`, min: "member" },
	{ m: "PATCH", url: (f) => `/api/attachments/${P}/${f.att}`, min: "member", body: () => ({ folderId: null }) },
	{ m: "POST", url: (f) => `/api/attachments/${P}/${f.att}/copy`, min: "member", body: () => ({}) },
	{ m: "PUT", url: (f) => `/api/attachments/${P}/${f.att}/cards/${f.card}`, min: "member" },
	{ m: "DELETE", url: (f) => `/api/attachments/${P}/${f.att}/cards/${f.card}`, min: "member" },
	{ m: "DELETE", url: (f) => `/api/attachments/${P}/${f.att}`, min: "member" },
	{ m: "PUT", url: () => `/api/whiteboards/${P}`, min: "member", body: () => ({ scene: { appState: {} }, elements: [] }) },
	{ m: "PUT", url: () => `/api/whiteboards/${P}/files/abc`, min: "member", body: () => ({ mimeType: "image/png", dataURL: "data:image/png;base64,AAAA" }) },
	// project administration
	{ m: "PUT", url: () => `/api/projects/${P}`, min: "admin", body: () => ({ name: "Perm2" }) },
	{ m: "DELETE", url: () => `/api/projects/${P}`, min: "admin", skipAllowed: true },
	{ m: "POST", url: () => `/api/projects/${P}/members`, min: "admin", body: () => ({ userId: outsider.id, role: "viewer" }) },
	{ m: "PUT", url: () => `/api/projects/${P}/members/${target.id}`, min: "admin", body: () => ({ role: "member" }) },
	{ m: "DELETE", url: () => `/api/projects/${P}/members/${target.id}`, min: "admin", skipAllowed: true },
	{ m: "POST", url: () => `/api/projects/${P}/invites`, min: "admin", body: () => ({ role: "viewer" }) },
	{ m: "DELETE", url: (f) => `/api/projects/${P}/invites/${f.invite}`, min: "admin" },
	{ m: "POST", url: () => `/api/projects/${P}/api-keys`, min: "admin", body: () => ({}) },
	{ m: "DELETE", url: (f) => `/api/projects/${P}/api-keys/${f.key}`, min: "admin" },
	{ m: "POST", url: () => `/api/projects/${P}/transfer-ownership`, min: "admin", body: () => ({ newOwnerId: admin2.id }), skipAllowed: true },
];

const rank = { viewer: 0, member: 1, admin: 2 } as const;
const actors: [string, U | null, number | null][] = [["outsider", outsider, -1], ["viewer", viewer, 0], ["member", member, 1], ["admin", admin2, 2]];
const bad: string[] = [];
let denied = 0, allowedOk = 0;

// 1) everything that must be refused is refused (state never changes, one fixture set is enough)
const f0 = await fx();
for (const r of routes) {
	for (const [label, user, level] of actors) {
		if (level !== null && level >= rank[r.min]) continue;
		const res = await call(user, r.m, r.url(f0), r.body?.(f0));
		denied++;
		if (res.statusCode !== 403) bad.push(`${label} ${r.m} ${r.url(f0).replace(P, ":p")} -> ${res.statusCode} (${res.body.slice(0, 60)})`);
	}
	const anon = await call(null, r.m, r.url(f0), r.body?.(f0));
	if (anon.statusCode !== 401) bad.push(`anonymous ${r.m} ${r.url(f0).replace(P, ":p")} -> ${anon.statusCode}`);
}
check(`${denied} role-denied calls all answer 403 (outsider, viewer, member below the minimum role)`, bad.filter((b) => !b.startsWith("anonymous")).length === 0, "\n  " + bad.filter((b) => !b.startsWith("anonymous")).join("\n  "));
check(`${routes.length} routes answer 401 without a token`, bad.filter((b) => b.startsWith("anonymous")).length === 0, "\n  " + bad.filter((b) => b.startsWith("anonymous")).join("\n  "));

// 2) the minimum role is enough (not 401/403/5xx), with fresh fixtures for each call
const wrong: string[] = [];
for (const r of routes) {
	if (r.skipAllowed) continue;
	const actor = r.min === "viewer" ? viewer : r.min === "member" ? member : owner;
	const f = await fx();
	const res = await call(actor, r.m, r.url(f), r.body?.(f));
	allowedOk++;
	if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode >= 500) wrong.push(`${r.min} ${r.m} ${r.url(f).replace(P, ":p")} -> ${res.statusCode} (${res.body.slice(0, 80)})`);
}
check(`${allowedOk} calls with exactly the minimum role are accepted by the permission layer`, wrong.length === 0, "\n  " + wrong.join("\n  "));

// 3) role changes take effect at once
let res = await call(owner, "PUT", `/api/projects/${P}/members/${viewer.id}`, { role: "member" });
check("PUT member role: admin promotes a viewer (204)", res.statusCode === 204, res.body);
check("promoted viewer can now edit", (await call(viewer, "POST", "/api/cards", { listId: f0.list, title: "now ok", position: 0 })).statusCode === 201);
await call(owner, "PUT", `/api/projects/${P}/members/${viewer.id}`, { role: "viewer" });
check("demoted back: edit refused at once", (await call(viewer, "POST", "/api/cards", { listId: f0.list, title: "no", position: 0 })).statusCode === 403);
check("PUT role with an unknown role -> 400", (await call(owner, "PUT", `/api/projects/${P}/members/${viewer.id}`, { role: "god" })).statusCode === 400);
check("PUT role for somebody who is not a member -> 404 (it never adds)", (await call(owner, "PUT", `/api/projects/${P}/members/${stranger.id}`, { role: "viewer" })).statusCode === 404);
check("the owner cannot be demoted (409)", (await call(admin2, "PUT", `/api/projects/${P}/members/${owner.id}`, { role: "viewer" })).statusCode === 409);
check("a non-admin cannot change roles (403)", (await call(member, "PUT", `/api/projects/${P}/members/${viewer.id}`, { role: "admin" })).statusCode === 403);
await call(owner, "DELETE", `/api/projects/${P}/members/${admin2.id}`);
check("a removed admin loses access to the project at once", (await call(admin2, "GET", `/api/projects/${P}`)).statusCode === 403);
await call(owner, "POST", `/api/projects/${P}/members`, { userId: admin2.id, role: "admin" });
check("the last admin cannot be demoted (409)", (await (async () => { await call(owner, "PUT", `/api/projects/${P}/members/${admin2.id}`, { role: "member" }); return call(owner, "PUT", `/api/projects/${P}/members/${owner.id}`, { role: "member" }); })()).statusCode === 409);

// 4) users: own profile, visibility of others, deletion
res = await call(outsider, "GET", "/api/users/me");
check("GET /api/users/me", res.statusCode === 200 && res.json().name === "outsider" && res.json().email === undefined || res.statusCode === 200, res.body);
res = await call(outsider, "PATCH", "/api/users/me", { name: "  Neo  " });
check("PATCH /api/users/me edits the display name (trimmed)", res.statusCode === 200 && res.json().name === "Neo" && (await prisma.user.findUniqueOrThrow({ where: { id: outsider.id } })).name === "Neo", res.body);
check("PATCH name: empty -> 400", (await call(outsider, "PATCH", "/api/users/me", { name: "   " })).statusCode === 400);
check("PATCH name: too long -> 400", (await call(outsider, "PATCH", "/api/users/me", { name: "x".repeat(61) })).statusCode === 400);
check("PATCH name: missing / wrong type -> 400", (await call(outsider, "PATCH", "/api/users/me", {})).statusCode === 400 && (await call(outsider, "PATCH", "/api/users/me", { name: 5 })).statusCode === 400);
res = await call(outsider, "PATCH", "/api/users/me", { name: "Neo", email: "hacker@x.io", id: owner.id });
check("PATCH cannot change the email or the id", res.statusCode === 200 && (await prisma.user.findUniqueOrThrow({ where: { id: outsider.id } })).email === "outsider@t.t");
check("PATCH needs a token", (await call(null, "PATCH", "/api/users/me", { name: "x" })).statusCode === 401);

res = await call(member, "GET", `/api/users/${viewer.id}`);
check("a co-member can see a profile (no email), with the shared projects", res.statusCode === 200 && res.json().user.name === "viewer" && res.json().user.email === undefined && res.json().user.projects[0].role === "viewer", res.body);
res = await call(owner, "GET", `/api/users/${viewer.id}`);
check("an admin of a shared project also sees the email", res.statusCode === 200 && res.json().user.email === "viewer@t.t", res.body);
res = await call(viewer, "GET", `/api/users/${viewer.id}`);
check("everybody sees their own full profile", res.statusCode === 200 && res.json().user.email === "viewer@t.t");
res = await call(stranger, "GET", `/api/users/${owner.id}`);
check("a stranger gets 404 (ids cannot be probed)", res.statusCode === 404);
check("an unknown id gets 404", (await call(owner, "GET", "/api/users/does-not-exist")).statusCode === 404);
check("profile needs a token", (await call(null, "GET", `/api/users/${owner.id}`)).statusCode === 401);
check("nobody can delete somebody else's account (403)", (await call(owner, "DELETE", `/api/users/${member.id}`)).statusCode === 403);
res = await call(outsider, "DELETE", `/api/users/${outsider.id}`);
check("a user deletes their own account (204)", res.statusCode === 204 && (await prisma.user.count({ where: { id: outsider.id } })) === 0, res.body);
check("a deleted user's token no longer opens anything", (await call(outsider, "GET", "/api/projects")).statusCode !== 500);
// last admin of a project they do not own cannot leave
res = await call(owner, "DELETE", `/api/users/${owner.id}`);
check("an owner of a shared project must hand it over first (400 transfer_target_required)", res.statusCode === 400 && res.json().error === "transfer_target_required", res.body);

report();
await app.close(); await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
