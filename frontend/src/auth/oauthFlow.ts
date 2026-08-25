// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the OAuth2 login UI flow (GitHub/GitLab), layered on top of the email/password baseline.

// startOAuthLogin redirects the browser to the provider's consent screen.
function startOAuthLogin(provider: "github" | "gitlab"): void {
  // TODO: fetch the redirect URL from the backend (GetOAuthRedirectURL) and navigate to it
}

// handleOAuthCallback runs on the OAuth callback route, exchanging the provider code for a session.
async function handleOAuthCallback(code: string, provider: "github" | "gitlab"): Promise<void> {
  // TODO: POST code+provider to the backend callback endpoint, store the returned JWT
  // TODO: on success, note that this also lets Track 3's Git integration use the same OAuth token later
}
