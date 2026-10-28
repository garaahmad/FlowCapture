export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const USAGE_CATEGORIES = ["personal", "business", "developer"] as const;
export type UsageCategory = (typeof USAGE_CATEGORIES)[number];

export const DATE_FORMATS = ["system", "MDY", "DMY", "YMD"] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export interface WorkspaceDto {
  id: string;
  name: string;
  slug: string;
  planCode: string;
}

export interface UserProfileDto {
  id: string;
  email: string;
  displayName: string;
  preferredLanguage: SupportedLanguage;
  timezone: string;
  usageCategory: UsageCategory | null;
  dateFormat: DateFormat;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  workspace: WorkspaceDto;
}

export interface AuthSessionDto {
  user: UserProfileDto;
  expiresAt: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: Array<{ field?: string; message: string }>;
  };
}

export interface ApiData<T> {
  data: T;
}

export interface MessageResponse {
  message: string;
}

export type Feasibility = "supported" | "partially_supported" | "unsupported";

export type WorkflowLifecycleState =
  | "draft"
  | "needs_connection"
  | "ready"
  | "active"
  | "paused"
  | "error"
  | "archived";

export type ExecutionStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "timed_out";
