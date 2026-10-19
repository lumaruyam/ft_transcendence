// Real time: authentication of connections, every kanban event in order and only to the project room, per-person presence, membership events and eviction, project deletion, clean shutdown.
import { check, failures, report, sleep, testConfig } from "./helpers.js";
import { buildApp } from "../../src/app.js";
import { createKanbanHub } from "../../src/modules/kanban/hub.js";
import { prisma } from "../../src/db/prisma/client.js";
import { generateJwt } from "../../src/modules/auth/jwt.service.js";
import jwtLib from "jsonwebtoken";
import { io } from "socket.io-client";


const app = buildApp(testConfig());
const hub = createKanbanHub(app.server);
await app.listen({ port: 0, host: "127.0.0.1" });
const port = (app.server.address() as any).port;
const url = `http://127.0.0.1:${port}`;

const mk = async (name: string) => { const u = await prisma.user.create({ data: { email: `${name}@t.t`, passwordHash: "x", passwordSalt: "x", name } }); return { id: u.id, jwt: generateJwt(u.id) }; };
const alice = await mk("alice"), bob = await mk("bob"), carol = await mk("carol"), dave = await mk("dave"), zed = await mk("zed");
const call = (as: { jwt: string }, method: string, path: string, body?: unknown) => app.inject({ method: method as any, url: path, headers: { authorization: `Bearer ${as.jwt}` }, ...(body !== undefined ? { payload: body as any } : {}) });

const P1 = (await call(alice, "POST", "/api/projects", { name: "One" })).json().project.id;
const P2 = (await call(zed, "POST", "/api/projects", { name: "Other" })).json().project.id;
for (const u of [bob, carol, dave]) await call(alice, "POST", `/api/projects/${P1}/members`, { userId: u.id, role: "member" });

type C = { s: any; got: [string, any][]; count: (e: string) => number; last: (e: string) => any; clear: () => void };
const connect = async (u: { jwt: string }, project?: string): Promise<C> => {
	const s = io(url, { auth: { token: u.jwt }, reconnection: false });
	const got: [string, any][] = [];
	s.onAny((e: string, d: unknown) => got.push([e, d]));
	await new Promise((r) => s.on("connect", r as any));
	if (project) s.emit("join_project", project);
	return { s, got, count: (e) => got.filter((g) => g[0] === e).length, last: (e) => got.filter((g) => g[0] === e).at(-1)?.[1], clear: () => (got.length = 0) };
};
const wait = (ms = 350) => sleep(ms);

const a = await connect(alice, P1), b = await connect(bob, P1), z = await connect(zed, P2);
await wait(600);

// ---- connection security
const rejected = (token: string | null) => new Promise<string>((resolve) => { const s = io(url, { auth: token === null ? {} : { token }, reconnection: false }); s.on("connect_error", (e: Error) => { s.close(); resolve(e.message); }); s.on("connect", () => { s.close(); resolve("connected"); }); });
check("no token -> refused (unauthorized)", (await rejected(null)) === "unauthorized");
check("garbage token -> refused (unauthorized)", (await rejected("nonsense")) === "unauthorized");
const expired = jwtLib.sign({ sub: alice.id, userId: alice.id }, "jwt-secret-for-tests", { expiresIn: -10 });
check("expired token -> refused (token_expired)", (await rejected(expired)) === "token_expired");
const nm = await connect(carol); nm.s.emit("join_project", P2); await wait();
check("a non-member cannot join a project room (join_denied)", nm.count("join_denied") === 1 && nm.count("presence_snapshot") === 0);

// ---- every mutation reaches the room, once, and only the room
const board = (await call(alice, "GET", `/api/projects/${P1}/board`)).json().id;
a.clear(); b.clear(); z.clear();
const l1 = (await call(alice, "POST", "/api/lists", { boardId: board, title: "L1", position: 0 })).json().id;
const l2 = (await call(alice, "POST", "/api/lists", { boardId: board, title: "L2", position: 1 })).json().id;
const c1 = (await call(alice, "POST", "/api/cards", { listId: l1, title: "C1", position: 0 })).json().id;
await call(alice, "PUT", `/api/cards/${c1}`, { title: "C1 renamed" });
await call(alice, "PUT", `/api/cards/${c1}/move`, { listId: l2, position: 0 });
const tag = (await call(alice, "POST", `/api/projects/${P1}/tags`, { name: "T" })).json().id;
await call(alice, "PUT", `/api/tags/${tag}`, { color: "#aabbcc" });
await call(alice, "PUT", `/api/cards/${c1}/tags`, { tagIds: [tag] });
await call(alice, "PUT", `/api/lists/${l1}`, { title: "L1 renamed" });
await call(alice, "PUT", `/api/boards/${board}/lists/reorder`, { orderedListIds: [l2, l1] });
await call(alice, "DELETE", `/api/tags/${tag}`);
await call(alice, "DELETE", `/api/cards/${c1}`);
await call(alice, "DELETE", `/api/lists/${l1}`);
await wait(600);
const evs = (c: C) => c.got.map((g) => g[0]).filter((e) => e !== "notification");
const expected = ["list_created", "list_created", "card_created", "card_updated", "card_moved", "tag_created", "tag_updated", "card_updated", "list_updated", "lists_reordered", "tag_deleted", "card_deleted", "list_deleted"];
check("a member receives every kanban mutation, in order, exactly once", JSON.stringify(evs(b)) === JSON.stringify(expected), JSON.stringify(evs(b)));
check("the author's own tabs get them too (one source of truth)", JSON.stringify(evs(a)) === JSON.stringify(expected));
check("another project's room receives none of them", evs(z).filter((e) => e !== "presence" && e !== "presence_snapshot").length === 0, JSON.stringify(evs(z)));
check("card_moved carries the new order of both lists (no refetch needed)", true);
const mv = b.got.find((g) => g[0] === "card_moved")![1];
check("card_moved payload: from/to list and their card order", mv.fromListId === l1 && mv.toListId === l2 && Array.isArray(mv.toOrder) && mv.toOrder.includes(c1) && Array.isArray(mv.fromOrder));

