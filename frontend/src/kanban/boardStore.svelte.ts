// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: the reactive state of the kanban page (project, board, members, who is online) and
// every way it changes — user actions (optimistic, rolled back by a reload on failure) and the live
// Socket.IO events sent by the other participants.
//
// Every event handler is idempotent: our own mutations update the state as soon as the HTTP call
// returns AND come back as a broadcast, in either order, so applying one twice must change nothing.
import { SvelteSet } from "svelte/reactivity";
import { ApiError } from "../api/apiClient";
import { getStoredUser } from "../auth/authClient";
import * as api from "./boardApi";
import { connectKanbanSocket } from "./wsClient";
import type { Board, Card, CardMoved, List, Member, Project } from "./types";

type LoadState = "loading" | "ready" | "error";

const byPosition = (a: { position: number; id: string }, b: { position: number; id: string }): number =>
  a.position - b.position || a.id.localeCompare(b.id);

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return "Vous n'avez pas les droits pour faire cela.";
    if (err.details.length > 0) return err.details.join(", ");
  }
  return "Une erreur est survenue, réessayez.";
}

export class BoardStore {
  project = $state<Project | null>(null);
  board = $state<Board | null>(null);
  members = $state<Member[]>([]);
  online = new SvelteSet<string>();
  loadState = $state<LoadState>("loading");
  // the logged-in user's role in this project: viewers get a read-only board
  myRole = $derived(this.members.find((m) => m.userId === getStoredUser()?.id)?.role ?? null);
  canEdit = $derived(this.myRole === "admin" || this.myRole === "member");
  // the server refused the room: the user is not a member of this project
  accessDenied = $state(false);
  // last failed user action, shown by the page until dismissed
  actionError = $state<string | null>(null);

  readonly #projectId: string;
  #disconnect: (() => void) | null = null;

  constructor(projectId: string) {
    this.#projectId = projectId;
  }

