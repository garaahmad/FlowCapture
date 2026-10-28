# FlowCapture AI — Product Requirements Document

**Status:** Proposed specification  
**Product:** FlowCapture AI  
**Audience:** Product, engineering, design, QA, and AI coding agents  
**Primary implementation branch:** `develop`

## 1. Product vision
FlowCapture AI is a cloud SaaS platform that turns natural-language instructions into executable automations. The user describes a task in Arabic (including dialects) or English; the assistant clarifies missing details, verifies feasibility against a controlled registry of supported operations, presents an understandable plan and required permissions, and only then compiles, tests, and activates a workflow with explicit consent.

**Core journey:** Describe → Understand → Clarify → Check Feasibility → Plan → Approve → Build → Connect → Test → Activate → Monitor.

The product is general-purpose at the conversational layer but intentionally limited to supported actions in its first release. It must never pretend to support arbitrary browser or mobile automation.

## 2. Users and scope
- **Visitor:** View landing page, product explanation, examples, pricing, sign up.
- **User:** Own personal workspace, conversations, workflow plans, connections, workflows, executions, settings, and usage.
- **Admin:** Operate the service, monitor system health, manage abuse and plans without access to raw user secrets.

**MVP:** Single-user workspaces, no teams or marketplace. Focus on a reliable end-to-end workflow lifecycle, not breadth of integrations.

## 3. Functional requirements — all features

### F01 — Landing page
Present logo, navigation (Features, How It Works, Pricing, Login), headline, task-description input, Get Started CTA, examples, supported services, FAQs, privacy, terms, and contact. Preserve an anonymous visitor's draft task across signup when practical. Do not claim unsupported integrations.

### F02 — Authentication
Support email/password registration and login, Google sign-in if configured, email verification, password reset, logout, session management, account deletion, brute-force protection, secure password hashing, and authorization. Keep application authentication separate from third-party OAuth connection permissions.

### F03 — Onboarding
Collect preferred language, timezone, and optional usage category (personal, business, developer). Show examples and take the user into their first chat. Allow skipping optional questions. Persist preferences.

### F04 — Dashboard
Show total, active, paused, and failed workflows; execution counts and recent runs; a create button; search and status filters; failure alerts; and links to workflow details. Metrics must come from real persisted data. Provide informative empty/loading/error states.

### F05 — AI chat
Provide conversation list, new automation, multi-line input, send, streamed/visible progress, messages, clarification prompts, embedded plan cards, change requests, retries, and saved history. Maintain task context across turns, including edits such as changing a schedule without losing other constraints.

### F06 — Intent understanding
Extract trigger, timing, source, transformations, conditions, destinations, required credentials, unknowns, and unsupported steps from Arabic/English input. Produce validated structured data, not executable code. Never hallucinate supported nodes or scopes.

### F07 — Clarification engine
Ask only necessary questions, ideally incrementally: API URL, schedule, timezone, destination, recipient, missing mapping, failure behavior. Allow deferring nonessential connection configuration. Preserve draft state, detect contradictions, and revise the plan when answers change.

### F08 — Feasibility checker
Classify requests as Supported, Partially Supported, or Unsupported based on the actual node registry, permissions, and engine capabilities. Explain unsupported portions and offer grounded alternatives. Do not claim mobile-app control or arbitrary browser automation in MVP.

### F09 — Plan generator
Produce a human-readable plan with name, purpose, ordered steps, trigger, services, accounts, scopes, data read/written/transmitted, conditions, failure handling, assumptions, unsupported portions, approximate limits/costs when defensible, and next steps. Version the plan.

### F10 — Approval and plan editing
Allow Approve, Request Changes, and Save Draft. Record who approved which immutable plan version and when. Do not change recipients, side effects, or permissions after approval without reapproval. Plan approval does not automatically authorize live execution or activation.

### F11 — Workflow compiler
Validate the approved plan against a strict JSON schema and supported node types, required inputs, output references, ordering, graph validity, credentials, and execution policies. Compile it into an engine-specific representation, persist it, and return actionable errors. Never execute AI-generated arbitrary code.

