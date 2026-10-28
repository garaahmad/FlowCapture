import type { User, Workspace } from "@flowcapture/database";
import type {
  DateFormat,
  SupportedLanguage,
  UsageCategory,
  UserProfileDto,
} from "@flowcapture/shared-types";

export type UserWithWorkspace = User & { workspace: Workspace };

export function toUserProfile(user: UserWithWorkspace): UserProfileDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    preferredLanguage: user.preferredLanguage as SupportedLanguage,
    timezone: user.timezone,
    usageCategory: user.usageCategory as UsageCategory | null,
    dateFormat: user.dateFormat as DateFormat,
    emailVerified: user.emailVerifiedAt !== null,
    onboardingCompleted: user.onboardingCompletedAt !== null,
    workspace: {
      id: user.workspace.id,
      name: user.workspace.name,
      slug: user.workspace.slug,
      planCode: user.workspace.planCode,
    },
  };
}
