// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: Fastify route handlers for boards/lists/cards CRUD. Calls into Track 2 Person B's
// broadcast.ts after each mutation to notify connected clients over Socket.IO.
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../permissions/permissions.middleware.js";
import {
  createBoard,
  getBoard,
  getOrCreateBoardForProject,
  deleteBoard,
  getProjectIdForBoard,
} from "./board.service.js";
import {
  createList,
  getList,
  updateList,
  deleteList,
  reorderLists,
  getProjectIdForList,
} from "./list.service.js";
import { createCard, getCard, updateCard, deleteCard } from "./card.service.js";
import { broadcastToProject } from "./broadcast.js";
import {
  createBoardSchema,
  boardIdParamSchema,
  projectIdParamSchema,
  createListSchema,
  listIdParamSchema,
  updateListSchema,
  reorderListsSchema,
  createCardSchema,
  cardIdParamSchema,
  updateCardSchema,
} from "./kanban.schemas.js";

export async function registerKanbanRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { projectId: string; title: string } }>(
    "/boards",
    { preHandler: requireAuth, schema: createBoardSchema },
    createBoardHandler
  );
  app.get<{ Params: { id: string } }>(
    "/boards/:id",
    { preHandler: requireAuth, schema: boardIdParamSchema },
    getBoardHandler
  );
  app.delete<{ Params: { id: string } }>(
    "/boards/:id",
    { preHandler: requireAuth, schema: boardIdParamSchema },
    deleteBoardHandler
  );
  app.get<{ Params: { projectId: string } }>(
    "/projects/:projectId/board",
    { preHandler: requireAuth, schema: projectIdParamSchema },
    getBoardForProjectHandler
  );

  app.post<{ Body: { boardId: string; title: string; position: number } }>(
    "/lists",
    { preHandler: requireAuth, schema: createListSchema },
    createListHandler
  );
  app.get<{ Params: { id: string } }>(
    "/lists/:id",
    { preHandler: requireAuth, schema: listIdParamSchema },
    getListHandler
  );
  app.put<{ Params: { id: string }; Body: { title?: string; position?: number } }>(
    "/lists/:id",
    { preHandler: requireAuth, schema: updateListSchema },
    updateListHandler
  );
  app.delete<{ Params: { id: string } }>(
    "/lists/:id",
    { preHandler: requireAuth, schema: listIdParamSchema },
    deleteListHandler
  );
  app.put<{ Params: { boardId: string }; Body: { orderedListIds: string[] } }>(
    "/boards/:boardId/lists/reorder",
    { preHandler: requireAuth, schema: reorderListsSchema },
    reorderListsHandler
  );

  app.post<{ Body: { listId: string; title: string; description?: string; position: number } }>(
    "/cards",
    { preHandler: requireAuth, schema: createCardSchema },
    createCardHandler
  );
  app.get<{ Params: { id: string } }>(
    "/cards/:id",
    { preHandler: requireAuth, schema: cardIdParamSchema },
    getCardHandler
  );
  app.put<{
    Params: { id: string };
    Body: { title?: string; description?: string; position?: number };
  }>("/cards/:id", { preHandler: requireAuth, schema: updateCardSchema }, updateCardHandler);
  app.delete<{ Params: { id: string } }>(
    "/cards/:id",
    { preHandler: requireAuth, schema: cardIdParamSchema },
    deleteCardHandler
  );
}

// createBoardHandler creates a board within a project.
async function createBoardHandler(
  request: FastifyRequest<{ Body: { projectId: string; title: string } }>,
  reply: FastifyReply
): Promise<void> {
  const board = await createBoard(request.body);
  broadcastToProject(board.projectId, { type: "board_created", payload: board });
  reply.code(201).send(board);
}

// getBoardHandler fetches a board with its lists/cards for initial render.
async function getBoardHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params;
  const board = await getBoard(id);

  if (!board) {
    reply.code(404).send({ error: "Board not found" });
    return;
  }
  reply.send(board);
}

