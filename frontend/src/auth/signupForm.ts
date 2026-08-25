// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the signup form UI and its frontend-side validation, part of the mandatory email/password baseline.

interface SignupFormValues {
  email: string;
  password: string;
  name: string;
}

// renderSignupForm mounts the signup form into the given container element.
function renderSignupForm(container: HTMLElement): void {
  // TODO: render name/email/password inputs and a submit button
}

// validateSignupForm applies frontend-side validation — email format, password strength, required name.
function validateSignupForm(values: SignupFormValues): string[] {
  // TODO: mirror the backend's ValidateSignupInput rules so users get instant feedback
  return [];
}

// submitSignup calls the backend signup endpoint and stores the returned JWT.
async function submitSignup(values: SignupFormValues): Promise<void> {
  // TODO: POST to /api/auth/signup via the shared API client
}
