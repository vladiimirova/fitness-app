import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(12)
  @Max(100)
  age: number;

  @IsInt()
  @Min(30)
  @Max(300)
  weight: number;

  @IsInt()
  @Min(100)
  @Max(250)
  height: number;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  goal: string;

  @IsString()
  @IsNotEmpty()
  activityLevel: string;

  @IsInt()
  @Min(1)
  @Max(7)
  trainingDaysPerWeek: number;

  @IsString()
  @IsNotEmpty()
  experienceLevel: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
