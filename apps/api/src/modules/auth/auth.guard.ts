import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AppException } from "../../common/app.exception";
import { PrismaService } from "../database/prisma.service";
import { hashOpaqueToken, SESSION_COOKIE_NAME } from "./session-token";
import { toUserProfile } from "./user.mapper";
import type { AuthenticatedRequest } from "../../common/decorators/current-auth.decorator";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>() as AuthenticatedRequest;
    const cookies = request.cookies as Record<string, string | undefined>;
    const token = cookies[SESSION_COOKIE_NAME];
    if (!token) throw new AppException("AUTH_REQUIRED", "Please sign in to continue.", 401);

    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash: hashOpaqueToken(token),
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { status: "ACTIVE" },
      },
      include: { user: { include: { workspace: true } } },
    });
    if (!session) {
      throw new AppException("AUTH_REQUIRED", "Your session has expired. Please sign in again.", 401);
    }

    request.auth = {
      sessionId: session.id,
      userId: session.userId,
      workspaceId: session.workspaceId,
      user: toUserProfile(session.user),
    };

    if (Date.now() - session.lastSeenAt.getTime() > 5 * 60 * 1000) {
      await this.prisma.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { lastSeenAt: new Date() },
      });
    }
    return true;
  }
}
