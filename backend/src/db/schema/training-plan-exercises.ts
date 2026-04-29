import { integer, pgTable } from 'drizzle-orm/pg-core';
import { trainingPlansTable } from './training-plans';
import { exercisesTable } from './exercises';

export const trainingPlanExercisesTable = pgTable('training_plan_exercises', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

  trainingPlanId: integer('training_plan_id')
    .references(() => trainingPlansTable.id)
    .notNull(),

  exerciseId: integer('exercise_id')
    .references(() => exercisesTable.id)
    .notNull(),

  weekNumber: integer('week_number').notNull(),
  dayNumber: integer('day_number').notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
});