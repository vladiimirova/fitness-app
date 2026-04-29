import { pgTable, varchar, integer } from 'drizzle-orm/pg-core';

export const authUsersTable = pgTable('auth_users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  email: varchar('email', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
});