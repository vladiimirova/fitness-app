import { numeric, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const foodsTable = pgTable('foods', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  calories: numeric('calories', { precision: 6, scale: 2 }).notNull(),
  protein: numeric('protein', { precision: 6, scale: 2 }).notNull(),
  fat: numeric('fat', { precision: 6, scale: 2 }).notNull(),
  carbs: numeric('carbs', { precision: 6, scale: 2 }).notNull(),
});