### F12 — Node registry
Define stable node IDs, versions, descriptions, input/output schemas, credential types, validation rules, side-effect and risk classifications. Initial nodes: Manual Trigger, Schedule, Webhook (later beta if necessary), HTTP GET, constrained HTTP POST, Google Sheets Read, Google Sheets Append, Filter, Map Fields, Condition, AI Summarize, Gmail Send. Implement only a smaller tested subset first.

### F13 — Variables and data mapping
Support references to prior step outputs, typed field mappings, optional values, defaults, simple transformations, missing-field errors, and safe previews. Redact sensitive values in UI and logs.

### F14 — Workflow preview
Show a readable step-by-step or graph preview with trigger, action, and connection requirements. Click a step to inspect description, configuration, and inputs/outputs. MVP preview is read-only or offers limited settings; full drag-and-drop editing is out of scope.

### F15 — Connections manager
List, add, validate, reconnect, and revoke third-party connections; show status and dependent workflows; prevent execution when required credentials are unavailable. Keep ownership and scopes explicit.

### F16 — OAuth integrations
Use provider-authorized OAuth flows with state, PKCE where applicable, strict redirect URIs, least-privilege scopes, encrypted access/refresh tokens, refresh/reconnect handling, and no token exposure to the LLM. Google Gmail/Sheets scopes may require provider verification before public launch.

### F17 — API credentials
Allow named API-key/bearer-token connections with restricted target hosts and encrypted storage. Never reveal saved secrets in full. Protect outbound requests from SSRF, DNS rebinding, redirects to private networks, and metadata endpoints.

### F18 — Manual execution
Offer Run Now after checking workflow validity, credentials, quotas, and confirmation for side effects. Queue an execution, show status, and prevent accidental duplicate dispatch.

### F19 — Scheduled execution
Support simple hourly/daily/weekly schedules, selected weekdays, local time and timezone. Define DST behavior, concurrency rules, missed schedules, and pause/resume semantics.

### F20 — Webhook triggers
Issue workflow-specific endpoints, validate signatures or configured secrets where supported, enforce payload size/rate limits, record reception, and deduplicate provider event IDs when available. Endpoint obscurity alone is not authentication.

### F21 — Test mode
Support dry runs with fixture data and no external side effects, plus explicit-consent live tests. Report step-by-step status, duration, redacted sample outputs, errors, and recommended corrections. Do not mislabel a live action as a dry run.

### F22 — Workflow lifecycle
States: Draft, Needs Connection, Ready, Active, Paused, Error, Archived. Actions: Activate, Pause, Resume, Run Now, Duplicate, Archive, Delete. Activation is separate from creation. Destructive actions require confirmation.

### F23 — Execution history
Persist execution ID, workflow version, trigger, start/end, status (Queued, Running, Succeeded, Failed, Cancelled, Timed Out), duration, per-step outcomes, and sanitized errors. Paginate history and apply retention limits.

### F24 — Error handling and retries
Classify transient, authentication, configuration, data, rate-limit, and permission failures. Use bounded exponential backoff for safe retries; consider idempotency and uncertain outcomes before retrying side-effecting actions such as sending email.

### F25 — Notifications
Notify users of creation, readiness, failed runs, expired connections, quota exhaustion, and automatic pause after repeated errors. MVP: in-app notifications and critical failure email; mobile push later.

### F26 — My Automations
List each workflow's name, description, state, trigger, last result, last run, and next scheduled run when known. Support search, filtering, sorting, detail navigation, and meaningful empty states.

### F27 — Automation details
Tabs/sections: Overview, Workflow, Configuration, Connections, Executions, Activity, Settings. Permit limited safe configuration edits; material changes create a new version and may require reapproval.

### F28 — AI-assisted workflow editing
Accept natural-language modifications, read current workflow definition, propose a diff, obtain approval, validate and test a new version, then switch active version safely. Never mutate an active definition silently.

### F29 — Versioning
Persist immutable workflow JSON snapshots with version, timestamp, change summary, and approval. Associate executions with the exact version used. Permit rollback only after validation and required consent.

