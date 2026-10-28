import { Prisma, PrismaClient } from "@prisma/client";

export type DatabaseClient = PrismaClient;
export type DatabaseTransaction = Prisma.TransactionClient;
export { Prisma, PrismaClient } from "@prisma/client";
export type { User, Workspace, Session, AuditLog } from "@prisma/client";

export interface TenantContext {
  userId: string;
  workspaceId: string;
}

export function createDatabaseClient(databaseUrl?: string): PrismaClient {
  return new PrismaClient({
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
    log: [{ emit: "event", level: "error" }],
  });
}
