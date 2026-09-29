// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: backend input validation for all board/list/card forms, per the mandatory dual frontend+backend validation requirement. TS equivalent of backend/internal/kanban/validation.go (Go skeleton, removed).
import type { CreateBoardInput } from "./boards.service";
import type { CreateListInput } from "./lists.service";
import type { CreateCardInput } from "./cards.service";

// validateBoardInput checks a board creation/edit request for required fields and length limits.
export function validateBoardInput(input: CreateBoardInput): string[] {
  // TODO: title required, non-empty after trim, reasonable max length
  return [];
}

// validateListInput checks a list creation/edit request.
export function validateListInput(input: CreateListInput): string[] {
  // TODO: title required; boardId must reference an existing board the caller can access
  return [];
}

// validateCardInput checks a card creation/edit request.
export function validateCardInput(input: CreateCardInput): string[] {
  // TODO: title required; listId must reference an existing list belonging to the caller's project
  // TODO: assignee, if set, must be a member of the project
  return [];
}
