//Owner: Track 4 (Whiteboard, notes, and supporting modules)
//Responsible for: entry point for the whiteboard page — mounts Excalidraw full screen.
import { StrictMode, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

const STORAGE_KEY = "ft_transcendence.whiteboard";
const SAVE_DELAY_MS = 1000;//autosave every  1 second
//load saved drawing from local storage
function loadElements(): ExcalidrawElement[] {
	try {		//getItem:get saved drawing from local storage
		const saved = localStorage.getItem(STORAGE_KEY);
		if (!saved) return []; 
		const parsed: unknown = JSON.parse(saved);//JSON.parse: turn string into binaire object
		return Array.isArray(parsed) ? (parsed as ExcalidrawElement[]) : [];
	} catch {
		return [];
	}
}

//save the current drawing to local storage
function saveElements(elements: readonly ExcalidrawElement[]): void {
	const visible = elements.filter((element) => !element.isDeleted);
	try {//setItem: save the current drawing to local storage
		localStorage.setItem(STORAGE_KEY, JSON.stringify(visible));
	} catch {
		// storage full or blocked (e.g. private mode): the drawing just isn't kept
	}
}
//render the whiteboard app, which is a full-screen Excalidraw canvas with autosaves
function WhiteboardApp() {
	const saveTimer = useRef<number | undefined>(undefined);

	//Save current drawing to local storage when user stops drawing for 1 second
	function handleChange(elements: readonly ExcalidrawElement[]): void {
		window.clearTimeout(saveTimer.current);
		saveTimer.current = window.setTimeout(() => saveElements(elements), SAVE_DELAY_MS);
	}

	return (
		<div style={{ height: "100%" }}>
			<Excalidraw theme="dark" initialData={{ elements: loadElements() }} onChange={handleChange} />
		</div>
	);
}

const root = document.getElementById("app");

if (root) {//if find root(id=app) in html
	createRoot(root).render(//mount the whiteboard app to it
		<StrictMode>
			<WhiteboardApp />
		</StrictMode>,
	);//render WriteboardApp in strict mode
}