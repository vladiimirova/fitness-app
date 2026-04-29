import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async generateToken(payload: { sub: number; email: string }) {
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}