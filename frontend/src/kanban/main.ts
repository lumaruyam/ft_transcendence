// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: the /app/:id entry point — checks there is a session and a project id in the URL,
// then mounts the Svelte kanban app.
import { mount } from "svelte";
import "../shared/theme.css";
import { initTheme } from "../shared/theme";
import { isAuthenticated } from "../auth/authClient";
import App from "./App.svelte";
import { BoardStore } from "./boardStore.svelte";

initTheme();

const projectId = window.location.pathname.match(/^\/app\/([^/]+)\/?$/)?.[1];

if (!isAuthenticated()) {
  window.location.replace("/login");
} else if (!projectId) {
  window.location.replace("/app");
} else {
  mount(App, {
    target: document.getElementById("app") as HTMLElement,
    props: { store: new BoardStore(projectId) },
  });
}