// ---- presence: per user, not per tab
b.clear(); a.clear();
const a2 = await connect(alice, P1); await wait();
check("a newcomer gets a snapshot of who is here", a2.last("presence_snapshot")?.userIds.sort().join() === [alice.id, bob.id].sort().join(), JSON.stringify(a2.last("presence_snapshot")));
a2.s.close(); await wait();
check("closing one of two tabs does NOT show the user as gone", b.got.filter((g) => g[0] === "presence" && g[1].userId === alice.id && g[1].status === "left").length === 0, JSON.stringify(b.got.filter((g) => g[0] === "presence")));
a.s.close(); await wait();
check("closing the last tab says left", b.got.some((g) => g[0] === "presence" && g[1].userId === alice.id && g[1].status === "left"));
// reconnect (what the browser does): new connection joins again and gets a fresh snapshot
const a3 = await connect(alice, P1); await wait();
check("coming back: joined is announced and a fresh snapshot arrives", b.got.some((g) => g[0] === "presence" && g[1].userId === alice.id && g[1].status === "joined") && a3.last("presence_snapshot")?.userIds.includes(bob.id));
const d1 = await connect(dave, P1); await wait();
d1.s.emit("leave_project", P1); await wait();
check("leave_project announces left when it was the last tab", b.got.some((g) => g[0] === "presence" && g[1].userId === dave.id && g[1].status === "left"));
a3.s.close();
const a4 = await connect(alice, P1);

// ---- members / roles / project: live
b.clear(); a4.clear();
await call(alice, "PUT", `/api/projects/${P1}/members/${bob.id}`, { role: "viewer" }); await wait();
check("a role change is broadcast (members_changed) so open boards refresh who may edit", b.count("members_changed") === 1 && a4.count("members_changed") === 1);
await call(alice, "PUT", `/api/projects/${P1}`, { name: "One renamed" }); await wait();
check("a rename is broadcast (project_updated with the name)", b.last("project_updated")?.name === "One renamed");
const cc = await connect(carol, P1); cc.clear(); // carol will be removed
await call(alice, "DELETE", `/api/projects/${P1}/members/${carol.id}`); await wait();
check("a removed member is told (removed_from_project) on their tab", cc.count("removed_from_project") === 1 && cc.last("removed_from_project").projectId === P1);
check("the others see the member list change", b.count("members_changed") === 2);
cc.clear(); b.clear();
await call(alice, "POST", "/api/lists", { boardId: board, title: "after removal", position: 5 }); await wait();
check("a removed member receives nothing more (evicted from the room)", cc.got.filter((g) => g[0] !== "presence").length === 0, JSON.stringify(cc.got.map((g) => g[0])));
check("...while the others still do", b.count("list_created") === 1);

// ---- a member deletes their own account while connected
const dd = await connect(dave, P1); dd.clear(); b.clear();
const del = await call(dave, "DELETE", `/api/users/${dave.id}`);
await wait();
check("account deletion: 204, their tab is evicted, the others see the member list change", del.statusCode === 204 && dd.count("removed_from_project") === 1 && b.count("members_changed") === 1, `${del.statusCode} ${dd.count("removed_from_project")} ${b.count("members_changed")}`);

// ---- project deleted
a4.clear(); b.clear();
const gone = await call(alice, "DELETE", `/api/projects/${P1}`); await wait();
check("project deletion: everybody connected is told (project_deleted)", gone.statusCode === 204 && a4.count("project_deleted") === 1 && b.count("project_deleted") === 1, `${gone.statusCode} ${a4.count("project_deleted")} ${b.count("project_deleted")}`);
check("the other project is untouched", z.got.every((g) => g[0] === "presence" || g[0] === "presence_snapshot" || g[0] === "notification"));

// ---- graceful shutdown: clients see the disconnect
const closing = new Promise<string>((resolve) => z.s.on("disconnect", (reason: string) => resolve(reason)));
hub.close(); // same order as server.ts: Socket.IO first, then Fastify
await app.close();
check("server shutdown disconnects clients cleanly", typeof (await Promise.race([closing, sleep(3000).then(() => "timeout")])) === "string" && !z.s.connected);

report();
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
