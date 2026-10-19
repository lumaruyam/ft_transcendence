// Git webhooks: signature checks, the push / pull request / merge lifecycle with its regression guards, audit log, notifications.
import { check, failures, report } from "./helpers.js";
import Fastify from "fastify";
import fastifyRawBody from "fastify-raw-body";
import crypto from "node:crypto";
import { prisma } from "../../src/db/prisma/client.js";
import { registerGitWebhookRoutes } from "../../src/modules/git/webhook.routes.js";
import { listProjectWebhookEvents } from "../../src/modules/git/webhookLog.service.js";

const SECRET = "test-secret";
process.env.GIT_WEBHOOK_SECRET = SECRET;


const app = Fastify();
await app.register(fastifyRawBody, { field: "rawBody", global: false, encoding: "utf8", runFirst: true });
await app.register(registerGitWebhookRoutes, { prefix: "/api" });

const REPO = "https://github.com/Acme/App";
const repository = { html_url: REPO, full_name: "Acme/App", default_branch: "main" };

async function send(event: string, body: object, secret = SECRET) {
	const raw = JSON.stringify(body);
	const sig = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
	return app.inject({
		method: "POST", url: "/api/webhooks/git", payload: raw,
		headers: { "content-type": "application/json", "x-hub-signature-256": sig, "x-github-event": event },
	});
}
const pr = (action: string, merged: boolean, base = "main", branch = "feature/x") => ({
	action, repository,
	pull_request: { title: "My PR", body: null, html_url: "https://github.com/Acme/App/pull/7", merged, head: { ref: branch }, base: { ref: base } },
});
const card = () => prisma.card.findUniqueOrThrow({ where: { id: cardId }, include: { gitLink: true } });

// seed
const u1 = await prisma.user.create({ data: { email: "a@t.t", passwordHash: "x", passwordSalt: "x", name: "A" } });
const u2 = await prisma.user.create({ data: { email: "b@t.t", passwordHash: "x", passwordSalt: "x", name: "B" } });
const project = await prisma.project.create({ data: { name: "P", ownerId: u1.id } });
await prisma.projectMember.createMany({ data: [{ projectId: project.id, userId: u1.id, role: "admin" }, { projectId: project.id, userId: u2.id, role: "member" }] });
const board = await prisma.board.create({ data: { projectId: project.id, title: "B" } });
const list = await prisma.list.create({ data: { boardId: board.id, title: "L", position: 0 } });
const created = await prisma.card.create({ data: { listId: list.id, title: "C", position: 0 } });
const cardId = created.id;
await prisma.gitLink.create({ data: { cardId, repoUrl: "https://github.com/acme/app", branchName: "feature/x", prStatus: "none" } });
await prisma.card.update({ where: { id: cardId }, data: { linkedBranch: "feature/x" } });

// 1. signature
let r = await send("push", { ref: "refs/heads/feature/x", repository, commits: [] }, "wrong-secret");
check("bad signature -> 401", r.statusCode === 401, String(r.statusCode));
r = await app.inject({ method: "POST", url: "/api/webhooks/git", payload: "{}", headers: { "content-type": "application/json", "x-github-event": "push" } });
check("missing signature -> 401", r.statusCode === 401, String(r.statusCode));
check("rejected requests are not logged", (await prisma.webhookEvent.count()) === 0);

// 2. ping + unrelated push
r = await send("ping", { zen: "hi", repository });
check("ping -> 200", r.statusCode === 200);
r = await send("push", { ref: "refs/heads/other", repository, commits: [] });
check("push on unlinked branch -> 200, card untouched", r.statusCode === 200 && (await card()).status === "todo");
r = await send("push", { ref: "refs/tags/v1", repository, commits: [] });
check("tag push ignored", (await card()).status === "todo");
r = await send("push", { ref: "refs/heads/feature/x", deleted: true, repository, commits: [] });
check("branch deletion ignored", (await card()).status === "todo");

// 3. lifecycle
r = await send("push", { ref: "refs/heads/feature/x", repository, commits: [{ id: "1", message: "m", author: { name: "a", email: "a@a" } }] });
check("push on linked branch -> In progress", (await card()).status === "In progress", (await card()).status);

r = await send("pull_request", pr("opened", false));
let c = await card();
check("PR opened -> PR pending", c.status === "PR pending", c.status);
check("PR url stored on card", c.linkedPrUrl === "https://github.com/Acme/App/pull/7");
check("git link prStatus = open", c.gitLink?.prStatus === "open");
check("PR opened notifies both members", (await prisma.notification.count()) === 2, String(await prisma.notification.count()));

r = await send("push", { ref: "refs/heads/feature/x", repository, commits: [] });
check("push after PR does not regress status", (await card()).status === "PR pending", (await card()).status);

r = await send("pull_request", pr("closed", false));
c = await card();
check("PR closed unmerged -> back to In progress", c.status === "In progress" && c.gitLink?.prStatus === "closed", `${c.status}/${c.gitLink?.prStatus}`);

r = await send("pull_request", pr("reopened", false));
check("PR reopened -> PR pending", (await card()).status === "PR pending");

r = await send("pull_request", pr("closed", true, "dev"));
check("merge into non-default branch ignored", (await card()).status === "PR pending", (await card()).status);

r = await send("pull_request", pr("closed", true, "main"));
c = await card();
check("merge into main -> Done", c.status === "Done" && c.gitLink?.prStatus === "merged", `${c.status}/${c.gitLink?.prStatus}`);

r = await send("push", { ref: "refs/heads/feature/x", repository, commits: [] });
check("push after Done does not regress status", (await card()).status === "Done");

// 4. audit log
const total = await prisma.webhookEvent.count();
const unprocessed = await prisma.webhookEvent.count({ where: { processedAt: null } });
check("every valid webhook logged", total === 12, String(total));
check("every handled webhook marked processed", unprocessed === 0, String(unprocessed));
const events = await listProjectWebhookEvents(project.id);
check("project audit view lists events (case-insensitive repo match)", events.length === 12, String(events.length));
check("audit view omits payload", !("payload" in events[0]));
check("audit view empty for a project without git links", (await listProjectWebhookEvents(u1.id)).length === 0);

report();
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
