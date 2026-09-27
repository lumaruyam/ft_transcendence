/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   loginForm.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/20 18:26:16 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/27 16:10:33 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the login form UI and its frontend-side validation, part of the mandatory email/password baseline.

import { login, storeAuthSession, AuthApiError } from "./authClient";
import { startOAuthLogin } from "./oauthFlow";

export interface LoginFormValues {
	email: string;
	password: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DASHBOARD_PATH = "/app";
const SIGNUP_PATH = "/signup";
const FORGOT_PASSWORD_PATH = "/forgot-password";

// validateLoginForm applies frontend-side validation before hitting the API. mandatory dual validation requirement
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

// submitLogin calls the backend login endpoint via authClient and stores the returned session
async function submitLogin(values: LoginFormValues): Promise<void> {
	const session = await login({ email: values.email.trim().toLowerCase(), password: values.password });
	storeAuthSession(session);
	window.location.href = DASHBOARD_PATH;
}

function loginErrorMessage(err: unknown): string {
	if (err instanceof AuthApiError) {
		if (err.status === 401)
			return "Incorrect email or password.";
		if (err.details.length > 0)
			return err.details.join(" ");
		if (err.status === 0)
			return err.message;
	}
	return "Something went wrong. Please try again.";
}

// renderLoginForm mounts the login form into the given container element
export function renderLoginForm(container: HTMLElement): void {
	container.innerHTML = "";
	container.style.cssText = "max-width:360px;width:100%;font-family:sans-serif;color:#e2e8f0;";

	const form = document.createElement("form");
	form.noValidate = true; // turn off the HTML automatic validation to use validateLoginForm
	const heading = document.createElement("h1");
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

	const submitButton = document.createElement("button");
	submitButton.type = "submit";
	submitButton.textContent = "Log in";
	submitButton.style.cssText = buttonStyle(true);
	form.appendChild(submitButton);

	const divider = document.createElement("div");
	divider.textContent = "or";
	divider.style.cssText = "text-align:center;color:#64748b;font-size:.8rem;margin:1rem 0;";
	form.appendChild(divider);

	const oauthButton = document.createElement("button");
	oauthButton.type = "button";
	oauthButton.textContent = "Continue with GitHub";
	oauthButton.style.cssText = buttonStyle(false);
	oauthButton.addEventListener("click", () => startOAuthLogin());
	form.appendChild(oauthButton);

	const links = document.createElement("div");
	links.style.cssText = "margin-top:1.25rem;font-size:.875rem;";
	links.appendChild(createLink(SIGNUP_PATH, "Sign up"));
	links.appendChild(document.createTextNode(" · "));
	links.appendChild(createLink(FORGOT_PASSWORD_PATH, "Forgot password"));
	form.appendChild(links);

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		void handleSubmit();
	});

	async function handleSubmit(): Promise<void> {
		const values: LoginFormValues = {
			email: emailField.input.value,
			password: passwordField.input.value,
		};

		const errors = validateLoginForm(values);
		if (errors.length > 0) {
			errorBox.textContent = errors[0];
			return;
		}

		errorBox.textContent = "";
		setBusy(true);
		try {
			await submitLogin(values);
		} catch (err) {
			errorBox.textContent = loginErrorMessage(err);
		} finally {
			setBusy(false);
		}
	}

	function setBusy(busy: boolean): void {
		submitButton.disabled = busy;
		oauthButton.disabled = busy;
		submitButton.textContent = busy ? "Logging in…" : "Log in";
	}

	container.appendChild(form);
}

// --- small local DOM helpers (kept file-local until shared/components.ts is implemented)

function createField(id: string, labelText: string, type: string): { wrapper: HTMLElement; input: HTMLInputElement } {
	const wrapper = document.createElement("div");
	wrapper.style.cssText = "margin-bottom:1rem;";

	const label = document.createElement("label");
	label.htmlFor = id;
	label.textContent = labelText;
	label.style.cssText = "display:block;font-size:.85rem;color:#94a3b8;margin-bottom:.35rem;";

	const input = document.createElement("input");
	input.id = id;
	input.name = id;
	input.type = type;
	input.required = true;
	input.autocomplete = type === "password" ? "current-password" : "email";
	input.style.cssText = "width:100%;padding:.6rem .7rem;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:.95rem;box-sizing:border-box;";

	wrapper.appendChild(label);
	wrapper.appendChild(input);
	return { wrapper, input };
}

function createLink(href: string, text: string): HTMLAnchorElement {
	const a = document.createElement("a");
	a.href = href;
	a.textContent = text;
	a.style.cssText = "color:#6366f1;text-decoration:none;";
	return a;
}

function buttonStyle(primary: boolean): string {
	return primary
		? "width:100%;padding:.65rem;border:none;border-radius:6px;background:#6366f1;color:#fff;font-size:.95rem;cursor:pointer;"
		:  "width:100%;padding:.65rem;border:1px solid #334155;border-radius:6px;background:transparent;color:#e2e8f0;font-size:.95rem;cursor:pointer;margin-top:.75rem;";
}
