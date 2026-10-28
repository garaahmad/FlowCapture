import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../database/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("live")
  live(): { data: { status: "ok" } } {
    return { data: { status: "ok" } };
  }

  @Get("ready")
  async ready(): Promise<{ data: { status: "ok"; database: "up" } }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { data: { status: "ok", database: "up" } };
    } catch {
      throw new ServiceUnavailableException("Database is not ready");
    }
  }
}
