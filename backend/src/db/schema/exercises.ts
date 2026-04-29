import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const exercisesTable = pgTable('exercises', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  muscleGroup: text('muscle_group').notNull(),
  description: text('description'),
  equipment: text('equipment'),
});