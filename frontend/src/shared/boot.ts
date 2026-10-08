// Entry helper for every page.
// auth: "required" = login first, "guest" = skip if signed in, "none" = public.
import { mount, type Component } from "svelte";
import "./theme.css";
import { initTheme } from "./theme.svelte";
import { getStoredToken } from "../auth/authClient";
import { nextFromUrl, requireSession } from "./session";
import Root from "./ui/Root.svelte";

export function boot(page: Component<any>, options: { auth?: "required" | "guest" | "none"; props?: Record<string, unknown> } = {}): void {
  initTheme();
  const auth = options.auth ?? "none";

  if (auth === "required" && !requireSession()) return;
  if (auth === "guest" && getStoredToken()) {
    window.location.replace(nextFromUrl());
    return;
  }

  mount(Root, { target: document.getElementById("app") as HTMLElement, props: { page, props: options.props } });
}
