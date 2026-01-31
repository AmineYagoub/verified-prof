import { IsNotEmpty, IsString } from 'class-validator';

export class AccountUpdatedDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  providerId!: string;
}
