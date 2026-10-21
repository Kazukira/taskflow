
const API_URL = import.meta.env.VITE_API_URL ?? "";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function getCsrfToken(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/csrf`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Не удалось получить CSRF-токен");
  }

  const data: { csrf_token: string } = await response.json();
  return data.csrf_token;
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = await getCsrfToken();
    headers.set("X-CSRF-Token", csrfToken);
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
    body:
      options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = `Ошибка API: ${response.status}`;

    try {
      const data: { detail?: string } = await response.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Ответ не содержит JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type User = {
  id: number;
  email: string;
  created_at: string;
};

export type AuthInput = {
  email: string;
  password: string;
};
