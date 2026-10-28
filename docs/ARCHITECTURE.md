# FlowCapture AI Architecture

**Status:** Initial architecture baseline  
**Date:** 2026-10-28  
**Specification:** [`PRODUCT_REQUIREMENTS.md`](./PRODUCT_REQUIREMENTS.md)

## 1. Repository baseline

The repository began with a single README and no application architecture. The PRD was copied only from source commit `a72c5053c6160ae24870d1cc41844d135c9457c5` on `develop`; `main` was not modified. All implementation is on the Arena-pinned branch.

## 2. Design goals

1. Protect tenant data and external systems before optimizing for feature breadth.
2. Keep a natural-language plan separate from an approved, executable workflow.
3. Make every plan and workflow version immutable and auditable.
4. Support a small, explicitly registered set of operations; never imply arbitrary automation.
5. Keep local development and operations practical for one maintainer.
6. Treat AI output, API responses, OAuth metadata, and user input as untrusted.

## 3. Architecture decisions

### ADR-001 — npm-workspace monorepo, modular monolith first

Use npm workspaces with no orchestration framework. The deployable units are a Next.js web application, a NestJS API, and (from Phase 3) a workflow worker process. PostgreSQL and Redis are the only required infrastructure services at runtime.

```text
apps/
  web/                    Next.js App Router UI and same-origin API proxy
  api/                    NestJS REST API and application modules
packages/
  shared-types/           Stable transport contracts; no runtime secrets
  workflow-schema/        Canonical Zod/JSON schemas and reference validation
  node-definitions/       Versioned capability registry and risk metadata
  database/               Prisma schema, migrations, and tenant-aware client helpers
services/
  workflow-engine/        BullMQ worker and deterministic node executors (Phase 3)
infrastructure/           Dockerfiles and deployment support
docs/                     Product and engineering source of truth
```

The worker is a separate process for resource isolation, not a network microservice. Modules communicate through database state and BullMQ jobs rather than an internal service mesh.

### ADR-002 — Custom constrained execution engine; n8n not adopted

