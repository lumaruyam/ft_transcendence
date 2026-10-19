// Whiteboard: many concurrent saves (including the very first one) keep every element.
import { check, failures, report } from "./helpers.js";
import { prisma } from "../../src/db/prisma/client.js";
import { saveWhiteboard } from "../../src/modules/whiteboard/whiteboard.service.js";

const u = await prisma.user.create({ data: { email: `wb${Date.now()}@t.t`, passwordHash: "x", passwordSalt: "x", name: "W" } });
const project = await prisma.project.create({ data: { name: "P", ownerId: u.id } });
const el = (id: string) => ({ id, type: "rectangle", version: 1, versionNonce: 1 });
const ids = async () => ((await prisma.whiteboard.findUniqueOrThrow({ where: { projectId: project.id } })).sceneJson as any).elements.map((e: any) => e.id) as string[];


// 1. no row yet: 12 saves race to create it
const first = await Promise.allSettled(Array.from({ length: 12 }, (_, i) => saveWhiteboard(project.id, u.id, { appState: {} } as any, [el(`a${i}`)])));
const rejected = first.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
check("12 concurrent first saves: none fails", rejected.length === 0, rejected.map((r) => String(r.reason).slice(0, 120)).join(" | "));
let got = await ids();
check("12 concurrent first saves: every element is kept", got.length === 12, `${got.length}`);

// 2. existing row: 20 saves in parallel, each adds one element
const second = await Promise.allSettled(Array.from({ length: 20 }, (_, i) => saveWhiteboard(project.id, u.id, { appState: {} } as any, [el(`b${i}`)])));
const rej2 = second.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
check("20 concurrent saves on an existing board: none fails", rej2.length === 0, rej2.map((r) => String(r.reason).slice(0, 120)).join(" | "));
got = await ids();
check("20 concurrent saves: no element lost (32 total)", got.length === 32 && new Set(got).size === 32, `${got.length}`);

report();
await prisma.$disconnect();
process.exit(failures === 0 ? 0 : 1);
