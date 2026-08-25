// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the login form UI and its frontend-side validation, part of the mandatory email/password baseline.

interface LoginFormValues {
  email: string;
  password: string;
}

// renderLoginForm mounts the login form into the given container element.
function renderLoginForm(container: HTMLElement): void {
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
