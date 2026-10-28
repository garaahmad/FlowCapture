import { describe, expect, it, vi } from "vitest";
import type { AutomationPlan, PlanApproval } from "@flowcapture/database";
import { PlansService } from "../src/modules/planning/plans.service";
import type { PrismaService } from "../src/modules/database/prisma.service";
import { DeterministicPlanner } from "../src/modules/planning/deterministic.planner";
import { FeasibilityService } from "../src/modules/planning/feasibility.service";
import { hashPlanDefinition } from "../src/modules/planning/plan-hash";
import type { AuthenticatedContext } from "../src/modules/auth/auth.context";

async function planRecord() {
  const intent = await new DeterministicPlanner().generate({
    message: "Read https://example.com/data.json and summarize it", timezone: "UTC", history: [],
  });
  const definition = new FeasibilityService().buildPlan(intent, "deterministic");
  const id = crypto.randomUUID();
  const approval: PlanApproval = {
    id: crypto.randomUUID(), planId: id, workspaceId: crypto.randomUUID(), approvedByUserId: crypto.randomUUID(),
    planHash: hashPlanDefinition(definition), approvedAt: new Date(),
  };
  const plan: AutomationPlan & { approvals: PlanApproval[] } = {
    id, conversationId: crypto.randomUUID(), workspaceId: approval.workspaceId, version: 1,
    status: "DRAFT", definition, contentHash: approval.planHash, feasibility: "SUPPORTED",
    createdAt: new Date(), approvals: [],
  };
  return { plan, approval };
}

describe("PlansService approval", () => {
  it("records approval for the exact immutable plan hash", async () => {
    const { plan, approval } = await planRecord();
    const updated = { ...plan, status: "APPROVED" as const, approvals: [approval] };
    const transaction = {
      planApproval: { create: vi.fn().mockResolvedValue(approval) },
      automationPlan: { update: vi.fn().mockResolvedValue(updated) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
    };
    const prisma = {
      automationPlan: { findFirst: vi.fn().mockResolvedValue(plan) },
      $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) => callback(transaction)),
    } as unknown as PrismaService;
    const auth = { userId: approval.approvedByUserId, workspaceId: plan.workspaceId } as AuthenticatedContext;
    const result = await new PlansService(prisma).approve(auth, plan.id, {
      version: 1, contentHash: plan.contentHash, confirmScopes: true,
    });
    expect(result.status).toBe("approved");
    expect(transaction.planApproval.create).toHaveBeenCalledWith({ data: expect.objectContaining({ planHash: plan.contentHash }) });
  });

  it("rejects a stale content hash before any write", async () => {
    const { plan } = await planRecord();
    const prisma = {
      automationPlan: { findFirst: vi.fn().mockResolvedValue(plan) },
      $transaction: vi.fn(),
    } as unknown as PrismaService;
    const auth = { userId: crypto.randomUUID(), workspaceId: plan.workspaceId } as AuthenticatedContext;
    await expect(new PlansService(prisma).approve(auth, plan.id, {
      version: 1, contentHash: "0".repeat(64), confirmScopes: true,
    })).rejects.toMatchObject({ code: "PLAN_VERSION_CONFLICT" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
