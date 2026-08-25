// Owner: Track 3 (Git integration)
// Responsible for: GitHub/GitLab API calls to create or link a branch to a card, using the OAuth token from Track 1.
package git

import (
	"context"

	"ft-transcendence/internal/db"
)

// CreateBranch creates a new branch on the linked repository via the provider's API.
func CreateBranch(ctx context.Context, userID uint, repoURL string, branchName string) error {
	// TODO: fetch the user's stored OAuth access token (from Track 1's auth.LinkOAuthAccount flow)
	// TODO: call go-github (or GitLab equivalent) to create the branch from the repo's default branch
	return nil
}

// LinkCardToBranch associates a Kanban card with a Git branch, creating the git_links row.
func LinkCardToBranch(ctx context.Context, cardID uint, repoURL string, branchName string) (*db.GitLink, error) {
	// TODO: insert/update the git_links row for this card
	// TODO: populate the card's linked_branch field (Track 2 Person A's cards.go owns the Card row itself)
	return nil, nil
}

// ListBranches lists existing branches on a repo, for the "pick an existing branch" UI option.
func ListBranches(ctx context.Context, userID uint, repoURL string) ([]string, error) {
	// TODO: call the provider API to list branches using the user's OAuth token
	return nil, nil
}
