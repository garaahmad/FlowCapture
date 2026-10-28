import type { ApiData, ApiErrorBody } from "@flowcapture/shared-types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
  const response = await fetch(`/backend${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  const text = await response.text();
  let payload: unknown;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError("The server returned an invalid response.", response.status, "INVALID_RESPONSE");
    }
  }
  if (!response.ok) {
    const body = payload as ApiErrorBody | undefined;
    throw new ApiError(
      body?.error?.message ?? "The request could not be completed.",
      response.status,
      body?.error?.code ?? "REQUEST_ERROR",
      body?.error?.requestId,
    );
  }
  return payload as T;
}

export async function apiData<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch<ApiData<T>>(path, init);
  return response.data;
}

export function jsonBody(value: unknown): string {
  return JSON.stringify(value);
}
