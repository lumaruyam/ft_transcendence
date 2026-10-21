// Standard user management: avatar upload (type sniffing, size cap, replacement, default avatar, public serving, cleanup)
// and password change (current password required, validation, new password works, old one does not, old tokens revoked).
import { readdir } from "node:fs/promises";
import path from "node:path";
import { check, failures, report, testConfig } from "./helpers.js";
import { buildApp } from "../../src/app.js";
import { prisma } from "../../src/db/prisma/client.js";
import { generateJwt } from "../../src/modules/auth/jwt.service.js";

const app = buildApp(testConfig());
await app.ready();

const AVATARS = path.join(process.env.UPLOADS_DIR as string, "avatars");
const files = async (): Promise<string[]> => readdir(AVATARS).catch(() => []);

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 2)]);

function multipart(data: Buffer, filename = "me.png", type = "image/png") {
	const boundary = "----avatartest";
	const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${type}\r\n\r\n`);
	return {
		headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
		payload: Buffer.concat([head, data, Buffer.from(`\r\n--${boundary}--\r\n`)]),
	};
}

// sign up for real, so the password is hashed the way the application does it
const signup = await app.inject({ method: "POST", url: "/api/auth/signup", payload: { email: "ava@t.t", password: "oldpass123", name: "Ava Lovelace" } });
const token: string = signup.json().token;
const me = signup.json().user as { id: string; avatar: string | null };
let auth = { authorization: `Bearer ${token}` };
const other = await prisma.user.create({ data: { email: "other@t.t", passwordHash: "x", passwordSalt: "x", name: "Other" } });

check("a new account has no avatar (the frontend draws the default one)", me.avatar === null, String(me.avatar));

// ---- upload
let r = await app.inject({ method: "PUT", url: "/api/users/me/avatar", headers: { ...auth, ...multipart(PNG).headers }, payload: multipart(PNG).payload });
const avatar: string = r.json().avatar;
check("uploading a PNG: 200 and a /api/avatars/ path", r.statusCode === 200 && /^\/api\/avatars\/[0-9a-f-]{36}\.png$/.test(avatar), r.body);
r = await app.inject({ method: "GET", url: "/api/users/me", headers: auth });
check("/me returns the avatar", r.json().avatar === avatar);

r = await app.inject({ method: "GET", url: avatar });
check("the picture is served without a token, with the right type and nosniff", r.statusCode === 200 && r.headers["content-type"] === "image/png" && r.headers["x-content-type-options"] === "nosniff", `${r.statusCode} ${r.headers["content-type"]}`);
check("...and the bytes are the ones uploaded", r.rawPayload.equals(PNG));

// ---- rejects
const html = Buffer.from("<script>alert(1)</script>");
r = await app.inject({ method: "PUT", url: "/api/users/me/avatar", headers: { ...auth, ...multipart(html, "x.png", "image/png").headers }, payload: multipart(html, "x.png", "image/png").payload });
check("a non-image sent as image/png is rejected by its content (400)", r.statusCode === 400 && r.json().error === "invalid_avatar", r.body);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
r = await app.inject({ method: "PUT", url: "/api/users/me/avatar", headers: { ...auth, ...multipart(svg, "x.svg", "image/svg+xml").headers }, payload: multipart(svg, "x.svg", "image/svg+xml").payload });
check("SVG is rejected (400)", r.statusCode === 400);
const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);
r = await app.inject({ method: "PUT", url: "/api/users/me/avatar", headers: { ...auth, ...multipart(big).headers }, payload: multipart(big).payload });
check("a file over 2 MiB is rejected (413)", r.statusCode === 413 && r.json().error === "avatar_too_large", `${r.statusCode} ${r.body}`);
r = await app.inject({ method: "PUT", url: "/api/users/me/avatar", headers: { ...auth, "content-type": "application/json" }, payload: "{}" });
check("no file: 4xx", r.statusCode >= 400 && r.statusCode < 500, String(r.statusCode));
r = await app.inject({ method: "PUT", url: "/api/users/me/avatar", headers: multipart(PNG).headers, payload: multipart(PNG).payload });
check("without a session: 401", r.statusCode === 401);
check("failed uploads left nothing on disk", (await files()).length === 1, JSON.stringify(await files()));
r = await app.inject({ method: "GET", url: "/api/avatars/..%2F..%2Fpackage.json" });
check("path traversal in the file name: 404", r.statusCode === 404);
r = await app.inject({ method: "GET", url: "/api/avatars/00000000-0000-0000-0000-000000000000.png" });
check("unknown picture: 404", r.statusCode === 404);

// ---- replace / remove
r = await app.inject({ method: "PUT", url: "/api/users/me/avatar", headers: { ...auth, ...multipart(JPG, "a.jpg", "image/jpeg").headers }, payload: multipart(JPG, "a.jpg", "image/jpeg").payload });
const avatar2: string = r.json().avatar;
check("replacing with a JPEG works", r.statusCode === 200 && avatar2.endsWith(".jpg") && avatar2 !== avatar, r.body);
check("the previous file is deleted", (await files()).length === 1 && (await app.inject({ method: "GET", url: avatar })).statusCode === 404);

r = await app.inject({ method: "DELETE", url: "/api/users/me/avatar", headers: auth });
check("removing the avatar: 204, back to none, file deleted", r.statusCode === 204 && (await prisma.user.findUnique({ where: { id: me.id } }))?.avatar === null && (await files()).length === 0);

// the profile other people see carries the avatar
await app.inject({ method: "PUT", url: "/api/users/me/avatar", headers: { ...auth, ...multipart(PNG).headers }, payload: multipart(PNG).payload });
const project = (await app.inject({ method: "POST", url: "/api/projects", headers: auth, payload: { name: "P" } })).json().project.id;
await prisma.projectMember.create({ data: { projectId: project, userId: other.id, role: "member" } });
r = await app.inject({ method: "GET", url: `/api/users/${me.id}`, headers: { authorization: `Bearer ${generateJwt(other.id)}` } });
check("a teammate sees the avatar on the profile", r.statusCode === 200 && /^\/api\/avatars\//.test(r.json().user.avatar), r.body);
r = await app.inject({ method: "GET", url: `/api/projects/${project}/members`, headers: auth });
check("...and in the member list", JSON.stringify(r.json()).includes("/api/avatars/"));

// ---- password
const pw = (currentPassword: unknown, newPassword: unknown) =>
	app.inject({ method: "PUT", url: "/api/users/me/password", headers: auth, payload: { currentPassword, newPassword } as any });
r = await pw("wrong-pass1", "newpass456");
check("wrong current password: 403 wrong_password (not 401: the session stays)", r.statusCode === 403 && r.json().error === "wrong_password", r.body);
r = await pw("oldpass123", "short1");
check("too short: 400", r.statusCode === 400 && r.json().error === "invalid_input", r.body);
r = await pw("oldpass123", "onlyletters");
check("no digit: 400", r.statusCode === 400);
r = await pw("oldpass123", 12345678);
check("not a string: 400", r.statusCode === 400);
r = await app.inject({ method: "PUT", url: "/api/users/me/password", payload: { currentPassword: "oldpass123", newPassword: "newpass456" } });
check("without a session: 401", r.statusCode === 401);
r = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "ava@t.t", password: "oldpass123" } });
check("nothing changed after the failures: old password still logs in", r.statusCode === 200);

r = await pw("oldpass123", "newpass456");
const newToken: string = r.json().token;
check("correct current password + valid new one: 200 with a new token", r.statusCode === 200 && typeof newToken === "string", r.body);
check("the token used to change it is revoked (401)", (await app.inject({ method: "GET", url: "/api/users/me", headers: auth })).statusCode === 401);
check("the token returned by the change works", (await app.inject({ method: "GET", url: "/api/users/me", headers: { authorization: `Bearer ${newToken}` } })).statusCode === 200);
auth = { authorization: `Bearer ${newToken}` };
r = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "ava@t.t", password: "oldpass123" } });
check("the old password no longer logs in", r.statusCode === 401);
r = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "ava@t.t", password: "newpass456" } });
check("the new one does", r.statusCode === 200);
check("login returns the avatar too", typeof r.json().user.avatar === "string");

// ---- password guessing is slowed down (10 tries a minute per client address)
const guess = (ip: string) => app.inject({ method: "POST", url: "/api/auth/login", headers: { "x-forwarded-for": ip }, payload: { email: "ava@t.t", password: "not-the-password1" } });
const codes: number[] = [];
for (let i = 0; i < 12; i++) codes.push((await guess("203.0.113.50")).statusCode);
check("10 wrong passwords answer 401, then the client is limited (429)", codes.slice(0, 10).every((c) => c === 401) && codes.slice(10).every((c) => c === 429), codes.join(","));
check("another client address is not affected", (await guess("203.0.113.51")).statusCode === 401);

// ---- deleting the account removes the picture
r = await app.inject({ method: "DELETE", url: `/api/users/${me.id}`, headers: auth, payload: { transferTo: other.id } });
check("account deletion: 204 and the picture file is gone", r.statusCode === 204 && (await files()).length === 0, `${r.statusCode} ${r.body} ${JSON.stringify(await files())}`);

await app.close();
report();
process.exit(failures === 0 ? 0 : 1);
