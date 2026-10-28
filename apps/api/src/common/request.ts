import type { Request } from "express";

export function getRequestId(request: Request): string | undefined {
  if (typeof request.id === "string" || typeof request.id === "number") {
    return String(request.id);
  }
  return request.header("x-request-id")?.slice(0, 100);
}
