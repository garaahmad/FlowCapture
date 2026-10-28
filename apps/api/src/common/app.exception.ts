import { HttpException } from "@nestjs/common";

export interface ErrorDetail {
  field?: string;
  message: string;
}

export class AppException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: number,
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message, status);
  }
}
