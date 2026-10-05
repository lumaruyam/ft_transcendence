// Theme preference: "system" follows the browser, "light"/"dark" are the user's choice.
// Stored per browser. Each page's <head> applies it before first paint.
const STORAGE_KEY = "ft_theme";

export type ThemePref = "system" | "light" | "dark";

function readPref(): ThemePref {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function apply(pref: ThemePref): void {
  if (pref === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = pref;
}

// reactive
export const theme = $state<{ pref: ThemePref }>({ pref: readPref() });

export function setThemePref(pref: ThemePref): void {
  theme.pref = pref;
  apply(pref);
  try {
    if (pref === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // storage disabled: the choice is not saved
  }
}

// applies the stored choice and syncs other tabs
export function initTheme(): void {
  theme.pref = readPref();
  apply(theme.pref);
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    theme.pref = readPref();
    apply(theme.pref);
  });
}

// system → light → dark → system
export function cycleTheme(): ThemePref {
  const next: ThemePref = theme.pref === "system" ? "light" : theme.pref === "light" ? "dark" : "system";
  setThemePref(next);
  return next;
}
