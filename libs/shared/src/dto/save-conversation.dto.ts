import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TranscriptEntryDto {
  speaker!: 'user' | 'twin';
  text!: string;
  timestamp!: string;
}

export class SaveConversationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranscriptEntryDto)
  transcript!: TranscriptEntryDto[];

  @IsNumber()
  duration!: number;
}
