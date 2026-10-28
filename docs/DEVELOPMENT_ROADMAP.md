# Development Roadmap

**Baseline:** Empty repository plus PRD commit `a72c505`  
**Updated:** 2026-10-28

This roadmap is dependency-ordered. Checkboxes mean verified implementation, not merely created files. Detailed evidence and limitations live in [`DEVELOPMENT_PROGRESS.md`](./DEVELOPMENT_PROGRESS.md).

## Phase 1 — Foundation

### 1.1 Repository and configuration
- [x] npm workspaces, strict TypeScript, shared build/lint/test commands.
- [x] Validated environment configuration and secret-free examples.
- [x] Shared transport contracts and Prisma/PostgreSQL schema (WASM-validated; live migration pending).
- [ ] Docker Compose for web, API, PostgreSQL, and Redis; health checks (assets created; Compose verification pending).

### 1.2 Identity vertical slice
- [ ] Register, login, logout, current-user session, and password hashing.
- [ ] Personal workspace creation in the registration transaction.
- [ ] Profile/onboarding read and update with language/timezone validation.
- [ ] Session expiry/revocation, login throttling, audit events, authorization.
- [ ] Honest verification/reset states when email delivery is not configured.

### 1.3 Web foundation
- [x] Responsive landing page grounded in supported/planned capabilities.
- [ ] Sign-up, login, onboarding, and authenticated application shell (connected; live DB journey pending).
- [x] Honest empty dashboard, loading/error states, theme, RTL foundation.
- [x] Accessible reusable shadcn-style components and typed API client.

### 1.4 Phase gate
- [x] Unit tests for authentication and contracts.
- [ ] Real-database auth/tenant integration tests (suite created; service unavailable).
- [x] Lint, typecheck, unit tests, production builds.
- [ ] Compose startup and persistence verification.

## Phase 2 — AI planning

- [ ] Conversation list/detail, persisted messages, retries, and draft preservation.
- [ ] Provider-neutral LLM adapter with structured JSON output, timeout, and bounded retry.
- [ ] Intent extraction for Arabic/English with schema validation and prompt-injection boundaries.
- [ ] Registry-grounded feasibility and incremental clarification.
- [ ] Human-readable versioned plans, scope/data-flow report, draft/change/approve endpoints.
- [ ] Immutable approval hashes and material-change reapproval tests.
- [ ] Chat UI with clarification and plan cards; no fake streaming or progress.
- [ ] Representative Arabic/English planner evaluations and invalid-output tests.

**Depends on:** Phase 1 identity and database; initial registry contracts.  
**External gate:** Live model quality cannot be certified without a provider and evaluation run.

## Phase 3 — Workflow runtime

- [ ] Stable registry subset: manual, schedule, constrained HTTP GET, mapping/filter primitives.
- [ ] Canonical workflow schema, output references, graph/config/policy validation.
- [ ] Deterministic compiler requiring a valid immutable approval.
- [ ] Workflow/version persistence and read-only preview.
- [ ] BullMQ worker, execution/step records, leases, timeouts, idempotent manual dispatch.
- [ ] Dry-run fixtures with no external side effects and clearly labeled live tests.
- [ ] Hourly/daily/weekly scheduling, timezone/DST tests, pause/resume semantics.
- [ ] Execution polling/detail UI and sanitized actionable errors.

**Depends on:** Approved plans and worker infrastructure.  
**Security gate:** No live HTTP execution until SSRF controls pass hostile-network tests.

## Phase 4 — Initial integrations

- [ ] Encrypted credential envelopes, key configuration, redaction, revocation.
- [ ] Named API credentials with target-host allowlists.
- [ ] Google OAuth state/PKCE, exact redirects, least scopes, refresh/reconnect.
- [ ] Gmail send with consent and uncertain-outcome retry protection.
- [ ] Google Sheets read/append with validated identifiers and mappings.
- [ ] Connection manager and dependent-workflow behavior.
- [ ] Provider contract/integration tests; no fabricated connection success.

**External gates:** Google credentials, scope verification for public launch, key management.

## Phase 5 — User operations

- [ ] Real dashboard metrics, workflow search/filter/sort, lifecycle controls.
- [ ] Workflow details, connections, immutable versions, execution history.
- [ ] Bounded retry policies and repeated-error automatic pause.
- [ ] Server-side quotas and monthly usage records.
- [ ] In-app notifications and critical-email adapter when configured.

## Phase 6 — Security and beta verification

- [ ] Cross-tenant repository/API tests and audit coverage.
- [ ] SSRF, DNS rebinding, redirect, payload, timeout, and response-size tests.
- [ ] Mutation idempotency, rate limits, queue/concurrency limits, recovery tests.
- [ ] Authentication, chat-to-plan, dry-run, activation, execution browser E2E.
- [ ] Backup/restore procedure and an executed restore drill.
- [ ] Docker deployment verification, logging review, operational documentation.

## Post-MVP (only after the above gates)

- AI-assisted edits with approved diffs, duplication, curated templates, signed webhooks.
- Expanded notifications/usage and limited administration.
- Billing, teams, advanced editor, marketplace, and additional integrations remain later work.

## Current execution order

1. Establish workspace/configuration/database and identity backend.
2. Connect authentication and onboarding to the web application.
3. Verify Phase 1 with every locally available check; record unavailable service tests.
4. Commit the verified foundation before beginning planning.
5. Deliver Phase 2 as a vertical slice, then runtime, integrations, operations, and hardening.
