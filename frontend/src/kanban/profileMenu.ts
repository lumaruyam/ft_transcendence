// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: the top bar profile menu, theme toggle plus profile and board settings links
//
// projectId is optional so the dashboard page can reuse this without a board settings link
import { currentTheme, toggleTheme } from "./theme";

export function renderProfileMenu(container: HTMLElement, projectId?: string): void {
  const wrapper = document.createElement("div");
  wrapper.className = "profile-menu";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "profile-avatar-btn";
  button.textContent = "U"; // TODO Track 1: real initials or photo once auth exposes the user
  wrapper.appendChild(button);

  const dropdown = document.createElement("div");
  dropdown.className = "dropdown profile-dropdown";

  const themeRow = document.createElement("div");
  themeRow.className = "theme-toggle-row";
  const themeLabel = document.createElement("span");
  themeLabel.textContent = "Theme sombre";
  const themeSwitch = document.createElement("div");
  themeSwitch.className = `theme-switch${currentTheme() === "dark" ? " on" : ""}`;
  const knob = document.createElement("div");
  knob.className = "theme-switch-knob";
  themeSwitch.appendChild(knob);
  themeSwitch.addEventListener("click", (e) => {
    e.stopPropagation();
    themeSwitch.classList.toggle("on", toggleTheme() === "dark");
  });
  themeRow.append(themeLabel, themeSwitch);
  dropdown.appendChild(themeRow);

  const divider = document.createElement("div");
  divider.className = "dropdown-divider";
  dropdown.appendChild(divider);

  const profileLink = document.createElement("a");
  profileLink.className = "dropdown-item dropdown-link";
  profileLink.href = "/settings";
  profileLink.textContent = "Parametres du profil";
  dropdown.appendChild(profileLink);

  if (projectId) {
    const boardLink = document.createElement("a");
    boardLink.className = "dropdown-item dropdown-link";
    boardLink.href = `/app/${projectId}/settings`;
    boardLink.textContent = "Parametres du board";
    dropdown.appendChild(boardLink);
  }

  wrapper.appendChild(dropdown);

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });
  document.addEventListener("click", () => dropdown.classList.remove("open"));

  container.appendChild(wrapper);
}
