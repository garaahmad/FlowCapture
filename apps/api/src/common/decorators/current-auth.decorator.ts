import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedContext } from "../../modules/auth/auth.context";

export type AuthenticatedRequest = Request & { auth: AuthenticatedContext };

export const CurrentAuth = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedContext => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
  },
);
