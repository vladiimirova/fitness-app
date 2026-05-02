import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProgressEntryDto } from './dto/create-progress-entry.dto';
import { ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyEntries(@Req() req: { user: { userId: number; email: string } }) {
    return this.progressService.getMyEntries(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  createMyEntry(
    @Req() req: { user: { userId: number; email: string } },
    @Body() body: CreateProgressEntryDto,
  ) {
    return this.progressService.createEntry(req.user.userId, body);
  }
}
