import { integer, numeric, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  age: integer('age').notNull(),
  weight: numeric('weight', { precision: 5, scale: 2 }).notNull(),
  height: numeric('height', { precision: 5, scale: 2 }).notNull(),
  goal: text('goal').notNull(),
  activityLevel: text('activity_level').notNull(),
});