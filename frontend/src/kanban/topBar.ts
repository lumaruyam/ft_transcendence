// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: the top bar shell, board logo and title on the left, participants and profile menu on the right
import { renderParticipants } from "./participants";
import { renderProfileMenu } from "./profileMenu";

export function renderTopBar(container: HTMLElement, projectId: string, boardTitle: string): void {
  container.innerHTML = "";

  const left = document.createElement("div");
  left.className = "topbar-left";

  const logo = document.createElement("div");
  logo.className = "board-logo";
  logo.textContent = boardTitle.trim().slice(0, 2).toUpperCase() || "?";
  left.appendChild(logo);

  const title = document.createElement("div");
  title.className = "topbar-title";
  title.textContent = boardTitle;
  left.appendChild(title);

  container.appendChild(left);

  const right = document.createElement("div");
  right.className = "topbar-right";
  renderParticipants(right);
  renderProfileMenu(right, projectId);
  container.appendChild(right);
}
