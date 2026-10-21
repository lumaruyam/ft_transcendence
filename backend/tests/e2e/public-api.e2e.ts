// Public API: key issuance rules, hash-only storage, authentication, scope, full CRUD with validation, roles through the key owner, rate limiting, revocation, served documentation.
import { check, failures, report } from "./helpers.js";
import { buildApp } from "../../src/app.js";
import { prisma } from "../../src/db/prisma/client.js";
import { generateJwt } from "../../src/modules/auth/jwt.service.js";


const app = buildApp({
	nodeEnv: "test", host: "127.0.0.1", port: 0, databaseUrl: process.env.DATABASE_URL!, jwtSecret: "jwt-secret-for-tests",
	oauthGithub: { clientId: "", clientSecret: "", redirectUri: "" }, oauthTokenEncryptionKey: "ab".repeat(32), signupAdminPassword: "",
	gitWebhookSecret: "x", publicApiRateLimitDefault: 100, rateLimit: { globalMax: 100000, globalWindowMs: 60000 },
} as any);
await app.ready();

const mk = async (name: string) => { const u = await prisma.user.create({ data: { email: `${name}@t.t`, passwordHash: "x", passwordSalt: "x", name } }); return { ...u, jwt: generateJwt(u.id) }; };
const alice = await mk("alice"), bob = await mk("bob");
const jwt = (as: { jwt: string }, method: string, url: string, body?: unknown) => app.inject({ method: method as any, url, headers: { authorization: `Bearer ${as.jwt}` }, ...(body !== undefined ? { payload: body as any } : {}) });
const api = (key: string | null, method: string, url: string, body?: unknown) => app.inject({ method: method as any, url, headers: key ? { "x-api-key": key } : {}, ...(body !== undefined ? { payload: body as any } : {}) });

// two projects for alice, one for bob
const pA = (await jwt(alice, "POST", "/api/projects", { name: "Alpha" })).json().project.id;
const pB = (await jwt(alice, "POST", "/api/projects", { name: "Beta" })).json().project.id;
const pBob = (await jwt(bob, "POST", "/api/projects", { name: "Bobs" })).json().project.id;
const boardA = (await jwt(alice, "GET", `/api/projects/${pA}/board`)).json().id;
const boardB = (await jwt(alice, "GET", `/api/projects/${pB}/board`)).json().id;
const listA = (await jwt(alice, "POST", "/api/lists", { boardId: boardA, title: "L", position: 0 })).json().id;
const listA2 = (await jwt(alice, "POST", "/api/lists", { boardId: boardA, title: "L2", position: 1 })).json().id;
const listB = (await jwt(alice, "POST", "/api/lists", { boardId: boardB, title: "LB", position: 0 })).json().id;

// ---- key issuance (JWT, admin)
let r = await jwt(bob, "POST", `/api/projects/${pA}/api-keys`, {});
check("a non-member cannot issue a key", r.statusCode === 403, String(r.statusCode));
r = await jwt(alice, "POST", `/api/projects/${pA}/api-keys`, { rateLimit: 0 });
check("rateLimit 0 is rejected (400)", r.statusCode === 400);
r = await jwt(alice, "POST", `/api/projects/${pA}/api-keys`, { rateLimit: 100000 });
check("rateLimit above the cap is rejected (400)", r.statusCode === 400);
r = await jwt(alice, "POST", `/api/projects/${pA}/api-keys`, {});
const body = r.json();
const key: string = body.key;
check("admin issues a key: 201, tk_ prefix, plaintext once", r.statusCode === 201 && key.startsWith("tk_") && key.length > 40, JSON.stringify(body).slice(0, 100));
const row = await prisma.apiKey.findFirstOrThrow({ where: { projectId: pA } });
check("only a hash is stored (never the plaintext)", row.keyHash !== key && !JSON.stringify(row).includes(key) && row.keyHash.length === 64);
r = await jwt(alice, "GET", `/api/projects/${pA}/api-keys`);
check("listing keys never shows key material", r.statusCode === 200 && !JSON.stringify(r.json()).includes(key) && !JSON.stringify(r.json()).includes(row.keyHash));

// ---- authentication
r = await api(null, "GET", `/api/projects/${pA}/cards`);
check("no key -> 401 missing_api_key", r.statusCode === 401 && r.json().error === "missing_api_key", r.body);
r = await api("tk_not-a-real-key", "GET", `/api/projects/${pA}/cards`);
check("wrong key -> 401 invalid_api_key", r.statusCode === 401 && r.json().error === "invalid_api_key");
r = await app.inject({ method: "GET", url: `/api/projects/${pA}/cards`, headers: { authorization: `Bearer ${alice.jwt}` } });
check("a JWT is not accepted on the public routes", r.statusCode === 401, String(r.statusCode));

