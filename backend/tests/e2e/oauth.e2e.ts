// GitHub OAuth against a stubbed GitHub: state bound to the browser, private emails, unverified emails, linking, encrypted token, refusal, link flow and identity conflicts.
import { check, failures, report } from "./helpers.js";
import Fastify from "fastify";
import { prisma } from "../../src/db/prisma/client.js";
import { registerAuthRoutes } from "../../src/modules/auth/auth.routes.js";
import { initJwtService, generateJwt, validateJwt } from "../../src/modules/auth/jwt.service.js";
import { initOAuthService, getDecryptedAccessToken } from "../../src/modules/auth/oauth.service.js";
import { initTokenCrypto } from "../../src/modules/auth/tokenCrypto.js";

initJwtService("jwt-secret-for-tests");
initTokenCrypto("ab".repeat(32));
initOAuthService({ github: { clientId: "cid", clientSecret: "csecret", redirectUri: "https://localhost:8443/api/auth/oauth/github/callback" }, stateSecret: "jwt-secret-for-tests" });


// ---- fake GitHub (replaces global fetch for github.com / api.github.com) ----
type Gh = { id: number; login: string; name: string | null; avatar: string | null; emails: { email: string; primary: boolean; verified: boolean }[] };
let gh: Gh = { id: 1, login: "octo", name: "Octo Cat", avatar: "https://a/1.png", emails: [{ email: "Octo@Example.com", primary: true, verified: true }] };
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init?: any) => {
	const url = String(input);
	const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });
	if (url === "https://github.com/login/oauth/access_token") return json({ access_token: `gho_token_for_${gh.id}` });
	if (url === "https://api.github.com/user") return json({ id: gh.id, login: gh.login, name: gh.name, avatar_url: gh.avatar, email: null });
	if (url === "https://api.github.com/user/emails") return json(gh.emails);
	return realFetch(input, init);
}) as typeof fetch;

const app = Fastify();
await app.register(registerAuthRoutes, { prefix: "/api/auth" });

const cookieOf = (res: any) => String(res.headers["set-cookie"] ?? "");
const nonceOf = (res: any) => cookieOf(res).match(/ft_oauth_state=([0-9a-f]+)/)?.[1];
const fragment = (res: any) => new URLSearchParams(String(res.headers.location).split("#")[1] ?? "");

async function startLogin() {
	const res = await app.inject({ method: "GET", url: "/api/auth/oauth/github/redirect" });
	const state = new URL(String(res.headers.location)).searchParams.get("state")!;
	return { res, state, nonce: nonceOf(res)! };
}
const callback = (state: string, nonce: string | undefined, extra = "code=abc") =>
	app.inject({ method: "GET", url: `/api/auth/oauth/github/callback?${extra}&state=${encodeURIComponent(state)}`, headers: nonce ? { cookie: `ft_oauth_state=${nonce}` } : {} });

// 1. redirect
let { res, state, nonce } = await startLogin();
const loc = new URL(String(res.headers.location));
check("redirect goes to github authorize", res.statusCode === 302 && loc.origin + loc.pathname === "https://github.com/login/oauth/authorize");
check("authorize url has client_id, scope user:email, state", loc.searchParams.get("client_id") === "cid" && loc.searchParams.get("scope")!.includes("user:email") && !!state);
check("state cookie is HttpOnly, SameSite=Lax, Secure (https app), scoped", /HttpOnly/.test(cookieOf(res)) && /SameSite=Lax/.test(cookieOf(res)) && /Secure/.test(cookieOf(res)) && /Path=\/api\/auth\/oauth/.test(cookieOf(res)));

// 2. CSRF protections
res = await callback(state, undefined);
check("callback without state cookie -> OAuthStateError", fragment(res).get("error") === "OAuthStateError", String(res.headers.location));
res = await callback(state, "0".repeat(32));
check("callback with another browser's cookie -> OAuthStateError", fragment(res).get("error") === "OAuthStateError");
res = await callback(state + "x", nonce);
check("tampered state -> OAuthStateError", fragment(res).get("error") === "OAuthStateError");
check("no user created by rejected callbacks", (await prisma.user.count()) === 0);

// 3. denied consent
res = await callback(state, nonce, "error=access_denied");
check("consent refused -> OAuthAccessDeniedError", fragment(res).get("error") === "OAuthAccessDeniedError", String(res.headers.location));

