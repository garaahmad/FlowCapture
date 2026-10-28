import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import type { Request, Response } from "express";
import type { ApiErrorBody } from "@flowcapture/shared-types";
import { AppException, type ErrorDetail } from "../app.exception";
import { getRequestId } from "../request";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const requestId = getRequestId(request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "An unexpected error occurred. Please try again.";
    let details: ErrorDetail[] = [];

    if (exception instanceof AppException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof ThrottlerException) {
      status = exception.getStatus();
      code = "RATE_LIMITED";
      message = "Too many requests. Please wait before trying again.";
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      const responseMessage = typeof body === "object" && body && "message" in body
        ? body.message
        : exception.message;
      if (Array.isArray(responseMessage)) {
        code = "VALIDATION_ERROR";
        message = "Please correct the highlighted fields.";
        details = responseMessage.map((item) => ({ message: String(item) }));
      } else {
        code = status === 404 ? "NOT_FOUND" : "REQUEST_ERROR";
        message = typeof responseMessage === "string" ? responseMessage : exception.message;
      }
    } else {
      this.logger.error(
        `Unhandled request error (${requestId ?? "no-request-id"})`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: ApiErrorBody = {
      error: { code, message, requestId, details },
    };
    response.status(status).json(body);
  }
}
