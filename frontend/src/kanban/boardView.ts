// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: rendering the board and its interactions, add list, add card, edit title
import {
  fetchBoardForProject,
  createList,
  createCard,
  updateCardTitle,
  updateListTitle,
  deleteCard,
  deleteList,
} from "./boardApi";
import type { Board, List, Card } from "./boardApi";
import { connectKanbanSocket } from "./wsClient";

// pass initialBoard if the caller already fetched it, to skip a second request
export async function mountBoard(root: HTMLElement, projectId: string, initialBoard?: Board): Promise<void> {
  let board: Board;
  if (initialBoard) {
    board = initialBoard;
  } else {
    try {
      board = await fetchBoardForProject(projectId);
    } catch {
      root.textContent = "Impossible de charger le board pour le moment.";
      return;
    }
  }

  render();
  connectKanbanSocket(projectId, handleKanbanEvent);

  // applies a live broadcast to local state and re-renders
  // id checks below avoid duplicates since our own mutations also update state right away
  function handleKanbanEvent(event: string, payload: unknown): void {
    switch (event) {
      case "list_created": {
        const created = payload as Omit<List, "cards">;
        if (!board.lists.some((l) => l.id === created.id)) {
          board.lists.push({ ...created, cards: [] });
          render();
        }
        break;
      }
      case "list_updated": {
        const updated = payload as List;
        const list = board.lists.find((l) => l.id === updated.id);
        if (list) {
          list.title = updated.title;
          list.position = updated.position;
          render();
        }
        break;
      }
      case "list_deleted": {
        const { id } = payload as { id: string };
        const index = board.lists.findIndex((l) => l.id === id);
        if (index !== -1) {
          board.lists.splice(index, 1);
          render();
        }
        break;
      }
      case "card_created": {
        const card = payload as Card;
        const list = board.lists.find((l) => l.id === card.listId);
        if (list && !list.cards.some((c) => c.id === card.id)) {
          list.cards.push(card);
          render();
        }
        break;
      }
      case "card_updated": {
        const updated = payload as Card;
        for (const list of board.lists) {
          const card = list.cards.find((c) => c.id === updated.id);
          if (card) {
            card.title = updated.title;
            card.description = updated.description;
            render();
            break;
          }
        }
        break;
      }
      case "card_deleted": {
        const { id } = payload as { id: string };
        for (const list of board.lists) {
          const index = list.cards.findIndex((c) => c.id === id);
          if (index !== -1) {
            list.cards.splice(index, 1);
            render();
            break;
          }
        }
        break;
      }
      default:
        // no ui yet for board created, board deleted, list reorder or presence events
        break;
    }
  }

  function render(): void {
    root.innerHTML = "";
    for (const list of board.lists) {
      root.appendChild(renderList(list));
    }
    root.appendChild(renderAddListForm());
  }

  function renderList(list: List): HTMLElement {
    const column = document.createElement("div");
    column.className = "list-column";

    const header = document.createElement("div");
    header.className = "list-header";

    const titleInput = document.createElement("input");
    titleInput.className = "list-title-input";
    titleInput.value = list.title;

    const commitTitle = async (): Promise<void> => {
      const newTitle = titleInput.value.trim();
      if (!newTitle || newTitle === list.title) {
        titleInput.value = list.title;
        return;
      }
      try {
        const updated = await updateListTitle(list.id, newTitle);
        list.title = updated.title;
      } catch {
        titleInput.value = list.title;
      }
    };

    titleInput.addEventListener("blur", commitTitle);
    titleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") titleInput.blur();
      if (e.key === "Escape") {
        titleInput.value = list.title;
        titleInput.blur();
      }
    });

    header.appendChild(titleInput);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "list-delete";
    deleteBtn.setAttribute("aria-label", "Supprimer la liste");
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", async () => {
      try {
        await deleteList(list.id);
        // the delete broadcast can arrive before this request finishes, avoids removing it twice
        const index = board.lists.findIndex((l) => l.id === list.id);
        if (index !== -1) {
          board.lists.splice(index, 1);
          render();
        }
      } catch {
        // keep the list if the delete request failed
      }
    });
    header.appendChild(deleteBtn);

    column.appendChild(header);

    const cardsEl = document.createElement("div");
    cardsEl.className = "list-cards";
    for (const card of list.cards) {
      cardsEl.appendChild(renderCard(card));
    }
    column.appendChild(cardsEl);
    column.appendChild(renderAddCardForm(list));

    return column;
  }

  function renderCard(card: Card): HTMLElement {
    const el = document.createElement("div");
    el.className = "card";

    const row = document.createElement("div");
    row.className = "card-row";

    const input = document.createElement("input");
    input.className = "card-title-input";
    input.value = card.title;

    const commit = async (): Promise<void> => {
      const newTitle = input.value.trim();
      if (!newTitle || newTitle === card.title) {
        input.value = card.title;
        return;
      }
      try {
        const updated = await updateCardTitle(card.id, newTitle);
        card.title = updated.title;
      } catch {
        input.value = card.title;
      }
    };

    input.addEventListener("blur", commit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") input.blur();
      if (e.key === "Escape") {
        input.value = card.title;
        input.blur();
      }
    });

    row.appendChild(input);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "card-delete";
    deleteBtn.setAttribute("aria-label", "Supprimer la carte");
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", async () => {
      const list = board.lists.find((l) => l.id === card.listId);
      if (!list) return;
      try {
        await deleteCard(card.id);
        // same race as the list delete, avoids a duplicate removal
        const index = list.cards.findIndex((c) => c.id === card.id);
        if (index !== -1) {
          list.cards.splice(index, 1);
          render();
        }
      } catch {
        // keep the card if the delete request failed
      }
    });
    row.appendChild(deleteBtn);

    el.appendChild(row);
    return el;
  }

  function renderAddCardForm(list: List): HTMLElement {
    const form = document.createElement("form");
    form.className = "add-card-form";

    const input = document.createElement("input");
    input.className = "add-card-input";
    input.placeholder = "+ Ajouter une carte";

    form.appendChild(input);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;
      input.value = "";
      try {
        const card = await createCard(list.id, title, list.cards.length);
        // the create broadcast can arrive first, avoids adding it twice
        if (!list.cards.some((c) => c.id === card.id)) {
          list.cards.push(card);
          render();
        }
      } catch {
        input.value = title;
      }
    });

    return form;
  }

  function renderAddListForm(): HTMLElement {
    const form = document.createElement("form");
    form.className = "add-list-form";

    const input = document.createElement("input");
    input.className = "add-list-input";
    input.placeholder = "+ Ajouter une liste";

    form.appendChild(input);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = input.value.trim();
      if (!title) return;
      input.value = "";
      try {
        const list = await createList(board.id, title, board.lists.length);
        // same race as the add card form, avoids a duplicate list
        if (!board.lists.some((l) => l.id === list.id)) {
          board.lists.push(list);
          render();
        }
      } catch {
        input.value = title;
      }
    });

    return form;
  }
}
