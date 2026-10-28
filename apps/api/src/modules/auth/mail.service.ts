import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";
import type { AppEnvironment } from "../../config/environment";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService<AppEnvironment, true>) {}

  get configured(): boolean {
    return Boolean(this.config.get("SMTP_URL") && this.config.get("MAIL_FROM"));
  }

  async sendVerification(email: string, token: string): Promise<void> {
    const url = this.url("/verify-email", token);
    await this.send(email, "Verify your FlowCapture email", `Verify your email: ${url}`);
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const url = this.url("/reset-password", token);
    await this.send(email, "Reset your FlowCapture password", `Reset your password: ${url}`);
  }

  private url(path: string, token: string): string {
    const base = this.config.get("APP_BASE_URL").replace(/\/$/, "");
    return `${base}${path}?token=${encodeURIComponent(token)}`;
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    if (!this.configured) throw new Error("Email delivery is not configured");
    this.transporter ??= nodemailer.createTransport(this.config.get("SMTP_URL"));
    await this.transporter.sendMail({
      from: this.config.get("MAIL_FROM"),
      to,
      subject,
      text,
    });
    this.logger.log(`Transactional email accepted by SMTP: ${subject}`);
  }
}
