import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { authUsersTable } from './auth-users';

export const nutritionPlansTable = pgTable('nutrition_plans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => authUsersTable.id)
    .notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});