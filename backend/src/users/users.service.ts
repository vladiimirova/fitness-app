import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { db } from '../db';
import { authUsersTable } from '../db/schema/auth-users';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(private readonly authService: AuthService) {}

  async register(data: CreateUserDto) {
    const existingUser = await db
      .select()
      .from(authUsersTable)
      .where(eq(authUsersTable.email, data.email));

    if (existingUser.length > 0) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await db
      .insert(authUsersTable)
      .values({
        email: data.email,
        password: hashedPassword,
      })
      .returning({
        id: authUsersTable.id,
        email: authUsersTable.email,
      });

    return user[0];
  }

  async login(data: LoginUserDto) {
    const users = await db
      .select()
      .from(authUsersTable)
      .where(eq(authUsersTable.email, data.email));

    const user = users[0];

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.authService.generateToken({
      sub: user.id,
      email: user.email,
    });

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
      },
      ...token,
    };
  }

  async testDb() {
    const result = await db.execute('select now()');
    return result;
  }
}
