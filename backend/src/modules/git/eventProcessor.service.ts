// Owner: Track 3 (Git integration)
// Responsible for: matching incoming webhook payloads to the correct card and driving PR-lifecycle status transitions (PR pending → Done). TS equivalent of backend/internal/git/eventProcessor.go (Go skeleton, removed).

// processPushEvent handles a `push` webhook payload.
export async function processPushEvent(payload: unknown): Promise<void> {
  // TODO: parse the push payload, match branch to a git_links row via matchCardByGitLink
  // TODO: no status transition on plain push per the design doc — this is mainly for audit logging
}

// processPullRequestEvent handles a `pull_request` webhook payload (opened).
export async function processPullRequestEvent(payload: unknown): Promise<void> {
  // TODO: on PR opened, match the card via matchCardByGitLink and call transitionCardStatus to "PR pending"
  // TODO: fire a notification via Track 4's notifications.service.ts once the card moves
}

// processMergeEvent handles a merge-to-main webhook payload.
export async function processMergeEvent(payload: unknown): Promise<void> {
  // TODO: match the card via matchCardByGitLink and call transitionCardStatus to "Done"
  // TODO: fire a notification via Track 4's notifications.service.ts
}

// matchCardByGitLink finds the card linked to a given repo+branch, per the git_links table.
export async function matchCardByGitLink(repoUrl: string, branchName: string): Promise<string | null> {
  // TODO: prisma.gitLink.findFirst({ where: { repoUrl, branchName } }), return the associated cardId
  return null;
}

// transitionCardStatus drives the actual card move by calling into Track 2 Person A's card service.
export async function transitionCardStatus(cardId: string, newStatus: string): Promise<void> {
  // TODO: call kanban's updateCard (or a dedicated status-transition function) so the move also broadcasts over Socket.IO
}
