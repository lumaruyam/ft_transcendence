// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: exporting the current Excalidraw drawing to an image and sending it through the file upload pipeline.

// exportWhiteboardToImage uses Excalidraw's built-in export and uploads the result as a regular attachment.
async function exportWhiteboardToImage(projectId: string, cardId?: string): Promise<void> {
  // TODO: call Excalidraw's exportToBlob (or exportToSvg) on the current scene
  // TODO: upload the resulting image via the attachments API (Track 4's backend attachments package) — no WS involvement, no persisted stroke data, per the plan's save-and-share scope
}
