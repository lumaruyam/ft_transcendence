// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: backend-side validation rules for signup/login fields, per the mandatory dual frontend+backend validation requirement. TS equivalent of the ValidateSignupInput portion of backend/internal/auth/handlers.go (Go skeleton, removed).

export interface SignupInput {
  email: string;
  password: string;
  name: string;
}

// validateSignupInput checks required fields, email format, and password strength.
export function validateSignupInput(input: SignupInput): string[] {
  // TODO: validate email format, password minimum length/complexity, required name field
  // TODO: consider using a schema library (zod) or Fastify's built-in JSON schema validation instead of hand-rolled checks
  return [];
}