// fetches or creates the project board, the url only carries a project id not a board id
async function getBoardForProjectHandler(
  request: FastifyRequest<{ Params: { projectId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { projectId } = request.params;
  const board = await getOrCreateBoardForProject(projectId);

  if (!board) {
    reply.code(404).send({ error: "Project not found" });
    return;
  }
  reply.send(board);
}

// deleteBoardHandler deletes a board.
async function deleteBoardHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params;
  const deleted = await deleteBoard(id);

  if (!deleted) {
    reply.code(404).send({ error: "Board not found" });
    return;
  }
  broadcastToProject(deleted.projectId, { type: "board_deleted", payload: { id } });
  reply.code(204).send();
}

// createListHandler creates a new list/column on a board.
async function createListHandler(
  request: FastifyRequest<{ Body: { boardId: string; title: string; position: number } }>,
  reply: FastifyReply
): Promise<void> {
  const list = await createList(request.body);
  const projectId = await getProjectIdForBoard(list.boardId);
  if (projectId) {
    broadcastToProject(projectId, { type: "list_created", payload: list });
  }
  reply.code(201).send(list);
}

// getListHandler fetches a list with its cards for additionnal info.
async function getListHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params;
  const list = await getList(id);

  if (!list) {
    reply.code(404).send({ error: "List not found" });
    return;
  }
  reply.send(list);
}

// updateListHandler renames/repositions a list.
async function updateListHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: { title?: string; position?: number } }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params;

  const list = await updateList(id, request.body);
  if (!list)
  {
    reply.code(404).send({ error: "List not found" });
    return;
  }
  const projectId = await getProjectIdForBoard(list.boardId);
  if (projectId) {
    broadcastToProject(projectId, { type: "list_updated", payload: list });
  }
  reply.send(list);
}

// deleteListHandler removes a list.
async function deleteListHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params;
  const deleted = await deleteList(id);

  if (!deleted) {
    reply.code(404).send({ error: "List not found" });
    return;
  }
  const projectId = await getProjectIdForBoard(deleted.boardId);
  if (projectId) {
    broadcastToProject(projectId, { type: "list_deleted", payload: { id } });
  }
  reply.code(204).send();
}

// reorderListsHandler persists a new list order after drag-and-drop.
async function reorderListsHandler(
  request: FastifyRequest<{ Params: { boardId: string }; Body: { orderedListIds: string[] } }>,
  reply: FastifyReply
): Promise<void> {
  const { boardId } = request.params;

  const success = await reorderLists(request.body.orderedListIds);

  if (!success) {
    reply.code(404).send({ error: "One or more lists not found" });
    return;
  }
  const projectId = await getProjectIdForBoard(boardId);
  if (projectId) {
    broadcastToProject(projectId, {
      type: "lists_reordered",
      payload: { boardId, orderedListIds: request.body.orderedListIds },
    });
  }
  reply.code(204).send();
}

// createCardHandler creates a card in a list.
async function createCardHandler(
  request: FastifyRequest<{
    Body: { listId: string; title: string; description?: string; position: number };
  }>,
  reply: FastifyReply
): Promise<void> {
  const card = await createCard(request.body);
  const projectId = await getProjectIdForList(card.listId);
  if (projectId) {
    broadcastToProject(projectId, { type: "card_created", payload: card });
  }
  reply.code(201).send(card);
}

// getCardHandler fetches a card for additionnal info.
async function getCardHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params;
  const card = await getCard(id);

  if (!card) {
    reply.code(404).send({ error: "Card not found" });
    return;
  }
  reply.send(card);
}

// updateCardHandler edits a card's fields.
async function updateCardHandler(
  request: FastifyRequest<{
    Params: { id: string };
    Body: { title?: string; description?: string; position?: number };
  }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params;

  const card = await updateCard(id, request.body);
  if (!card) {
    reply.code(404).send({ error: "Card not found" });
    return;
  }
  const projectId = await getProjectIdForList(card.listId);
  if (projectId) {
    broadcastToProject(projectId, { type: "card_updated", payload: card });
  }
  reply.send(card);
}

// deleteCardHandler removes a card.
async function deleteCardHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { id } = request.params;
  const deleted = await deleteCard(id);

  if (!deleted) {
    reply.code(404).send({ error: "Card not found" });
    return;
  }
  const projectId = await getProjectIdForList(deleted.listId);
  if (projectId) {
    broadcastToProject(projectId, { type: "card_deleted", payload: { id } });
  }
  reply.code(204).send();
}
