import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const exercisesTable = pgTable('exercises', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  nameUk: text('name_uk'),
  muscleGroup: text('muscle_group').notNull(),
  muscleGroupUk: text('muscle_group_uk'),
  description: text('description'),
  equipment: text('equipment'),
});
