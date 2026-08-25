// Owner: Track 4 (Whiteboard, notes, and supporting modules)
// Responsible for: the Advanced search minor module — search across cards, notes, and attachments within a project.
package search

import "context"

// SearchResult is a unified hit across entity types, for a single combined search UI.
type SearchResult struct {
	EntityType string
	EntityID   uint
	Title      string
	Snippet    string
}

// SearchCards searches card titles/descriptions within a project.
func SearchCards(ctx context.Context, projectID uint, query string) ([]SearchResult, error) {
	// TODO: query cards (joined through lists/boards) filtered by project, matching query against title/description
	return nil, nil
}

// SearchNotes searches note content within a project.
func SearchNotes(ctx context.Context, projectID uint, query string) ([]SearchResult, error) {
	// TODO: search notes.content_json text for the query
	return nil, nil
}

// SearchAttachments searches attachment file names within a project.
func SearchAttachments(ctx context.Context, projectID uint, query string) ([]SearchResult, error) {
	// TODO: search attachments filtered by project_id
	return nil, nil
}

// SearchAll combines cards/notes/attachments results for the project's global search bar.
func SearchAll(ctx context.Context, projectID uint, query string) ([]SearchResult, error) {
	// TODO: call SearchCards/SearchNotes/SearchAttachments and merge, ranked by relevance
	return nil, nil
}
