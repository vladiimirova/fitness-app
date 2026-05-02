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

    this.validateTargetWeight(data.weight, data.targetWeight, data.goal);

    const result = await db
      .insert(userProfilesTable)
      .values({
        userId,
        name: data.name,
        age: data.age,
        weight: data.weight,
        targetWeight: data.targetWeight ?? null,
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

    const current = existingProfile[0];
    const nextTargetWeight =
      'targetWeight' in data
        ? (data.targetWeight ?? undefined)
        : (current.targetWeight ?? undefined);

    this.validateTargetWeight(
      data.weight ?? current.weight,
      nextTargetWeight,
      data.goal ?? current.goal,
    );

    const result = await db
      .update(userProfilesTable)
      .set({
        ...data,
      })
      .where(eq(userProfilesTable.userId, userId))
      .returning();

    return result[0];
  }

  private validateTargetWeight(
    weight: number,
    targetWeight: number | null | undefined,
    goal: string,
  ) {
    if (!targetWeight) {
      return;
    }

    if (
      (goal === 'lose_weight' || goal === 'lose weight') &&
      targetWeight >= weight
    ) {
      throw new BadRequestException(
        'Для схуднення цільова вага має бути меншою за поточну',
      );
    }

    if (
      (goal === 'gain_muscle' || goal === 'gain muscle') &&
      targetWeight <= weight
    ) {
      throw new BadRequestException(
        'Для набору маси цільова вага має бути більшою за поточну',
      );
    }

    if (
      (goal === 'maintain' || goal === 'maintenance') &&
      Math.abs(targetWeight - weight) > 2
    ) {
      throw new BadRequestException(
        'Для підтримки форми цільова вага має бути близькою до поточної',
      );
    }
  }
}
