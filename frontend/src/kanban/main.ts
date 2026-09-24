import { fetchBoardForProject } from "./boardApi";
import { renderBoard } from "./boardView";

function getProjectIdFromUrl(): string | null {
  const match = window.location.pathname.match(/^\/app\/([^/]+)$/);
  return match ? match[1] : null;
}

async function init(): Promise<void> {
  const root = document.getElementById("board-root");
  const projectId = getProjectIdFromUrl();
  if (!root || !projectId) return;

  try {
    const board = await fetchBoardForProject(projectId);
    renderBoard(root, board);
  } catch {
    // boardApi.ts's fetchBoardForProject is still a stub — show the empty state until it's wired.
    renderBoard(root, { id: "", projectId, title: "", lists: [] });
  }
}

init();
