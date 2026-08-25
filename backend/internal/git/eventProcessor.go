// Owner: Track 3 (Git integration)
// Responsible for: matching incoming webhook payloads to the correct card and driving PR-lifecycle status transitions (PR pending → Done).
package git

import "context"

// ProcessPushEvent handles a `push` webhook payload.
func ProcessPushEvent(ctx context.Context, payload []byte) error {
	// TODO: parse the push payload, match branch to a git_links row via MatchCardByGitLink
	// TODO: no status transition on plain push per the design doc — this is mainly for audit logging
	return nil
}

// ProcessPullRequestEvent handles a `pull_request` webhook payload (opened).
func ProcessPullRequestEvent(ctx context.Context, payload []byte) error {
	// TODO: on PR opened, match the card via MatchCardByGitLink and call TransitionCardStatus to "PR pending"
	// TODO: fire a notification via Track 4's notifications package once the card moves
	return nil
}

// ProcessMergeEvent handles a merge-to-main webhook payload.
func ProcessMergeEvent(ctx context.Context, payload []byte) error {
	// TODO: match the card via MatchCardByGitLink and call TransitionCardStatus to "Done"
	// TODO: fire a notification via Track 4's notifications package
	return nil
}

// MatchCardByGitLink finds the card linked to a given repo+branch, per the git_links table.
func MatchCardByGitLink(ctx context.Context, repoURL string, branchName string) (cardID uint, err error) {
	// TODO: query git_links for (repo_url, branch_name), return the associated card_id
	return 0, nil
}

// TransitionCardStatus drives the actual card move by calling into Track 2 Person A's card API.
func TransitionCardStatus(ctx context.Context, cardID uint, newStatus string) error {
	// TODO: call kanban.UpdateCard (or a dedicated status-transition function) so the move also broadcasts over WebSocket
	return nil
}
