import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import type { ApiData, AuthSessionDto, MessageResponse } from "@flowcapture/shared-types";
import type { AppEnvironment } from "../../config/environment";
import { CurrentAuth } from "../../common/decorators/current-auth.decorator";
import type { AuthenticatedContext } from "./auth.context";
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from "./auth.dto";
import { AuthGuard } from "./auth.guard";
import { AuthService, type AuthResult } from "./auth.service";
import { SESSION_COOKIE_NAME } from "./session-token";
import { toUserProfile } from "./user.mapper";
import { getRequestId } from "../../common/request";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<AppEnvironment, true>,
  ) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() input: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiData<AuthSessionDto>> {
    const result = await this.auth.register(input, this.metadata(request));
    this.setSessionCookie(response, result);
    return { data: this.sessionDto(result) };
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() input: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiData<AuthSessionDto>> {
    const result = await this.auth.login(input, this.metadata(request));
    this.setSessionCookie(response, result);
    return { data: this.sessionDto(result) };
  }

  @Post("logout")
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponse> {
    const cookies = request.cookies as Record<string, string | undefined>;
    const result = await this.auth.logout(cookies[SESSION_COOKIE_NAME], getRequestId(request));
    response.clearCookie(SESSION_COOKIE_NAME, this.cookieOptions());
    return result;
  }

  @Post("forgot-password")
  @HttpCode(202)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  forgotPassword(@Body() input: ForgotPasswordDto): Promise<MessageResponse> {
    return this.auth.forgotPassword(input);
  }

  @Post("reset-password")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(
    @Body() input: ResetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponse> {
    const result = await this.auth.resetPassword(input);
    response.clearCookie(SESSION_COOKIE_NAME, this.cookieOptions());
    return result;
  }

  @Post("verify-email")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  verifyEmail(@Body() input: VerifyEmailDto): Promise<MessageResponse> {
    return this.auth.verifyEmail(input);
  }

  @Post("resend-verification")
  @HttpCode(202)
  @UseGuards(AuthGuard)
  @ApiCookieAuth(SESSION_COOKIE_NAME)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  resendVerification(@CurrentAuth() auth: AuthenticatedContext): Promise<MessageResponse> {
    return this.auth.resendVerification(auth.userId, auth.workspaceId);
  }

  private metadata(request: Request): { userAgent?: string; requestId?: string } {
    return { userAgent: request.header("user-agent"), requestId: getRequestId(request) };
  }

  private setSessionCookie(response: Response, result: AuthResult): void {
    response.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
      ...this.cookieOptions(),
      expires: result.session.expiresAt,
    });
  }

  private cookieOptions(): {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: "/";
  } {
    return {
      httpOnly: true,
      secure: this.config.get("COOKIE_SECURE") ?? this.config.get("NODE_ENV") === "production",
      sameSite: "lax",
      path: "/",
    };
  }

  private sessionDto(result: AuthResult): AuthSessionDto {
    return {
      user: toUserProfile(result.user),
      expiresAt: result.session.expiresAt.toISOString(),
    };
  }
}
