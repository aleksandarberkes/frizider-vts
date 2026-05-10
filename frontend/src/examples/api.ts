// Thin fetch wrapper. Two important details:
//   1. credentials: 'include'  — required so the PHPSESSID cookie is sent on
//      every request. Without this, the backend can never see your session.
//   2. JSON in / JSON out — the backend always replies with JSON; on error it
//      returns { error: "..." } with a non-2xx status code, which we surface
//      as an ApiError so callers can handle it cleanly.

export const API_BASE_URL = 'http://localhost/frizider-vts/backend';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
};
