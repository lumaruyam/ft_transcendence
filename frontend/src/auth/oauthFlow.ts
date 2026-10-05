// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the GitHub OAuth login flow.

import { storeToken } from "./authClient";
import { safeNext } from "../shared/session";

const GITHUB_OAUTH_START_PATH = "/api/auth/oauth/github/redirect";
const NEXT_KEY = "ft_oauth_next";

// `next` is saved because the OAuth redirect drops the query string
export function startOAuthLogin(next?: string): void {
  try {
    if (next) sessionStorage.setItem(NEXT_KEY, next);
    else sessionStorage.removeItem(NEXT_KEY);
  } catch {
    // storage unavailable: land on the dashboard
  }
  window.location.href = GITHUB_OAUTH_START_PATH;
}

export type OAuthResult = { ok: true; next: string } | { ok: false; message: string };

// reads and clears the URL fragment, stores the token on success
export function readOAuthResult(): OAuthResult {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const token = params.get("token");
  const error = params.get("error");
  history.replaceState(null, "", window.location.pathname);

  if (error) return { ok: false, message: oauthErrorMessage(error) };
  if (!token) return { ok: false, message: "GitHub n'a renvoyé aucune information de connexion. Réessayez." };

  storeToken(token);
  let next = "/app";
  try {
    next = safeNext(sessionStorage.getItem(NEXT_KEY));
    sessionStorage.removeItem(NEXT_KEY);
  } catch {
  }
  return { ok: true, next };
}

// maps the error names sent by oauthCallbackHandler to messages
function oauthErrorMessage(error: string): string {
  switch (error) {
    case "OAuthNotConfiguredError":
      return "La connexion avec GitHub n'est pas disponible pour l'instant. Utilisez votre e-mail et votre mot de passe.";
    case "OAuthStateError":
      return "La tentative de connexion a expiré ou n'a pas pu être vérifiée. Réessayez.";
    case "OAuthExchangeError":
      return "GitHub n'a pas pu être joint pour terminer la connexion. Réessayez dans un instant.";
    case "OAuthAccountConflictError":
      return "Ce compte GitHub est déjà lié à un autre utilisateur.";
    default:
      return "Un problème est survenu pendant la connexion avec GitHub.";
  }
}
