import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard)
  @Get('advice/me')
  getMyAdvice(@Req() req: { user: { userId: number; email: string } }) {
    return this.aiService.getAdviceForUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('program/me')
  getMyProgram(@Req() req: { user: { userId: number; email: string } }) {
    return this.aiService.getLatestProgramForUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('program/me')
  generateMyProgram(@Req() req: { user: { userId: number; email: string } }) {
    return this.aiService.generateProgramForUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat/me')
  chatWithAi(
    @Req() req: { user: { userId: number; email: string } },
    @Body()
    body: {
      message?: string;
      history?: Array<{ role?: string; text?: string }>;
    },
  ) {
    return this.aiService.chatWithUser(
      req.user.userId,
      body.message ?? '',
      body.history ?? [],
    );
  }
}
