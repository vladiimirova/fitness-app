import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { TrainingModule } from './training/training.module';

@Module({
  imports: [UsersModule, AuthModule, ProfileModule, TrainingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}