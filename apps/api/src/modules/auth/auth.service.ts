import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { Prisma, type Session } from "@flowcapture/database";
import type { MessageResponse } from "@flowcapture/shared-types";
import { AppException } from "../../common/app.exception";
import type { AppEnvironment } from "../../config/environment";
import { PrismaService } from "../database/prisma.service";
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from "./auth.dto";
import { MailService } from "./mail.service";
import { createOpaqueToken, hashOpaqueToken } from "./session-token";
import type { UserWithWorkspace } from "./user.mapper";

interface RequestMetadata {
  userAgent?: string;
  requestId?: string;
}

export interface AuthResult {
  sessionToken: string;
  session: Session;
  user: UserWithWorkspace;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnvironment, true>,
    private readonly mail: MailService,
  ) {}

  async register(input: RegisterDto, metadata: RequestMetadata): Promise<AuthResult> {
    const passwordHash = await this.hashPassword(input.password);
    const sessionToken = createOpaqueToken();
    const expiresAt = this.sessionExpiry();

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const workspace = await transaction.workspace.create({
          data: {
            name: `${input.displayName}'s workspace`,
            slug: `personal-${createOpaqueToken().slice(0, 20)}`,
          },
        });
        const user = await transaction.user.create({
          data: {
            workspaceId: workspace.id,
            email: input.email,
            passwordHash,
            displayName: input.displayName,
          },
          include: { workspace: true },
        });
        const session = await transaction.session.create({
          data: {
            tokenHash: hashOpaqueToken(sessionToken),
            userId: user.id,
            workspaceId: workspace.id,
            expiresAt,
            userAgent: metadata.userAgent?.slice(0, 512),
          },
        });
        await transaction.auditLog.create({
          data: {
            workspaceId: workspace.id,
            actorUserId: user.id,
            action: "auth.registered",
            targetType: "user",
            targetId: user.id,
            requestId: metadata.requestId,
          },
        });
        return { user, session };
      });

      if (this.mail.configured) {
        try {
          await this.sendVerificationForUser(result.user.id, result.user.email);
        } catch {
          this.logger.warn("Verification email could not be sent after registration");
        }
      }
      return { ...result, sessionToken };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppException("EMAIL_ALREADY_REGISTERED", "An account with this email already exists.", 409);
      }
      throw error;
    }
  }

  async login(input: LoginDto, metadata: RequestMetadata): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { workspace: true },
    });
    const passwordHash = user?.passwordHash ?? await this.getDummyHash();
    let valid = false;
    try {
      valid = await argon2.verify(passwordHash, input.password);
    } catch {
      this.logger.warn("A stored password hash could not be verified");
    }
    if (!user || !valid || user.status !== "ACTIVE" || !user.passwordHash) {
      throw new AppException("INVALID_CREDENTIALS", "Email or password is incorrect.", 401);
    }

    const sessionToken = createOpaqueToken();
    const session = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.session.create({
        data: {
          tokenHash: hashOpaqueToken(sessionToken),
          userId: user.id,
          workspaceId: user.workspaceId,
          expiresAt: this.sessionExpiry(),
          userAgent: metadata.userAgent?.slice(0, 512),
        },
      });
      await transaction.auditLog.create({
        data: {
          workspaceId: user.workspaceId,
          actorUserId: user.id,
          action: "auth.logged_in",
          targetType: "session",
          targetId: created.id,
          requestId: metadata.requestId,
        },
      });
      return created;
    });
    return { user, session, sessionToken };
  }

  async logout(rawToken?: string, requestId?: string): Promise<MessageResponse> {
    if (rawToken) {
      const tokenHash = hashOpaqueToken(rawToken);
      const session = await this.prisma.session.findUnique({ where: { tokenHash } });
      if (session) {
        await this.prisma.$transaction(async (transaction) => {
          await transaction.session.updateMany({
            where: { id: session.id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          await transaction.auditLog.create({
            data: {
              workspaceId: session.workspaceId,
              actorUserId: session.userId,
              action: "auth.logged_out",
              targetType: "session",
              targetId: session.id,
              requestId,
            },
          });
        });
      }
    }
    return { message: "Signed out." };
  }

  async forgotPassword(input: ForgotPasswordDto): Promise<MessageResponse> {
    if (!this.mail.configured) {
      throw new AppException(
        "EMAIL_DELIVERY_NOT_CONFIGURED",
        "Password reset email is not configured on this environment.",
        503,
      );
    }
    const user = await this.prisma.user.findFirst({
      where: { email: input.email, status: "ACTIVE" },
    });
    if (user) {
      try {
        const token = await this.issueToken(user.id, "PASSWORD_RESET", 30 * 60 * 1000);
        await this.mail.sendPasswordReset(user.email, token);
      } catch {
        this.logger.error("Password reset email could not be sent");
      }
    }
    return { message: "If the account exists, reset instructions have been requested." };
  }

  async resetPassword(input: ResetPasswordDto): Promise<MessageResponse> {
    const passwordHash = await this.hashPassword(input.password);
    const changed = await this.consumeToken(
      input.token,
      "PASSWORD_RESET",
      async (transaction, token) => {
        await transaction.user.update({
          where: { id: token.userId },
          data: { passwordHash },
        });
        await transaction.session.updateMany({
          where: { userId: token.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      },
    );
    if (!changed) this.invalidToken();
    return { message: "Password updated. Please sign in again." };
  }

  async verifyEmail(input: VerifyEmailDto): Promise<MessageResponse> {
    const changed = await this.consumeToken(
      input.token,
      "EMAIL_VERIFICATION",
      async (transaction, token) => {
        await transaction.user.update({
          where: { id: token.userId },
          data: { emailVerifiedAt: new Date() },
        });
      },
    );
    if (!changed) this.invalidToken();
    return { message: "Email verified." };
  }

  async resendVerification(userId: string, workspaceId: string): Promise<MessageResponse> {
    if (!this.mail.configured) {
      throw new AppException("EMAIL_DELIVERY_NOT_CONFIGURED", "Verification email is not configured.", 503);
    }
    const user = await this.prisma.user.findFirst({ where: { id: userId, workspaceId } });
    if (!user) throw new AppException("NOT_FOUND", "Account not found.", 404);
    if (user.emailVerifiedAt) return { message: "Email is already verified." };
    try {
      await this.sendVerificationForUser(user.id, user.email);
      return { message: "Verification email requested." };
    } catch {
      throw new AppException("EMAIL_DELIVERY_FAILED", "Verification email could not be sent.", 502);
    }
  }

  private async sendVerificationForUser(userId: string, email: string): Promise<void> {
    const token = await this.issueToken(userId, "EMAIL_VERIFICATION", 24 * 60 * 60 * 1000);
    await this.mail.sendVerification(email, token);
  }

  private async issueToken(
    userId: string,
    purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
    ttlMs: number,
  ): Promise<string> {
    const raw = createOpaqueToken();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.authToken.updateMany({
        where: { userId, purpose, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await transaction.authToken.create({
        data: {
          userId,
          purpose,
          tokenHash: hashOpaqueToken(raw),
          expiresAt: new Date(Date.now() + ttlMs),
        },
      });
    });
    return raw;
  }

  private async consumeToken(
    raw: string,
    purpose: "EMAIL_VERIFICATION" | "PASSWORD_RESET",
    mutate: (
      transaction: Prisma.TransactionClient,
      token: { id: string; userId: string },
    ) => Promise<void>,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const token = await transaction.authToken.findFirst({
        where: {
          tokenHash: hashOpaqueToken(raw),
          purpose,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: { select: { workspaceId: true } } },
      });
      if (!token) return false;
      const consumed = await transaction.authToken.updateMany({
        where: { id: token.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (consumed.count !== 1) return false;
      await mutate(transaction, token);
      await transaction.auditLog.create({
        data: {
          workspaceId: token.user.workspaceId,
          actorUserId: token.userId,
          action: purpose === "PASSWORD_RESET" ? "auth.password_reset" : "auth.email_verified",
          targetType: "user",
          targetId: token.userId,
        },
      });
      return true;
    });
  }

  private invalidToken(): never {
    throw new AppException("INVALID_TOKEN", "This link is invalid or has expired.", 400);
  }

  private hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hashPassword(createOpaqueToken());
    return this.dummyHash;
  }

  private sessionExpiry(): Date {
    const days = this.config.get("SESSION_TTL_DAYS");
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}
