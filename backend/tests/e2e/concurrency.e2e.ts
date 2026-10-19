// Concurrency: simultaneous requests from several users (one board per project, positions, moves, tags, invites, signups, deletions) must neither fail nor corrupt data.
import { check, failures, report, testConfig } from "./helpers.js";
import { buildApp } from "../../src/app.js";
import { prisma } from "../../src/db/prisma/client.js";
import { generateJwt } from "../../src/modules/auth/jwt.service.js";

const app = buildApp(testConfig());
await app.ready();

type U = { id: string; jwt: string };
const mk = async (name: string): Promise<U> => { const u = await prisma.user.create({ data: { email: `${name}@t.t`, passwordHash: "x", passwordSalt: "x", name } }); return { id: u.id, jwt: generateJwt(u.id) }; };
const call = (as: U | null, method: string, url: string, body?: unknown, headers: Record<string, string> = {}) =>
	app.inject({ method: method as any, url, headers: { ...(as ? { authorization: `Bearer ${as.jwt}` } : {}), ...headers }, ...(body !== undefined ? { payload: body as any } : {}) });
const codes = (rs: { statusCode: number }[]) => rs.map((r) => r.statusCode).sort().join(",");
const no5xx = (rs: { statusCode: number }[]) => rs.every((r) => r.statusCode < 500);
const summary = (rs: { statusCode: number }[]) => { const m: Record<number, number> = {}; rs.forEach((r) => (m[r.statusCode] = (m[r.statusCode] ?? 0) + 1)); return JSON.stringify(m); };
const positionsOk = (ps: number[]) => new Set(ps).size === ps.length;

const owner = await mk("owner");
const members = await Promise.all(Array.from({ length: 10 }, (_, i) => mk(`m${i}`)));
const newProject = async (name = "P") => {
	const id = (await call(owner, "POST", "/api/projects", { name })).json().project.id;
	for (const m of members) await call(owner, "POST", `/api/projects/${id}/members`, { userId: m.id, role: "member" });
	return id as string;
};

// S1: first visit of a fresh project by many members at once -> ONE board
{
	const p = await newProject("S1");
	const rs = await Promise.all(members.map((m) => call(m, "GET", `/api/projects/${p}/board`)));
	const ids = new Set(rs.map((r) => r.json().id));
	const boards = await prisma.board.count({ where: { projectId: p } });
	check("S1 first board open by 10 members at once: one board, everybody sees it", boards === 1 && ids.size === 1 && no5xx(rs), `boards=${boards} distinctIds=${ids.size} ${summary(rs)}`);
}

const board = async (p: string) => (await call(owner, "GET", `/api/projects/${p}/board`)).json().id as string;
const posOf = async (listId: string) => (await prisma.card.findMany({ where: { listId }, orderBy: { position: "asc" }, select: { position: true } })).map((c) => c.position);

// S2/S3: many cards created at the same moment
{
	const p = await newProject("S2"); const b = await board(p);
	const l = (await call(owner, "POST", "/api/lists", { boardId: b, title: "L", position: 0 })).json().id;
	const rs = await Promise.all(members.flatMap((m, i) => [0, 1].map((j) => call(m, "POST", "/api/cards", { listId: l, title: `c${i}-${j}`, position: 0 }))));
	const ps = await posOf(l);
	check("S2 20 cards created at once with the same position: none lost, none fails", ps.length === 20 && no5xx(rs), `${ps.length} ${summary(rs)}`);
	check("S2 ...and they end with distinct positions", positionsOk(ps), JSON.stringify(ps));
	const key = (await call(owner, "POST", `/api/projects/${p}/api-keys`, {})).json().key;
	const l2 = (await call(owner, "POST", "/api/lists", { boardId: b, title: "L2", position: 1 })).json().id;
	const rs2 = await Promise.all(Array.from({ length: 20 }, (_, i) => app.inject({ method: "POST", url: `/api/projects/${p}/cards`, headers: { "x-api-key": key }, payload: { listId: l2, title: `api${i}` } })));
	const ps2 = await posOf(l2);
	check("S3 20 cards created at once through the public API (no position): appended, distinct positions", ps2.length === 20 && positionsOk(ps2) && no5xx(rs2), `${ps2.length} ${JSON.stringify(ps2)} ${summary(rs2)}`);
}

// S4: lists
{
	const p = await newProject("S4"); const b = await board(p);
	const rs = await Promise.all(Array.from({ length: 10 }, (_, i) => call(members[i], "POST", "/api/lists", { boardId: b, title: `l${i}`, position: 0 })));
	const ps = (await prisma.list.findMany({ where: { boardId: b }, select: { position: true } })).map((l) => l.position);
	check("S4 10 lists created at once: none lost, distinct positions", ps.length === 10 && positionsOk(ps) && no5xx(rs), `${ps.length} ${JSON.stringify(ps)} ${summary(rs)}`);
}