### F30 — Duplication
Clone workflow structure into a new inactive draft with a new ID. Never copy raw secrets; require selection/authorization of existing connections.

### F31 — Templates
Offer 4–6 curated starter templates (daily email summary, Sheets sync, news digest, webhook alert) grounded in supported nodes. Selecting one starts a prefilled conversation; no public marketplace in MVP.

### F32 — Profile settings
Manage display name, optional avatar, email, language, timezone, date format, password, sessions, and deletion. Warn before timezone changes affect existing schedules.

### F33 — Usage dashboard
Track workflow count, active workflows, monthly executions, AI requests, duration and costly operations. Enforce quotas server-side; UI counters are informative only.

### F34 — Subscriptions and billing
Plan for Free, Starter, and Pro with configurable limits. Later implement upgrades, downgrades, renewals, invoices, cancellation, payment failure, and quota transitions. Pricing figures in early mockups are illustrative, not approved. Defer payment integration until validated demand.

### F35 — Data export and deletion
Export nonsecret workflow definitions, settings, and permitted history. On deletion, stop workflows, revoke credentials where possible, and delete or schedule removal of personal data under a documented retention policy. Never export raw OAuth tokens.

### F36 — Admin dashboard
Show user counts, active workflows, run counts, success/failure rates, AI spend, queues, and revenue when billing exists. Respect tenant privacy.

### F37 — User administration
Search accounts, inspect plan/usage/status, disable abusive accounts, adjust quotas with audit logs. No admin display of passwords or raw tokens.

### F38 — System monitoring
Track API, database, engine, queues, stuck tasks, latency, resource utilization, integration failures, and LLM failures. Prefer proven monitoring tools over building an observability platform from scratch.

### F39 — Node management
Admin view of supported nodes, versions, risk levels, usage, and emergency disable flags. Registry remains code-defined in MVP; no visual node editor.

### F40 — AI model and prompt configuration
Configure planner model, token limits, timeouts, retry policy, prompt versions, evaluation cases, and costs. Keep system prompts and provider credentials private.

### F41 — Permissions and consent
Present actual external read/write scopes and data flows per plan. Record consent and require reapproval on material scope, recipient, or side-effect changes. Additional confirmation for high-impact operations.

### F42 — Secrets management
Encrypt tokens and API keys at rest, use HTTPS, redact logs, limit access by tenant/workflow, support revocation/rotation, and keep encryption keys outside the database. Never send credentials to the LLM.

### F43 — Tenant isolation
Authorize every API and DB access by ownership; isolate conversations, workflows, credentials, execution logs, files, and usage. Validate isolation inside any external execution engine, not just the FlowCapture UI.

### F44 — Execution safety
Defend against SSRF, internal-network access, unsafe redirects, oversized responses, unbounded concurrency, arbitrary code execution, excessive timeouts, and sensitive file access. Separate workers from public API as practical.

### F45 — AI guardrails
Treat external text and tool results as untrusted data, never instructions. Restrict AI to schema-defined actions; independently validate authorization, scopes, recipients, and all side effects. No cross-user data leakage.

### F46 — Rate limits and quotas
Enforce limits on chat messages, plan generation, workflow creation, manual runs, webhooks, concurrent jobs, payload size, and AI usage. Explain limits and reset behavior.

### F47 — Audit logs
Record authentication, connection changes, plan approvals, workflow creation/activation/edit/deletion, privilege changes, and subscription changes. Distinguish audit events from execution telemetry.

### F48 — Backups and recovery
Schedule DB backups, test restore procedures, preserve versioned workflow definitions, establish log retention, and prevent unintended duplicate execution after recovery.

## 4. UX and screen inventory
Required screens: Landing, Sign Up, Login, Forgot Password, Onboarding, Dashboard, AI Chat/Conversations, Plan Review/Approval, Workflow Preview, My Automations, Automation Details, Connections, Execution Detail/History, Templates, Notifications, Usage, Profile/Settings, and a limited Admin Console. Billing and advanced editor are post-MVP.

