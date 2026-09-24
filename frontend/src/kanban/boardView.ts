// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: rendering a board's lists/cards into the DOM. Simple read-only render for now —
// no drag-and-drop, no create/edit UI yet.
import type { Board, List, Card } from "./boardApi";

export function renderBoard(root: HTMLElement, board: Board): void {
  root.innerHTML = "";

  if (board.lists.length === 0) {
    const empty = document.createElement("p");
    empty.className = "board-empty";
    empty.textContent = "Aucune liste pour l'instant.";
    root.appendChild(empty);
    return;
  }

  for (const list of board.lists) {
    root.appendChild(renderList(list));
  }
}

function renderList(list: List): HTMLElement {
  const column = document.createElement("div");
  column.className = "list-column";

  const title = document.createElement("h2");
  title.className = "list-title";
  title.textContent = list.title;
  column.appendChild(title);

  const cards = document.createElement("div");
  cards.className = "list-cards";
  for (const card of list.cards) {
    cards.appendChild(renderCard(card));
  }
  column.appendChild(cards);

  return column;
}

function renderCard(card: Card): HTMLElement {
  const el = document.createElement("div");
  el.className = "card";
  el.textContent = card.title;
  return el;
}
