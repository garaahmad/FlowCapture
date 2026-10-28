import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, type TransformFnParams } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Length, MaxLength, Min } from "class-validator";

export class CreateConversationDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => typeof value === "string" ? value.trim() : value)
  @IsString()
  @Length(1, 120)
  title?: string;
}

export class SendMessageDto {
  @ApiProperty({ maxLength: 4000 })
  @Transform(({ value }: TransformFnParams) => typeof value === "string" ? value.trim() : value)
  @IsString()
  @Length(1, 4000)
  content!: string;

  @ApiProperty({ description: "Client-generated idempotency identifier", maxLength: 100 })
  @IsString()
  @Length(8, 100)
  clientMessageId!: string;
}

export class ApprovePlanDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  version!: number;

  @ApiProperty()
  @IsString()
  @Length(64, 64)
  contentHash!: string;

  @ApiProperty({ description: "Confirms review of scopes and side effects, not live execution" })
  @IsBoolean()
  confirmScopes!: boolean;
}

export class ChangeRequestDto {
  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => typeof value === "string" ? value.trim() : value)
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
