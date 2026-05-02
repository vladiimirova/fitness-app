import {
  date,
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { authUsersTable } from './auth-users';

export const progressEntriesTable = pgTable('progress_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => authUsersTable.id)
    .notNull(),
  entryDate: date('entry_date').notNull(),
  weight: numeric('weight', { precision: 6, scale: 1 }).notNull(),
  waist: numeric('waist', { precision: 6, scale: 1 }).notNull(),
  steps: integer('steps').notNull().default(0),
  completedWorkouts: integer('completed_workouts').notNull(),
  energy: integer('energy').notNull(),
  sleepHours: numeric('sleep_hours', { precision: 4, scale: 1 }).notNull(),
  mood: integer('mood').notNull(),
  followedNutrition: boolean('followed_nutrition').notNull().default(false),
  completedTraining: boolean('completed_training').notNull().default(false),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
