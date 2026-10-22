// Notifications: who is told and who is not, wording, coalescing, refused actions, inbox endpoints, retention, live delivery over Socket.IO.
import { check, failures, report, sleep } from "./helpers.js";
import { buildApp } from "../../src/app.js";
import { createKanbanHub } from "../../src/modules/kanban/hub.js";
import { prisma } from "../../src/db/prisma/client.js";
import { generateJwt } from "../../src/modules/auth/jwt.service.js";
import { uploadAttachment } from "../../src/modules/attachments/attachments.service.js";
import { saveNoteDoc } from "../../src/modules/notes/notes.service.js";
import { saveWhiteboard } from "../../src/modules/whiteboard/whiteboard.service.js";
import * as Y from "yjs";
import { io } from "socket.io-client";


const app = buildApp({
	nodeEnv: "test", host: "127.0.0.1", port: 0, databaseUrl: process.env.DATABASE_URL!, jwtSecret: "jwt-secret-for-tests",
	oauthGithub: { clientId: "", clientSecret: "", redirectUri: "" }, oauthTokenEncryptionKey: "ab".repeat(32), signupAdminPassword: "",
	gitWebhookSecret: "x", publicApiRateLimitDefault: 100, rateLimit: { globalMax: 10000, globalWindowMs: 60000 },
} as any);
createKanbanHub(app.server);
await app.listen({ port: 0, host: "127.0.0.1" });
const port = (app.server.address() as any).port;

const mk = async (name: string) => {
	const u = await prisma.user.create({ data: { email: `${name}@t.t`, passwordHash: "x", passwordSalt: "x", name } });
	return { ...u, jwt: generateJwt(u.id) };
};
const alice = await mk("Alice"), bob = await mk("Bob"), carol = await mk("Carol"), dave = await mk("Dave");

const call = (as: { jwt: string }, method: string, url: string, body?: unknown) =>
	app.inject({ method: method as any, url, headers: { authorization: `Bearer ${as.jwt}` }, ...(body !== undefined ? { payload: body as any } : {}) });
const notifs = (u: { id: string }, type?: string) => prisma.notification.findMany({ where: { userId: u.id, ...(type ? { type } : {}) }, orderBy: { createdAt: "asc" } });
const count = async (u: { id: string }, type: string) => (await notifs(u, type)).length;
const flush = () => sleep(400); // notifications are sent after the reply

// sockets: Bob and Dave listen
const listen = (u: { jwt: string }) => {
	const events: any[] = [];
	const s = io(`http://127.0.0.1:${port}`, { auth: { token: u.jwt } });
	s.onAny((e: string, d: unknown) => e === "notification" && events.push(d));
	return { s, events };
};
const bobSock = listen(bob), aliceSock = listen(alice), daveSock = listen(dave);
await sleep(800);

// ---- project + members
let r = await call(alice, "POST", "/api/projects", { name: "Apollo" });
const projectId = r.json().project.id;
// Carol is a member before Bob arrives, so that she is one of "the others" who hear about it; flush() makes sure
// her own notification is written before Bob's is computed (notifications are sent after the response).
r = await call(alice, "POST", `/api/projects/${projectId}/members`, { userId: carol.id, role: "viewer" });
await flush();
r = await call(alice, "POST", `/api/projects/${projectId}/members`, { userId: bob.id, role: "member" });
await flush();
check("added member is told (vous a ajouté ...)", (await notifs(bob, "member_added")).some((n) => (n.payload as any).message.startsWith("Alice vous a ajouté au projet « Apollo »")));
check("other members hear who was added", (await notifs(carol, "member_added")).some((n) => (n.payload as any).message.includes("Alice a ajouté Bob")), JSON.stringify((await notifs(carol)).map((n) => (n.payload as any).message)));
check("the actor is never notified of their own actions", (await notifs(alice)).length === 0, String((await notifs(alice)).length));

// ---- kanban
r = await call(alice, "GET", `/api/projects/${projectId}/board`);
const boardId = r.json().id;
r = await call(alice, "POST", "/api/lists", { boardId, title: "À faire", position: 0 });
const list1 = r.json().id;
r = await call(alice, "POST", "/api/lists", { boardId, title: "En cours", position: 1 });
const list2 = r.json().id;
await flush();
check("list created -> members told", (await count(bob, "list_created")) === 2 && (await count(carol, "list_created")) === 2);

r = await call(alice, "POST", "/api/cards", { listId: list1, title: "Écrire le README", position: 0 });
const cardId = r.json().id;
await flush();
const created = (await notifs(bob, "card_created"))[0];
check("card created -> message and in-app url", (created.payload as any).message === "Alice a créé la carte « Écrire le README »" && (created.payload as any).url === `/app/${projectId}` && (created.payload as any).projectName === "Apollo", JSON.stringify(created?.payload));

