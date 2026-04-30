import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { TranslateService } from '../translate/translate.service';
import { GeminiService } from '../ai/gemini.service';

@Module({
  imports: [AiModule],
  controllers: [TrainingController],
  providers: [TrainingService, TranslateService, GeminiService],
})
export class TrainingModule {}
