import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { authUsersTable } from './auth-users';
import { trainingPlansTable } from './training-plans';

export const trainingSessionsTable = pgTable('training_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => authUsersTable.id)
    .notNull(),
  trainingPlanId: integer('training_plan_id')
    .references(() => trainingPlansTable.id)
    .notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at'),
  status: text('status').notNull(),
});