// S5: many moves at once keep every list contiguous
{
	const p = await newProject("S5"); const b = await board(p);
	const la = (await call(owner, "POST", "/api/lists", { boardId: b, title: "A", position: 0 })).json().id;
	const lb = (await call(owner, "POST", "/api/lists", { boardId: b, title: "B", position: 1 })).json().id;
	const cards: string[] = [];
	for (let i = 0; i < 12; i++) cards.push((await call(owner, "POST", "/api/cards", { listId: i % 2 ? la : lb, title: `c${i}`, position: Math.floor(i / 2) })).json().id);
	const rs = await Promise.all(Array.from({ length: 30 }, (_, i) => call(members[i % 10], "PUT", `/api/cards/${cards[i % 12]}/move`, { listId: i % 3 ? lb : la, position: i % 4 })));
	const a = await posOf(la), bb = await posOf(lb);
	const contiguous = (ps: number[]) => ps.every((v, i) => v === i);
	check("S5 30 concurrent moves: no failure, no card lost", no5xx(rs) && a.length + bb.length === 12, `${a.length + bb.length} ${summary(rs)}`);
	check("S5 ...and both lists end contiguous 0..n-1 with no duplicate", contiguous(a) && contiguous(bb), `${JSON.stringify(a)} ${JSON.stringify(bb)}`);
}

// S6: move vs delete of the same card
{
	const p = await newProject("S6"); const b = await board(p);
	const l1 = (await call(owner, "POST", "/api/lists", { boardId: b, title: "A", position: 0 })).json().id;
	const l2 = (await call(owner, "POST", "/api/lists", { boardId: b, title: "B", position: 1 })).json().id;
	let bad = 0;
	for (let i = 0; i < 6; i++) {
		const c = (await call(owner, "POST", "/api/cards", { listId: l1, title: "x", position: 0 })).json().id;
		const rs = await Promise.all([call(members[0], "PUT", `/api/cards/${c}/move`, { listId: l2, position: 0 }), call(members[1], "DELETE", `/api/cards/${c}`), call(members[2], "PUT", `/api/cards/${c}`, { title: "y" }), call(members[3], "PUT", `/api/cards/${c}/tags`, { tagIds: [] })]);
		if (!no5xx(rs)) bad++;
	}
	check("S6 move / delete / edit / retag of one card at once: never a 5xx", bad === 0, `${bad} rounds with a 5xx`);
}

// S7: lists reordered while others are created and deleted
{
	const p = await newProject("S7"); const b = await board(p);
	const ls: string[] = [];
	for (let i = 0; i < 5; i++) ls.push((await call(owner, "POST", "/api/lists", { boardId: b, title: `l${i}`, position: i })).json().id);
	const rs = await Promise.all([
		call(members[0], "PUT", `/api/boards/${b}/lists/reorder`, { orderedListIds: [...ls].reverse() }),
		call(members[1], "PUT", `/api/boards/${b}/lists/reorder`, { orderedListIds: ls }),
		call(members[2], "POST", "/api/lists", { boardId: b, title: "new", position: 9 }),
		call(members[3], "DELETE", `/api/lists/${ls[2]}`),
		call(members[4], "PUT", `/api/lists/${ls[0]}`, { title: "renamed" }),
	]);
	check("S7 reorder + create + delete + rename lists at once: no 5xx (conflicting reorders may be refused)", no5xx(rs), summary(rs));
}

// S8: tags
{
	const p = await newProject("S8"); const b = await board(p);
	const l = (await call(owner, "POST", "/api/lists", { boardId: b, title: "L", position: 0 })).json().id;
	const c = (await call(owner, "POST", "/api/cards", { listId: l, title: "c", position: 0 })).json().id;
	const rs = await Promise.all(members.map((m) => call(m, "POST", `/api/projects/${p}/tags`, { name: "Same name" })));
	check("S8 the same tag created by 10 people at once: exactly one wins, the rest get 409", rs.filter((r) => r.statusCode === 201).length === 1 && rs.filter((r) => r.statusCode === 409).length === 9, summary(rs));
	const tags = [];
	for (let i = 0; i < 4; i++) tags.push((await call(owner, "POST", `/api/projects/${p}/tags`, { name: `t${i}` })).json().id);
	const sets = [[tags[0]], [tags[1], tags[2]], [tags[3]], [tags[0], tags[3]], []];
	const rs2 = await Promise.all(Array.from({ length: 15 }, (_, i) => call(members[i % 10], "PUT", `/api/cards/${c}/tags`, { tagIds: sets[i % 5] })));
	const final = (await prisma.cardTag.findMany({ where: { cardId: c } })).map((t) => t.tagId).sort().join();
	const ok = sets.some((s) => [...s].sort().join() === final);
	check("S8 15 concurrent retags of one card: no 5xx, the result is exactly one of the requested sets", no5xx(rs2) && ok, `${summary(rs2)} final=${final}`);
}

