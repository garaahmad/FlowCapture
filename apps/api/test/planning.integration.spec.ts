import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@flowcapture/database";
import { AuthService, type AuthResult } from "../src/modules/auth/auth.service";
import type { MailService } from "../src/modules/auth/mail.service";
import type { AuthenticatedContext } from "../src/modules/auth/auth.context";
import type { PrismaService } from "../src/modules/database/prisma.service";
import type { AppEnvironment } from "../src/config/environment";
import { ConversationsService } from "../src/modules/planning/conversations.service";
import { DeterministicPlanner } from "../src/modules/planning/deterministic.planner";
import { FeasibilityService } from "../src/modules/planning/feasibility.service";
import { PlansService } from "../src/modules/planning/plans.service";

const enabled = process.env.RUN_DATABASE_TESTS === "1";
const prisma = new PrismaClient();
const config = { get: vi.fn(() => 30) } as unknown as ConfigService<AppEnvironment, true>;
const authService = new AuthService(prisma as unknown as PrismaService, config, { configured: false } as MailService);
const conversations = new ConversationsService(
  prisma as unknown as PrismaService,
  new FeasibilityService(),
  new DeterministicPlanner(),
);
const plans = new PlansService(prisma as unknown as PrismaService);
const emails = new Set<string>();

describe.skipIf(!enabled)("PostgreSQL planning integration", () => {
  beforeAll(async () => { await prisma.$connect(); });
  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [...emails] } } });
    emails.clear();
  });
  afterAll(async () => { await prisma.$disconnect(); });

  it("isolates tenants, deduplicates messages, and binds approval and revisions to exact versions", async () => {
    const first = await register("planning-first");
    const second = await register("planning-second");
    const firstAuth = context(first);
    const secondAuth = context(second);
    const conversation = await conversations.create(firstAuth, {});
    const content = "Read https://example.com/data.json and summarize it";
    const clientMessageId = crypto.randomUUID();
    const created = await conversations.sendMessage(firstAuth, conversation.id, { content, clientMessageId });
    const plan = created.plan;
    expect(plan?.status).toBe("draft");

    const duplicate = await conversations.sendMessage(firstAuth, conversation.id, { content, clientMessageId });
    expect(duplicate.assistant.id).toBe(created.assistant.id);
    await expect(conversations.get(secondAuth, conversation.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(plans.get(secondAuth, plan!.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(plans.approve(firstAuth, plan!.id, {
      version: plan!.version, contentHash: "0".repeat(64), confirmScopes: true,
    })).rejects.toMatchObject({ code: "PLAN_VERSION_CONFLICT" });

    const approved = await plans.approve(firstAuth, plan!.id, {
      version: plan!.version, contentHash: plan!.contentHash, confirmScopes: true,
    });
    expect(approved.status).toBe("approved");
    await plans.requestChanges(firstAuth, plan!.id, { comment: "Please revise this plan." });
    const revised = await conversations.sendMessage(firstAuth, conversation.id, {
      content, clientMessageId: crypto.randomUUID(),
    });
    expect(revised.plan).toMatchObject({ version: 2, status: "draft", contentHash: plan!.contentHash });
  });
});

async function register(prefix: string): Promise<AuthResult> {
  const email = `${prefix}-${crypto.randomUUID()}@example.com`;
  emails.add(email);
  return authService.register({ email, password: "a-long-password", displayName: prefix }, {});
}

function context(result: AuthResult): AuthenticatedContext {
  return {
    sessionId: result.session.id,
    userId: result.user.id,
    workspaceId: result.user.workspaceId,
    user: result.user,
  };
}
