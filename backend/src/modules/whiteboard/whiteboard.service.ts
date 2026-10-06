//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: loading and autosaving a project's Excalidraw scene, stored as JSON so it stays re-editable. Last save wins.
import type { Whiteboard, Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";

//load a project's saved scene, or null if nobody has drawn yet.
export async function getWhiteboard(projectId: string): Promise<Whiteboard | null> {
	return prisma.whiteboard.findUnique({ where: { projectId } });
}

//save a debounced scene from the Excalidraw canvas.
//The route validates that sceneJson is a JSON object and answers 400 if it isn't — the parameter
//type records that, so there is no second runtime check here.
export async function saveWhiteboard(
	projectId: string,
	userId: string,
	sceneJson: Prisma.InputJsonObject,
): Promise<Whiteboard> {
	//update the project's scene if it exists, otherwise create it
	return prisma.whiteboard.upsert({//=update+insert
		where: { projectId },
		update: { sceneJson, updatedBy: userId },
		create: { projectId, sceneJson, updatedBy: userId },
	});
}