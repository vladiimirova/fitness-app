import 'dotenv/config';
import { db } from '../db';
import { exercisesTable } from '../db/schema/exercises';

const API_KEY = process.env.API_NINJAS_KEY;

const muscles = ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps'];

async function loadExercises() {
  if (!API_KEY) {
    throw new Error('API_NINJAS_KEY is not set');
  }

  for (const muscle of muscles) {
    const res = await fetch(
      `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}`,
      {
        headers: {
          'X-Api-Key': API_KEY,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to load exercises for muscle: ${muscle}`);
    }

    const data = await res.json();

    for (const ex of data) {
      await db.insert(exercisesTable).values({
        name: ex.name,
        muscleGroup: ex.muscle,
        description: ex.instructions ?? '',
        equipment: ex.equipment ?? '',
      });
    }
  }

  console.log('Exercises loaded');
}

loadExercises().catch((error) => {
  console.error(error);
  process.exit(1);
});