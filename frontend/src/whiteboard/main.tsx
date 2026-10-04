// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: entry point for the whiteboard page — mounts Excalidraw and autosaves the scene to the backend.
import { StrictMode, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
//one second after, the whiteboard will be saved
const SAVE_DELAY_MS = 1000;

const TOKEN_STORAGE_KEY = "ft_transcendence.token";
//read the auth token from localStorage
function readToken(): string {
	try {
		return localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
	} catch {
		return "";
	}
}

const projectId = new URLSearchParams(window.location.search).get("projectId") ?? "";
//tell the backend what is backend like to expect in the response body
interface SceneResponse {
	whiteboard?: { 
		sceneJson?: {
			 elements?: ExcalidrawElement[] } } | null;
}

//load the saved whiteboard from the backend
async function loadScene(): Promise<{ elements: ExcalidrawElement[] } | null> {
	if (projectId === "") return null;

	try {				//get the saved scene from the backend
		const response = await fetch(`/api/whiteboards/${projectId}`, {
			headers: { Authorization: `Bearer ${readToken()}` },
		});
		if (!response.ok) return null;

		const body = (await response.json()) as SceneResponse;
		const elements = body.whiteboard?.sceneJson?.elements;
		return Array.isArray(elements) ? { elements } : null;
	} catch {
		return null;
	}
}

//save the whiteboard to the backend  //readonly: will not modify the elements of whiteboard
async function saveScene(elements: readonly ExcalidrawElement[]): Promise<void> {
	if (projectId === "") return;
	//filter out deleted elements so they don't get saved to the backend
	const visible = elements.filter((element) => !element.isDeleted);

	try {//put the whiteboard to backend, showing auth token
		await fetch(`/api/whiteboards/${projectId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${readToken()}`,
			},
			body: JSON.stringify({ sceneJson: { elements: visible } }),
		});
	} catch {
	}
}

//loadScene is async
const initialData = loadScene();

function WhiteboardApp() {
	const saveTimer = useRef<number | undefined>(undefined);
	//handleChange is called whenever the user draws
	function handleChange(elements: readonly ExcalidrawElement[]): void {
		window.clearTimeout(saveTimer.current);
		saveTimer.current = window.setTimeout(() => void saveScene(elements), SAVE_DELAY_MS);
	}	//save it one second after the last change

	return (
		<div style={{ height: "100%" }}>
			<Excalidraw theme="dark" initialData={initialData} onChange={handleChange} />
		</div>
	);
}

const root = document.getElementById("app");
//mount the isolated React tree into the whiteboard page
if (root) {
	createRoot(root).render(
		<StrictMode>
			<WhiteboardApp />
		</StrictMode>,
	);
}