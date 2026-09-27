/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   signupForm.ts                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lulmaruy <lulmaruy@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/09/20 18:29:03 by lulmaruy          #+#    #+#             */
/*   Updated: 2026/09/27 18:10:00 by lulmaruy         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the signup form UI and its frontend-side validation, part of the mandatory email/password baseline

import { signup, storeAuthSession, AuthApiError } from "./authClient";
import { startOAuthLogin } from "./oauthFlow";

export interface SignupFormValues {
	email: string;
	password: string;
	name: string;
}

// Mirrors backend/src/modules/auth/auth.validation.ts's validateSignupInput exactly
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const DASHBOARD_PATH = "/app";
const LOGIN_PATH = "/login";

// validateSignupForm applies frontend-side validation — email format, password strength, required name
export function validateSignupForm(values: SignupFormValues): string[] {
	const errors: string[] = [];

	if (!values.email.trim() || !EMAIL_RE.test(values.email.trim())) {
		errors.push("Enter a valid email address.");
	}
	if (!values.password || values.password.length < MIN_PASSWORD_LENGTH) {
		errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
	} else if (!/[a-zA-Z]/.test(values.password) || !/[0-9]/.test(values.password)) {
		errors.push("Password must contain at least one letter and one number.");
	}
	if (!values.name.trim()) {
		errors.push("Name is required.");
	}

	return errors;
}

// submitSignup calls the backend signup endpoint and stores the returned session
async function submitSignup(values: SignupFormValues): Promise<void> {
	const session = await signup({
		email: values.email.trim().toLowerCase(),
		password: values.password,
		name: values.name.trim(),
	});
	storeAuthSession(session);
	window.location.href = DASHBOARD_PATH;
}

function signupErrorMessage(err: unknown): string {
	if (err instanceof AuthApiError) {
		if (err.status === 409)
			return "An account with this email already exists.";
		if (err.details.length > 0)
			return err.details.join(" ");
		if (err.status === 0)
			return err.message;
	}
	return "Something went wrong. Please try again.";
}

// renderSignupForm mounts the signup form into the given container element
export function renderSignupForm(container: HTMLElement): void {
	container.innerHTML = "";
	container.style.cssText = "max-width:360px;width:100%;font-family:sans-serif;color:#e2e8f0;";

	const form = document.createElement("form");
	form.noValidate = true;

	const heading = document.createElement("h1");
	heading.textContent = "Create your account";
	heading.style.cssText = "font-size:1.75rem;margin-bottom:1.25rem;";
	form.appendChild(heading);

	const nameField = createField("name", "Name", "text");
	const emailField = createField("email", "Email", "email");
	const passwordField = createField("password", "Password", "password");
	form.appendChild(nameField.wrapper);
	form.appendChild(emailField.wrapper);
	form.appendChild(passwordField.wrapper);

	const errorBox = document.createElement("div");
	errorBox.setAttribute("role", "alert");
	errorBox.style.cssText = "color:#f87171;font-size:.85rem;margin:.5rem 0 1rem;min-height:1.1em;";
	form.appendChild(errorBox);

	const submitButton = document.createElement("button");
	submitButton.type = "submit";
	submitButton.textContent = "Sign up";
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
	links.appendChild(createLink(LOGIN_PATH, "Already have an account? Log in"));
	form.appendChild(links);

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		void handleSubmit();
	});

	async function handleSubmit(): Promise<void> {
		const values: SignupFormValues = {
			email: emailField.input.value,
			password: passwordField.input.value,
			name: nameField.input.value,
		};

		const errors = validateSignupForm(values);
		if (errors.length > 0) {
			errorBox.textContent = errors[0];
			return;
		}

		errorBox.textContent = "";
		setBusy(true);
		try {
			await submitSignup(values);
		} catch (err) {
			errorBox.textContent = signupErrorMessage(err);
		} finally {
			setBusy(false);
		}
	}

	function setBusy(busy: boolean): void {
		submitButton.disabled = busy;
		oauthButton.disabled = busy;
		submitButton.textContent = busy ? "Creating account..." : "Sign up";
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
	input.autocomplete = type === "password" ? "new-password" : type === "email" ? "email" : "name";
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
		: "width:100%;padding:.65rem;border:1px solid #334155;border-radius:6px;background:transparent;color:#e2e8f0;font-size:.95rem;cursor:pointer;margin-top:.75rem;";
}
