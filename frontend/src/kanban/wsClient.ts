// Owner: Track 2 (Person B — WebSocket layer)
// Responsible for: the Kanban-specific Socket.IO connection, joins the project room and
// forwards every event to boardView state patching logic
//
// uses socket io client directly instead of the shared ws wrapper since that module is still a stub
import { io, Socket } from "socket.io-client";

export type KanbanEventHandler = (event: string, payload: unknown) => void;

let socket: Socket | null = null;

// joins the project room on connect, including after reconnects
export function connectKanbanSocket(projectId: string, onEvent: KanbanEventHandler): void {
  if (socket) {
    socket.disconnect();
  }

  socket = io({
    // TODO Track 1: use the real JWT once login exists, this dev token only unblocks testing
    auth: { token: "dev" },
  });

  socket.on("connect", () => {
    socket?.emit("join_project", projectId);
  });

  socket.onAny(onEvent);
}
