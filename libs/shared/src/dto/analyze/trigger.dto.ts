import { IsEnum } from 'class-validator';

export class AnalysisTriggerRequestDto {
  @IsEnum(['FREE', 'PREMIUM'])
  plan!: 'FREE' | 'PREMIUM';
}
