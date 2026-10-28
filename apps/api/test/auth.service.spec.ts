import { describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import type { Session, User, Workspace } from "@flowcapture/database";
import { AuthService } from "../src/modules/auth/auth.service";
import type { PrismaService } from "../src/modules/database/prisma.service";
import type { MailService } from "../src/modules/auth/mail.service";
import { hashOpaqueToken } from "../src/modules/auth/session-token";
import type { AppEnvironment } from "../src/config/environment";

describe("AuthService registration", () => {
  it("creates a personal workspace and persists only the session hash", async () => {
    const workspace: Workspace = {
      id: crypto.randomUUID(), slug: "personal-test", name: "Test's workspace", planCode: "free",
      createdAt: new Date(), updatedAt: new Date(),
    };
    const user: User & { workspace: Workspace } = {
      id: crypto.randomUUID(), workspaceId: workspace.id, email: "user@example.com",
      passwordHash: "stored-hash", displayName: "Test", preferredLanguage: "en", timezone: "UTC",
      usageCategory: null, dateFormat: "system", status: "ACTIVE", emailVerifiedAt: null,
      onboardingCompletedAt: null, createdAt: new Date(), updatedAt: new Date(), workspace,
    };
    const session: Session = {
      id: crypto.randomUUID(), tokenHash: "hash", userId: user.id, workspaceId: workspace.id,
      expiresAt: new Date(Date.now() + 10000), lastSeenAt: new Date(), revokedAt: null,
      userAgent: null, ipHash: null, createdAt: new Date(),
    };
    const transaction = {
      workspace: { create: vi.fn().mockResolvedValue(workspace) },
      user: { create: vi.fn().mockResolvedValue(user) },
      session: { create: vi.fn().mockResolvedValue(session) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) => callback(transaction)),
    } as unknown as PrismaService;
    const config = { get: vi.fn(() => 30) } as unknown as ConfigService<AppEnvironment, true>;
    const mail = { configured: false } as MailService;
    const service = new AuthService(prisma, config, mail);

    const result = await service.register({
      email: "user@example.com", password: "a-long-password", displayName: "Test",
    }, {});

    expect(result.user.workspaceId).toBe(workspace.id);
    const userInput = transaction.user.create.mock.calls[0]?.[0] as { data: { passwordHash: string } };
    expect(userInput.data.passwordHash).toMatch(/^\$argon2id\$/);
    expect(userInput.data.passwordHash).not.toContain("a-long-password");
    const sessionInput = transaction.session.create.mock.calls[0]?.[0] as { data: { tokenHash: string } };
    expect(sessionInput.data.tokenHash).toBe(hashOpaqueToken(result.sessionToken));
    expect(sessionInput.data.tokenHash).not.toBe(result.sessionToken);
    expect(transaction.auditLog.create).toHaveBeenCalledOnce();
  });
});