Design: modern responsive SaaS, accessible forms and keyboard interactions, Arabic RTL and English LTR, clear loading/empty/error states, honest progress, no mock data represented as live.

## 5. Canonical workflow data model
Use a declarative versioned workflow schema independent of execution vendor. Illustrative conceptual shape:

```json
{
  "schemaVersion": 1,
  "name": "Daily News Summary",
  "trigger": {
    "type": "schedule",
    "time": "08:00",
    "timezone": "Asia/Jerusalem"
  },
  "steps": [
    {"id": "fetch", "type": "http.get", "config": {"url": "{{news_api_url}}"}},
    {"id": "summary", "type": "ai.summarize", "input": "{{fetch.body}}"},
    {"id": "send", "type": "gmail.send", "input": "{{summary.output}}"}
  ]
}
```

This is an illustrative internal schema, not an importable n8n definition. Specify typed inputs/outputs, references, conditional branches, node versions, connection references, side-effect policy, and validation. Never embed secrets in definitions.

## 6. Technical architecture
Recommended stack for a solo developer:
- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS, accessible component library.
- **Backend:** NestJS, REST/OpenAPI, validation and authorization.
- **Data:** PostgreSQL with Prisma, JSONB for immutable workflow definitions when appropriate.
- **Jobs:** Redis + BullMQ for asynchronous orchestration, or a properly licensed execution engine.
- **AI:** LLM structured outputs validated by JSON Schema/Zod; separate intent, feasibility, and compiler logic.
- **Deployment:** Docker Compose initially, HTTPS, environment secrets, backups, health checks.
- **Updates:** SSE for chat/run progress, polling fallback.

**Execution engine decision:** Evaluate n8n's current commercial/embedding license and tenant isolation requirements before incorporating it into a customer-facing SaaS. Do not assume unrestricted embedding. A minimal custom BullMQ-based engine is a valid alternative. Keep canonical workflow JSON independent of either engine.

Suggested monorepo:
```text
apps/web
apps/api
packages/shared-types
packages/workflow-schema
packages/node-definitions
services/workflow-engine
infrastructure/
docs/
```

## 7. Data entities
- `users`, `sessions`
- `conversations`, `messages`
- `automation_plans`, `plan_approvals`
- `workflows`, `workflow_versions` (optional separate `workflow_steps`)
- `connections`, `workflow_connections`
- `executions`, `execution_steps`
- `webhook_endpoints`, `notifications`
- `usage_records`, `subscriptions`, `billing_events`
- `audit_logs`, `system_settings`

Relationships: users own conversations, workflows, connections, and logs; conversations yield versioned plans; approved plans yield workflows; workflows have immutable versions and multiple executions; each execution references its exact version. Enforce tenant ownership on every query.

## 8. Suggested API surface
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
- `GET /me`, `PATCH /me`
- `POST /conversations`, `GET /conversations/:id`, `POST /conversations/:id/messages`
- `GET /plans/:id`, `POST /plans/:id/approve`
- `GET /workflows`, `POST /workflows`, `GET /workflows/:id`
- `POST /workflows/:id/activate`, `POST /workflows/:id/pause`, `POST /workflows/:id/run`
- `GET /executions/:id`
- `GET /connections`, `DELETE /connections/:id` and secure provider-specific OAuth endpoints
- `GET /usage`, `GET /notifications`
- `POST /hooks/:endpointId`

Use DTO/schema validation, pagination, consistent error codes, ownership checks, CSRF protection where relevant, idempotency keys for mutations, and documented OpenAPI contracts.

