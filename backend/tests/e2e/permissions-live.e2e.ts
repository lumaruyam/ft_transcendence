// Permissions on open sockets: non-members refused, viewers read-only, a demoted or removed member is cut off after the role cache delay (takes about 35 s).
import { check, failures, report, sleep, testConfig } from "./helpers.js";
import { buildApp } from "../../src/app.js";
import { createKanbanHub } from "../../src/modules/kanban/hub.js";
import { prisma } from "../../src/db/prisma/client.js";
import { generateJwt } from "../../src/modules/auth/jwt.service.js";
import { io } from "socket.io-client";


const app = buildApp(testConfig());
createKanbanHub(app.server);
await app.listen({ port: 0, host: "127.0.0.1" });
const port = (app.server.address() as any).port;

const mk = async (name: string) => { const u = await prisma.user.create({ data: { email: `${name}@t.t`, passwordHash: "x", passwordSalt: "x", name } }); return { id: u.id, jwt: generateJwt(u.id) }; };
const owner = await mk("owner"), writer = await mk("writer"), reader = await mk("reader"), spy = await mk("spy");
const call = (as: { jwt: string }, method: string, url: string, body?: unknown) => app.inject({ method: method as any, url, headers: { authorization: `Bearer ${as.jwt}` }, ...(body !== undefined ? { payload: body as any } : {}) });
const projectId = (await call(owner, "POST", "/api/projects", { name: "WS" })).json().project.id;
await call(owner, "POST", `/api/projects/${projectId}/members`, { userId: writer.id, role: "member" });
await call(owner, "POST", `/api/projects/${projectId}/members`, { userId: reader.id, role: "viewer" });

const connect = async (u: { jwt: string }) => {
	const s = io(`http://127.0.0.1:${port}`, { auth: { token: u.jwt } });
	const got: any[] = [];
	s.onAny((e: string, d: unknown) => got.push([e, d]));
	await new Promise((r) => s.on("connect", r as any));
	return { s, got, count: (e: string) => got.filter((x) => x[0] === e).length };
};
const o = await connect(owner), w = await connect(writer), r = await connect(reader), x = await connect(spy);
for (const c of [o, w, r, x]) c.s.emit("join_whiteboard", projectId);
await sleep(600);
const el = (id: string) => ({ id, type: "rectangle", version: 1, versionNonce: 1 });

check("a non-member cannot join the whiteboard room (join_denied)", x.count("whiteboard_joined") === 0 && x.count("join_denied") === 1);
w.s.emit("whiteboard_update", { elements: [el("w1")] });
await sleep(400);
check("a member's drawing reaches the others", o.count("whiteboard_update") === 1 && r.count("whiteboard_update") === 1);
check("...and never the non-member", x.count("whiteboard_update") === 0);
r.s.emit("whiteboard_update", { elements: [el("r1")] });
await sleep(400);
check("a viewer's drawing is not relayed", o.count("whiteboard_update") === 1);

// demote the writer, remove the reader, and wait for the role cache to expire
await call(owner, "PUT", `/api/projects/${projectId}/members/${writer.id}`, { role: "viewer" });
await call(owner, "DELETE", `/api/projects/${projectId}/members/${reader.id}`);
console.log("   (waiting 31 s for the 30 s role cache to expire)");
await sleep(31000);
const before = o.count("whiteboard_update");
w.s.emit("whiteboard_update", { elements: [el("w2")] });
await sleep(500);
check("a demoted member can no longer draw on an open connection", o.count("whiteboard_update") === before, `${o.count("whiteboard_update")} vs ${before}`);
const ptrBefore = o.count("whiteboard_pointer");
r.s.emit("whiteboard_pointer", { x: 1, y: 2, tool: "pointer", button: "up" });
await sleep(500);
check("a removed member's cursor is no longer relayed", o.count("whiteboard_pointer") === ptrBefore);
o.s.emit("whiteboard_update", { elements: [el("o1")] });
await sleep(500);
check("a removed member stops receiving the board (left the room)", r.count("whiteboard_update") === 1, String(r.count("whiteboard_update")));
check("the demoted member still watches (a viewer keeps read access)", w.count("whiteboard_update") >= 1 && w.got.some((g) => g[0] === "whiteboard_update" && (g[1] as any).elements[0].id === "o1"));

report();
[o, w, r, x].forEach((c) => c.s.close());
await app.close(); await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
