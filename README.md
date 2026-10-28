# FlowCapture AI

Consent-first, natural-language automation. The product journey is **describe → clarify → check feasibility → approve → build → connect → test → activate → monitor**.

This repository is under active MVP development. The current milestone includes identity/profile APIs, responsive authentication/onboarding, canonical workflow contracts, a schema-only node registry, persisted planning APIs, deterministic/OpenAI-compatible planners, and a chat/plan-review UI. Real database planning journeys and live-provider quality remain unverified. It does **not** claim executable workflows or live third-party integrations.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod
- NestJS REST/OpenAPI, Argon2id, opaque database sessions
- PostgreSQL and Prisma
- Redis/BullMQ planned for the Phase 3 custom execution worker
- npm workspaces; no n8n embedding

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the n8n licensing decision and security boundaries.

## Repository layout

```text
apps/web                  Next.js application
apps/api                  NestJS API
packages/shared-types     Public transport contracts
packages/workflow-schema  Canonical workflow schema and references
packages/node-definitions Versioned capability registry
packages/database         Prisma schema, migrations, and client
services/workflow-engine  Phase 3 worker (not implemented yet)
infrastructure            Docker assets
docs                      Product and engineering documentation
```

## Local development

Requirements: Node.js 22.12+, npm 12.2+, PostgreSQL 16+, and (from Phase 3) Redis 7+.

```bash
# npm 12 avoids an npm 10 optional-peer resolution bug in the test toolchain.
npx npm@12.2.0 install
cp .env.example .env
# Edit .env with local-only values, then export them for Prisma CLI:
set -a; . ./.env; set +a
npm run prisma:generate
npm run migrate -w @flowcapture/database
npm run build:packages
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api/v1`
- OpenAPI in development: `http://localhost:3001/api/v1/docs`

The browser uses relative `/backend/*` URLs; Next.js rewrites them to the API. Do not put credentials in `NEXT_PUBLIC_*` variables.

Alternatively, use `docker compose up --build` after reviewing `infrastructure/README.md`.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Real PostgreSQL integration tests require an already migrated **disposable** database:

```bash
RUN_DATABASE_TESTS=1 DATABASE_URL='postgresql://…' npm run test:integration
```

They are skipped by default. Never point tests at production data.

## Security and secrets

- Commit `.env.example` files only; never commit real `.env` files or credentials.
- Session cookies are HTTP-only; only token hashes are persisted.
- Workflow registry entries remain `schema_only` until real executors and tests exist.
- Email reset/verification returns an explicit configuration error when SMTP is unavailable.
- No paid infrastructure or public deployment is configured by this repository.

## Progress

- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database design](docs/DATABASE_DESIGN.md)
- [API contracts](docs/API_SPECIFICATION.md)
- [Roadmap](docs/DEVELOPMENT_ROADMAP.md)
- [Verified progress and limitations](docs/DEVELOPMENT_PROGRESS.md)
