"use client";

export type ApiErrorShape = {
  error: {
    code: string;
    message: string;
  };
};

export class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeoutMs?: number;
};

async function request<T>(input: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 10000, body, headers, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await res.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = null;
      }
    }

    if (!res.ok) {
      const err = payload as ApiErrorShape | null;
      const code = err?.error?.code ?? "HTTP_ERROR";
      const message = err?.error?.message ?? `Request failed (${res.status})`;
      throw new ApiClientError(res.status, code, message);
    }

    if (payload == null) {
      throw new ApiClientError(500, "INVALID_JSON", "Invalid or empty JSON response");
    }
    const wrapped = payload as { data: T };
    return wrapped.data;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiClientError(408, "TIMEOUT", "Request timeout");
    }
    throw new ApiClientError(500, "NETWORK_ERROR", "Network error");
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  get: <T>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: "GET" }),
  post: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "POST", body }),
  patch: <T>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>(url, { ...options, method: "PATCH", body }),
  delete: <T>(url: string, options?: RequestOptions) => request<T>(url, { ...options, method: "DELETE" }),
};
