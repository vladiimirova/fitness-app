import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { TranslateService } from '../translate/translate.service';

@Module({
  controllers: [TrainingController],
  providers: [TrainingService, TranslateService],
})
export class TrainingModule {}