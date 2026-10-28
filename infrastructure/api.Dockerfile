FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN npm install --global npm@12.2.0
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/workflow-schema/package.json packages/workflow-schema/package.json
COPY packages/node-definitions/package.json packages/node-definitions/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build:packages && npm run build -w @flowcapture/api

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install --yes --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app
EXPOSE 3001
USER node
CMD ["sh", "-c", "npm run migrate -w @flowcapture/database && npm run start:prod -w @flowcapture/api"]
