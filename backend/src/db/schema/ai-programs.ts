import {
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core';
import { authUsersTable } from './auth-users';

export const aiProgramsTable = pgTable('ai_programs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => authUsersTable.id)
    .notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
