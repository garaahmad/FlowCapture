import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { MailService } from "./mail.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, MailService],
  exports: [AuthGuard, AuthService],
})
export class AuthModule {}
