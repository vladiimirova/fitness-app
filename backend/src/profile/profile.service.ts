import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { userProfilesTable } from '../db/schema/user-profiles';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  async createProfile(userId: number, data: CreateProfileDto) {
    const existingProfile = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId));

    if (existingProfile.length > 0) {
      throw new BadRequestException('Profile already exists for this user');
    }

    const result = await db
      .insert(userProfilesTable)
      .values({
        userId,
        name: data.name,
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        goal: data.goal,
        activityLevel: data.activityLevel,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        experienceLevel: data.experienceLevel,
        avatarUrl: data.avatarUrl ?? null,
      })
      .returning();

    return result[0];
  }

  async getMyProfile(userId: number) {
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId));

    return profiles[0] ?? null;
  }

  async updateMyProfile(userId: number, data: UpdateProfileDto) {
    const existingProfile = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId));

    if (existingProfile.length === 0) {
      throw new NotFoundException('Profile not found');
    }

    const result = await db
      .update(userProfilesTable)
      .set({
        ...data,
      })
      .where(eq(userProfilesTable.userId, userId))
      .returning();

    return result[0];
  }
}
