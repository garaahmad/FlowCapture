import { Injectable } from "@nestjs/common";
import type { UserProfileDto } from "@flowcapture/shared-types";
import { PrismaService } from "../database/prisma.service";
import type { AuthenticatedContext } from "../auth/auth.context";
import { toUserProfile } from "../auth/user.mapper";
import { UpdateProfileDto } from "./profile.dto";

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async update(auth: AuthenticatedContext, input: UpdateProfileDto): Promise<UserProfileDto> {
    const previousTimezone = auth.user.timezone;
    const user = await this.prisma.user.update({
      where: { id: auth.userId, workspaceId: auth.workspaceId },
      data: {
        displayName: input.displayName,
        preferredLanguage: input.preferredLanguage,
        timezone: input.timezone,
        usageCategory: input.usageCategory,
        dateFormat: input.dateFormat,
        onboardingCompletedAt: input.completeOnboarding ? new Date() : undefined,
      },
      include: { workspace: true },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId: auth.workspaceId,
        actorUserId: auth.userId,
        action: "profile.updated",
        targetType: "user",
        targetId: auth.userId,
        metadata: {
          fields: Object.keys(input).filter((key) => key !== "completeOnboarding"),
          onboardingCompleted: input.completeOnboarding === true,
          timezoneChanged: Boolean(input.timezone && input.timezone !== previousTimezone),
        },
      },
    });
    return toUserProfile(user);
  }
}
