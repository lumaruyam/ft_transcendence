import { prisma } from "../../db/prisma/client.js";

export async function createList(input: { boardId: string; title: string; position: number}) {
	const list = await prisma.list.create({
		data: {
			boardId: input.boardId,
			title: input.title,
			position: input.position,
		},
	});
	return list;
}

export async function getList(id: string) {
	const list = await prisma.list.findUnique({
		where: { id },
		include: {
			cards: {
				orderBy: { position: "asc" },
			},
		},
	});
	return list;
}

export async function updateList(): Promise<void> {

}


export async function deleteList(): Promise<void> {

}
