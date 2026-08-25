// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: mounting @excalidraw/excalidraw as an isolated React tree on the whiteboard page/route.

import React from "react";

// mountWhiteboard mounts the Excalidraw component into the given DOM node, isolated from the rest of the vanilla TS/Svelte app.
export function mountWhiteboard(container: HTMLElement, projectId: string): void {
  // TODO: render <Excalidraw /> into container via ReactDOM, scoped to just this route per the plan's "isolated React tree" note
  // TODO: wire the export button to exportWhiteboardToImage
}

// WhiteboardPage is the isolated React component tree hosting the Excalidraw canvas.
export function WhiteboardPage(props: { projectId: string }): React.ReactElement {
  // TODO: render the Excalidraw canvas and an "Export & Attach" action
  return React.createElement("div");
}
