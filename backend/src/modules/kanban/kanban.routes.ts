// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: Fastify route handlers for boards/lists/cards CRUD. Calls into Track 2 Person B's
// broadcast.ts after each mutation to notify connected clients over Socket.IO.
import { Prisma } from "@prisma/client";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../permissions/permissions.middleware.js";
import { createBoard, getBoard, deleteBoard } from "./board.service.js";
import { createList, getList, updateList, deleteList, reorderLists } from "./list.service.js";
import { createCard, getCard, updateCard, deleteCard } from "./card.service.js";

export function registerKanbanRoutes(app: FastifyInstance): void {
  app.post("/boards", { preHandler: requireAuth }, createBoardHandler);
  app.get("/boards/:id", { preHandler: requireAuth }, getBoardHandler);
  app.delete("/boards/:id", { preHandler: requireAuth }, deleteBoardHandler);

  app.post("/lists", { preHandler: requireAuth }, createListHandler);
  app.get("/lists/:id", { preHandler: requireAuth }, getListHandler);
  app.put("/lists/:id", { preHandler: requireAuth }, updateListHandler);
  app.delete("/lists/:id", { preHandler: requireAuth }, deleteListHandler);
  app.put("/boards/:boardId/lists/reorder", { preHandler: requireAuth }, reorderListsHandler);

  app.post("/cards", { preHandler: requireAuth }, createCardHandler);
  app.get("/cards/:id", { preHandler: requireAuth }, getCardHandler);
  app.put("/cards/:id", { preHandler: requireAuth }, updateCardHandler);
  app.delete("/cards/:id", { preHandler: requireAuth }, deleteCardHandler);
}

// createBoardHandler creates a board within a project.
async function createBoardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = request.body as { projectId: string; title: string}; // TODO: replace with proper fastify schema validation
  const board = await createBoard(body);
  // TODO(Track 2 Person B): broadcast "board_created" { board } to the project's room
  reply.code(201).send(board);
}

// getBoardHandler fetches a board with its lists/cards for initial render.
async function getBoardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string};
  const board = await getBoard(id);

  if (!board) {
    reply.code(404).send({ error: "Board not found" });
    return;
  }
  reply.send(board);
}

// deleteBoardHandler deletes a board.
async function deleteBoardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string };
  const deleted = await deleteBoard(id);

  if (!deleted) {
    reply.code(404).send({ error: "Board not found" });
    return;
  }
  // TODO(Track 2 Person B): broadcast "board_deleted" { id } to the project's room
  reply.code(204).send();
}

// createListHandler creates a new list/column on a board.
async function createListHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = request.body as { boardId: string; title: string; position: number}; // TODO: replace with proper fastify schema validation
  const list = await createList(body);
  // TODO(Track 2 Person B): broadcast "list_created" { list } to the board's room
  reply.code(201).send(list);
}

// getListHandler fetches a list with its cards for additionnal info.
async function getListHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string};
  const list = await getList(id);

  if (!list) {
    reply.code(404).send({ error: "List not found" });
    return;
  }
  reply.send(list);
}

// updateListHandler renames/repositions a list.
async function updateListHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string };
  const body = request.body as  Prisma.ListUncheckedUpdateInput; // TODO: replace with proper fastify schema validation

  const list = await updateList(id, body);
  if (!list)
  {
    reply.code(404).send({ error: "List not found" });
    return;
  }
  // TODO(Track 2 Person B): broadcast "list_updated" { list } to the board's room
  reply.send(list);
}

// deleteListHandler removes a list.
async function deleteListHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string };
  const deleted = await deleteList(id);

  if (!deleted) {
    reply.code(404).send({ error: "List not found" });
    return;
  }
  // TODO(Track 2 Person B): broadcast "list_deleted" { id } to the board's room
  reply.code(204).send();
}

// reorderListsHandler persists a new list order after drag-and-drop.
async function reorderListsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { boardId } = request.params as { boardId: string };
  const body = request.body as { orderedListIds: string[] }; // TODO: replace with proper fastify schema validation

  const success = await reorderLists(body.orderedListIds);

  if (!success) {
    reply.code(404).send({ error: "One or more lists not found" });
    return;
  }
  // TODO(Track 2 Person B): broadcast "lists_reordered" { boardId, orderedListIds } to the board's room
  reply.code(204).send();
}

// createCardHandler creates a card in a list.
async function createCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = request.body as {listId: string; title: string; description: string; position: number}; // TODO: replace with proper fastify schema validation
  const card = await createCard(body);
  // TODO(Track 2 Person B): broadcast "card_created" { card } to the board's room
  reply.code(201).send(card);
}

// getCardHandler fetches a card for additionnal info.
async function getCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string};
  const card = await getCard(id);

  if (!card) {
    reply.code(404).send({ error: "Card not found" });
    return;
  }
  reply.send(card);
}

// updateCardHandler edits a card's fields.
async function updateCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string };
  const body = request.body as Prisma.CardUncheckedUpdateInput; // TODO: replace with proper fastify schema validation

  const card = await updateCard(id, body);
  if (!card) {
    reply.code(404).send({ error: "Card not found" });
    return;
  }
  // TODO(Track 2 Person B): broadcast "card_updated" { card } to the board's room
  reply.send(card);
}

// deleteCardHandler removes a card.
async function deleteCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = request.params as { id: string };
  const deleted = await deleteCard(id);

  if (!deleted) {
    reply.code(404).send({ error: "Card not found" });
    return;
  }
  // TODO(Track 2 Person B): broadcast "card_deleted" { id } to the board's room
  reply.code(204).send();
}
