import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, type TransformFnParams } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import {
  DATE_FORMATS,
  SUPPORTED_LANGUAGES,
  USAGE_CATEGORIES,
} from "@flowcapture/shared-types";
import { IsIanaTimezone } from "../../common/validators/timezone.validator";

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => typeof value === "string" ? value.trim() : value)
  @IsString()
  @Length(1, 80)
  displayName?: string;

  @ApiPropertyOptional({ enum: SUPPORTED_LANGUAGES })
  @IsOptional()
  @IsIn(SUPPORTED_LANGUAGES)
  preferredLanguage?: (typeof SUPPORTED_LANGUAGES)[number];

  @ApiPropertyOptional({ example: "Asia/Jerusalem" })
  @IsOptional()
  @IsIanaTimezone()
  timezone?: string;

  @ApiPropertyOptional({ enum: USAGE_CATEGORIES, nullable: true })
  @IsOptional()
  @IsIn(USAGE_CATEGORIES)
  usageCategory?: (typeof USAGE_CATEGORIES)[number] | null;

  @ApiPropertyOptional({ enum: DATE_FORMATS })
  @IsOptional()
  @IsIn(DATE_FORMATS)
  dateFormat?: (typeof DATE_FORMATS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  completeOnboarding?: boolean;
}