The [n8n Sustainable Use License](https://github.com/n8n-io/n8n/blob/master/LICENSE.md), reviewed on 2026-10-28, limits use to internal business purposes or non-commercial/personal use and restricts commercial distribution. A customer-facing hosted/embedded SaaS therefore requires a separate commercial licensing review. Multi-tenant isolation would also need an independent security assessment.

FlowCapture will implement a minimal custom engine using NestJS and BullMQ. It will execute only code-defined node handlers selected by stable registry IDs. No AI-generated JavaScript, expressions with code evaluation, shell commands, or arbitrary imports are permitted. The canonical workflow JSON remains vendor-independent.

### ADR-003 — Two validated artifacts: plan and workflow

An AI plan is a product/approval artifact, not an executable program. Approving a plan records its exact SHA-256 content hash, version, user, and timestamp. Compilation is a deterministic server-side operation that maps an approved plan to canonical workflow JSON and validates it again against the node registry. Material changes create a new plan and require reapproval. Activation and live side effects require separate consent.

### ADR-004 — Strict canonical workflow schema

`packages/workflow-schema` owns schema version 1. Every node has a versioned registry entry, required configuration, output contract, side-effect/risk classification, timeout, and retry policy. References use a constrained syntax such as `{{steps.fetch.body}}`; arbitrary expression evaluation is forbidden. Compilation rejects unknown nodes, duplicate IDs, missing references, invalid schedules, missing connection references, and unsafe policies.

JSON Schema is generated or exported for provider structured-output boundaries, while Zod validation runs independently on the server. A successful provider response is never sufficient validation.

### ADR-005 — Database-backed opaque sessions

Email/password authentication uses Argon2id password hashing with per-password salts and opaque, cryptographically random session tokens. Only SHA-256 token hashes are persisted. Session cookies are `HttpOnly`, `Secure` outside development, and `SameSite=Lax`; session lookup enforces expiry and revocation. Application login sessions are distinct from third-party OAuth connections.

Mutation requests use origin checks, JSON content types, and same-site cookies for CSRF defense. Cross-origin API access is disabled by default. Password reset and email-verification tokens are single-use, expiring hashes. Authentication responses avoid account enumeration.

### ADR-006 — Tenant context comes from the session

Every owned table carries `workspaceId` (directly or through an immutable parent whose ownership is checked in the same transaction). Controllers never accept a workspace ID as authority. Repositories require a `TenantContext` derived from the authenticated session. Cross-tenant and missing-resource lookups return the same not-found response and emit an audit event where appropriate. Integration tests must cover this boundary, not just controller guards.

### ADR-007 — Same-origin browser/API communication

Browser code calls relative `/backend/*` URLs. Next.js rewrites those requests to the internal API origin, so preview/browser code never calls `localhost` for another service. OpenAPI is exposed by the API in non-production or when explicitly enabled. SSE is planned for progress, with polling as the reliable fallback.

### ADR-008 — Secrets and outbound request safety

From Phase 4, credentials are encrypted with versioned AES-256-GCM envelopes and keys supplied outside PostgreSQL. Only ciphertext, IV, authentication tag, key version, provider, scopes, and nonsecret metadata are stored. Secret values are never returned by a read API, included in model prompts, or written to logs.

HTTP execution will resolve DNS on every connection attempt, reject private/link-local/loopback/reserved ranges (including IPv6), pin validated addresses for the request, limit redirects and revalidate every hop, block metadata endpoints, and cap response bytes and duration. Redirecting to another host requires explicit policy. These controls require integration tests with hostile DNS and redirect cases before HTTP execution is called production-ready.

### ADR-009 — Execution reliability and scheduling

BullMQ jobs include execution ID, workflow version ID, workspace ID, idempotency key, and attempt policy. Workers set short-lived execution leases and persist each step outcome. Side-effecting steps are not blindly retried. Dry runs use fixtures and replace side-effect handlers with explicit simulated results; they are never presented as live provider tests.

Simple schedules use IANA timezones. A daily/weekly schedule means the first valid instant at the configured local wall time; nonexistent DST times move forward to the next valid instant, and repeated times run once per scheduled local date. Missed schedules are not replayed after downtime by default. Pausing blocks new dispatches but does not cancel an in-flight step; cancellation is a separate operation.

### ADR-010 — Configuration, logs, and errors

Environment variables are validated at startup with Zod. Example files contain placeholders only. API logs are structured JSON with request IDs and explicit redaction for cookies, authorization headers, tokens, passwords, and secret-like payload fields. Public errors use stable machine codes and safe messages; internal traces retain causes without exposing secrets.

### ADR-011 — Testing and honest completion gates

Unit tests cover pure schemas, registry validation, planning rules, authentication primitives, and execution policies. Integration tests require real PostgreSQL/Redis and exercise tenant boundaries, migrations, queues, and OAuth callback state. Browser end-to-end tests cover the vertical MVP journey. A feature is documented as complete only for the checks actually executed; unavailable external providers remain launch blockers.

## 4. Module boundaries

- **Identity:** users, workspaces, sessions, onboarding, preferences, audit events.
- **Conversations:** persisted messages and draft planning state.
- **Planning:** provider adapter, structured-output validation, clarification, feasibility, immutable plans, approvals.
- **Workflows:** compiler, immutable versions, lifecycle, schedules, previews.
- **Connections:** provider OAuth and API credentials; no plaintext secret reads.
- **Executions:** dispatch, leases, steps, retries, sanitized outcomes.
- **Operations:** quotas, notifications, usage, health, administrative metadata.

AI code can propose only data inside these boundaries. Authorization, feasibility, compilation, consent, quota checks, and execution remain deterministic server code.

## 5. Environments and current limitations

The implementation sandbox has Node.js 22 and npm, but no Docker, PostgreSQL, Redis, or browser automation runtime preinstalled. No live LLM, OAuth, SMTP, payment, or production secret provider is configured. The Phase 2 planning milestone now includes deterministic and configurable OpenAI-compatible adapters, persisted planning models/APIs, and chat/plan-review UI; only unit, static, build, and unauthenticated HTTP checks have run. Live integration claims require the relevant services and credentials. No paid service or public deployment will be activated.

## 6. Open decisions and launch risks

- Select and test the production LLM provider against Arabic and English evaluation cases; model configuration is not yet available.
- Google sensitive-scope verification may block public Gmail/Sheets launch.
- Production encryption-key storage and rotation require a deployment-specific KMS/secret manager decision.
- Backup schedules and restore drills require real deployed infrastructure.
- Email delivery is required for verification, reset, and critical notifications; until configured, those flows must not report successful delivery.
- Pricing and billing remain out of MVP scope.
