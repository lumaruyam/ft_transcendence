import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";

export async function createBoard(input: { projectId: string; title: string}) {
	const board = await prisma.board.create({
		data: {
			projectId: input.projectId,
			title: input.title,
		},
	});
	return board;
}


const BOARD_WITH_LISTS_AND_CARDS = {
	lists: {
		orderBy: { position: "asc" as const },
		include: {
			cards: {
				orderBy: { position: "asc" as const },
			},
		},
	},
};

// creates a board for the project if none exists yet
// null return means the project does not exist, this is only an existence check not a permission check
export async function getOrCreateBoardForProject(projectId: string) {
	const existing = await prisma.board.findFirst({
		where: { projectId },
		include: BOARD_WITH_LISTS_AND_CARDS,
	});
	if (existing) {
		return existing;
	}

	try {
		const created = await prisma.board.create({
			data: { projectId, title: "BoardTitle" }, // TODO: allow real board and project names
		});
		return { ...created, lists: [] };
	} catch (err) {
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
			return null;
		}
		throw err;
	}
}

export async function getBoard(id: string) {
	const board = await prisma.board.findUnique({
		where: { id },
		include: {
			lists: {
				orderBy: { position: "asc" },
				include: {
					cards: {
						orderBy: { position: "asc" },
					},
				},
			},
		},
	});
	return board;
}


// returns the deleted row so callers can broadcast to its project room, null if not found
export async function deleteBoard(id: string) {
	try {
		const deleted = await prisma.board.delete({ where: { id } });
		return deleted;
	}
	catch (err)
	{
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
			return null;
		throw err;
	}
}

// resolves a board id to its project id, used to pick the broadcast room
export async function getProjectIdForBoard(boardId: string): Promise<string | null> {
	const board = await prisma.board.findUnique({
		where: { id: boardId },
		select: { projectId: true },
	});
	return board?.projectId ?? null;
}