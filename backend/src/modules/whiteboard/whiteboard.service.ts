//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: loading and autosaving a project's Excalidraw scene, stored as JSON so it stays re-editable. Saves are merged element by element.
import { Prisma, type Whiteboard, type WhiteboardFile } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";
import { notifyProject } from "../notifications/notifications.service.js";
import { MAX_ELEMENTS_PER_SCENE, mergeScene, validateElements, type SceneElement } from "./whiteboard.elements.js";

//load a project's saved scene, or null if nobody has drawn yet.
export async function getWhiteboard(projectId: string): Promise<Whiteboard | null> {
	return prisma.whiteboard.findUnique({ where: { projectId } });
}

//save a debounced scene from the Excalidraw canvas.
//Every member autosaves, so the scene is merged into what is stored (rather than replacing it): a client that
//is behind cannot wipe out a newer change. Erased shapes stay as tombstones for a while, see whiteboard.elements.ts.
//The route validates that sceneJson is a JSON object and answers 400 if it isn't.
export async function saveWhiteboard(
	projectId: string,
	userId: string,
	sceneJson: Prisma.InputJsonObject,
	elements: SceneElement[],
): Promise<Whiteboard> {
	const whiteboard = await queuedPerProject(projectId, () => mergeAndStore(projectId, userId, sceneJson, elements));
	//the board autosaves while someone draws: the notification is refreshed, not repeated
	void notifyProject({
		projectId,
		actorId: userId,
		type: "whiteboard_updated",
		text: "a modifié le tableau blanc",
		entityId: whiteboard.id,
		path: `/app/${projectId}/whiteboard`,
		coalesce: true,
	});
	return whiteboard;
}

//Read the stored scene, merge the incoming elements into it and write it back. Two saves running together must
//merge one after the other instead of both reading the old scene. Saves of the same project are first queued in
//this process, which removes the contention of one backend (every autosave of a busy board lands at once). The
//transaction is also Serializable, so a second backend instance stays correct: Postgres aborts the one that lost
//the race (P2034, or P2002 when both tried to create the first row) and it is run again on the new state, after
//a short random wait. No row lock is used because there is nothing to lock yet on the very first save.
const SAVE_MAX_ATTEMPTS = 8;
const saveQueues = new Map<string, Promise<unknown>>();

function queuedPerProject<T>(projectId: string, task: () => Promise<T>): Promise<T> {
	const run = (saveQueues.get(projectId) ?? Promise.resolve()).then(task, task);
	const tail = run.catch(() => undefined);
	saveQueues.set(projectId, tail);
	void tail.then(() => {
		if (saveQueues.get(projectId) === tail) saveQueues.delete(projectId);
	});
	return run;
}

async function mergeAndStore(
	projectId: string,
	userId: string,
	sceneJson: Prisma.InputJsonObject,
	elements: SceneElement[],
): Promise<Whiteboard> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await prisma.$transaction(
				async (tx) => {
					const existing = await tx.whiteboard.findUnique({ where: { projectId } });
					const merged = mergeScene(readStoredElements(existing?.sceneJson), elements);
					if (merged.length > MAX_ELEMENTS_PER_SCENE) throw new SceneTooLargeError();

					const scene = { ...sceneJson, elements: merged } as Prisma.InputJsonObject;
					return tx.whiteboard.upsert({//=update+insert
						where: { projectId },
						update: { sceneJson: scene, updatedBy: userId },
						create: { projectId, sceneJson: scene, updatedBy: userId },
					});
				},
				{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
			);
		} catch (err) {
			const conflict = err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2034" || err.code === "P2002");
			if (!conflict || attempt >= SAVE_MAX_ATTEMPTS) throw err;
			await new Promise((resolve) => setTimeout(resolve, Math.random() * 20 * attempt));
		}
	}
}

export class SceneTooLargeError extends Error {}

function readStoredElements(sceneJson: Prisma.JsonValue | undefined): SceneElement[] {
	if (typeof sceneJson !== "object" || sceneJson === null || Array.isArray(sceneJson)) return [];
	return validateElements(sceneJson.elements, MAX_ELEMENTS_PER_SCENE) ?? [];
}

//store one image of the board. Idempotent: the same fileId is the same content, so an existing row is left as is.
export async function saveWhiteboardFile(
	projectId: string,
	fileId: string,
	mimeType: string,
	dataUrl: string,
): Promise<void> {
	await prisma.whiteboardFile.upsert({
		where: { projectId_fileId: { projectId, fileId } },
		update: {},
		create: { projectId, fileId, mimeType, dataUrl },
	});
}

export async function getWhiteboardFile(projectId: string, fileId: string): Promise<WhiteboardFile | null> {
	return prisma.whiteboardFile.findUnique({ where: { projectId_fileId: { projectId, fileId } } });
}