// ---- GET /api/projects: same path, two handlers
r = await api(key, "GET", "/api/projects");
check("GET /api/projects with a project key: only that project", r.statusCode === 200 && r.json().projects.length === 1 && r.json().projects[0].id === pA, r.body);
r = await jwt(alice, "GET", "/api/projects");
check("GET /api/projects without key still serves the JWT route (all projects)", r.statusCode === 200 && r.json().projects.length === 2);

// ---- project scope + isolation
r = await api(key, "GET", `/api/projects/${pB}/cards`);
check("project-scoped key on another project -> 403 api_key_project_mismatch", r.statusCode === 403 && r.json().error === "api_key_project_mismatch", r.body);

// ---- CRUD
r = await api(key, "POST", `/api/projects/${pA}/cards`, { listId: listA, title: "  First card  ", description: "hello" });
check("POST card -> 201, trimmed title, documented shape", r.statusCode === 201 && r.json().card.title === "First card" && r.json().card.projectId === pA && "linkedBranch" in r.json().card && r.json().card.status === "todo", r.body);
const c1 = r.json().card.id;
check("POST validation: missing title -> 400 with details", (await api(key, "POST", `/api/projects/${pA}/cards`, { listId: listA })).statusCode === 400);
check("POST validation: title too long -> 400", (await api(key, "POST", `/api/projects/${pA}/cards`, { listId: listA, title: "x".repeat(201) })).statusCode === 400);
check("POST validation: description not a string -> 400", (await api(key, "POST", `/api/projects/${pA}/cards`, { listId: listA, title: "t", description: 5 })).statusCode === 400);
check("POST validation: body is not an object -> 400", (await app.inject({ method: "POST", url: `/api/projects/${pA}/cards`, headers: { "x-api-key": key, "content-type": "application/json" }, payload: "[]" })).statusCode === 400);
r = await api(key, "POST", `/api/projects/${pA}/cards`, { listId: listB, title: "cross" });
check("POST in a list of another project -> 404 list_not_found (no probing)", r.statusCode === 404 && r.json().error === "list_not_found", r.body);
for (let i = 0; i < 4; i++) await api(key, "POST", `/api/projects/${pA}/cards`, { listId: i % 2 ? listA : listA2, title: `card ${i}` });

r = await api(key, "GET", `/api/projects/${pA}/cards?limit=2&offset=1`);
check("GET cards: pagination (limit/offset/total)", r.statusCode === 200 && r.json().cards.length === 2 && r.json().total === 5 && r.json().limit === 2 && r.json().offset === 1, r.body);
r = await api(key, "GET", `/api/projects/${pA}/cards?listId=${listA2}`);
check("GET cards: filter by listId", r.json().cards.length === 2 && r.json().cards.every((c: any) => c.listId === listA2));
r = await api(key, "GET", `/api/projects/${pA}/cards?status=Done`);
check("GET cards: filter by status", r.statusCode === 200 && r.json().total === 0);
check("GET cards: bad limit -> 400", (await api(key, "GET", `/api/projects/${pA}/cards?limit=0`)).statusCode === 400 && (await api(key, "GET", `/api/projects/${pA}/cards?limit=101`)).statusCode === 400 && (await api(key, "GET", `/api/projects/${pA}/cards?limit=abc`)).statusCode === 400);

r = await api(key, "PUT", `/api/projects/${pA}/cards/${c1}`, { title: "Renamed" });
check("PUT card -> 200, partial update keeps the rest", r.statusCode === 200 && r.json().card.title === "Renamed" && r.json().card.description === "hello", r.body);
check("PUT with nothing to change -> 400", (await api(key, "PUT", `/api/projects/${pA}/cards/${c1}`, {})).statusCode === 400);
const foreign = (await jwt(alice, "POST", "/api/cards", { listId: listB, title: "in beta", position: 0 })).json().id;
check("PUT a card of another project -> 404", (await api(key, "PUT", `/api/projects/${pA}/cards/${foreign}`, { title: "x" })).statusCode === 404);
check("DELETE a card of another project -> 404", (await api(key, "DELETE", `/api/projects/${pA}/cards/${foreign}`)).statusCode === 404);
check("PUT an unknown card -> 404 card_not_found", (await api(key, "PUT", `/api/projects/${pA}/cards/nope`, { title: "x" })).json().error === "card_not_found");
r = await api(key, "DELETE", `/api/projects/${pA}/cards/${c1}`);
check("DELETE card -> 204, gone afterwards", r.statusCode === 204 && (await prisma.card.count({ where: { id: c1 } })) === 0);
check("DELETE twice -> 404", (await api(key, "DELETE", `/api/projects/${pA}/cards/${c1}`)).statusCode === 404);

