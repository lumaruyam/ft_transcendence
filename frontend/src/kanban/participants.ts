// Owner: Track 2 (Person A — Kanban CRUD and UI)
// Responsible for: the top bar participants widget, collapsed avatar stack plus expandable list
//
// TODO Track 1: replace MOCK_PARTICIPANTS with a real call to the members list endpoint
// TODO Track 2: wire online status to presence events once sockets carry a real user id

interface Participant {
  id: string;
  name: string;
  color: string;
  online: boolean;
}

const MOCK_PARTICIPANTS: Participant[] = [
  { id: "1", name: "John Smith", color: "#5865f2", online: true },
  { id: "2", name: "Jane Doe", color: "#eb459e", online: true },
  { id: "3", name: "Alex Roe", color: "#23a55a", online: false },
  { id: "4", name: "Sam Lee", color: "#f0b132", online: false },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function renderAvatar(p: Participant): HTMLElement {
  const el = document.createElement("div");
  el.className = "avatar";
  el.style.background = p.color;
  el.textContent = initials(p.name);
  el.title = p.name;

  const dot = document.createElement("span");
  dot.className = `avatar-dot ${p.online ? "online" : "offline"}`;
  el.appendChild(dot);

  return el;
}

export function renderParticipants(container: HTMLElement): void {
  const wrapper = document.createElement("div");
  wrapper.className = "participants";

  const stack = document.createElement("div");
  stack.className = "avatar-stack";

  const visible = MOCK_PARTICIPANTS.slice(0, 3);
  for (const p of visible) {
    stack.appendChild(renderAvatar(p));
  }
  if (MOCK_PARTICIPANTS.length > 3) {
    const more = document.createElement("div");
    more.className = "avatar-more";
    more.textContent = `+${MOCK_PARTICIPANTS.length - 3}`;
    stack.appendChild(more);
  }
  wrapper.appendChild(stack);

  const dropdown = document.createElement("div");
  dropdown.className = "dropdown participants-dropdown";

  const title = document.createElement("div");
  title.className = "dropdown-section-title";
  title.textContent = `${MOCK_PARTICIPANTS.length} participants`;
  dropdown.appendChild(title);

  for (const p of MOCK_PARTICIPANTS) {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.appendChild(renderAvatar(p));

    const info = document.createElement("div");
    info.className = "dropdown-item-info";
    const name = document.createElement("div");
    name.textContent = p.name;
    const status = document.createElement("div");
    status.className = "dropdown-item-status";
    status.textContent = p.online ? "En ligne" : "Hors ligne";
    info.append(name, status);
    item.appendChild(info);

    dropdown.appendChild(item);
  }

  wrapper.appendChild(dropdown);

  wrapper.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });
  document.addEventListener("click", () => dropdown.classList.remove("open"));

  container.appendChild(wrapper);
}
