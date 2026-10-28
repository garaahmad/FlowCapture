-- Phase 2 persisted conversations, immutable plans, and exact-version approvals.

CREATE TYPE "ConversationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
CREATE TYPE "MessageKind" AS ENUM ('TEXT', 'CLARIFICATION', 'PLAN', 'ERROR');
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'NEEDS_CLARIFICATION', 'APPROVED', 'CHANGES_REQUESTED');
CREATE TYPE "Feasibility" AS ENUM ('SUPPORTED', 'PARTIALLY_SUPPORTED', 'UNSUPPORTED');

CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'DRAFT',
    "draft_state" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "archived_at" TIMESTAMPTZ(6),
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "role" "MessageRole" NOT NULL,
    "kind" "MessageKind" NOT NULL DEFAULT 'TEXT',
    "content" TEXT NOT NULL,
    "payload" JSONB,
    "plan_id" UUID,
    "client_message_id" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "automation_plans" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "definition" JSONB NOT NULL,
    "content_hash" CHAR(64) NOT NULL,
    "feasibility" Feasibility NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "automation_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "plan_approvals" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "approved_by_user_id" UUID NOT NULL,
    "plan_hash" CHAR(64) NOT NULL,
    "approved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plan_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversations_id_workspace_id_key" ON "conversations"("id", "workspace_id");
CREATE INDEX "conversations_workspace_id_updated_at_idx" ON "conversations"("workspace_id", "updated_at");
CREATE UNIQUE INDEX "messages_conversation_id_client_message_id_key" ON "messages"("conversation_id", "client_message_id");
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");
CREATE INDEX "messages_workspace_id_created_at_idx" ON "messages"("workspace_id", "created_at");
CREATE UNIQUE INDEX "automation_plans_conversation_id_version_key" ON "automation_plans"("conversation_id", "version");
CREATE UNIQUE INDEX "automation_plans_id_workspace_id_key" ON "automation_plans"("id", "workspace_id");
CREATE INDEX "automation_plans_workspace_id_created_at_idx" ON "automation_plans"("workspace_id", "created_at");
CREATE UNIQUE INDEX "plan_approvals_plan_id_key" ON "plan_approvals"("plan_id");
CREATE INDEX "plan_approvals_workspace_id_approved_at_idx" ON "plan_approvals"("workspace_id", "approved_at");

ALTER TABLE "conversations"
    ADD CONSTRAINT "conversations_user_id_workspace_id_fkey"
    FOREIGN KEY ("user_id", "workspace_id") REFERENCES "users"("id", "workspace_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages"
    ADD CONSTRAINT "messages_conversation_id_workspace_id_fkey"
    FOREIGN KEY ("conversation_id", "workspace_id") REFERENCES "conversations"("id", "workspace_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "automation_plans"
    ADD CONSTRAINT "automation_plans_conversation_id_workspace_id_fkey"
    FOREIGN KEY ("conversation_id", "workspace_id") REFERENCES "conversations"("id", "workspace_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_approvals"
    ADD CONSTRAINT "plan_approvals_plan_id_workspace_id_fkey"
    FOREIGN KEY ("plan_id", "workspace_id") REFERENCES "automation_plans"("id", "workspace_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_approvals"
    ADD CONSTRAINT "plan_approvals_approved_by_user_id_workspace_id_fkey"
    FOREIGN KEY ("approved_by_user_id", "workspace_id") REFERENCES "users"("id", "workspace_id") ON DELETE CASCADE ON UPDATE CASCADE;