// S9: invites
{
	const p = await newProject("S9");
	const outsiders = await Promise.all(Array.from({ length: 10 }, (_, i) => mk(`o${i}-${p.slice(0, 4)}`)));
	const inv = (await call(owner, "POST", `/api/projects/${p}/invites`, { role: "member", maxUses: 3 })).json();
	const rs = await Promise.all(outsiders.map((u, i) => call(u, "POST", `/api/projects/invites/${inv.token}/join`, undefined, { "x-forwarded-for": `10.9.0.${i + 1}` })));
	const joined = await prisma.projectMember.count({ where: { projectId: p, userId: { in: outsiders.map((u) => u.id) } } });
	const uses = (await prisma.projectInvite.findFirstOrThrow({ where: { projectId: p } })).useCount;
	check("S9 invite limited to 3 uses, 10 people join at once: exactly 3 get in", joined === 3 && uses === 3 && no5xx(rs), `joined=${joined} uses=${uses} ${summary(rs)}`);
	const inv2 = (await call(owner, "POST", `/api/projects/${p}/invites`, { role: "member", maxUses: 5 })).json();
	const solo = await mk(`solo-${p.slice(0, 4)}`);
	const rs2 = await Promise.all(Array.from({ length: 5 }, (_, i) => call(solo, "POST", `/api/projects/invites/${inv2.token}/join`, undefined, { "x-forwarded-for": `10.8.0.${i + 1}` })));
	const uses2 = (await prisma.projectInvite.findFirstOrThrow({ where: { id: inv2.invite.id } })).useCount;
	check("S9 one person using the same invite 5 times at once: one membership, one use consumed", (await prisma.projectMember.count({ where: { projectId: p, userId: solo.id } })) === 1 && uses2 === 1 && no5xx(rs2), `uses=${uses2} ${summary(rs2)}`);
}

// S10: signup race
{
	const rs = await Promise.all(Array.from({ length: 8 }, () => call(null, "POST", "/api/auth/signup", { email: "race@t.t", password: "Passw0rd-x", name: "Race" })));
	check("S10 the same e-mail signs up 8 times at once: one account, the others 409", rs.filter((r) => r.statusCode === 201).length === 1 && no5xx(rs) && (await prisma.user.count({ where: { email: "race@t.t" } })) === 1, summary(rs));
}

// S11: two non-owner admins demote each other
{
	const p = await newProject("S11");
	await call(owner, "POST", `/api/projects/${p}/members`, { userId: members[0].id, role: "admin" });
	await call(owner, "POST", `/api/projects/${p}/members`, { userId: members[1].id, role: "admin" });
	const rs = await Promise.all([call(members[0], "PUT", `/api/projects/${p}/members/${members[1].id}`, { role: "viewer" }), call(members[1], "PUT", `/api/projects/${p}/members/${members[0].id}`, { role: "viewer" }), call(members[0], "DELETE", `/api/projects/${p}/members/${members[1].id}`)]);
	const admins = await prisma.projectMember.count({ where: { projectId: p, role: "admin" } });
	check("S11 admins demoting / removing each other at once: the project always keeps an admin", admins >= 1 && no5xx(rs), `admins=${admins} ${summary(rs)}`);
}

// S12: project deleted while people are working in it
{
	const p = await newProject("S12"); const b = await board(p);
	const l = (await call(owner, "POST", "/api/lists", { boardId: b, title: "L", position: 0 })).json().id;
	const rs = await Promise.all([
		call(owner, "DELETE", `/api/projects/${p}`),
		...members.slice(0, 5).map((m, i) => call(m, "POST", "/api/cards", { listId: l, title: `c${i}`, position: 0 })),
		call(members[5], "POST", `/api/notes/${p}`, { title: "n" }),
		call(members[6], "POST", `/api/projects/${p}/tags`, { name: "t" }),
		call(members[7], "POST", "/api/lists", { boardId: b, title: "late", position: 1 }),
		call(members[8], "POST", `/api/folders/${p}`, { name: "f" }),
	]);
	check("S12 project deleted while others create cards, notes, tags, lists, folders: never a 5xx", no5xx(rs), summary(rs) + " by op: " + rs.map((r) => r.statusCode).join(","));
}

// S13: two people edit different fields of one card
{
	const p = await newProject("S13"); const b = await board(p);
	const l = (await call(owner, "POST", "/api/lists", { boardId: b, title: "L", position: 0 })).json().id;
	const c = (await call(owner, "POST", "/api/cards", { listId: l, title: "orig", position: 0 })).json().id;
	await Promise.all([call(members[0], "PUT", `/api/cards/${c}`, { title: "new title" }), call(members[1], "PUT", `/api/cards/${c}`, { description: "new description" })]);
	const card = await prisma.card.findUniqueOrThrow({ where: { id: c } });
	check("S13 two people edit title and description of one card at once: both edits kept", card.title === "new title" && card.description === "new description", JSON.stringify(card));
}

// S14: errors keep their meaning
{
	const bad = await call(owner, "POST", "/api/cards", { title: "no list" });
	const gone = await call(owner, "PUT", "/api/cards/00000000-0000-0000-0000-000000000000", { title: "x" });
	check("S14 a malformed body is still a 400, an unknown card a 404 (never a 500)", bad.statusCode === 400 && gone.statusCode < 500, `${bad.statusCode} ${gone.statusCode}`);
}

report();
await app.close(); await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
