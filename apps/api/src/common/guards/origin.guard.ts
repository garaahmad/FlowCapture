import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import { AppException } from "../app.exception";
import { configuredOrigins, type AppEnvironment } from "../../config/environment";

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppEnvironment, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;

    const origin = request.header("origin");
    if (!origin) {
      if (request.header("sec-fetch-site") === "cross-site") {
        throw new AppException("ORIGIN_DENIED", "Cross-site request denied.", 403);
      }
      return true;
    }

    const allowed = configuredOrigins(this.config.get("WEB_ORIGINS"));
    const previewAllowed = this.config.get("NODE_ENV") !== "production"
      && this.config.get("ALLOW_PREVIEW_ORIGINS")
      && isAllowedPreviewOrigin(origin);

    if (!allowed.includes(origin) && !previewAllowed) {
      throw new AppException("ORIGIN_DENIED", "Request origin is not allowed.", 403);
    }
    return true;
  }
}

function isAllowedPreviewOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".e2b.app");
  } catch {
    return false;
  }
}
