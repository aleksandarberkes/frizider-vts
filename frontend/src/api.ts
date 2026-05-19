export const API_BASE_URL = 'http://localhost/frizider-vts/backend';

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
      'Content-Type': 'application/json',
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

export const api = { get, post, put, delete: del };
