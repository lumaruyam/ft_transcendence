import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma/client.js";

// position is optional: callers that don't care (the public API) get the card appended at the end of the list
export async function createCard(input: { listId: string; title: string; description?: string; position?: number}) {
	const position = input.position ?? await prisma.card.count({ where: { listId: input.listId } });
	const card = await prisma.card.create({
		data: {
			listId: input.listId,
			title: input.title,
			description: input.description,
			position,
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

// returns the deleted row so callers can resolve its project room, null if not found
export async function deleteCard(id: string) {
	try {
		const deleted = await prisma.card.delete({ where: { id } });
		return deleted;
	}
	catch (err)
	{
		if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")
			return null;
		throw err;
	}
}