await call(alice, "PUT", `/api/cards/${cardId}`, { description: "v1" });
await flush();
await call(alice, "PUT", `/api/cards/${cardId}`, { description: "v2" });
await flush();
check("repeated updates are coalesced into one unread notification", (await count(bob, "card_updated")) === 1);
const merged = (await notifs(bob, "card_updated"))[0];
await call(alice, "PUT", `/api/cards/${cardId}`, { position: 3 });
await flush();
check("position-only update is not notified", (await count(bob, "card_updated")) === 1);
await prisma.notification.update({ where: { id: merged.id }, data: { readAt: new Date() } });
await call(alice, "PUT", `/api/cards/${cardId}`, { title: "README final" });
await flush();
check("after it is read, the next update notifies again", (await count(bob, "card_updated")) === 2);

await call(alice, "PUT", `/api/cards/${cardId}/move`, { listId: list1, position: 0 });
await flush();
check("reorder inside the same list is not notified", (await count(bob, "card_moved")) === 0);
await call(alice, "PUT", `/api/cards/${cardId}/move`, { listId: list2, position: 0 });
await flush();
check("move to another list is notified with the list name", (await notifs(bob, "card_moved")).some((n) => (n.payload as any).message === "Alice a déplacé la carte « README final » vers « En cours »"));

r = await call(alice, "POST", `/api/projects/${projectId}/tags`, { name: "Urgent" });
const tagId = r.json().id;
await call(alice, "PUT", `/api/tags/${tagId}`, { name: "Très urgent" });
await call(alice, "PUT", `/api/cards/${cardId}/tags`, { tagIds: [tagId] });
await call(alice, "DELETE", `/api/tags/${tagId}`);
await flush();
check("tag created / updated / deleted and card tags changed are notified", (await count(bob, "tag_created")) === 1 && (await count(bob, "tag_updated")) === 1 && (await count(bob, "tag_deleted")) === 1 && (await count(bob, "card_tags_updated")) === 1);

await call(alice, "PUT", `/api/lists/${list1}`, { title: "Backlog" });
await call(alice, "DELETE", `/api/lists/${list1}`);
await call(alice, "DELETE", `/api/cards/${cardId}`);
await flush();
check("list renamed / deleted and card deleted are notified", (await count(bob, "list_updated")) === 1 && (await count(bob, "list_deleted")) === 1 && (await count(bob, "card_deleted")) === 1);

// a viewer cannot change anything, so nothing may be notified from a refused call
const before = await prisma.notification.count();
r = await call(carol, "POST", "/api/cards", { listId: list2, title: "nope", position: 0 });
await flush();
check("a refused action (viewer) notifies nobody", r.statusCode === 403 && (await prisma.notification.count()) === before, String(r.statusCode));

// ---- notes
r = await call(alice, "POST", `/api/notes/${projectId}`, { title: "Compte rendu" });
const noteId = r.json().note.id;
await call(alice, "PATCH", `/api/notes/${projectId}/${noteId}`, { title: "Compte rendu v2" });
const doc = new Y.Doc();
doc.getXmlFragment("default").insert(0, [new Y.XmlText("hello")]);
await saveNoteDoc(noteId, doc, alice.id);
await saveNoteDoc(noteId, doc, alice.id);
await flush();
check("note created / renamed / edited (coalesced) are notified", (await count(bob, "note_created")) === 1 && (await count(bob, "note_renamed")) === 1 && (await count(bob, "note_updated")) === 1);
check("note notification opens the note", (await notifs(bob, "note_created"))[0] && ((await notifs(bob, "note_created"))[0].payload as any).url === `/app/${projectId}/notes/${noteId}`);
await call(alice, "DELETE", `/api/notes/${projectId}/${noteId}`);
await flush();
check("note deleted is notified", (await count(bob, "note_deleted")) === 1);

// ---- folders + files
r = await call(alice, "POST", `/api/folders/${projectId}`, { name: "Docs" });
const folderId = r.json().folder.id;
await call(alice, "PATCH", `/api/folders/${projectId}/${folderId}`, { name: "Documents" });
const att = await uploadAttachment(alice.id, { projectId, fileName: "plan.txt", fileType: "text/plain", fileBuffer: Buffer.from("hi") });
await flush();
await call(alice, "DELETE", `/api/attachments/${projectId}/${att.id}`);
await call(alice, "DELETE", `/api/folders/${projectId}/${folderId}`);
await flush();
check("folder created / renamed / deleted notified", (await count(bob, "folder_created")) === 1 && (await count(bob, "folder_updated")) === 1 && (await count(bob, "folder_deleted")) === 1);
check("file uploaded / deleted notified", (await count(bob, "file_uploaded")) === 1 && (await count(bob, "file_deleted")) === 1);

// ---- whiteboard
await saveWhiteboard(projectId, alice.id, { appState: {} } as any, []);
await saveWhiteboard(projectId, alice.id, { appState: {} } as any, []);
await flush();
check("whiteboard autosave is coalesced into one notification", (await count(bob, "whiteboard_updated")) === 1);

