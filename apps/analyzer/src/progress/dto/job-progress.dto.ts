import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { JobStatus, JobStage } from '@verified-prof/shared';

export class JobProgressResponseDto {
  @IsString()
  id!: string;

  @IsString()
  userId!: string;

  @IsEnum(JobStatus)
  status!: JobStatus;

  @IsEnum(JobStage)
  @IsOptional()
  currentStage?: JobStage;

  @IsNumber()
  progress!: number;

  @IsString()
  startedAt!: string;

  @IsString()
  @IsOptional()
  completedAt?: string | null;

  @IsString()
  @IsOptional()
  error?: string | null;
}
