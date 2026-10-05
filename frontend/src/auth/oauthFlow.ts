/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   oauthFlow.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/20 18:26:24 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/27 19:07:57 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the OAuth2 login UI flow (GitHub only), layered on top of the email/password baseline

import { storeToken } from "./authClient";

const DASHBOARD_PATH = "/app";
const LOGIN_PATH = "/login";

const GITHUB_OAUTH_START_PATH = "/api/auth/oauth/github/redirect";

// startOAuthLogin sends the browser to the backend's GitHub OAuth entry point
export function startOAuthLogin(): void {
	window.location.href = GITHUB_OAUTH_START_PATH;
}

// handleOAuthCallback reads the token/error the backend left in the URL fragment after GitHub's redirect,
// stores the session on success, and sends the user on. Meant to be called on load from
// frontend/src/auth-callback/main.ts. `container`, if given, is where a status/error message is rendered;
// it's optional so the redirect logic still runs even if the page has nowhere to show one.
export async function handleOAuthCallback(container?: HTMLElement): Promise<void> {
	const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
	const token = params.get("token");
	const error = params.get("error");

	history.replaceState(null, "", window.location.pathname);

	if (error) {
		renderStatus(container, oauthErrorMessage(error), true);
		return;
	}

	if (!token) {
		renderStatus(container, "No token was returned from GitHub. Please try logging in again.", true);
		return;
	}

	// Only a token comes back through the fragment (oauthCallbackHandler redirects with just #token=...,
	// no user JSON), whichever page loads next is responsible for fetching the profile itself, e.g. via
	// apiClient.ts's getCurrentUser() once that's implemented
	storeToken(token);
	renderStatus(container, "Signed in. Redirecting...", false);
	window.location.href = DASHBOARD_PATH;
}

// oauthErrorMessage maps the error `name`s oauthCallbackHandler forwards (see its catch block in
// auth.routes.ts) to a message a user can act on
function oauthErrorMessage(error: string): string {
	switch (error) {
		case "OAuthNotConfiguredError":
			return "GitHub login isn't available right now. Please log in with email and password instead.";
		case "OAuthStateError":
			return "Your login attempt expired or couldn't be verified. Please try again.";
		case "OAuthExchangeError":
			return "GitHub couldn't be reached to finish signing you in. Please try again.";
		case "OAuthAccountConflictError":
			return "This GitHub account is already linked to another user.";
		default:
			return "Something went wrong signing you in with GitHub.";
	}
}

function renderStatus(container: HTMLElement | undefined, message: string, isError: boolean): void {
	if (!container)
		return;
	container.innerHTML = "";

	const p = document.createElement("p");
	p.textContent = message;
	p.style.cssText = `color:${isError ? "#f87171" : "#e2e8f0"};font-size:.95rem;`;
	container.appendChild(p);

	if (isError) {
		const link = document.createElement("a");
		link.href = LOGIN_PATH;
		link.textContent = "Back to login";
		link.style.cssText = "color:#6366f1;text-decoration:none;display:inline-block;margin-top:1rem;";
		container.appendChild(link);
	}
}
