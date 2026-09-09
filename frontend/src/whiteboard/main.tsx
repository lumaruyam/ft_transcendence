import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// To implement:
// import { Excalidraw } from "@excalidraw/excalidraw";
// import "@excalidraw/excalidraw/index.css";
//
// Flow:
//   1. Extract project ID from window.location.pathname: /app/:id/whiteboard
//   2. GET /api/projects/:id/whiteboard  -> load saved elements + appState as initialData
//   3. Render <Excalidraw initialData={...} onChange={handleChange} />
//   4. handleChange: debounce (~1s) then POST /api/projects/:id/whiteboard { elements, appState }
//      so the last saved state is available to any team member who opens the page

function WhiteboardApp() {
  // TODO: implement — see flow above
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a", color: "#94a3b8", fontFamily: "sans-serif" }}>
      Whiteboard (Excalidraw) — not yet implemented
    </div>
  );
}

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <WhiteboardApp />
  </StrictMode>
);
