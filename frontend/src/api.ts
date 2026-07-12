// API base URL resolution:
//  - honor an explicit REACT_APP_API_BASE_URL if provided at build time
//  - in a production build, default to the same origin the app is served from
//    (the PHP API lives at <origin>/backend) — works on http or https, any host
//  - in local development, hit the XAMPP-served backend
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === 'production' && typeof window !== 'undefined'
    ? `${window.location.origin}/backend`
    : 'http://localhost/frizider-vts/backend');

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function buildRequest(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init.headers ?? {}),
    },
  });
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await buildRequest(path, init);
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const message =
      typeof data?.error === 'string' ? data.error : `HTTP ${response.status}`;

    throw new ApiError(response.status, message);
  }

  return data as T;
}

function get<T>(path: string) {
  return request<T>(path);
}

function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function put<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function del<T>(path: string) {
  return request<T>(path, {
    method: 'DELETE',
  });
}

function upload<T>(path: string, body: FormData) {
  return request<T>(path, {
    method: 'POST',
    body,
  });
}

export const api = { get, post, put, delete: del, upload };
