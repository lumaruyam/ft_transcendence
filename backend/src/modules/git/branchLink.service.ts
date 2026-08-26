// Owner: Track 3 (Git integration)
// Responsible for: GitHub/GitLab API calls to create or link a branch to a card, using the OAuth token from Track 1. TS equivalent of backend/internal/git/branchLink.go (Go skeleton, removed); go-github is replaced by Octokit (GitHub) and a GitLab REST client such as @gitbeaker/rest (GitLab).
import type { GitLink } from "@prisma/client";

// createBranch creates a new branch on the linked repository via the provider's API.
export async function createBranch(userId: string, repoUrl: string, branchName: string): Promise<void> {
  // TODO: fetch the user's stored OAuth access token (from Track 1's oauth.service.ts linkOAuthAccount flow)
  // TODO: GitHub — use Octokit (`new Octokit({ auth: token })`) to create the branch (git.createRef) from the repo's default branch
  // TODO: GitLab — use a GitLab REST client (e.g. @gitbeaker/rest) to call the equivalent create-branch endpoint
  // TODO: branch the implementation on the repo's provider (derive from repoUrl or a stored provider field)
}

// linkCardToBranch associates a Kanban card with a Git branch, creating the git_links row.
export async function linkCardToBranch(
  cardId: string,
  repoUrl: string,
  branchName: string
): Promise<GitLink> {
  // TODO: prisma.gitLink.upsert for this card
  // TODO: populate the card's linkedBranch field (Track 2 Person A's cards.service.ts owns the Card row itself)
  throw new Error("not implemented");
}

// listBranches lists existing branches on a repo, for the "pick an existing branch" UI option.
export async function listBranches(userId: string, repoUrl: string): Promise<string[]> {
  // TODO: Octokit repos.listBranches (GitHub) or the GitLab client's branch-listing call, using the user's OAuth token
  return [];
}
