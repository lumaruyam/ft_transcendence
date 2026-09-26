//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: loading and autosaving a project's Excalidraw scene, stored as JSON so it stays re-editable. Last save wins.
import type { Whiteboard, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";

//load a project's saved scene, or null if nobody has drawn yet.
export async function getWhiteboard(projectId: string): Promise<Whiteboard | null> {
	return prisma.whiteboard.findUnique({ where: { projectId } });
}

//save a debounced scene from the Excalidraw canvas.
export async function saveWhiteboard(
	projectId: string,
	userId: string,
	sceneJson: unknown,
): Promise<Whiteboard> {
	if (typeof sceneJson !== "object" || sceneJson === null || Array.isArray(sceneJson)) {
		throw new Error("sceneJson must be a JSON object");
	}//as means i'm sure for type of sceneJson; InputJsonObject passed sceneJson to schema.prisma(sceneJson:Json)
	const scene = sceneJson as Prisma.InputJsonObject;

	//update the project's scene if it exists, otherwise create it
	return prisma.whiteboard.upsert({//=update+insert
		where: { projectId },
		update: { sceneJson: scene, updatedBy: userId },
		create: { projectId, sceneJson: scene, updatedBy: userId },
	});
}