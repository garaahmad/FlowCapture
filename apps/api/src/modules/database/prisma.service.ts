import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@flowcapture/database";
import type { AppEnvironment } from "../../config/environment";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService<AppEnvironment, true>) {
    super({ datasources: { db: { url: config.get("DATABASE_URL") } } });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
