// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: the /app/:id/notes entry point.
import { boot } from "../shared/boot";//for beginning the svelte
import Notes from "./Notes.svelte";//note editor explained bt svelte
//grab the projectId from the URL, or redirect to /app if it's not there
const projectId = window.location.pathname.match(/^\/app\/([^/]+)\/notes\/?$/)?.[1];
//if the projectId is missing, redirect to /app
//otherwise, boot the Notes component with the projectId as a prop
if (!projectId) {
	window.location.replace("/app");
} else {
	boot(Notes, {
        auth: "required", 
        props: { projectId } });
}