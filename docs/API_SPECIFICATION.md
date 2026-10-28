# REST API Specification

**Base path:** `/api/v1` (browser applications use same-origin `/backend`)  
**Format:** JSON, UTF-8  
**OpenAPI:** generated from NestJS DTOs  
**Status legend:** “Phase 1” denotes the current implementation target; later routes are contracts, not claims of availability.

## Conventions

- Authenticated routes require the opaque `fc_session` HTTP-only cookie.
- Workspace authority is derived from the session; clients never supply tenant IDs.
- Error body: `{ "error": { "code": "STRING_CODE", "message": "Safe actionable message", "requestId": "…", "details": [] } }`.
- Successful single-resource responses use `{ "data": … }`; collections use `{ "data": [], "page": { … } }`.
- Mutations that can dispatch or purchase side effects accept `Idempotency-Key` in their respective phases.
- List endpoints use bounded cursor/page parameters. Timestamps are ISO 8601 UTC.

## Health

| Route | Phase | Behavior |
|---|---|---|
| `GET /health/live` | 1 | Process liveness; no dependency data or secrets. |
| `GET /health/ready` | 1 | Verifies required dependencies; returns 503 when not ready. |

## Authentication and profile

| Route | Phase | Behavior |
|---|---|---|
| `POST /auth/register` | 1 | Email/password/display name; creates user, personal workspace, and session transactionally. |
| `POST /auth/login` | 1 | Verifies credentials, applies throttling, rotates to a new session cookie. |
| `POST /auth/logout` | 1 | Revokes the current session and clears the cookie; safe when already logged out. |
| `POST /auth/forgot-password` | 1 contract | Always generic response; sends only when mail is configured. |
| `POST /auth/reset-password` | 1 contract | Consumes a valid single-use token and revokes other sessions. |
| `POST /auth/verify-email` | 1 contract | Consumes a valid verification token. |
| `GET /me` | 1 | Current safe user/profile/workspace payload. |
| `PATCH /me` | 1 | Validated display name, language, IANA timezone, usage category, and date format. |
| `DELETE /me` | Later | Confirmed account deletion and retention workflow. |
| `GET /me/sessions` | Later | Active session metadata and revocation controls. |

Register/login validation failures use `VALIDATION_ERROR`; invalid login uses the generic `INVALID_CREDENTIALS`; missing/expired sessions use `AUTH_REQUIRED`.

## Conversations and plans

| Route | Phase | Behavior |
|---|---|---|
| `POST /conversations` | 2 | Create an empty draft conversation. |
| `GET /conversations` | 2 | Paginated current-workspace history. |
| `GET /conversations/:id` | 2 | Conversation and ordered messages with ownership check. |
| `POST /conversations/:id/messages` | 2 | Persist user message, run bounded planning, return assistant/clarification/plan response. |
| `GET /plans/:id` | 2 | Immutable plan and human-readable report. |
| `POST /plans/:id/approve` | 2 | Approve exact `version` and `contentHash`; requires feasibility and no unresolved blocking questions. |
| `POST /plans/:id/change-requests` | 2 | Create a draft revision; never mutates an approved version. |

## Workflows and executions

| Route | Phase | Behavior |
|---|---|---|
| `POST /workflows` | 3 | Compile an approved plan/hash; persist immutable version 1. |
| `GET /workflows` | 3/5 | Workspace list with filters and real status summary. |
| `GET /workflows/:id` | 3 | Details, current version preview, required connections. |
| `POST /workflows/:id/activate` | 3/5 | Separate consent, validation, credentials, and quota checks. |
| `POST /workflows/:id/pause` | 3/5 | Stop future dispatch; documented in-flight behavior. |
| `POST /workflows/:id/run` | 3 | Idempotent manual dry/live dispatch with side-effect confirmation. |
| `GET /workflows/:id/executions` | 3 | Paginated sanitized history. |
| `GET /executions/:id` | 3 | Execution and ordered step outcomes. |
| `POST /executions/:id/cancel` | Later | Cooperative cancellation where safe. |

## Connections

| Route | Phase | Behavior |
|---|---|---|
| `GET /connections` | 4 | Safe provider/account/scope/status metadata only. |
| `POST /connections/api-keys` | 4 | Create encrypted host-restricted credential; secret is write-only. |
| `POST /connections/:id/validate` | 4 | Explicit provider validation; no fabricated success. |
| `DELETE /connections/:id` | 4 | Revoke and report dependent workflows. |
| `GET /oauth/google/start` | 4 | Provider state/PKCE initiation; application login remains separate. |
| `GET /oauth/google/callback` | 4 | Validates state and stores encrypted tokens. |

## Operations

| Route | Phase | Behavior |
|---|---|---|
| `GET /dashboard` | 5 | Real persisted metrics and recent runs. |
| `GET /usage` | 5 | Current workspace quota/usage. |
| `GET /notifications` | 5 | Paginated in-app notifications. |
| `POST /notifications/:id/read` | 5 | Mark owned notification read. |
| `POST /hooks/:endpointId` | Beta | Authenticated, size/rate-limited, deduplicated webhook reception. |

## Security requirements

- DTO allowlisting and strict validation at every write boundary.
- Same-workspace lookup in repository queries; uniform not-found behavior for foreign IDs.
- Origin/CSRF checks on cookie-authenticated mutations and route-specific throttles.
- No raw tokens, passwords, Authorization headers, or credential ciphertext in responses/logs.
- Provider callback errors are safe and do not leak authorization codes.
- Live side effects require explicit confirmation independent of plan approval.
