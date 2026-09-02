import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";

export async function createCard(input: { listId: string; title: string; description?: string; position: number}) {
	const card = await prisma.card.create({
		data: {
			listId: input.listId,
			title: input.title,
			description: input.description,
			position: input.position,
		}
	});
	return card;
}

export async function getCard(id: string) {
	const card = await prisma.card.findUnique({
		where: { id },
	});
	return card;
}

export async function updateCard(id: string, input: Prisma.CardUncheckedUpdateInput) {
	try 
	{
		const card = await prisma.card.update({
			where: { id },
			data: input,
		});
		return card;
	}
	catch (err)
	{
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
			return null;
		throw err;
	}
}

export async function deleteCard(id: string) {
	try {
		await prisma.card.delete({ where: { id } });
		return true;
	}
	catch (err)
	{
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
			return false;
		throw err;
	}
}