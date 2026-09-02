import { Prisma } from "@prisma/client";
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

export async function updateList(id: string, input:  Prisma.ListUncheckedUpdateInput) {
	try 
	{
		const list = await prisma.list.update({
			where: { id },
			data: input,
		});
		return list;
	}
	catch (err)
	{
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
			return null;
		throw err;
	}
}


export async function deleteList(id: string) {
	try {
		await prisma.list.delete({ where: { id } });
		return true;
	}
	catch (err)
	{
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
			return false;
		throw err;
	}
}
