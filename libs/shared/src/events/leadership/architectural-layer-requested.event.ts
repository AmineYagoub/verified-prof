import { IsString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class FileMetadataDto {
  @IsString()
  path!: string;

  @IsNumber()
  editCount!: number;

  @IsString()
  lastModified!: string;
}

export class ArchitecturalLayerRequestedEvent {
  @IsString()
  userId!: string;

  @IsString()
  userProfileId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileMetadataDto)
  fileMetadata!: FileMetadataDto[];
}
