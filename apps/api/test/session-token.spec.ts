import { describe, expect, it } from "vitest";
import { createOpaqueToken, hashOpaqueToken } from "../src/modules/auth/session-token";

describe("opaque session tokens", () => {
  it("generates high-entropy unique tokens and stores only deterministic hashes", () => {
    const first = createOpaqueToken();
    const second = createOpaqueToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(43);
    expect(hashOpaqueToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashOpaqueToken(first)).toBe(hashOpaqueToken(first));
    expect(hashOpaqueToken(first)).not.toBe(hashOpaqueToken(second));
    expect(hashOpaqueToken(first)).not.toContain(first);
  });
});
