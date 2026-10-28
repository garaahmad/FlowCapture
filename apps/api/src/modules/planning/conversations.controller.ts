import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { ApiData } from "@flowcapture/shared-types";
import type {
  ConversationDetailDto,
  ConversationSummaryDto,
  SendMessageResponseDto,
} from "@flowcapture/workflow-schema";
import { CurrentAuth } from "../../common/decorators/current-auth.decorator";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedContext } from "../auth/auth.context";
import { SESSION_COOKIE_NAME } from "../auth/session-token";
import { CreateConversationDto, SendMessageDto } from "./conversations.dto";
import { ConversationsService } from "./conversations.service";

@ApiTags("Conversations")
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller("conversations")
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Post()
  async create(@CurrentAuth() auth: AuthenticatedContext, @Body() input: CreateConversationDto): Promise<ApiData<ConversationSummaryDto>> {
    return { data: await this.conversations.create(auth, input) };
  }

  @Get()
  async list(@CurrentAuth() auth: AuthenticatedContext): Promise<ApiData<ConversationSummaryDto[]>> {
    return { data: await this.conversations.list(auth) };
  }

  @Get(":id")
  async get(@CurrentAuth() auth: AuthenticatedContext, @Param("id", ParseUUIDPipe) id: string): Promise<ApiData<ConversationDetailDto>> {
    return { data: await this.conversations.get(auth, id) };
  }

  @Post(":id/messages")
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  async send(
    @CurrentAuth() auth: AuthenticatedContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: SendMessageDto,
  ): Promise<ApiData<SendMessageResponseDto>> {
    return { data: await this.conversations.sendMessage(auth, id, input) };
  }
}
