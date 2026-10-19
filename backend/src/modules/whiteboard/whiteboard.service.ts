//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: loading and autosaving a project's Excalidraw scene, stored as JSON so it stays re-editable. Saves are merged element by element.
import type { Whiteboard, WhiteboardFile, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";
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
	return prisma.$transaction(async (tx) => {
		//lock the row so two simultaneous saves merge one after the other instead of both reading the old scene
		await tx.$queryRaw`SELECT id FROM whiteboards WHERE project_id = ${projectId} FOR UPDATE`;
		const existing = await tx.whiteboard.findUnique({ where: { projectId } });
		const stored = readStoredElements(existing?.sceneJson);
		const merged = mergeScene(stored, elements);
		if (merged.length > MAX_ELEMENTS_PER_SCENE) throw new SceneTooLargeError();

		const scene = { ...sceneJson, elements: merged } as Prisma.InputJsonObject;
		return tx.whiteboard.upsert({//=update+insert
			where: { projectId },
			update: { sceneJson: scene, updatedBy: userId },
			create: { projectId, sceneJson: scene, updatedBy: userId },
		});
	});
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
