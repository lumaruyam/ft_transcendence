// Responsible for: fetch/error/auth helpers shared by boardApi.ts, listApi.ts and cardApi.ts.
// Temporary: talks to the backend directly, bypassing the shared frontend/src/api/apiClient.ts
// (still unimplemented, Track 1). Swap every kanban *Api.ts file to apiClient once it lands.

// TODO(Track 1): centralize this in apiClient once auth/token storage is decided
// "ft_auth_token" is a placeholder key, not yet used by any login flow.
const AUTH_TOKEN_KEY = "ft_auth_token";

// TODO: temporary dev-only base URL (backend container's port is mapped to the host for now,
// see docker-compose.yml). Replace with a proper env-based config once apiClient.ts exists.
export const BASE_URL = "http://localhost:3000/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function authHeaders(): HeadersInit {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? body.error ?? res.statusText);
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
