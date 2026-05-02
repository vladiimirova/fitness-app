import {
  IsDateString,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProgressEntryDto {
  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  @Max(500)
  weight: number;

  @IsNumber()
  @Min(0)
  @Max(300)
  waist: number;

  @IsInt()
  @Min(0)
  @Max(100000)
  steps: number;

  @IsInt()
  @Min(0)
  @Max(14)
  completedWorkouts: number;

  @IsInt()
  @Min(1)
  @Max(10)
  energy: number;

  @IsNumber()
  @Min(0)
  @Max(14)
  sleepHours: number;

  @IsInt()
  @Min(1)
  @Max(10)
  mood: number;

  @IsBoolean()
  followedNutrition: boolean;

  @IsBoolean()
  completedTraining: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
