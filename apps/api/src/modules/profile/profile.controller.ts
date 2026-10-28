import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { ApiData, UserProfileDto } from "@flowcapture/shared-types";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentAuth } from "../../common/decorators/current-auth.decorator";
import type { AuthenticatedContext } from "../auth/auth.context";
import { UpdateProfileDto } from "./profile.dto";
import { ProfileService } from "./profile.service";
import { SESSION_COOKIE_NAME } from "../auth/session-token";

@ApiTags("Profile")
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller("me")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  me(@CurrentAuth() auth: AuthenticatedContext): ApiData<UserProfileDto> {
    return { data: auth.user };
  }

  @Patch()
  async update(
    @CurrentAuth() auth: AuthenticatedContext,
    @Body() input: UpdateProfileDto,
  ): Promise<ApiData<UserProfileDto>> {
    return { data: await this.profile.update(auth, input) };
  }
}