// ---- roles are enforced through the key's owner
await jwt(alice, "POST", `/api/projects/${pA}/members`, { userId: bob.id, role: "viewer" });
const bobKey = (await jwt(alice, "POST", `/api/projects/${pA}/api-keys`, {})).json().key;
// a key acts as the user who issued it: alice issued this one, so make bob issue his own as admin first
await jwt(alice, "POST", `/api/projects/${pA}/members`, { userId: bob.id, role: "admin" });
const bobOwnKey = (await jwt(bob, "POST", `/api/projects/${pA}/api-keys`, {})).json().key;
await jwt(alice, "POST", `/api/projects/${pA}/members`, { userId: bob.id, role: "viewer" });
r = await api(bobOwnKey, "GET", `/api/projects/${pA}/cards`);
check("viewer's key can read", r.statusCode === 200);
r = await api(bobOwnKey, "POST", `/api/projects/${pA}/cards`, { listId: listA, title: "nope" });
check("viewer's key cannot create (403 insufficient_role)", r.statusCode === 403, r.body);
r = await api(bobOwnKey, "DELETE", `/api/projects/${pA}/cards/${(await prisma.card.findFirstOrThrow({ where: { list: { boardId: boardA } } })).id}`);
check("viewer's key cannot delete (403)", r.statusCode === 403);
await jwt(alice, "DELETE", `/api/projects/${pA}/members/${bob.id}`);
r = await api(bobOwnKey, "GET", `/api/projects/${pA}/cards`);
check("removing the user cuts their key's access at once (403)", r.statusCode === 403, String(r.statusCode));

// ---- rate limiting
const limited = (await jwt(alice, "POST", `/api/projects/${pA}/api-keys`, { rateLimit: 3 })).json().key;
const seen: any[] = [];
for (let i = 0; i < 5; i++) seen.push(await api(limited, "GET", `/api/projects/${pA}/cards`));
check("rate limit: 3 requests pass, the next ones get 429", seen.map((x) => x.statusCode).join() === "200,200,200,429,429", seen.map((x) => x.statusCode).join());
check("rate limit headers on success", seen[0].headers["x-ratelimit-limit"] === "3" && seen[0].headers["x-ratelimit-remaining"] === "2" && !!seen[0].headers["x-ratelimit-reset"] && seen[2].headers["x-ratelimit-remaining"] === "0");
check("429 carries Retry-After and the documented body", Number(seen[3].headers["retry-after"]) > 0 && seen[3].json().error === "rate_limit_exceeded" && seen[3].json().limit === 3 && seen[3].json().retryAfter > 0, seen[3].body);
check("the limit is per key: another key is not affected", (await api(key, "GET", `/api/projects/${pA}/cards`)).statusCode === 200);

// ---- revocation
const keyRow = await prisma.apiKey.findFirstOrThrow({ where: { projectId: pA, userId: alice.id }, orderBy: { createdAt: "asc" } });
r = await jwt(alice, "DELETE", `/api/projects/${pA}/api-keys/${keyRow.id}`);
check("revoke key -> 204", r.statusCode === 204, String(r.statusCode));
check("a revoked key stops working at once (401)", (await api(key, "GET", `/api/projects/${pA}/cards`)).statusCode === 401);
check("revoking an unknown key -> 404", (await jwt(alice, "DELETE", `/api/projects/${pA}/api-keys/${keyRow.id}`)).statusCode === 404);

// ---- documentation
r = await app.inject({ method: "GET", url: "/api/docs" });
check("GET /api/docs is public HTML listing the 5 endpoints", r.statusCode === 200 && /text\/html/.test(String(r.headers["content-type"])) && ["GET", "POST", "PUT", "DELETE"].every((m) => r.body.includes(`>${m}</span>`)) && r.body.includes("/api/projects/{projectId}/cards/{cardId}") && r.body.includes("X-API-Key") && r.body.includes("429"), String(r.statusCode));
check("docs page has no script and no external resource", !/<script/i.test(r.body) && !/https?:\/\/(?!<host>)[^"' ]*\.(js|css)/i.test(r.body));
r = await app.inject({ method: "GET", url: "/api/openapi.json" });
const spec = r.json();
const ops = Object.values(spec.paths).flatMap((p: any) => Object.keys(p));
check("GET /api/openapi.json is a valid-looking OpenAPI 3 with 5 operations and the key scheme", r.statusCode === 200 && spec.openapi.startsWith("3.") && ops.length === 5 && spec.components.securitySchemes.ApiKeyAuth.name === "X-API-Key", JSON.stringify(ops));

report();
await app.close(); await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