## 9. Edge cases and required behaviors
1. Unsupported service → explain limitations, offer supported alternatives.
2. Ambiguous instruction → ask clarification before building.
3. Invalid AI JSON → validate, retry within bounds, then report failure.
4. Plan rejected → keep draft, no side effects.
5. Browser closes during build → persist job state, recover safely.
6. OAuth expires → refresh safely or request reconnection.
7. Third-party API fails → categorized error and bounded retries.
8. Pause during execution → block future runs, apply defined in-flight policy.
9. Duplicate webhook → deduplicate where possible.
10. Email sent but response lost → avoid blind duplicate send.
11. Quota exceeded → block new runs and notify.
12. Active workflow modified → stage new version and validate before switching.
13. Shared connection revoked → warn about dependent workflows.
14. DST change → deterministic documented scheduling behavior.
15. Engine outage → recover state without unintended duplicate runs.
16. Prompt injection in API data → treat as untrusted content.
17. Long-running job → timeout and record status.
18. Missing or invalid data mapping → show actionable validation error.
19. User attempts cross-tenant access → deny and audit.
20. High-impact live test → require explicit confirmation.

## 10. MVP scope and phased roadmap

### Phase 1 — Foundation
Monorepo, Next.js, NestJS, PostgreSQL/Prisma, authentication, personal workspace, Docker, configuration, basic dashboard shell, tests.

### Phase 2 — AI planning
Chat, persistence, intent extraction, clarification, feasibility, validated JSON plans, versioning and approvals. Build evaluations using representative Arabic/English requests.

### Phase 3 — Workflow runtime
Node registry, compiler, persisted workflows, manual and simple scheduled triggers, worker/engine integration, execution status and logs, dry-run behavior.

### Phase 4 — Initial integrations
Secure HTTP API access, Google OAuth, Gmail send, Google Sheets read/append, credential lifecycle, integration tests. Provider verification and licensing may be external launch blockers.

### Phase 5 — User operations
Dashboard with real metrics, workflow list/details, activate/pause, history, errors/retries, basic quotas, limited notifications.

### Phase 6 — Security and beta launch
Tenant isolation tests, SSRF controls, idempotency, limits, logging redaction, backups, end-to-end scenarios, docs, deployment validation.

**MVP excludes:** arbitrary browser/mobile automation, arbitrary generated code execution, drag-and-drop workflow editor, marketplace, team permissions, complex billing, dozens of integrations.

### Beta after MVP
AI-assisted editing, versioning UX, duplication, curated templates, webhooks, notifications, usage dashboard, basic admin controls.

### V1 after validation
Subscriptions/billing, advanced editor, more integrations, teams, advanced monitoring, marketplace.

**Indicative timeline:** approximately 8–12 weeks of near-full-time solo work, dependent on provider approval, engine licensing, and test coverage. **Illustrative infrastructure cost:** approximately $20–85/month at small beta scale, excluding potential licensing and third-party provider charges. These are estimates, not commitments.

## 11. Acceptance criteria
A real user must be able to:
1. Register and sign in.
2. Describe a supported automation in natural language.
3. Answer necessary clarification questions.
4. Review a correct plan with required permissions and side effects.
5. Approve a specific immutable plan version.
6. Connect necessary external services securely.
7. Generate a validated executable workflow.
8. Run a dry test and explicitly approve any live side-effecting test.
9. Activate and pause a scheduled workflow.
10. Inspect real execution outcomes and actionable failures.

Additional quality gates: no cross-tenant data exposure; no secrets in logs or model prompts; no arbitrary code execution; bounded retries and quotas; tests for invalid plans, expired credentials, duplicate events, and timezone behavior. A feature is not done until wired end-to-end, tested, documented, and honestly represented in UI.

## 12. Agent implementation instructions
1. Read this entire PRD and inspect the repository before coding.
2. Record architecture decisions, unresolved risks, and phase tasks in `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT_ROADMAP.md`, and `docs/DEVELOPMENT_PROGRESS.md`.
3. Implement one vertical slice at a time; prioritize a working chat-to-plan-to-approved-workflow path over breadth.
4. Run lint, typecheck, tests, and integration checks; report what actually ran.
5. Never commit credentials, invent successful tests, silently expand scope, or modify `main`.
6. Follow the branch constraints of the execution environment; if the agent is pinned to an Arena branch, fetch/cherry-pick this PRD into that branch and work there rather than falsely claiming to be on `develop`.
7. Request explicit approval before paid infrastructure, production deployment, or other irreversible external actions.

**End of specification.**
