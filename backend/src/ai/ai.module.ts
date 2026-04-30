import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfileModule } from '../profile/profile.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';

@Module({
  imports: [AuthModule, ProfileModule],
  controllers: [AiController],
  providers: [AiService, GeminiService],
  exports: [AiService],
})
export class AiModule {}
