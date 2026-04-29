import { integer, pgTable, varchar } from 'drizzle-orm/pg-core';
import { authUsersTable } from './auth-users';

export const userProfilesTable = pgTable('user_profiles', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

  userId: integer('user_id')
    .references(() => authUsersTable.id)
    .notNull()
    .unique(),

  name: varchar('name', { length: 255 }).notNull(),
  age: integer('age').notNull(),
  weight: integer('weight').notNull(),
  height: integer('height').notNull(),
  gender: varchar('gender', { length: 50 }).notNull(),
  goal: varchar('goal', { length: 255 }).notNull(),
  activityLevel: varchar('activity_level', { length: 255 }).notNull(),
  trainingDaysPerWeek: integer('training_days_per_week').notNull(),
  experienceLevel: varchar('experience_level', { length: 100 }).notNull(),
});