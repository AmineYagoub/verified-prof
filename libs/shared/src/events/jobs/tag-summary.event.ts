import {
  IsOptional,
  IsString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TagSummary } from '../../types';

export class TagSummaryEvent {
  @IsString()
  repo!: string;

  @IsString()
  commitSha!: string;

  @IsString()
  filePath!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  tagSummary!: TagSummary;
}

export class MissionMetadata {
  @IsString()
  commit_message!: string;

  @IsString()
  total_files!: number;

  @IsString()
  total_complexity!: number;
}

export class MissionEvent {
  constructor(
    public readonly mission_metadata: MissionMetadata,
    public readonly summaries: TagSummaryEvent[],
  ) {}
}
