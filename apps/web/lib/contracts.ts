export type {
  AuthSessionDto,
  DateFormat,
  MessageResponse,
  SupportedLanguage,
  UsageCategory,
  UserProfileDto,
  WorkspaceDto,
} from "@flowcapture/shared-types";

import type { DateFormat, SupportedLanguage, UsageCategory } from "@flowcapture/shared-types";

export interface UpdateProfileInput {
  displayName?: string;
  preferredLanguage?: SupportedLanguage;
  timezone?: string;
  usageCategory?: UsageCategory | null;
  dateFormat?: DateFormat;
  completeOnboarding?: boolean;
}
