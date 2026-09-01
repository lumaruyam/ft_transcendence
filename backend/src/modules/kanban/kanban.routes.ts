// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: Fastify route handlers for boards/lists/cards CRUD. Calls into Track 2 Person B's
// broadcast.ts after each mutation to notify connected clients over Socket.IO.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../permissions/permissions.middleware.js";
import { createBoard, getBoard, deleteBoard } from "./board.service.js";
import { createList, updateList, deleteList } from "./list.service.js";
import { createCard, updateCard, deleteCard } from "./card.service.js";

export function registerKanbanRoutes(app: FastifyInstance): void {
  app.post("/boards", { preHandler: requireAuth }, createBoardHandler);
  app.get("/boards/:id", { preHandler: requireAuth }, getBoardHandler);
  app.delete("/boards/:id", { preHandler: requireAuth }, deleteBoardHandler);

  app.post("/lists", { preHandler: requireAuth }, createListHandler);
  app.put("/lists/:id", { preHandler: requireAuth }, updateListHandler);
  app.delete("/lists/:id", { preHandler: requireAuth }, deleteListHandler);
  app.put("/boards/:boardId/lists/reorder", { preHandler: requireAuth }, reorderListsHandler);

  app.post("/cards", { preHandler: requireAuth }, createCardHandler);
  app.put("/cards/:id", { preHandler: requireAuth }, updateCardHandler);
  app.put("/cards/:id/move", { preHandler: requireAuth }, moveCardHandler);
  app.delete("/cards/:id", { preHandler: requireAuth }, deleteCardHandler);
}

// createBoardHandler creates a board within a project.
async function createBoardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = request.body as { projectId: string; title: string}; // TODO: replace with proper fastify schema validation 
  const board = await createBoard(body);
  reply.code(201).send(board);
}

// getBoardHandler fetches a board with its lists/cards for initial render.
async function getBoardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call getBoard(request.params.id); 404 if null
}

// deleteBoardHandler deletes a board.
async function deleteBoardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call deleteBoard(request.params.id) (broadcasts "board_deleted" internally)
}

// createListHandler creates a new list/column on a board.
async function createListHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = request.body as { boardId: string; title: string; position: number}; // TODO: replace with proper fastify schema validation 
  const list = await createList(body);
  reply.code(201).send(list);
}

// updateListHandler renames/repositions a list.
async function updateListHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: decode body { title?, position? } → call updateList(request.params.id, input); broadcast "list_updated"
}

// deleteListHandler removes a list.
async function deleteListHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call deleteList(request.params.id) (broadcasts "list_deleted" internally)
}

// reorderListsHandler persists a new list order after drag-and-drop.
async function reorderListsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: decode body { orderedListIds: string[] } → call reorderLists(request.params.boardId, orderedListIds)
}

// createCardHandler creates a card in a list.
async function createCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const body = request.body as {listId: string; title: string; description: string; position: number}; // TODO: replace with proper fastify schema validation
  const card = await createCard(body);
  reply.code(201).send(card);
}

// updateCardHandler edits a card's fields.
async function updateCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: decode body { title?, description?, assignee? } → call updateCard(request.params.id, input)
}

// moveCardHandler relocates a card to a new list/position (drag-and-drop).
async function moveCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: decode body { newListId, newPosition } → call moveCard(request.params.id, newListId, newPosition)
}

// deleteCardHandler removes a card.
async function deleteCardHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // TODO: call deleteCard(request.params.id) (broadcasts "card_deleted" internally)
}
