// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: integrating the Tiptap rich text editor for the Notion-style notes page.

// mountNotesEditor initializes Tiptap in the given container, loaded with the project's latest saved note.
function mountNotesEditor(container: HTMLElement, projectId: string): void {
  // TODO: fetch the latest note via notesApi.fetchLatestNote and initialize Tiptap with its content_json
  // TODO: wire a debounce timer on the editor's update event to call notesApi.autosaveNote after typing stops
}
