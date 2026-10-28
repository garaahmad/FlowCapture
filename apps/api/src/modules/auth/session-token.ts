import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "fc_session";

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
