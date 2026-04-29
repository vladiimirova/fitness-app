import { integer, numeric, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { nutritionPlansTable } from './nutrition-plans';
import { foodsTable } from './foods';

export const nutritionPlanFoodsTable = pgTable('nutrition_plan_foods', {
  id: serial('id').primaryKey(),
  nutritionPlanId: integer('nutrition_plan_id')
    .references(() => nutritionPlansTable.id)
    .notNull(),
  foodId: integer('food_id')
    .references(() => foodsTable.id)
    .notNull(),
  mealType: text('meal_type').notNull(),
  quantityGrams: numeric('quantity_grams', { precision: 6, scale: 2 }).notNull(),
});