  // start loads the page data, then listens to the project room
  async start(): Promise<void> {
    await this.load();
    this.#disconnect = connectKanbanSocket(this.#projectId, {
      onEvent: (event, payload) => this.applyEvent(event, payload),
      onReconnect: () => void this.load(),
    });
  }

  stop(): void {
    this.#disconnect?.();
    this.#disconnect = null;
  }

  // load (re)fetches everything. Also used to resync after a reconnect or a failed action.
  async load(): Promise<void> {
    try {
      const [project, board, members] = await Promise.all([
        api.fetchProject(this.#projectId),
        api.fetchBoardForProject(this.#projectId),
        api.fetchMembers(this.#projectId),
      ]);
      this.project = project;
      this.board = board;
      this.members = members;
      this.loadState = "ready";
    } catch (err) {
      // a failed reload keeps showing the board we already have
      if (this.loadState !== "ready") {
        this.loadState = "error";
        this.accessDenied = err instanceof ApiError && (err.status === 403 || err.status === 404);
      }
    }
  }

  // ---- user actions. They return false when the server refused, so a form can keep what was typed.

  async addList(title: string): Promise<boolean> {
    const board = this.board;
    if (!board) return false;
    return this.#run(async () => {
      const row = await api.createList(board.id, title, board.lists.length);
      this.#upsertList(row);
    });
  }

  async renameList(listId: string, title: string): Promise<boolean> {
    return this.#run(async () => this.#upsertList(await api.renameList(listId, title)));
  }

  async removeList(listId: string): Promise<boolean> {
    return this.#run(async () => {
      await api.deleteList(listId);
      this.#dropList(listId);
    });
  }

  // moveList puts a list at `toIndex`, shifting the others (drag-and-drop on the list headers)
  async moveList(listId: string, toIndex: number): Promise<void> {
    const board = this.board;
    if (!board) return;
    const ids = board.lists.map((l) => l.id).filter((id) => id !== listId);
    if (!board.lists.some((l) => l.id === listId)) return;
    ids.splice(Math.min(toIndex, ids.length), 0, listId);

    this.#applyListOrder(ids);
    const ok = await this.#run(() => api.reorderLists(board.id, ids));
    if (!ok) await this.load();
  }

  async addCard(listId: string, title: string): Promise<boolean> {
    const list = this.#findList(listId);
    if (!list) return false;
    return this.#run(async () => this.#upsertCard(await api.createCard(listId, title, list.cards.length)));
  }

  async editCard(cardId: string, patch: { title?: string; description?: string }): Promise<boolean> {
    return this.#run(async () => this.#upsertCard(await api.updateCard(cardId, patch)));
  }

  async removeCard(cardId: string): Promise<boolean> {
    return this.#run(async () => {
      await api.deleteCard(cardId);
      this.#dropCard(cardId);
    });
  }

  // moveCard puts a card at `toIndex` of a list (maybe another one): the UI updates right away, and a
  // reload puts things back if the server refuses
  async moveCard(cardId: string, toListId: string, toIndex: number): Promise<void> {
    const from = this.#findCardList(cardId);
    const to = this.#findList(toListId);
    if (!from || !to) return;

    const toOrder = from === to ? from.cards.map((c) => c.id).filter((id) => id !== cardId) : to.cards.map((c) => c.id);
    toOrder.splice(Math.min(toIndex, toOrder.length), 0, cardId);
    const fromOrder = from === to ? toOrder : from.cards.map((c) => c.id).filter((id) => id !== cardId);

    this.#applyMove({ cardId, fromListId: from.id, toListId, fromOrder, toOrder });
    const ok = await this.#run(() => api.moveCard(cardId, toListId, toIndex));
    if (!ok) await this.load();
  }

  dismissError(): void {
    this.actionError = null;
  }

  // ---- live events from the project room

  applyEvent(event: string, payload: unknown): void {
    switch (event) {
      case "presence": {
        const { userId, status } = payload as { userId: string; status: "joined" | "left" };
        if (status === "joined") this.online.add(userId);
        else this.online.delete(userId);
        return;
      }
      case "presence_snapshot": {
        const { userIds } = payload as { userIds: string[] };
        for (const userId of userIds) this.online.add(userId);
        return;
      }
      case "join_denied":
        this.accessDenied = true;
        return;
    }

    if (!this.board) return;
    switch (event) {
      case "list_created":
      case "list_updated":
        this.#upsertList(payload as Omit<List, "cards">);
        break;
      case "list_deleted":
        this.#dropList((payload as { id: string }).id);
        break;
      case "lists_reordered":
        this.#applyListOrder((payload as { orderedListIds: string[] }).orderedListIds);
        break;
      case "card_created":
      case "card_updated":
        this.#upsertCard(payload as Card);
        break;
      case "card_deleted":
        this.#dropCard((payload as { id: string }).id);
        break;
      case "card_moved":
        this.#applyMove(payload as CardMoved);
        break;
      // board_created / board_deleted: nothing to show, the page has a single board per project
    }
  }

  // ---- state helpers

  async #run(action: () => Promise<unknown>): Promise<boolean> {
    try {
      await action();
      return true;
    } catch (err) {
      this.actionError = describeError(err);
      return false;
    }
  }

  #findList(listId: string): List | undefined {
    return this.board?.lists.find((l) => l.id === listId);
  }

  #findCardList(cardId: string): List | undefined {
    return this.board?.lists.find((l) => l.cards.some((c) => c.id === cardId));
  }

  // upsert: add the list if it's new, otherwise update its title/position
  #upsertList(row: Omit<List, "cards">): void {
    const board = this.board;
    if (!board) return;
    const existing = board.lists.find((l) => l.id === row.id);
    if (existing) {
      existing.title = row.title;
      existing.position = row.position;
    } else {
      board.lists.push({ id: row.id, boardId: row.boardId, title: row.title, position: row.position, cards: [] });
    }
    board.lists.sort(byPosition);
  }

  #dropList(listId: string): void {
    if (this.board) this.board.lists = this.board.lists.filter((l) => l.id !== listId);
  }

  // applyListOrder reorders the lists following `orderedIds` (lists missing from it keep their relative order, last)
  #applyListOrder(orderedIds: string[]): void {
    const board = this.board;
    if (!board) return;
    const rank = new Map(orderedIds.map((id, index) => [id, index]));
    const ordered = [...board.lists].sort(
      (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) || byPosition(a, b)
    );
    ordered.forEach((list, index) => (list.position = index));
    board.lists = ordered;
  }

  #upsertCard(card: Card): void {
    const list = this.#findList(card.listId);
    if (!list) return;
    const existing = this.#findCardList(card.id)?.cards.find((c) => c.id === card.id);
    if (existing) {
      Object.assign(existing, card);
    } else {
      list.cards.push(card);
    }
    list.cards.sort(byPosition);
  }

  #dropCard(cardId: string): void {
    const list = this.#findCardList(cardId);
    if (list) list.cards = list.cards.filter((c) => c.id !== cardId);
  }

  // applyMove sets the card order of both lists from the ids the server (or moveCard) computed. If it
  // mentions a card we don't know, we missed an event: resync instead of guessing.
  #applyMove(move: CardMoved): void {
    const board = this.board;
    if (!board) return;
    const known = new Map(board.lists.flatMap((l) => l.cards).map((c) => [c.id, c]));
    const pick = (ids: string[]): Card[] | null => {
      const cards = ids.map((id) => known.get(id));
      return cards.every((c) => c !== undefined) ? (cards as Card[]) : null;
    };

    const from = this.#findList(move.fromListId);
    const to = this.#findList(move.toListId);
    const fromCards = pick(move.fromOrder);
    const toCards = pick(move.toOrder);
    const moved = known.get(move.cardId);
    if (!from || !to || !fromCards || !toCards || !moved) {
      void this.load();
      return;
    }

    moved.listId = move.toListId;
    from.cards = fromCards;
    to.cards = toCards;
    for (const list of from === to ? [to] : [from, to]) {
      list.cards.forEach((card, index) => (card.position = index));
    }
  }
}
