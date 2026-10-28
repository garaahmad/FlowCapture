# Local infrastructure

## Compose

1. Copy `../.env.example` to `../.env` and replace the development database password.
2. From the repository root run `docker compose up --build`.
3. Open `http://localhost:3000`. OpenAPI is disabled by default in the production-mode Compose configuration.

The API container applies checked-in Prisma migrations before starting. PostgreSQL and Redis use named volumes. Redis is included for the Phase 3 queue; the Phase 1 API does not claim queue functionality.

Do not expose this Compose configuration publicly as-is. Production requires HTTPS, strong secrets, restricted database/Redis ports, managed backups, resource limits, centralized logs, and deployment-specific secret management.

## Sandbox verification status

The development sandbox used for the initial implementation does not contain Docker, PostgreSQL, or Redis. Compose startup, image builds, native Prisma engine downloads, and live migration execution therefore require verification in an environment with those services. This limitation is tracked in `docs/DEVELOPMENT_PROGRESS.md`.
