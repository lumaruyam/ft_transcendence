// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: frontend API calls for the notes module — load-latest and autosave-on-edit.

interface Note {
  id: string;
  projectId: string;
  contentJson: string;
  updatedBy: string;
  updatedAt: string;
}

// fetchLatestNote loads whoever's most recent saved version for a project.
async function fetchLatestNote(projectId: string): Promise<Note> {
  // TODO: GET /api/projects/{projectId}/notes
  throw new Error("not implemented");
}

// autosaveNote persists a debounced edit — a normal HTTP request, not a live socket connection, per the plan's scope.
async function autosaveNote(projectId: string, contentJson: string): Promise<Note> {
  // TODO: PUT /api/projects/{projectId}/notes — last save wins if two people edit around the same time
  throw new Error("not implemented");
}