// 4. GitHub never creates an account: an unlinked identity is refused
({ state, nonce } = await startLogin());
res = await callback(state, nonce);
check("unlinked GitHub identity -> OAuthNoLinkedAccountError, no token", fragment(res).get("error") === "OAuthNoLinkedAccountError" && !fragment(res).get("token"), String(res.headers.location));
check("no user created by GitHub login", (await prisma.user.count()) === 0);

// 5. the signed-in user links GitHub from the settings, then GitHub signs in that account
const octo = await prisma.user.create({ data: { email: "octo@example.com", passwordHash: "x", passwordSalt: "x", name: "Octo" } });
res = await app.inject({ method: "POST", url: "/api/auth/oauth/github/link", headers: { authorization: `Bearer ${generateJwt(octo.id)}` } });
res = await callback(new URL(res.json().url).searchParams.get("state")!, nonceOf(res));
check("link callback -> #linked=1, no new token", fragment(res).get("linked") === "1" && !fragment(res).get("token"), String(res.headers.location));
({ state, nonce } = await startLogin());
res = await callback(state, nonce);
const token = fragment(res).get("token");
check("linked identity -> token of the linked account", !!token && validateJwt(token).userId === octo.id, String(res.headers.location));
check("state cookie cleared after callback", /Max-Age=0/.test(cookieOf(res)));
const account = await prisma.oAuthAccount.findFirstOrThrow({ where: { userId: octo.id } });
check("GitHub token stored encrypted, decryptable", account.accessToken !== "gho_token_for_1" && (await getDecryptedAccessToken(octo.id)) === "gho_token_for_1");
({ state, nonce } = await startLogin());
res = await callback(state, nonce);
check("second login -> same user, no duplicate", (await prisma.user.count()) === 1 && validateJwt(fragment(res).get("token")!).userId === octo.id);

// 6. an existing account with the same e-mail is NOT taken over by a GitHub login (local signup does not verify e-mails)
const pwd = await prisma.user.create({ data: { email: "pwd@example.com", passwordHash: "x", passwordSalt: "x", name: "Pwd" } });
gh = { id: 2, login: "pwd", name: null, avatar: null, emails: [{ email: "PWD@example.com", primary: true, verified: true }] };
({ state, nonce } = await startLogin());
res = await callback(state, nonce);
check("same verified e-mail but not linked -> refused, nothing attached", fragment(res).get("error") === "OAuthNoLinkedAccountError" && (await prisma.oAuthAccount.count({ where: { userId: pwd.id } })) === 0 && (await prisma.user.count()) === 2);

// 7. link flow
res = await app.inject({ method: "POST", url: "/api/auth/oauth/github/link" });
check("link without JWT -> 401", res.statusCode === 401);
const jwtPwd = generateJwt(pwd.id);
res = await app.inject({ method: "POST", url: "/api/auth/oauth/github/link", headers: { authorization: `Bearer ${jwtPwd}` } });
const linkUrl = new URL(res.json().url);
check("link with JWT -> authorize url + state cookie", res.statusCode === 200 && linkUrl.hostname === "github.com" && !!nonceOf(res));
// the logged-in user links a GitHub account whose email differs from the account email
gh = { id: 4, login: "different", name: "Diff", avatar: null, emails: [{ email: "unrelated@x.io", primary: true, verified: true }] };
res = await callback(linkUrl.searchParams.get("state")!, nonceOf(res));
check("link callback -> #linked=1, no new token", fragment(res).get("linked") === "1" && !fragment(res).get("token"), String(res.headers.location));
check("GitHub identity attached to the signed-in user (email differs)", (await getDecryptedAccessToken(pwd.id)) === "gho_token_for_4" && (await prisma.user.count({ where: { email: "unrelated@x.io" } })) === 0);
({ state, nonce } = await startLogin());
res = await callback(state, nonce);
check("login with that GitHub identity -> the account with the other e-mail", validateJwt(fragment(res).get("token")!).userId === pwd.id, String(res.headers.location));
// linking an identity that belongs to somebody else
const other = await prisma.user.create({ data: { email: "other@example.com", passwordHash: "x", passwordSalt: "x", name: "Other" } });
res = await app.inject({ method: "POST", url: "/api/auth/oauth/github/link", headers: { authorization: `Bearer ${generateJwt(other.id)}` } });
const nonceE = nonceOf(res);
const stateE = new URL(res.json().url).searchParams.get("state")!;
res = await callback(stateE, nonceE);
check("GitHub identity already owned by another user -> OAuthAccountConflictError", fragment(res).get("error") === "OAuthAccountConflictError", String(res.headers.location));

report();
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
