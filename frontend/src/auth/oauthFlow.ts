// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the OAuth2 login UI flow (GitHub only), layered on top of the email/password baseline.

function startOAuthLogin(): void {
  // TODO: fetch the redirect URL from the backend (GetOAuthRedirectURL) and navigate to it
}

async function handleOAuthCallback(code: string): Promise<void> {
  // TODO: POST code to the backend callback endpoint, store the returned JWT
  // TODO: on success, note that this also lets Track 3's Git integration use the same OAuth token later
}
