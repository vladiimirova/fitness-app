import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createProfile(
    @Req() req: { user: { userId: number; email: string } },
    @Body() body: CreateProfileDto,
  ) {
    return this.profileService.createProfile(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyProfile(@Req() req: { user: { userId: number; email: string } }) {
    return this.profileService.getMyProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMyProfile(
    @Req() req: { user: { userId: number; email: string } },
    @Body() body: UpdateProfileDto,
  ) {
    return this.profileService.updateMyProfile(req.user.userId, body);
  }
}