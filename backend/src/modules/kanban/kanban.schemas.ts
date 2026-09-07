// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: Fastify JSON Schema definitions used to validate boards/lists/cards route
// params and bodies (see kanban.routes.ts).
import type { FastifySchema } from "fastify";

// idParamSchema validates a single :id route param as a UUID.
const idParamSchema = {
  type: "object",
  required: ["id"],
  additionalProperties: false,
  properties: {
    id: { type: "string", format: "uuid" },
  },
} as const;

export const createBoardSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["projectId", "title"],
    additionalProperties: false,
    properties: {
      projectId: { type: "string", format: "uuid" },
      title: { type: "string", minLength: 1 },
    },
  },
};

export const boardIdParamSchema: FastifySchema = { params: idParamSchema };

export const createListSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["boardId", "title", "position"],
    additionalProperties: false,
    properties: {
      boardId: { type: "string", format: "uuid" },
      title: { type: "string", minLength: 1 },
      position: { type: "integer", minimum: 0 },
    },
  },
};

export const listIdParamSchema: FastifySchema = { params: idParamSchema };

export const updateListSchema: FastifySchema = {
  params: idParamSchema,
  body: {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 1 },
      position: { type: "integer", minimum: 0 },
    },
  },
};

export const reorderListsSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["boardId"],
    additionalProperties: false,
    properties: {
      boardId: { type: "string", format: "uuid" },
    },
  },
  body: {
    type: "object",
    required: ["orderedListIds"],
    additionalProperties: false,
    properties: {
      orderedListIds: {
        type: "array",
        items: { type: "string", format: "uuid" },
        minItems: 1,
      },
    },
  },
};

export const createCardSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["listId", "title", "position"],
    additionalProperties: false,
    properties: {
      listId: { type: "string", format: "uuid" },
      title: { type: "string", minLength: 1 },
      description: { type: "string" },
      position: { type: "integer", minimum: 0 },
    },
  },
};

export const cardIdParamSchema: FastifySchema = { params: idParamSchema };

export const updateCardSchema: FastifySchema = {
  params: idParamSchema,
  body: {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 1 },
      description: { type: "string" },
      position: { type: "integer", minimum: 0 },
    },
  },
};
