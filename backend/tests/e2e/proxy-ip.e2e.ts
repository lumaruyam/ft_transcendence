// Client address behind a proxy: X-Forwarded-For is believed only from private addresses, so a public peer cannot choose
// its own IP (which would defeat the per-client rate limits) and nginx's real client address is the one the backend sees.
import { check, failures, report, testConfig } from "./helpers.js";
import { buildApp } from "../../src/app.js";

const app = buildApp(testConfig());
app.get("/ip", async (request) => ({ ip: request.ip }));
await app.ready();

const ipSeenBy = async (remoteAddress: string, forwardedFor?: string): Promise<string> =>
	(await app.inject({ method: "GET", url: "/ip", remoteAddress, headers: forwardedFor ? { "x-forwarded-for": forwardedFor } : {} })).json().ip;

check("nginx (private network) forwards the real client", (await ipSeenBy("172.24.0.4", "203.0.113.9")) === "203.0.113.9");
check("nginx without the header: its own address", (await ipSeenBy("172.24.0.4")) === "172.24.0.4");
check("a public peer cannot spoof its address", (await ipSeenBy("198.51.100.7", "6.6.6.6")) === "198.51.100.7");
check("a loopback proxy is trusted", (await ipSeenBy("127.0.0.1", "203.0.113.50")) === "203.0.113.50");

report();
await app.close();
process.exit(failures === 0 ? 0 : 1);
