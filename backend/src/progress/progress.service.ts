import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db';
import { progressEntriesTable } from '../db/schema/progress-entries';
import { CreateProgressEntryDto } from './dto/create-progress-entry.dto';

@Injectable()
export class ProgressService {
  async getMyEntries(userId: number) {
    const entries = await db
      .select()
      .from(progressEntriesTable)
      .where(eq(progressEntriesTable.userId, userId))
      .orderBy(
        asc(progressEntriesTable.entryDate),
        asc(progressEntriesTable.id),
      );

    return entries.map((entry) => this.toResponse(entry));
  }

  async createEntry(userId: number, data: CreateProgressEntryDto) {
    const result = await db
      .insert(progressEntriesTable)
      .values({
        userId,
        entryDate: data.date,
        weight: String(data.weight),
        waist: String(data.waist),
        completedWorkouts: data.completedWorkouts,
        energy: data.energy,
        sleepHours: String(data.sleepHours),
        mood: data.mood,
        notes: data.notes ?? '',
      })
      .returning();

    return this.toResponse(result[0]);
  }

  private toResponse(entry: typeof progressEntriesTable.$inferSelect) {
    return {
      id: String(entry.id),
      date: entry.entryDate,
      weight: Number(entry.weight),
      waist: Number(entry.waist),
      completedWorkouts: entry.completedWorkouts,
      energy: entry.energy,
      sleepHours: Number(entry.sleepHours),
      mood: entry.mood,
      notes: entry.notes,
    };
  }
}
