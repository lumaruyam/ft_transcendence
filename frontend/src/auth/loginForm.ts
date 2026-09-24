/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   loginForm.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/20 18:26:16 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/20 18:26:18 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the login form UI and its frontend-side validation, part of the mandatory email/password baseline.

import { login, storeAuthSession, AuthApiError } from "./authClient";
import { startOAuthLogin } from "./oauthFlow";

interface LoginFormValues {
  email: string;
  password: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DASHBOARD_PATH = "/app";
const SIGNUP_PATH = "/signup";
const FORGOT_PASSWORD_PATH = "/forgot-password";

export function validateLoginForm(values: LoginFormValues): string[] {
  const errors: string[] = [];
  if (!values.email.trim()) {
    errors.push("email is required.");
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.push("Enter a valid email address.");
  }
  if (!values.password) {
    errors.push("password is required.");
  }
  return errors;
}

// renderLoginForm mounts the login form into the given container element
function renderLoginForm(container: HTMLElement): void {
  container.innerHTML = "";
  container.style.cssText = "max-width:360px;width:100%;font-family:sans-serif;color:#e2e8f0;";
  
  const form = document.createElement("Form");
  form.noValidate = true; // turn off the HTML automatic validation to use validateLoginForm
  const.heading = document.createElement("h1");
  heading.textContent = "Log in";
  heading.style.cssText = "font-size:1.75rem;margin-bottom:1.25rem;";
  form.appendChild(heading);

  const emailField = createField("email", "Email", "email");
  const passwordField = createField("password", "Password", "password");
  form.appendChild(emailField.wrapper);
  form.appendChild(passwordField.wrapper);

  const errorBox = document.createElement("div");
  errorBox.setAttribute("role", "alert");
  errorBox.style.cssText = "color:#f87171;font-size:.85rem;margin:.5rem 0 1rem;min-height:1.1em;";
  form.appendChild(errorBox);
  
    
  // TODO: render email/password inputs and a submit button
  // TODO: wire submit to validateLoginForm then submitLogin
}

// validateLoginForm applies frontend-side validation before hitting the API — mandatory dual validation requirement.
function validateLoginForm(values: LoginFormValues): string[] {
  // TODO: check email format and non-empty password; return a list of error messages (empty = valid)
  return [];
}

// submitLogin calls the backend login endpoint via the shared API client and stores the returned JWT.
async function submitLogin(values: LoginFormValues): Promise<void> {
  // TODO: POST to /api/auth/login via frontend/src/api/apiClient.ts
  // TODO: store the returned JWT (e.g. in memory + httpOnly-friendly storage strategy) and redirect to the project dashboard
}
