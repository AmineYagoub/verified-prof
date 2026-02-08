import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AnalysisTriggerRequestDto {
  @IsEnum(['FREE', 'PREMIUM'])
  plan!: 'FREE' | 'PREMIUM';

  @IsOptional()
  @IsString()
  userId?: string;
}
