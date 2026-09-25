import { fetchBoardForProject } from "./boardApi";
import { mountBoard } from "./boardView";
import { renderSidebar } from "./sidebar";
import { renderTopBar } from "./topBar";
import { initTheme } from "./theme";

function getProjectIdFromUrl(): string | null {
  const match = window.location.pathname.match(/^\/app\/([^/]+)$/);
  return match ? match[1] : null;
}

async function init(): Promise<void> {
  initTheme();

  const projectId = getProjectIdFromUrl();
  const sidebar = document.getElementById("sidebar");
  const topbar = document.getElementById("topbar");
  const boardRoot = document.getElementById("board-root");
  if (!projectId || !sidebar || !topbar || !boardRoot) return;

  // renders before the board request finishes so the sidebar does not flash open then close
  renderSidebar(sidebar);

  try {
    const board = await fetchBoardForProject(projectId);
    const title = board.title || "Kanban";
    renderTopBar(topbar, projectId, title);
    await mountBoard(boardRoot, projectId, board);
  } catch {
    renderTopBar(topbar, projectId, "Kanban");
    boardRoot.textContent = "Impossible de charger le board pour le moment.";
  }
}

init();
