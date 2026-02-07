import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CommitMetadataDto {
  @IsString()
  sha!: string;

  @IsString()
  message!: string;

  @IsString()
  authorDate!: string;

  @IsString()
  authorId!: string;

  @IsNumber()
  additions!: number;

  @IsNumber()
  deletions!: number;

  @IsNumber()
  filesChanged!: number;

  @IsArray()
  @IsString({ each: true })
  parentShas!: string[];
}

export class CodeOwnershipDto {
  @IsString()
  filePath!: string;

  @IsNumber()
  totalCommits!: number;

  @IsNumber()
  authorCommits!: number;

  @IsNumber()
  ownershipPercentage!: number;
}

export class PullRequestReviewDto {
  @IsString()
  commitSha!: string;

  @IsNumber()
  prNumber!: number;

  @IsString()
  reviewedAt!: string;

  @IsNumber()
  commentsCount!: number;
}

export class AnalysisPersistedEvent {
  @IsOptional()
  @IsString()
  userId?: string | null;

  @IsArray()
  @IsString({ each: true })
  commitShas!: string[];

  @IsNumber()
  totalFiles!: number;

  @IsNumber()
  totalComplexity!: number;

  @IsString()
  weekStart!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitMetadataDto)
  commitMetadata?: CommitMetadataDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CodeOwnershipDto)
  codeOwnership?: CodeOwnershipDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PullRequestReviewDto)
  pullRequestReviews?: PullRequestReviewDto[];

  @IsOptional()
  @IsNumber()
  teamSize?: number;

  @IsOptional()
  @IsArray()
  tagSummaries?: Array<{
    id: string;
    repoFullName: string;
    commitSha: string;
    filePath: string;
    tagSummary: any;
    createdAt: Date;
  }>;
}
