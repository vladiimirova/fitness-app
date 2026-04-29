import { BadRequestException, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { exercisesTable } from '../db/schema/exercises';
import { trainingPlanExercisesTable } from '../db/schema/training-plan-exercises';
import { trainingPlansTable } from '../db/schema/training-plans';
import { userProfilesTable } from '../db/schema/user-profiles';
import { TranslateService } from '../translate/translate.service';

type ExerciseRow = typeof exercisesTable.$inferSelect;

@Injectable()
export class TrainingService {
  constructor(private readonly translateService: TranslateService) {}

  async generateTrainingPlan(userId: number) {
    const profiles = await db
      .select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.userId, userId));

    const profile = profiles[0];

    if (!profile) {
      throw new BadRequestException('Profile not found');
    }

    const allExercises = await db.select().from(exercisesTable);

    if (!allExercises.length) {
      throw new BadRequestException('Exercises database is empty');
    }

    const trainingDaysPerWeek = profile.trainingDaysPerWeek;
    const split = this.getSplit(profile.goal, trainingDaysPerWeek);
    const title = this.buildTitle(profile.goal, trainingDaysPerWeek, split);

    const insertedPlans = await db
      .insert(trainingPlansTable)
      .values({
        userId,
        title,
      })
      .returning();

    const createdPlan = insertedPlans[0];

    const weeklyTemplate = this.buildDayTemplates(profile.goal, trainingDaysPerWeek);

    for (let weekNumber = 1; weekNumber <= 4; weekNumber += 1) {
      for (const day of weeklyTemplate) {
        const pickedExercises = this.pickExercisesForDay(
          allExercises,
          day.muscles,
          profile.experienceLevel,
          5,
        );

        for (const exercise of pickedExercises) {
          await db.insert(trainingPlanExercisesTable).values({
            trainingPlanId: createdPlan.id,
            exerciseId: exercise.exerciseId,
            weekNumber,
            dayNumber: day.dayNumber,
            sets: exercise.sets,
            reps: exercise.reps,
          });
        }
      }
    }

    return createdPlan;
  }

  async getMyPlans(userId: number) {
    return db
      .select()
      .from(trainingPlansTable)
      .where(eq(trainingPlansTable.userId, userId))
      .orderBy(desc(trainingPlansTable.createdAt));
  }

  async getMyPlanWithExercises(userId: number) {
  const plans = await db
    .select()
    .from(trainingPlansTable)
    .where(eq(trainingPlansTable.userId, userId))
    .orderBy(desc(trainingPlansTable.createdAt));

  const plan = plans[0];

  if (!plan) {
    return null;
  }

  const rows = await db
    .select({
      trainingPlanExercise: trainingPlanExercisesTable,
      exercise: exercisesTable,
    })
    .from(trainingPlanExercisesTable)
    .leftJoin(
      exercisesTable,
      eq(trainingPlanExercisesTable.exerciseId, exercisesTable.id),
    )
    .where(eq(trainingPlanExercisesTable.trainingPlanId, plan.id));

  const weeksMap: Record<
    number,
    Record<
      number,
      Array<{
        id: number;
        name: string;
        muscleGroup: string;
        description: string | null;
        equipment: string | null;
        sets: number;
        reps: number;
      }>
    >
  > = {};

  for (const row of rows) {
    const weekNumber = row.trainingPlanExercise.weekNumber;
    const dayNumber = row.trainingPlanExercise.dayNumber;

    if (!weeksMap[weekNumber]) {
      weeksMap[weekNumber] = {};
    }

    if (!weeksMap[weekNumber][dayNumber]) {
      weeksMap[weekNumber][dayNumber] = [];
    }

    const translatedName = await this.translateService.translateToUkrainian(
      row.exercise?.name ?? '',
    );

    const translatedMuscleGroup = await this.translateService.translateToUkrainian(
      row.exercise?.muscleGroup ?? '',
    );

    weeksMap[weekNumber][dayNumber].push({
      id: row.exercise?.id ?? 0,
      name: translatedName,
      muscleGroup: translatedMuscleGroup,
      description: null,
      equipment: row.exercise?.equipment ?? null,
      sets: row.trainingPlanExercise.sets,
      reps: row.trainingPlanExercise.reps,
    });
  }

  const weeks = Object.keys(weeksMap)
    .map(function (weekKey) {
      const weekNumber = Number(weekKey);

      const days = Object.keys(weeksMap[weekNumber])
        .map(function (dayKey) {
          const dayNumber = Number(dayKey);

          return {
            dayNumber,
            exercises: weeksMap[weekNumber][dayNumber],
          };
        })
        .sort(function (a, b) {
          return a.dayNumber - b.dayNumber;
        });

      return {
        weekNumber,
        days,
      };
    })
    .sort(function (a, b) {
      return a.weekNumber - b.weekNumber;
    });

  return {
    plan,
    weeks,
  };
}

  private getSplit(goal: string, trainingDaysPerWeek: number) {
    if (goal === 'gain muscle' || goal === 'gain_muscle') {
      if (trainingDaysPerWeek <= 2) {
        return 'Full Body';
      }

      if (trainingDaysPerWeek === 3) {
        return 'Upper / Lower / Full Body';
      }

      return 'Upper / Lower Split';
    }

    if (goal === 'lose weight' || goal === 'lose_weight') {
      if (trainingDaysPerWeek <= 2) {
        return 'Full Body + Cardio';
      }

      if (trainingDaysPerWeek === 3) {
        return 'Full Body Split';
      }

      return 'Fat Loss Split';
    }

    if (trainingDaysPerWeek <= 2) {
      return 'Full Body';
    }

    if (trainingDaysPerWeek === 3) {
      return 'Balanced 3-day Split';
    }

    return 'Balanced 4-day Split';
  }

  private buildTitle(goal: string, trainingDaysPerWeek: number, split: string) {
    const goalMap: Record<string, string> = {
      'gain muscle': 'Набір м’язової маси',
      gain_muscle: 'Набір м’язової маси',
      'lose weight': 'Схуднення',
      lose_weight: 'Схуднення',
      maintain: 'Підтримка форми',
    };

    const goalText = goalMap[goal] ?? 'Тренувальний план';

    return `${goalText}: ${trainingDaysPerWeek} дн./тиж. • ${split} • 4 тижні`;
  }

  private buildDayTemplates(goal: string, trainingDaysPerWeek: number) {
    if (goal === 'gain muscle' || goal === 'gain_muscle') {
      if (trainingDaysPerWeek === 2) {
        return [
          { dayNumber: 1, muscles: ['chest', 'back', 'legs', 'shoulders'] },
          { dayNumber: 2, muscles: ['legs', 'biceps', 'triceps', 'shoulders'] },
        ];
      }

      if (trainingDaysPerWeek === 3) {
        return [
          { dayNumber: 1, muscles: ['chest', 'triceps', 'shoulders'] },
          { dayNumber: 2, muscles: ['legs', 'legs', 'legs'] },
          { dayNumber: 3, muscles: ['back', 'biceps', 'shoulders'] },
        ];
      }

      return [
        { dayNumber: 1, muscles: ['chest', 'triceps', 'shoulders'] },
        { dayNumber: 2, muscles: ['legs', 'legs', 'legs', 'legs'] },
        { dayNumber: 3, muscles: ['back', 'biceps', 'shoulders'] },
        { dayNumber: 4, muscles: ['legs', 'legs', 'legs', 'legs'] },
      ];
    }

    if (goal === 'lose weight' || goal === 'lose_weight') {
      if (trainingDaysPerWeek === 2) {
        return [
          { dayNumber: 1, muscles: ['chest', 'back', 'legs', 'shoulders'] },
          { dayNumber: 2, muscles: ['legs', 'legs', 'back', 'shoulders'] },
        ];
      }

      if (trainingDaysPerWeek === 3) {
        return [
          { dayNumber: 1, muscles: ['chest', 'back', 'legs'] },
          { dayNumber: 2, muscles: ['legs', 'legs', 'shoulders'] },
          { dayNumber: 3, muscles: ['back', 'chest', 'legs'] },
        ];
      }

      return [
        { dayNumber: 1, muscles: ['chest', 'back', 'legs'] },
        { dayNumber: 2, muscles: ['legs', 'legs', 'shoulders'] },
        { dayNumber: 3, muscles: ['back', 'chest', 'legs'] },
        { dayNumber: 4, muscles: ['legs', 'legs', 'shoulders'] },
      ];
    }

    if (trainingDaysPerWeek === 2) {
      return [
        { dayNumber: 1, muscles: ['chest', 'back', 'legs', 'shoulders'] },
        { dayNumber: 2, muscles: ['legs', 'biceps', 'triceps', 'shoulders'] },
      ];
    }

    if (trainingDaysPerWeek === 3) {
      return [
        { dayNumber: 1, muscles: ['chest', 'back', 'legs'] },
        { dayNumber: 2, muscles: ['shoulders', 'legs', 'triceps'] },
        { dayNumber: 3, muscles: ['back', 'biceps', 'legs'] },
      ];
    }

    return [
      { dayNumber: 1, muscles: ['chest', 'triceps', 'shoulders'] },
      { dayNumber: 2, muscles: ['legs', 'legs', 'legs'] },
      { dayNumber: 3, muscles: ['back', 'biceps', 'shoulders'] },
      { dayNumber: 4, muscles: ['legs', 'legs', 'legs'] },
    ];
  }

  private pickExercisesForDay(
    allExercises: ExerciseRow[],
    muscles: string[],
    experienceLevel: string,
    maxExercises: number,
  ) {
    const picked: Array<{
      exerciseId: number;
      sets: number;
      reps: number;
    }> = [];

    const usedExerciseIds = new Set<number>();

    for (const muscle of muscles) {
      const matched = allExercises.filter((exercise) => {
        return (
          this.matchesMuscle(exercise.muscleGroup, muscle) &&
          !usedExerciseIds.has(exercise.id)
        );
      });

      if (!matched.length) {
        continue;
      }

      const randomExercise = matched[Math.floor(Math.random() * matched.length)];
      const scheme = this.getScheme(experienceLevel, muscle);

      usedExerciseIds.add(randomExercise.id);

      picked.push({
        exerciseId: randomExercise.id,
        sets: scheme.sets,
        reps: scheme.reps,
      });

      if (picked.length >= maxExercises) {
        break;
      }
    }

    if (picked.length < 3) {
      const fallbackPool = allExercises.filter((exercise) => !usedExerciseIds.has(exercise.id));

      while (picked.length < 3 && fallbackPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * fallbackPool.length);
        const fallbackExercise = fallbackPool.splice(randomIndex, 1)[0];

        usedExerciseIds.add(fallbackExercise.id);

        picked.push({
          exerciseId: fallbackExercise.id,
          sets: 3,
          reps: 10,
        });
      }
    }

    return picked;
  }

  private matchesMuscle(dbMuscle: string, targetMuscle: string) {
    const value = dbMuscle.toLowerCase();
    const target = targetMuscle.toLowerCase();

    const aliases: Record<string, string[]> = {
      chest: ['chest'],
      back: ['back', 'lats', 'middle_back', 'lower_back'],
      shoulders: ['shoulders'],
      biceps: ['biceps'],
      triceps: ['triceps'],
      legs: ['legs', 'quadriceps', 'hamstrings', 'glutes', 'calves'],
      glutes: ['glutes', 'legs'],
      calves: ['calves', 'legs'],
      abdominals: ['abdominals', 'abs'],
    };

    return aliases[target]?.includes(value) ?? value === target;
  }

  private getScheme(experienceLevel: string, muscle: string) {
    const isLegs =
      muscle === 'legs' ||
      muscle === 'glutes' ||
      muscle === 'calves';

    if (experienceLevel === 'intermediate') {
      return {
        sets: isLegs ? 4 : 3,
        reps: isLegs ? 10 : 12,
      };
    }

    return {
      sets: 3,
      reps: isLegs ? 12 : 10,
    };
  }
}