// ---- public API (card changed with an API key)
r = await call(alice, "POST", `/api/projects/${projectId}/api-keys`, {});
const key = r.json().key ?? r.json().plaintextKey ?? r.json().apiKey;
const keyValue = typeof key === "string" ? key : r.json().plaintextKey;
r = await app.inject({ method: "POST", url: `/api/projects/${projectId}/cards`, headers: { "x-api-key": keyValue }, payload: { listId: list2, title: "Depuis l'API" } });
await flush();
check("card created through the public API is notified (via l'API)", r.statusCode === 201 && (await notifs(bob, "card_created")).some((n) => (n.payload as any).message === "Alice a créé la carte « Depuis l'API » via l'API"), `${r.statusCode} ${r.body}`);

// ---- git webhook messages go through the same channel
// (covered by webhook-e2e: 2 members notified)

// ---- inbox endpoints
r = await call(bob, "GET", "/api/notifications?limit=5");
check("inbox: newest first, limited, with unread total", r.json().notifications.length === 5 && r.json().unreadCount > 5 && r.json().notifications[0].createdAt >= r.json().notifications[4].createdAt, JSON.stringify({ n: r.json().notifications.length, u: r.json().unreadCount }));
const oneId = r.json().notifications[0].id;
r = await call(carol, "PUT", `/api/notifications/${oneId}/read`);
check("cannot read someone else's notification", r.statusCode === 404);
r = await call(bob, "PUT", `/api/notifications/${oneId}/read`);
check("mark one as read", r.statusCode === 204);
const unreadBefore = (await call(bob, "GET", "/api/notifications")).json().unreadCount;
r = await call(bob, "PUT", "/api/notifications/read-all");
const after = (await call(bob, "GET", "/api/notifications")).json();
check("read-all clears the unread counter", r.statusCode === 200 && unreadBefore > 0 && after.unreadCount === 0 && after.notifications.every((n: any) => n.readAt));
check("read-all does not touch other users", (await prisma.notification.count({ where: { userId: carol.id, readAt: null } })) > 0);
await prisma.notification.create({ data: { userId: bob.id, type: "old", payload: {}, readAt: new Date(Date.now() - 40 * 86400000), createdAt: new Date(Date.now() - 40 * 86400000) } });
await call(bob, "GET", "/api/notifications");
check("read notifications older than 30 days are purged", (await count(bob, "old")) === 0);
r = await app.inject({ method: "GET", url: "/api/notifications" });
check("inbox needs authentication", r.statusCode === 401);

// ---- members: role change, removal, join by invite, rename, delete
await call(alice, "POST", `/api/projects/${projectId}/members`, { userId: bob.id, role: "admin" });
await flush();
check("role change tells the person", (await notifs(bob, "member_role")).some((n) => (n.payload as any).message.includes("a changé votre rôle")));
await call(alice, "DELETE", `/api/projects/${projectId}/members/${bob.id}`);
await flush();
check("removed member is told, the others too", (await notifs(bob, "member_removed")).some((n) => (n.payload as any).message === "Alice vous a retiré du projet « Apollo »") && (await notifs(carol, "member_removed")).some((n) => (n.payload as any).message === "Alice a retiré Bob du projet"));
r = await call(alice, "POST", `/api/projects/${projectId}/invites`, { role: "member" });
const token = r.json().token;
r = await call(dave, "POST", `/api/projects/invites/${token}/join`);
await flush();
check("joining by invite tells the project (and not the newcomer)", r.statusCode === 204 && (await notifs(carol, "member_joined")).some((n) => (n.payload as any).message === "Dave a rejoint le projet") && (await count(dave, "member_joined")) === 0);
await call(alice, "PUT", `/api/projects/${projectId}`, { name: "Apollo 2" });
await flush();
check("project renamed is notified", (await count(carol, "project_updated")) === 1);
await call(alice, "DELETE", `/api/projects/${projectId}`);
await flush();
const del = (await notifs(carol, "project_deleted"))[0];
check("project deleted: members told before it vanishes, no link to a dead page", !!del && (del.payload as any).url === null && (del.payload as any).message === "Alice a supprimé le projet « Apollo 2 »", JSON.stringify(del?.payload));

// ---- realtime
check("realtime: Bob received his notifications live", bobSock.events.length > 20, String(bobSock.events.length));
check("realtime: events are the stored rows (id, type, payload)", bobSock.events.every((e) => e.id && e.type && e.payload && e.userId === bob.id));
check("realtime: Alice (the actor) only got what others did (Dave joining)", aliceSock.events.length === 1 && aliceSock.events[0].type === "member_joined", JSON.stringify(aliceSock.events.map((e) => e.type)));
check("realtime: Dave only got what concerns him", daveSock.events.every((e) => e.userId === dave.id));

report();
[bobSock, aliceSock, daveSock].forEach((x) => x.s.close());
await app.close();
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
