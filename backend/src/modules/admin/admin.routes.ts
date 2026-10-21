// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the admin page that opens/closes signup. It is protected by SIGNUP_ADMIN_PASSWORD (.env), not by
// a user account, so it still works when nobody can sign up. Without that variable the endpoint answers 404.

import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { isSignupOpen, setSignupOpen } from "../auth/signupGate.js";

// 5 tries a minute per client address: the password is the only thing standing between the internet and the switch
const ADMIN_RATE_LIMIT = { max: 5, timeWindow: "1 minute" } as const;

const PAGE = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Inscriptions</title>
<style>body{font-family:system-ui,sans-serif;max-width:26rem;margin:4rem auto;padding:0 1rem}
input,button{font:inherit;padding:.6rem;width:100%;box-sizing:border-box;margin-top:.5rem}
button{cursor:pointer}#state{font-weight:700}#msg{min-height:1.5rem;margin-top:1rem}</style></head>
<body><h1>Inscriptions</h1>
<p>État actuel : <span id="state">…</span></p>
<form id="f"><input id="pw" type="password" autocomplete="current-password" placeholder="Mot de passe admin" required>
<button type="submit" id="toggle">…</button></form><p id="msg" role="status"></p>
<script src="/api/admin/signup.js"></script></body></html>`;

const SCRIPT = `(() => {
	const state = document.getElementById("state"), toggle = document.getElementById("toggle");
	const pw = document.getElementById("pw"), msg = document.getElementById("msg");
	let open = true;
	const render = () => { state.textContent = open ? "ouvertes" : "fermées"; toggle.textContent = open ? "Fermer les inscriptions" : "Ouvrir les inscriptions"; };
	fetch("/api/auth/signup-status").then((r) => r.json()).then((s) => { open = s.open; render(); }).catch(() => { msg.textContent = "Serveur injoignable."; });
	document.getElementById("f").addEventListener("submit", async (e) => {
		e.preventDefault();
		msg.textContent = "";
		try {
			const r = await fetch("/api/admin/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw.value, open: !open }) });
			if (r.status === 429) msg.textContent = "Trop de tentatives, patientez une minute.";
			else if (r.status === 401) msg.textContent = "Mot de passe incorrect.";
			else if (!r.ok) msg.textContent = "Action impossible.";
			else { open = (await r.json()).open; render(); pw.value = ""; msg.textContent = "Enregistré."; }
		} catch { msg.textContent = "Serveur injoignable."; }
	});
	render();
})();`;

function passwordMatches(given: unknown, expected: string): boolean {
	if (typeof given !== "string") return false;
	// hashing first gives both sides the same length, which timingSafeEqual requires, and hides the real length
	const a = createHash("sha256").update(given).digest();
	const b = createHash("sha256").update(expected).digest();
	return timingSafeEqual(a, b);
}

export async function registerAdminRoutes(app: FastifyInstance, opts: { signupAdminPassword: string }): Promise<void> {
	if (!opts.signupAdminPassword) return;

	app.get("/signup", async (_request, reply) => {
		reply.header("Cache-Control", "no-store").type("text/html; charset=utf-8").send(PAGE);
	});
	app.get("/signup.js", async (_request, reply) => {
		reply.header("Cache-Control", "no-store").type("application/javascript; charset=utf-8").send(SCRIPT);
	});
	app.post("/signup", { config: { rateLimit: ADMIN_RATE_LIMIT } }, async (request, reply) => {
		const body = request.body as { password?: unknown; open?: unknown } | undefined;
		if (!passwordMatches(body?.password, opts.signupAdminPassword)) {
			request.log.warn("admin signup switch: wrong password");
			reply.code(401).send({ error: "unauthorized" });
			return;
		}
		if (typeof body?.open !== "boolean") {
			reply.code(400).send({ error: "invalid_input" });
			return;
		}
		await setSignupOpen(body.open);
		request.log.warn({ open: body.open }, "signup switched by admin");
		reply.send({ open: await isSignupOpen() });
	});
}
