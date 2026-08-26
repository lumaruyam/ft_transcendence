// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: the Advanced search minor module — search across cards, notes, and attachments within a project. TS equivalent of backend/internal/search/search.go (Go skeleton, removed).

export interface SearchResult {
  entityType: "card" | "note" | "attachment";
  entityId: string;
  title: string;
  snippet: string;
}

// searchCards searches card titles/descriptions within a project.
export async function searchCards(projectId: string, query: string): Promise<SearchResult[]> {
  // TODO: prisma.card.findMany with a `contains` filter (joined through list -> board -> project), matching query against title/description
  //       consider Postgres full-text search (tsvector) for relevance ranking once this needs to scale beyond ILIKE
  return [];
}

// searchNotes searches note content within a project.
export async function searchNotes(projectId: string, query: string): Promise<SearchResult[]> {
  // TODO: search notes.contentJson text for the query
  return [];
}

// searchAttachments searches attachment file names within a project.
export async function searchAttachments(projectId: string, query: string): Promise<SearchResult[]> {
  // TODO: prisma.attachment.findMany filtered by projectId
  return [];
}

// searchAll combines cards/notes/attachments results for the project's global search bar.
export async function searchAll(projectId: string, query: string): Promise<SearchResult[]> {
  // TODO: call searchCards/searchNotes/searchAttachments in parallel (Promise.all) and merge, ranked by relevance
  return [];
}
