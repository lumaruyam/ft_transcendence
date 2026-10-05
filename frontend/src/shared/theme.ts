// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: dark/light theme toggle for the kanban page, persisted per-browser.
const STORAGE_KEY = "ft_theme";

export type Theme = "dark" | "light";

function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage disabled, theme just will not survive a reload
  }
}

export function initTheme(): Theme {
  const theme = getStoredTheme() ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  document.documentElement.dataset.theme = theme;
  return theme;
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  persistTheme(next);
  return next;
}
