import { describe, expect, it } from "vitest";
import type { User, Workspace } from "@flowcapture/database";
import { toUserProfile } from "../src/modules/auth/user.mapper";

describe("toUserProfile", () => {
  it("returns explicit public fields without password or internal timestamps", () => {
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      slug: "personal-example",
      name: "Personal",
      planCode: "free",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const user: User & { workspace: Workspace } = {
      id: crypto.randomUUID(),
      workspaceId: workspace.id,
      email: "user@example.com",
      passwordHash: "$argon2id$secret-hash",
      displayName: "Flow User",
      preferredLanguage: "en",
      timezone: "UTC",
      usageCategory: null,
      dateFormat: "system",
      status: "ACTIVE",
      emailVerifiedAt: null,
      onboardingCompletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      workspace,
    };
    const result = toUserProfile(user);
    expect(result.email).toBe("user@example.com");
    expect(JSON.stringify(result)).not.toContain("argon2");
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("createdAt");
  });
});
