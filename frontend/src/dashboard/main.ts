// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the /app entry point — redirects to /login without a session, otherwise mounts the dashboard.
import { mount } from "svelte";
import "../shared/theme.css";
import { initTheme } from "../shared/theme";
import { isAuthenticated } from "../auth/authClient";
import Dashboard from "./Dashboard.svelte";

initTheme();

if (!isAuthenticated()) {
  window.location.replace("/login");
} else {
  mount(Dashboard, { target: document.getElementById("app") as HTMLElement });
}
