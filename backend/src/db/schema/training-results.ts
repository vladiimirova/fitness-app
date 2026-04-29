import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { trainingSessionsTable } from './training-sessions';
import { exercisesTable } from './exercises';

export const trainingResultsTable = pgTable('training_results', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .references(() => trainingSessionsTable.id)
    .notNull(),
  exerciseId: integer('exercise_id')
    .references(() => exercisesTable.id)
    .notNull(),
  completedSets: integer('completed_sets').notNull(),
  completedReps: integer('completed_reps').notNull(),
  notes: text('notes'),
});