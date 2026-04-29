import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TrainingService } from './training.service';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  generate(@Req() req: { user: { userId: number; email: string } }) {
    return this.trainingService.generateTrainingPlan(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMy(@Req() req: { user: { userId: number; email: string } }) {
    return this.trainingService.getMyPlans(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/full')
  getMyFull(@Req() req: { user: { userId: number; email: string } }) {
    return this.trainingService.getMyPlanWithExercises(req.user.userId);
  }
}