// Notes: three people typing in the same note at once converge, a late joiner catches up, the saved state equals what clients see, a viewer cannot edit.
import { check, failures, report, sleep, testConfig } from "./helpers.js";
import { buildApp } from "../../src/app.js";
import { createKanbanHub } from "../../src/modules/kanban/hub.js";
import { flushAllNotes } from "../../src/modules/notes/notes.collab.js";
import { prisma } from "../../src/db/prisma/client.js";
import { generateJwt } from "../../src/modules/auth/jwt.service.js";
import * as Y from "yjs";
import { io } from "socket.io-client";


const app = buildApp(testConfig());
const hub = createKanbanHub(app.server);
await app.listen({ port: 0, host: "127.0.0.1" });
const url = `http://127.0.0.1:${(app.server.address() as any).port}`;

const mk = async (name: string) => { const u = await prisma.user.create({ data: { email: `${name}@t.t`, passwordHash: "x", passwordSalt: "x", name } }); return { id: u.id, jwt: generateJwt(u.id) }; };
const users = await Promise.all(["a", "b", "c"].map(mk));
const call = (as: { jwt: string }, method: string, path: string, body?: unknown) => app.inject({ method: method as any, url: path, headers: { authorization: `Bearer ${as.jwt}` }, ...(body !== undefined ? { payload: body as any } : {}) });
const projectId = (await call(users[0], "POST", "/api/projects", { name: "Notes" })).json().project.id;
for (const u of users.slice(1)) await call(users[0], "POST", `/api/projects/${projectId}/members`, { userId: u.id, role: "member" });
const noteId = (await call(users[0], "POST", `/api/notes/${projectId}`, { title: "Shared" })).json().note.id;

// a client = a Y.Doc kept in sync over the socket, like the browser does
async function client(u: { jwt: string }) {
	const s = io(url, { auth: { token: u.jwt }, reconnection: false });
	const doc = new Y.Doc();
	await new Promise((r) => s.on("connect", r as any));
	s.on("note_sync", (m: any) => Y.applyUpdate(doc, new Uint8Array(m.update), "remote"));
	s.on("note_update", (m: any) => Y.applyUpdate(doc, new Uint8Array(m.update), "remote"));
	doc.on("update", (update: Uint8Array, origin: unknown) => { if (origin !== "remote") s.emit("note_update", { noteId, update }); });
	s.emit("note_join", { noteId, stateVector: Y.encodeStateVector(doc) });
	await sleep(300);
	return { s, doc, fragment: doc.getXmlFragment("default") };
}
const texts = (doc: Y.Doc) => (doc.getXmlFragment("default").toArray() as Y.XmlElement[]).map((n: any) => n.toString()).sort();

const [a, b, c] = await Promise.all(users.map(client));
// everybody types 25 paragraphs at the same time
await Promise.all([a, b, c].map(async (cl, k) => { for (let i = 0; i < 25; i++) { cl.doc.transact(() => { const p = new Y.XmlElement("paragraph"); p.insert(0, [new Y.XmlText(`user${k}-line${i}`)]); cl.fragment.insert(cl.fragment.length, [p]); }); if (i % 5 === 0) await sleep(1); } }));
await sleep(800);
const expected = 75;
check("three people type 25 paragraphs each at once: every client ends with all 75", [a, b, c].every((cl) => cl.fragment.length === expected), [a, b, c].map((x) => x.fragment.length).join("/"));
check("all three clients hold exactly the same document", JSON.stringify(texts(a.doc)) === JSON.stringify(texts(b.doc)) && JSON.stringify(texts(b.doc)) === JSON.stringify(texts(c.doc)));
// a fourth tab joins in the middle of more typing and catches up
const late = await client(users[1]);
await Promise.all([a, b].map(async (cl, k) => { for (let i = 0; i < 10; i++) { cl.doc.transact(() => { const p = new Y.XmlElement("paragraph"); p.insert(0, [new Y.XmlText(`late${k}-${i}`)]); cl.fragment.insert(cl.fragment.length, [p]); }); await sleep(2); } }));
await sleep(800);
check("a tab that joins while others type catches up with everything (95 paragraphs)", late.fragment.length === 95 && a.fragment.length === 95, `${late.fragment.length}/${a.fragment.length}`);
// saved state = what everyone sees
await sleep(2600);
const stored = await prisma.note.findUniqueOrThrow({ where: { id: noteId } });
const stateDoc = new Y.Doc(); Y.applyUpdate(stateDoc, new Uint8Array(stored.yjsState!));
check("the saved note holds every paragraph, identical to what the clients see", stateDoc.getXmlFragment("default").length === 95 && JSON.stringify(texts(stateDoc)) === JSON.stringify(texts(a.doc)), String(stateDoc.getXmlFragment("default").length));
const json = JSON.stringify(stored.contentJson);
check("the searchable JSON copy has the text of the paragraphs too", json.includes("user0-line0") && json.includes("user2-line24") && json.includes("late1-9"));

// a viewer cannot edit
const v = await mk("viewer"); await call(users[0], "POST", `/api/projects/${projectId}/members`, { userId: v.id, role: "viewer" });
const vc = await client(v);
vc.doc.transact(() => { const p = new Y.XmlElement("paragraph"); p.insert(0, [new Y.XmlText("viewer-was-here")]); vc.fragment.insert(0, [p]); });
await sleep(500);
check("a viewer's edit is not applied for others", !texts(a.doc).some((t) => t.includes("viewer-was-here")));

[a, b, c, late, vc].forEach((x) => x.s.close());
await flushAllNotes(); hub.close(); await app.close(); await prisma.$disconnect();
report();
process.exit(failures === 0 ? 0 : 1);
