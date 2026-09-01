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

export async function updateCard(): Promise<void> {

}

export async function deleteCard(): Promise<void> {

}