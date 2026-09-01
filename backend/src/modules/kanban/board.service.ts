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


export async function getBoard(): Promise<void> {

}


export async function deleteBoard(): Promise<void> {

}