import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { authUsersTable } from './auth-users';

export const trainingPlansTable = pgTable('training_plans', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id')
    .references(() => authUsersTable.id)
    .notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});