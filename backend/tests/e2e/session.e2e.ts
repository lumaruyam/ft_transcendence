// Sessions and the signup switch: logout revokes every token of the account (all devices), the other routes answer as expected,
// the admin page opens and closes signup, and a closed signup answers 403 while existing accounts can still log in.
import { check, failures, report, testConfig } from "./helpers.js";
import { buildApp } from "../../src/app.js";
import { prisma } from "../../src/db/prisma/client.js";

const ADMIN_PASSWORD = "a-long-admin-pass";
const app = buildApp({ ...testConfig(), signupAdminPassword: ADMIN_PASSWORD });
await app.ready();

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
const me = (token: string) => app.inject({ method: "GET", url: "/api/users/me", headers: bearer(token) });
const login = async (email: string, password: string) => {
	const r = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email, password } });
	return { statusCode: r.statusCode, token: r.json().token as string };
};
const logout = (token?: string) =>
	app.inject({ method: "POST", url: "/api/auth/logout", headers: token === undefined ? {} : bearer(token) });

// ---- sessions
const signup = await app.inject({ method: "POST", url: "/api/auth/signup", payload: { email: "sam@t.t", password: "sessionpass1", name: "Sam" } });
const t1: string = signup.json().token;
check("signup gives a token that works on /me", signup.statusCode === 201 && (await me(t1)).statusCode === 200, signup.body);

let r = await logout(t1);
check("logout with that token: 204", r.statusCode === 204, `${r.statusCode} ${r.body}`);
r = await me(t1);
check("the same token is now rejected: 401 invalid_token", r.statusCode === 401 && r.json().error === "invalid_token", `${r.statusCode} ${r.body}`);

const a = await login("sam@t.t", "sessionpass1");
const b = await login("sam@t.t", "sessionpass1");
check("login again gives a working token", a.statusCode === 200 && (await me(a.token)).statusCode === 200, String(a.statusCode));
check("a second device logs in too and its token works", b.statusCode === 200 && (await me(b.token)).statusCode === 200, String(b.statusCode));
r = await logout(a.token);
check("logout from the first device: 204", r.statusCode === 204, String(r.statusCode));
r = await me(b.token);
check("the token of the second device dies as well (all devices)", r.statusCode === 401 && r.json().error === "invalid_token", `${r.statusCode} ${r.body}`);

const c = await login("sam@t.t", "sessionpass1");
check("after a logout, a new login works again", c.statusCode === 200 && (await me(c.token)).statusCode === 200, String(c.statusCode));

r = await logout();
check("logout with no token: 204", r.statusCode === 204, String(r.statusCode));
r = await logout("not-a-real-token");
check("logout with a garbage token: 204", r.statusCode === 204, String(r.statusCode));
check("...and it revoked nothing: the valid token still works", (await me(c.token)).statusCode === 200);

// ---- admin switch for signup
r = await app.inject({ method: "GET", url: "/api/admin/signup" });
check("the admin page answers 200 html", r.statusCode === 200 && String(r.headers["content-type"]).startsWith("text/html"), `${r.statusCode} ${r.headers["content-type"]}`);

const adminSwitch = (payload: Record<string, unknown>) => app.inject({ method: "POST", url: "/api/admin/signup", payload });
r = await adminSwitch({ password: "wrong-admin-pass", open: false });
check("admin: wrong password: 401", r.statusCode === 401, String(r.statusCode));
r = await adminSwitch({ open: false });
check("admin: missing password: 401", r.statusCode === 401, String(r.statusCode));
r = await adminSwitch({ password: ADMIN_PASSWORD, open: false });
check("admin: right password closes signup: 200 {open:false}", r.statusCode === 200 && r.json().open === false, `${r.statusCode} ${r.body}`);

r = await app.inject({ method: "GET", url: "/api/auth/signup-status" });
check("signup-status says closed", r.statusCode === 200 && r.json().open === false, r.body);
r = await app.inject({ method: "POST", url: "/api/auth/signup", payload: { email: "late@t.t", password: "sessionpass1", name: "Late" } });
check("signup while closed: 403 signup_disabled", r.statusCode === 403 && r.json().error === "signup_disabled", `${r.statusCode} ${r.body}`);
check("...and no account was created", (await prisma.user.findUnique({ where: { email: "late@t.t" } })) === null);

const existing = await login("sam@t.t", "sessionpass1");
check("an existing user can still log in while signup is closed", existing.statusCode === 200, String(existing.statusCode));

r = await adminSwitch({ password: ADMIN_PASSWORD, open: true });
check("admin: right password reopens signup: 200 {open:true}", r.statusCode === 200 && r.json().open === true, `${r.statusCode} ${r.body}`);
r = await app.inject({ method: "GET", url: "/api/auth/signup-status" });
check("signup-status says open", r.statusCode === 200 && r.json().open === true, r.body);
r = await app.inject({ method: "POST", url: "/api/auth/signup", payload: { email: "late@t.t", password: "sessionpass1", name: "Late" } });
check("signup works again after reopening", r.statusCode === 201 && typeof r.json().token === "string", `${r.statusCode} ${r.body}`);

await app.close();
report();
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
