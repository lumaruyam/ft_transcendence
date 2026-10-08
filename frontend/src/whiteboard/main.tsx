// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: entry point for the whiteboard page — mounts Excalidraw and autosaves the scene to the backend.
import { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { apiRequest, ApiError } from "../api/apiClient";

//Checked against the installed package: Excalidraw 0.17 ships its CSS inside the bundle, so there is
//no "@excalidraw/excalidraw/index.css" to import — that entry only exists from 0.18 on.

const SAVE_DELAY_MS = 1000;

//The route is /app/:id/whiteboard (see docs/frontend-routing.md), so the id is the third segment.
function readProjectId(): string {
	return window.location.pathname.split("/")[2] ?? "";
}

interface SceneResponse {
	whiteboard: { sceneJson?: { elements?: ExcalidrawElement[] } } | null;
}

type LoadResult =
	| { kind: "ready"; elements: ExcalidrawElement[] }
	| { kind: "error"; message: string };

async function loadScene(projectId: string): Promise<LoadResult> {
	try {
		const body = await apiRequest<SceneResponse>({
			method: "GET",
			path: `/whiteboards/${projectId}`,
		});
		//whiteboard === null means nothing has been saved for this project yet, so an empty board is correct.
		const elements = body.whiteboard?.sceneJson?.elements;
		return { kind: "ready", elements: Array.isArray(elements) ? elements : [] };
	} catch (error) {
		//A failed load must NOT fall back to an empty board: autosave would then overwrite what is stored.
		const message =
			error instanceof ApiError && error.status === 403
				? "You do not have access to this project's whiteboard."
				: "Could not load the whiteboard. Reload the page to try again.";
		return { kind: "error", message };
	}
}

interface WhiteboardAppProps {
	projectId: string;
	initialElements: ExcalidrawElement[];
}

function WhiteboardApp({ projectId, initialElements }: WhiteboardAppProps) {
	const saveTimer = useRef<number | undefined>(undefined);
	const [readOnly, setReadOnly] = useState(false);

	//saveScene sends the current scene, leaving out shapes the user erased.
	async function saveScene(elements: readonly ExcalidrawElement[]): Promise<void> {
		const visible = elements.filter((element) => !element.isDeleted);

		try {
			await apiRequest<unknown>({
				method: "PUT",
				path: `/whiteboards/${projectId}`,
				body: { sceneJson: { elements: visible } },
			});
		} catch (error) {
			//Viewers may open the board but not save it: stop retrying and switch the board to view mode.
			if (error instanceof ApiError && error.status === 403) {
				setReadOnly(true);
			}
			//any other failure: keep drawing, the next save retries
		}
	}

	// onChange fires on every change (even mouse moves), so wait until the user has
	// stopped for SAVE_DELAY_MS before sending anything.
	function handleChange(elements: readonly ExcalidrawElement[]): void {
		if (readOnly) return;
		window.clearTimeout(saveTimer.current);
		saveTimer.current = window.setTimeout(() => void saveScene(elements), SAVE_DELAY_MS);
	}

	return (
		<div style={{ height: "100%" }}>
			<Excalidraw
				theme="dark"
				initialData={{ elements: initialElements }}
				viewModeEnabled={readOnly}
				onChange={handleChange}
			/>
		</div>
	);
}

//replace the page with a plain message — used when there is no board to show at all.
function showMessage(root: HTMLElement, message: string): void {
	const paragraph = document.createElement("p");
	paragraph.textContent = message;
	paragraph.style.padding = "2rem";
	root.replaceChildren(paragraph);
}

async function main(): Promise<void> {
	const root = document.getElementById("app");
	if (!root) return;

	const projectId = readProjectId();
	if (projectId === "") {
		showMessage(root, "No project in the URL — open this page as /app/<projectId>/whiteboard.");
		return;
	}

	//Load before mounting, so nothing can be drawn — and therefore nothing can be overwritten —
	//until the saved scene is in hand.
	const result = await loadScene(projectId);
	if (result.kind === "error") {
		showMessage(root, result.message);
		return;
	}

	createRoot(root).render(
		<StrictMode>
			<WhiteboardApp projectId={projectId} initialElements={result.elements} />
		</StrictMode>,
	);
}

void main();