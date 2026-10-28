import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@flowcapture/database";
import { AuthService } from "../src/modules/auth/auth.service";
import type { PrismaService } from "../src/modules/database/prisma.service";
import type { MailService } from "../src/modules/auth/mail.service";
import type { AppEnvironment } from "../src/config/environment";

const enabled = process.env.RUN_DATABASE_TESTS === "1";
const prisma = new PrismaClient();
const config = { get: vi.fn(() => 30) } as unknown as ConfigService<AppEnvironment, true>;
const mail = { configured: false } as MailService;
const auth = new AuthService(prisma as unknown as PrismaService, config, mail);
const emails = new Set<string>();

describe.skipIf(!enabled)("PostgreSQL identity integration", () => {
  beforeAll(async () => { await prisma.$connect(); });
  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [...emails] } } });
    emails.clear();
  });
  afterAll(async () => { await prisma.$disconnect(); });

  it("registers, authenticates, isolates workspaces, and revokes a session", async () => {
    const firstEmail = `first-${crypto.randomUUID()}@example.com`;
    const secondEmail = `second-${crypto.randomUUID()}@example.com`;
    emails.add(firstEmail).add(secondEmail);
    const first = await auth.register({ email: firstEmail, password: "a-long-password", displayName: "First" }, {});
    const second = await auth.register({ email: secondEmail, password: "another-long-password", displayName: "Second" }, {});

    expect(first.user.workspaceId).not.toBe(second.user.workspaceId);
    expect(await prisma.user.findFirst({ where: { id: first.user.id, workspaceId: second.user.workspaceId } })).toBeNull();

    const login = await auth.login({ email: firstEmail, password: "a-long-password" }, {});
    expect(login.user.id).toBe(first.user.id);
    await auth.logout(first.sessionToken);
    const revoked = await prisma.session.findUnique({ where: { id: first.session.id } });
    expect(revoked?.revokedAt).not.toBeNull();
  });
});
