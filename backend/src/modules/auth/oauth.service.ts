// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: OAuth2 login flow (GitHub/GitLab), covering the OAuth minor module and feeding the credential source Track 3 needs for Octokit/GitLab API calls. TS equivalent of backend/internal/auth/oauth.go (Go skeleton, removed).
import type { User } from "@prisma/client";

// getOAuthRedirectUrl builds the provider consent-screen URL the frontend redirects the user to.
export function getOAuthRedirectUrl(provider: "github" | "gitlab"): string {
  // TODO: look up the client ID/redirect URI for the given provider from src/config/env.ts
  // TODO: build the authorize URL with the requested scopes (repo scope needed for Track 3's Git integration)
  throw new Error("not implemented");
}

// handleOAuthCallback exchanges the provider's auth code for a token, creates/links the User, and returns them.
export async function handleOAuthCallback(
  provider: "github" | "gitlab",
  code: string
): Promise<User> {
  // TODO: exchange code for an access token with the provider (Octokit OAuth app flow for GitHub; GitLab's OAuth2 token endpoint for GitLab)
  // TODO: fetch the provider profile and find-or-create the matching User row via prisma (oauthProvider, oauthId)
  // TODO: persist the OAuth access token securely so Track 3's git module can use it for branch/webhook API calls
  throw new Error("not implemented");
}

// linkOAuthAccount attaches an OAuth identity to an already-authenticated user (adding OAuth on top of email/password).
export async function linkOAuthAccount(
  userId: string,
  provider: "github" | "gitlab",
  oauthId: string
): Promise<void> {
  // TODO: verify the OAuth identity isn't already linked to a different account
  // TODO: update the user's oauthProvider/oauthId fields via prisma.user.update
}
