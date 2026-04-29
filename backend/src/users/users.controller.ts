import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() body: CreateUserDto) {
    return this.usersService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginUserDto) {
    return this.usersService.login(body);
  }

  @Get('db-test')
  testDb() {
    return this.usersService.testDb();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: { user: { userId: number; email: string } }) {
    return {
      message: 'Protected route works',
      user: req.user,
    };
  }
}