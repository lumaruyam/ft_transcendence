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


export async function deleteBoard(id: string) {
	try {
		await prisma.board.delete({ where: { id } });
		return true;
	}
	catch (err)
	{
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
			return false;
		throw err;
	}
}