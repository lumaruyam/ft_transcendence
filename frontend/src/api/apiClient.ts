// Owner: Track 1 (Foundation, Auth, and API infrastructure)
// Responsible for: the shared frontend API client — attaches auth headers and handles base request/response plumbing for every other module.

interface ApiRequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
}

// apiRequest is the single low-level function every feature module's API wrapper (kanban, notes, attachments, ...) is built on.
async function apiRequest<T>(options: ApiRequestOptions): Promise<T> {
  // TODO: attach the stored JWT as an Authorization header
  // TODO: serialize body as JSON, handle non-2xx responses by throwing a typed ApiError
  // TODO: parse and return the JSON response body as T
  throw new Error("not implemented");
}

// getCurrentUser fetches the logged-in user's profile, used across the app for header/profile display.
async function getCurrentUser(): Promise<unknown> {
  // TODO: GET /api/users/me via apiRequest
  return undefined;
}
