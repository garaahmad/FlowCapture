import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import type { Express } from "express";
import { AppModule } from "./app.module";
import { configuredOrigins, type AppEnvironment } from "./config/environment";
import { SESSION_COOKIE_NAME } from "./modules/auth/session-token";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const config = app.get(ConfigService<AppEnvironment, true>);

  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use(cookieParser());
  app.useBodyParser("json", { limit: "100kb" });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
  }));
  app.enableCors({
    origin: configuredOrigins(config.get("WEB_ORIGINS")),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });
  if (config.get("TRUST_PROXY")) {
    const server = app.getHttpAdapter().getInstance() as Express;
    server.set("trust proxy", 1);
  }

  const swaggerEnabled = config.get("SWAGGER_ENABLED") ?? config.get("NODE_ENV") !== "production";
  if (swaggerEnabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("FlowCapture AI API")
        .setDescription("Consent-first natural-language automation API")
        .setVersion("0.1.0")
        .addCookieAuth(SESSION_COOKIE_NAME)
        .build(),
    );
    SwaggerModule.setup("docs", app, document, { useGlobalPrefix: true });
  }

  app.enableShutdownHooks();
  await app.listen(config.get("PORT"), "0.0.0.0");
}

void bootstrap();
