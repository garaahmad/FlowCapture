import type { UserProfileDto } from "@flowcapture/shared-types";

export interface AuthenticatedContext {
  sessionId: string;
  userId: string;
  workspaceId: string;
  user: UserProfileDto;
}
