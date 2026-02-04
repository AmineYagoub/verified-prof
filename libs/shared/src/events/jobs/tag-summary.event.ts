import {
  IsOptional,
  IsString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { type TagSummary } from '../../types/ast-analysis';

export class TagSummaryEvent {
  @IsString()
  repo!: string;

  @IsString()
  commitSha!: string;

  @IsString()
  filePath!: string;

  @IsString()
  userId!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  tagSummary!: TagSummary;

  @IsOptional()
  fileStats?: {
    additions: number;
    deletions: number;
    changes: number;
  };
}

export class MissionMetadata {
  @IsString()
  commit_message!: string;

  @IsString()
  total_files!: number;

  @IsString()
  total_complexity!: number;

  @IsOptional()
  @IsString()
  repoOwner?: string;

  @IsOptional()
  @IsString()
  repoName?: string;

  @IsOptional()
  commitAuthor?: {
    name: string;
    email: string;
    date: string;
  };

  @IsOptional()
  commitStats?: {
    additions: number;
    deletions: number;
  };

  @IsOptional()
  @IsString({ each: true })
  parentShas?: string[];

  @IsOptional()
  @IsString()
  plan?: 'FREE' | 'PREMIUM' | 'ENTERPRISE';
}

export class MissionEvent {
  constructor(
    public readonly mission_metadata: MissionMetadata,
    public readonly summaries: TagSummaryEvent[],
  ) {}
}
