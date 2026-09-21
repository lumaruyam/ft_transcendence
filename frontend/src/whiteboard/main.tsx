// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: entry point for the whiteboard page — mounts Excalidraw full screen.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";

function WhiteboardApp() {
	return (
		<div style={{ height: "100%" }}>
			<Excalidraw theme="dark" />
		</div>
	);
}

const root = document.getElementById("app");

if (root) {
	createRoot(root).render(
		<StrictMode>
			<WhiteboardApp />
		</StrictMode>,
	);
}