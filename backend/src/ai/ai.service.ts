import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { aiProgramsTable } from '../db/schema/ai-programs';
import { ProfileService } from '../profile/profile.service';
import { GeminiService } from './gemini.service';

type AiExercise = {
  name: string;
  muscleGroup: string;
  equipment?: string | null;
  sets: number;
  reps: number;
};

type AiFood = {
  name: string;
  grams: number;
  calories: number;
};

type AiProfile = NonNullable<
  Awaited<ReturnType<ProfileService['getMyProfile']>>
>;

type HybridRecommendationModel = {
  normalizedFeatures: Record<string, number>;
  cluster: {
    id: string;
    label: string;
    distance: number;
  };
  regression: {
    targetCalories: number;
    trainingIntensity: number;
  };
};

type AiProgramResponse = {
  profile: {
    name: string;
    goal: string;
    trainingDaysPerWeek: number;
    experienceLevel: string;
  };
  source: {
    ai: 'gemini';
    generationMode: string;
    usesApiNinjas: false;
    variationToken: string;
    profileFingerprint?: string;
    profileSnapshot?: Record<string, unknown>;
    hybridModel?: HybridRecommendationModel;
    savedProgramId?: number;
    savedAt?: Date;
  };
  program: unknown;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly programCooldownDays = 28;

  constructor(
    private readonly geminiService: GeminiService,
    private readonly profileService: ProfileService,
  ) {}

  async getAdviceForUser(userId: number) {
    const profile = await this.profileService.getMyProfile(userId);

    if (!profile) {
      throw new BadRequestException('Profile is required for AI advice');
    }

    const prompt = `
Ти AI-помічник у фітнес-застосунку. Дай користувачу короткі персональні рекомендації українською мовою.

Дані користувача:
- Ім'я: ${profile.name}
- Вік: ${profile.age}
- Стать: ${profile.gender}
- Вага: ${profile.weight} кг
- Бажана вага: ${this.formatTargetWeight(profile)}
- Зріст: ${profile.height} см
- Ціль: ${profile.goal}
- Активність: ${profile.activityLevel}
- Тренувань на тиждень: ${profile.trainingDaysPerWeek}
- Рівень: ${profile.experienceLevel}

Формат відповіді:
1. 2 короткі поради по тренуваннях.
2. 2 короткі поради по харчуванню.
3. 1 обережне попередження, що рекомендації не замінюють консультацію спеціаліста.

Без медичних діагнозів. Без зайвого вступу.
`;

    const advice = await this.geminiService.generateText(prompt);

    return {
      advice,
    };
  }

  async chatWithUser(
    userId: number,
    message: string,
    history: Array<{ role?: string; text?: string }>,
  ) {
    const profile = await this.profileService.getMyProfile(userId);
    const question = message.trim();

    if (!profile) {
      throw new BadRequestException('Profile is required for AI chat');
    }

    if (!question) {
      throw new BadRequestException('Message is required');
    }

    if (question.length > 1200) {
      throw new BadRequestException('Message is too long');
    }

    const historyText = history
      .slice(-8)
      .map((item) => {
        const role = item.role === 'ai' ? 'AI' : 'Користувач';
        return `${role}: ${(item.text ?? '').trim().slice(0, 500)}`;
      })
      .filter((line) => !line.endsWith(': '))
      .join('\n');

    const prompt = `
Ти AI-чат у фітнес-застосунку. Відповідай як продовження вже відкритої розмови.

Профіль користувача:
- Вага: ${profile.weight} кг
- Бажана вага: ${this.formatTargetWeight(profile)}
- Зріст: ${profile.height} см
- Ціль: ${profile.goal}
- Активність: ${profile.activityLevel}
- Тренувань на тиждень: ${profile.trainingDaysPerWeek}
- Рівень: ${profile.experienceLevel}

Останні повідомлення:
${historyText || 'Історії ще немає.'}

Питання користувача:
${question}

Правила:
- Не починай відповідь з привітання.
- Не пиши "Привіт", "Вітаю", "Радий бачити", якщо це не перше повідомлення.
- Не представляйся заново.
- Не вигадуй медичних діагнозів.
- Якщо питання про біль, травму, ліки або хворобу, порадь звернутися до лікаря.
- Якщо користувач пише коротко або сумнівається, відповідай прямо по суті його останньої репліки.
- Відповідай 2-5 реченнями, без markdown-таблиць.
`;

    const answer = await this.generateTextStep('AI чат', prompt, {
      temperature: 0.35,
      maxOutputTokens: 450,
      responseMimeType: 'text/plain',
    });

    return { answer };
  }

  async generateProgramForUser(userId: number) {
    const profile = await this.profileService.getMyProfile(userId);

    if (!profile) {
      throw new BadRequestException(
        'Profile is required for AI program generation',
      );
    }

    await this.assertProgramCanBeGenerated(userId, profile);

    const variationToken = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const hybridModel = this.buildHybridRecommendationModel(profile);
    const profileSnapshot = this.buildProfileSnapshot(profile);

    const trainingPlan = await this.generateTrainingPlanForProfile(
      profile,
      hybridModel,
      variationToken,
    );
    const nutritionDays: unknown[] = [];

    for (let weekIndex = 0; weekIndex < 4; weekIndex += 1) {
      const startDay = weekIndex * 7 + 1;
      const endDay = startDay + 6;
      nutritionDays.push(
        ...(await this.generateNutritionDaysForRange(
          profile,
          hybridModel,
          startDay,
          endDay,
          variationToken,
        )),
      );
    }

    const parsed = await this.ensureProgramShape(
      {
        trainingPlan,
        nutritionPlan: {
          days: nutritionDays.sort((a, b) => {
            return this.getDayNumber(a) - this.getDayNumber(b);
          }),
        },
        notes:
          'План згенеровано AI частинами: тренування окремо, харчування на 28 днів по тижнях.',
      },
      profile.trainingDaysPerWeek,
    );

    const result: AiProgramResponse = {
      profile: {
        name: profile.name,
        goal: profile.goal,
        trainingDaysPerWeek: profile.trainingDaysPerWeek,
        experienceLevel: profile.experienceLevel,
      },
      source: {
        ai: 'gemini',
        generationMode: 'hybrid_profile_ai_feedback',
        usesApiNinjas: false,
        variationToken,
        profileFingerprint: this.buildProfileFingerprint(profileSnapshot),
        profileSnapshot,
        hybridModel,
      },
      program: parsed,
    };

    const savedPrograms = await db
      .insert(aiProgramsTable)
      .values({
        userId,
        payload: result,
      })
      .returning();

    const savedProgram = savedPrograms[0];

    result.source.savedProgramId = savedProgram.id;
    result.source.savedAt = savedProgram.createdAt;

    await db
      .update(aiProgramsTable)
      .set({
        payload: result,
      })
      .where(eq(aiProgramsTable.id, savedProgram.id));

    return result;
  }

  async getLatestProgramForUser(userId: number) {
    const programs = await db
      .select()
      .from(aiProgramsTable)
      .where(eq(aiProgramsTable.userId, userId))
      .orderBy(desc(aiProgramsTable.createdAt))
      .limit(1);

    const latest = programs[0];

    if (!latest) {
      return null;
    }

    return this.withSavedProgramMeta(
      latest.payload,
      latest.id,
      latest.createdAt,
    );
  }

  private async assertProgramCanBeGenerated(
    userId: number,
    profile: AiProfile,
  ) {
    const programs = await db
      .select()
      .from(aiProgramsTable)
      .where(eq(aiProgramsTable.userId, userId))
      .orderBy(desc(aiProgramsTable.createdAt))
      .limit(1);
    const latest = programs[0];

    if (!latest) {
      return;
    }

    if (this.isProfileChangedSinceProgram(latest.payload, profile)) {
      return;
    }

    const nextAvailableAt = new Date(latest.createdAt);
    nextAvailableAt.setDate(
      nextAvailableAt.getDate() + this.programCooldownDays,
    );

    if (nextAvailableAt.getTime() > Date.now()) {
      throw new BadRequestException(
        `Оновити AI-програму можна після ${nextAvailableAt.toLocaleDateString('uk-UA')}. Поточний план розрахований на ${this.programCooldownDays} днів.`,
      );
    }
  }

  private withSavedProgramMeta(payload: unknown, id: number, createdAt: Date) {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const candidate = payload as AiProgramResponse;

    return {
      ...candidate,
      source: {
        ...candidate.source,
        savedProgramId: candidate.source?.savedProgramId ?? id,
        savedAt: candidate.source?.savedAt ?? createdAt,
      },
    };
  }

  private isProfileChangedSinceProgram(payload: unknown, profile: AiProfile) {
    const currentSnapshot = this.buildProfileSnapshot(profile);
    const currentFingerprint = this.buildProfileFingerprint(currentSnapshot);

    if (!payload || typeof payload !== 'object') {
      return true;
    }

    const candidate = payload as AiProgramResponse;

    if (candidate.source?.profileFingerprint) {
      return candidate.source.profileFingerprint !== currentFingerprint;
    }

    const savedSnapshot =
      candidate.source?.profileSnapshot ??
      (candidate.profile as Record<string, unknown> | undefined);

    if (!savedSnapshot) {
      return true;
    }

    return Object.entries(currentSnapshot).some(([key, value]) => {
      return savedSnapshot[key] !== value;
    });
  }

  private buildProfileSnapshot(profile: AiProfile) {
    return {
      age: profile.age,
      gender: profile.gender,
      weight: profile.weight,
      targetWeight: profile.targetWeight ?? null,
      height: profile.height,
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      trainingDaysPerWeek: profile.trainingDaysPerWeek,
      experienceLevel: profile.experienceLevel,
    };
  }

  private buildProfileFingerprint(snapshot: Record<string, unknown>) {
    return JSON.stringify(snapshot);
  }

  private async generateJsonStep(
    label: string,
    prompt: string,
    options: {
      temperature: number;
      maxOutputTokens: number;
      responseMimeType: 'application/json';
    },
  ) {
    let lastMessage = '';

    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.geminiService.generateText(prompt, options);
      } catch (error) {
        lastMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `AI step failed (${label}), attempt ${attempt}: ${lastMessage}`,
        );

        if (
          lastMessage.includes('GEMINI_API_KEY') ||
          lastMessage.includes('Квота Gemini') ||
          lastMessage.includes('Модель Gemini')
        ) {
          break;
        }

        if (attempt < maxAttempts) {
          await this.delay(attempt * 1500);
        }
      }
    }

    throw new ServiceUnavailableException(
      `AI не зміг виконати етап: ${label}. ${lastMessage}`,
    );
  }

  private async generateTextStep(
    label: string,
    prompt: string,
    options: {
      temperature: number;
      maxOutputTokens: number;
      responseMimeType: 'text/plain';
    },
  ) {
    let lastMessage = '';
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.geminiService.generateText(prompt, options);
      } catch (error) {
        lastMessage = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `AI text step failed (${label}), attempt ${attempt}: ${lastMessage}`,
        );

        if (
          lastMessage.includes('GEMINI_API_KEY') ||
          lastMessage.includes('Квота Gemini') ||
          lastMessage.includes('Модель Gemini')
        ) {
          break;
        }

        if (attempt < maxAttempts) {
          await this.delay(attempt * 1500);
        }
      }
    }

    throw new ServiceUnavailableException(
      `${label}: ${lastMessage || 'Gemini тимчасово недоступний'}`,
    );
  }

  private delay(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private buildHybridRecommendationModel(
    profile: AiProfile,
  ): HybridRecommendationModel {
    const normalizedFeatures = {
      age: this.normalizeValue(profile.age, 12, 100),
      weight: this.normalizeValue(profile.weight, 30, 300),
      targetWeight: this.normalizeValue(
        profile.targetWeight ?? profile.weight,
        30,
        300,
      ),
      weightDelta: this.normalizeValue(
        (profile.targetWeight ?? profile.weight) - profile.weight,
        -80,
        80,
      ),
      height: this.normalizeValue(profile.height, 100, 250),
      activity: this.normalizeValue(
        this.getActivityScore(profile.activityLevel),
        1,
        3,
      ),
      trainingDays: this.normalizeValue(profile.trainingDaysPerWeek, 1, 7),
      experience: this.normalizeValue(
        this.getExperienceScore(profile.experienceLevel),
        1,
        3,
      ),
      goal: this.normalizeValue(this.getGoalScore(profile.goal), -1, 1),
    };
    const cluster = this.findNearestProfileCluster(normalizedFeatures);
    const regression = this.calculateRegressionTargets(normalizedFeatures);

    return {
      normalizedFeatures,
      cluster,
      regression,
    };
  }

  private normalizeValue(value: number, min: number, max: number) {
    if (max === min) {
      return 0;
    }

    const normalized = (value - min) / (max - min);
    return Math.min(1, Math.max(0, Number(normalized.toFixed(4))));
  }

  private findNearestProfileCluster(features: Record<string, number>) {
    const centroids = [
      {
        id: 'weight_loss_beginner',
        label: 'схуднення з помірною інтенсивністю',
        values: {
          age: 0.25,
          weight: 0.45,
          targetWeight: 0.38,
          weightDelta: 0.38,
          height: 0.45,
          activity: 0.25,
          trainingDays: 0.35,
          experience: 0.15,
          goal: 0,
        },
      },
      {
        id: 'muscle_gain_regular',
        label: "набір м'язової маси з регулярними силовими тренуваннями",
        values: {
          age: 0.3,
          weight: 0.5,
          targetWeight: 0.56,
          weightDelta: 0.58,
          height: 0.55,
          activity: 0.7,
          trainingDays: 0.55,
          experience: 0.55,
          goal: 1,
        },
      },
      {
        id: 'maintenance_active',
        label: 'підтримка форми з активним режимом',
        values: {
          age: 0.35,
          weight: 0.4,
          targetWeight: 0.4,
          weightDelta: 0.5,
          height: 0.5,
          activity: 0.75,
          trainingDays: 0.45,
          experience: 0.5,
          goal: 0.5,
        },
      },
    ];
    const scored = centroids.map((centroid) => {
      const distance = Math.sqrt(
        Object.entries(centroid.values).reduce((total, [key, value]) => {
          return total + (features[key] - value) ** 2;
        }, 0),
      );

      return {
        id: centroid.id,
        label: centroid.label,
        distance: Number(distance.toFixed(4)),
      };
    });

    return scored.sort((a, b) => a.distance - b.distance)[0];
  }

  private calculateRegressionTargets(features: Record<string, number>) {
    const targetCalories =
      1400 +
      900 * features.weight +
      250 * features.targetWeight +
      350 * features.height +
      450 * features.activity +
      220 * features.trainingDays +
      180 * features.experience +
      500 * (features.goal - 0.5) +
      350 * (features.weightDelta - 0.5);
    const trainingIntensity =
      3 +
      2.2 * features.activity +
      1.8 * features.experience +
      1.2 * features.trainingDays -
      0.8 * features.age;

    return {
      targetCalories: Math.max(1200, Math.round(targetCalories)),
      trainingIntensity: Math.min(
        10,
        Math.max(1, Number(trainingIntensity.toFixed(1))),
      ),
    };
  }

  private formatTargetWeight(profile: AiProfile) {
    return profile.targetWeight ? `${profile.targetWeight} кг` : 'не вказана';
  }

  private getActivityScore(activityLevel: string) {
    const scores: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
    };

    return scores[activityLevel] ?? 2;
  }

  private getExperienceScore(experienceLevel: string) {
    const scores: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };

    return scores[experienceLevel] ?? 1;
  }

  private getGoalScore(goal: string) {
    if (goal === 'lose_weight' || goal === 'lose weight') {
      return -1;
    }

    if (goal === 'gain_muscle' || goal === 'gain muscle') {
      return 1;
    }

    return 0;
  }

  private compactProgramForChat(program: unknown) {
    if (!program || typeof program !== 'object') {
      return 'Програма ще не сформована.';
    }

    const candidate = program as {
      program?: {
        trainingPlan?: {
          title?: unknown;
          days?: Array<{
            dayNumber?: unknown;
            focus?: unknown;
            exercises?: Array<{ name?: unknown }>;
          }>;
        };
        nutritionPlan?: {
          days?: Array<{
            dayNumber?: unknown;
            meals?: Array<{ dishName?: unknown; mealType?: unknown }>;
          }>;
        };
      };
    };
    const training = candidate.program?.trainingPlan;
    const nutritionDays = candidate.program?.nutritionPlan?.days ?? [];
    const trainingSummary = training?.days?.length
      ? training.days
          .slice(0, 3)
          .map((day) => {
            const exercises = (day.exercises ?? [])
              .slice(0, 3)
              .map((exercise) => exercise.name)
              .filter(Boolean)
              .join(', ');
            return `день ${day.dayNumber}: ${day.focus ?? 'тренування'} (${exercises})`;
          })
          .join('; ')
      : 'тренування ще не сформовані';
    const nutritionSummary = nutritionDays.length
      ? `харчування сформовано на ${nutritionDays.length} днів`
      : 'харчування ще не сформоване';

    return `Назва: ${training?.title ?? 'без назви'}. Тренування: ${trainingSummary}. Харчування: ${nutritionSummary}.`;
  }

  private async generateTrainingPlanForProfile(
    profile: AiProfile,
    hybridModel: HybridRecommendationModel,
    variationToken: string,
  ) {
    try {
      const trainingResponse = await this.generateJsonStep(
        'генерація тренувань',
        this.buildTrainingPrompt(profile, hybridModel, variationToken),
        {
          temperature: 0.6,
          maxOutputTokens: 2600,
          responseMimeType: 'application/json',
        },
      );

      const trainingPlan = this.extractTrainingPlan(
        await this.parseOrRepairJson(trainingResponse),
      );
      const normalizedTrainingPlan =
        this.normalizeTrainingPlanLanguage(trainingPlan);

      if (
        this.getTrainingDays(normalizedTrainingPlan).length ===
        profile.trainingDaysPerWeek
      ) {
        return normalizedTrainingPlan;
      }

      throw new BadRequestException(
        'AI returned an unexpected number of training days',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Full training generation failed, falling back to daily generation: ${message}`,
      );
    }

    const days: unknown[] = [];

    for (
      let dayNumber = 1;
      dayNumber <= profile.trainingDaysPerWeek;
      dayNumber += 1
    ) {
      const dayResponse = await this.generateJsonStep(
        `генерація тренування, день ${dayNumber}`,
        this.buildTrainingDayPrompt(
          profile,
          hybridModel,
          dayNumber,
          variationToken,
        ),
        {
          temperature: 0.65,
          maxOutputTokens: 1400,
          responseMimeType: 'application/json',
        },
      );
      const day = this.normalizeTrainingDayLanguage(
        this.extractTrainingDay(
          await this.parseOrRepairJson(dayResponse),
          dayNumber,
        ),
      );

      days.push(day);
    }

    return {
      title: this.buildTrainingTitle(profile),
      days,
    };
  }

  private async generateNutritionDaysForRange(
    profile: AiProfile,
    hybridModel: HybridRecommendationModel,
    startDay: number,
    endDay: number,
    variationToken: string,
  ) {
    try {
      const nutritionResponse = await this.generateJsonStep(
        `генерація харчування, дні ${startDay}-${endDay}`,
        this.buildNutritionPrompt(
          profile,
          hybridModel,
          startDay,
          endDay,
          variationToken,
        ),
        {
          temperature: 0.7,
          maxOutputTokens: 5000,
          responseMimeType: 'application/json',
        },
      );

      const days = this.extractNutritionDays(
        await this.parseOrRepairJson(nutritionResponse),
      );

      if (days.length === endDay - startDay + 1) {
        return days;
      }

      throw new BadRequestException(
        `AI returned ${days.length} nutrition days instead of ${
          endDay - startDay + 1
        }`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Weekly nutrition generation failed (${startDay}-${endDay}), falling back to daily generation: ${message}`,
      );
    }

    const days: unknown[] = [];

    for (let dayNumber = startDay; dayNumber <= endDay; dayNumber += 1) {
      const dayResponse = await this.generateJsonStep(
        `генерація харчування, день ${dayNumber}`,
        this.buildNutritionPrompt(
          profile,
          hybridModel,
          dayNumber,
          dayNumber,
          variationToken,
        ),
        {
          temperature: 0.7,
          maxOutputTokens: 1800,
          responseMimeType: 'application/json',
        },
      );
      const parsedDays = this.extractNutritionDays(
        await this.parseOrRepairJson(dayResponse),
      );
      const day = parsedDays.find((item) => {
        return this.getDayNumber(item) === dayNumber;
      });

      if (!day) {
        throw new BadRequestException(
          `AI returned nutrition without day ${dayNumber}`,
        );
      }

      days.push(day);
    }

    return days;
  }

  private buildTrainingPrompt(
    profile: AiProfile,
    hybridModel: HybridRecommendationModel,
    variationToken: string,
  ) {
    return `
Ти AI-модуль фітнес-застосунку. Згенеруй ТІЛЬКИ план тренувань українською.

Профіль користувача:
- Ім'я: ${profile.name}
- Вік: ${profile.age}
- Стать: ${profile.gender}
- Вага: ${profile.weight} кг
- Бажана вага: ${this.formatTargetWeight(profile)}
- Зріст: ${profile.height} см
- Ціль: ${profile.goal}
- Активність: ${profile.activityLevel}
- Тренувань на тиждень: ${profile.trainingDaysPerWeek}
- Рівень: ${profile.experienceLevel}

Результат гібридної рекомендаційної моделі:
- Нормалізовані ознаки: ${JSON.stringify(hybridModel.normalizedFeatures)}
- Кластер користувача за k-means моделлю: ${hybridModel.cluster.label}
- Регресійна ціль калорійності: ${hybridModel.regression.targetCalories} ккал/день
- Регресійна інтенсивність тренувань: ${hybridModel.regression.trainingIntensity}/10

Поверни СУВОРО валідний JSON без markdown:
{
  "trainingPlan": {
    "title": "string",
    "days": [
      {
        "dayNumber": 1,
        "focus": "string",
        "exercises": [
          {
            "name": "string",
            "muscleGroup": "string",
            "equipment": "string | null",
            "sets": 3,
            "reps": 10
          }
        ]
      }
    ]
  }
}

Вимоги:
- trainingPlan.days має містити рівно ${profile.trainingDaysPerWeek} тренувальних дні.
- Не додавай дні відпочинку.
- Для кожного тренувального дня 4-6 вправ.
- Вправи мають бути безпечними для рівня користувача.
- Інтенсивність тренувань узгоджуй з регресійним значенням ${hybridModel.regression.trainingIntensity}/10.
- Усі текстові значення мають бути українською або усталеними українськими фітнес-термінами.
- Заборонено англійські назви вправ: push-up, pull-up, squat, plank, bench press, deadlift, row, lunge, crunch, burpee, curl, press.
- Не використовуй id.
- Не використовуй коментарі, одинарні лапки, trailing comma або markdown.
- Variation token: ${variationToken}
`;
  }

  private buildTrainingDayPrompt(
    profile: AiProfile,
    hybridModel: HybridRecommendationModel,
    dayNumber: number,
    variationToken: string,
  ) {
    return `
Ти AI-модуль фітнес-застосунку. Згенеруй ТІЛЬКИ один тренувальний день українською.

Профіль користувача:
- Ім'я: ${profile.name}
- Вік: ${profile.age}
- Стать: ${profile.gender}
- Вага: ${profile.weight} кг
- Бажана вага: ${this.formatTargetWeight(profile)}
- Зріст: ${profile.height} см
- Ціль: ${profile.goal}
- Активність: ${profile.activityLevel}
- Тренувань на тиждень: ${profile.trainingDaysPerWeek}
- Рівень: ${profile.experienceLevel}
- Кластер користувача: ${hybridModel.cluster.label}
- Регресійна інтенсивність тренувань: ${hybridModel.regression.trainingIntensity}/10

Поверни СУВОРО валідний JSON без markdown:
{
  "day": {
    "dayNumber": ${dayNumber},
    "focus": "string",
    "exercises": [
      {
        "name": "string",
        "muscleGroup": "string",
        "equipment": "string | null",
        "sets": 3,
        "reps": 10
      }
    ]
  }
}

Вимоги:
- day.dayNumber має бути рівно ${dayNumber}.
- Для дня 4-6 вправ.
- Не додавай дні відпочинку.
- Вправи мають бути безпечними для рівня користувача.
- Усі текстові значення мають бути українською або усталеними українськими фітнес-термінами.
- Заборонено англійські назви вправ: push-up, pull-up, squat, plank, bench press, deadlift, row, lunge, crunch, burpee, curl, press.
- Не використовуй id.
- Не використовуй коментарі, одинарні лапки, trailing comma або markdown.
- Variation token: ${variationToken}-training-day-${dayNumber}
`;
  }

  private buildNutritionPrompt(
    profile: AiProfile,
    hybridModel: HybridRecommendationModel,
    startDay: number,
    endDay: number,
    variationToken: string,
  ) {
    const daysCount = endDay - startDay + 1;
    const dayRequirement =
      daysCount === 1
        ? `Поверни рівно 1 день: dayNumber ${startDay}.`
        : `Поверни рівно ${daysCount} днів: dayNumber від ${startDay} до ${endDay}.`;

    return `
Ти AI-модуль фітнес-застосунку. Згенеруй ТІЛЬКИ харчування українською для днів ${startDay}-${endDay}.

Профіль користувача:
- Вік: ${profile.age}
- Стать: ${profile.gender}
- Вага: ${profile.weight} кг
- Бажана вага: ${this.formatTargetWeight(profile)}
- Зріст: ${profile.height} см
- Ціль: ${profile.goal}
- Активність: ${profile.activityLevel}
- Рівень: ${profile.experienceLevel}
- Кластер користувача: ${hybridModel.cluster.label}
- Регресійна ціль калорійності: ${hybridModel.regression.targetCalories} ккал/день

Поверни СУВОРО валідний JSON без markdown:
{
  "days": [
    {
      "dayNumber": ${startDay},
      "meals": [
        {
          "mealType": "breakfast | lunch | dinner | snack",
          "dishName": "string",
          "foods": [
            { "name": "string", "grams": 150, "calories": 180 }
          ]
        }
      ]
    }
  ]
}

Вимоги:
- ${dayRequirement}
- На день 3-4 прийоми їжі.
- Сумарну калорійність дня тримай близько ${hybridModel.regression.targetCalories} ккал.
- На день не повторюй mealType.
- Кожен dishName має бути людською назвою страви, не списком інгредієнтів.
- У назві страви не пиши "Сніданок", "Обід", "Вечеря", "Перекус".
- Кожен foods item має name, grams і calories.
- calories — це реальні ккал саме для вказаної кількості grams, не за 100 г.
- calories має бути цілим числом більше 0 для всіх продуктів, крім води/чаю/кави без добавок.
- Калорійність рахуй самостійно як AI за реальними харчовими довідниками.
- Не використовуй id.
- Не використовуй коментарі, одинарні лапки, trailing comma або markdown.
- Variation token: ${variationToken}-${startDay}-${endDay}
`;
  }

  private extractTrainingPlan(value: unknown) {
    const candidate = value as { trainingPlan?: unknown };

    if (!candidate.trainingPlan) {
      throw new BadRequestException(
        'AI returned training plan without trainingPlan',
      );
    }

    return candidate.trainingPlan;
  }

  private extractTrainingDay(value: unknown, expectedDayNumber: number) {
    const candidate = value as {
      day?: unknown;
      days?: unknown[];
      trainingPlan?: { days?: unknown[] };
    };
    const day =
      candidate.day ??
      candidate.days?.find(
        (item) => this.getDayNumber(item) === expectedDayNumber,
      ) ??
      candidate.trainingPlan?.days?.find(
        (item) => this.getDayNumber(item) === expectedDayNumber,
      );

    if (!day || typeof day !== 'object') {
      throw new BadRequestException(
        `AI returned training without day ${expectedDayNumber}`,
      );
    }

    const exercises = (day as { exercises?: unknown[] }).exercises;

    if (!Array.isArray(exercises) || exercises.length < 4) {
      throw new BadRequestException(
        `AI returned training day ${expectedDayNumber} without exercises`,
      );
    }

    return {
      ...(day as object),
      dayNumber: expectedDayNumber,
    };
  }

  private normalizeTrainingPlanLanguage(trainingPlan: unknown) {
    if (!trainingPlan || typeof trainingPlan !== 'object') {
      return trainingPlan;
    }

    const candidate = trainingPlan as { days?: unknown[]; title?: unknown };

    return {
      ...(trainingPlan as object),
      title:
        typeof candidate.title === 'string'
          ? this.translateTrainingText(candidate.title)
          : candidate.title,
      days: Array.isArray(candidate.days)
        ? candidate.days.map((day) => this.normalizeTrainingDayLanguage(day))
        : candidate.days,
    };
  }

  private normalizeTrainingDayLanguage(day: unknown) {
    if (!day || typeof day !== 'object') {
      return day;
    }

    const candidate = day as {
      focus?: unknown;
      exercises?: Array<{
        name?: unknown;
        muscleGroup?: unknown;
        equipment?: unknown;
      }>;
    };

    return {
      ...(day as object),
      focus:
        typeof candidate.focus === 'string'
          ? this.translateTrainingText(candidate.focus)
          : candidate.focus,
      exercises: Array.isArray(candidate.exercises)
        ? candidate.exercises.map((exercise) => ({
            ...exercise,
            name:
              typeof exercise.name === 'string'
                ? this.translateTrainingText(exercise.name)
                : exercise.name,
            muscleGroup:
              typeof exercise.muscleGroup === 'string'
                ? this.translateTrainingText(exercise.muscleGroup)
                : exercise.muscleGroup,
            equipment:
              typeof exercise.equipment === 'string'
                ? this.translateTrainingText(exercise.equipment)
                : exercise.equipment,
          }))
        : candidate.exercises,
    };
  }

  private translateTrainingText(value: string) {
    const replacements: Array<[RegExp, string]> = [
      [/\bpush[- ]?ups?\b/gi, 'віджимання'],
      [/\bpull[- ]?ups?\b/gi, 'підтягування'],
      [/\bsquats?\b/gi, 'присідання'],
      [/\bplanks?\b/gi, 'планка'],
      [/\bbench press\b/gi, 'жим лежачи'],
      [/\bdeadlifts?\b/gi, 'станова тяга'],
      [/\brows?\b/gi, 'тяга'],
      [/\blunges?\b/gi, 'випади'],
      [/\bcrunch(es)?\b/gi, 'скручування'],
      [/\bburpees?\b/gi, 'берпі'],
      [/\bcurls?\b/gi, 'згинання рук'],
      [/\bpress\b/gi, 'жим'],
      [/\bchest\b/gi, 'груди'],
      [/\bback\b/gi, 'спина'],
      [/\blegs?\b/gi, 'ноги'],
      [/\bshoulders?\b/gi, 'плечі'],
      [/\barms?\b/gi, 'руки'],
      [/\bcore\b/gi, 'кор'],
      [/\babs?\b/gi, 'прес'],
      [/\bdumbbells?\b/gi, 'гантелі'],
      [/\bbarbells?\b/gi, 'штанга'],
      [/\bbodyweight\b/gi, 'власна вага'],
      [/\bresistance band\b/gi, 'еластична стрічка'],
    ];

    return replacements.reduce((text, [pattern, replacement]) => {
      return text.replace(pattern, replacement);
    }, value);
  }

  private getTrainingDays(trainingPlan: unknown) {
    if (!trainingPlan || typeof trainingPlan !== 'object') {
      return [];
    }

    const candidate = trainingPlan as { days?: unknown[] };
    return Array.isArray(candidate.days) ? candidate.days : [];
  }

  private buildTrainingTitle(profile: AiProfile) {
    const goal = this.getGoalLabel(profile.goal).toLowerCase();
    const level = this.getExperienceLabel(
      profile.experienceLevel,
    ).toLowerCase();

    return `AI програма для цілі: ${goal}, рівень: ${level}`;
  }

  private getGoalLabel(goal: string) {
    const labels: Record<string, string> = {
      lose_weight: 'Схуднення',
      'lose weight': 'Схуднення',
      maintain: 'Підтримка форми',
      gain_muscle: "Набір м'язової маси",
      'gain muscle': "Набір м'язової маси",
    };

    return labels[goal] ?? goal;
  }

  private getExperienceLabel(experienceLevel: string) {
    const labels: Record<string, string> = {
      beginner: 'Початковий',
      intermediate: 'Середній',
      advanced: 'Просунутий',
    };

    return labels[experienceLevel] ?? experienceLevel;
  }

  private extractNutritionDays(value: unknown) {
    const candidate = value as {
      days?: unknown[];
      nutritionPlan?: { days?: unknown[] };
    };
    const days = candidate.days ?? candidate.nutritionPlan?.days;

    if (!Array.isArray(days)) {
      throw new BadRequestException('AI returned nutrition plan without days');
    }

    return days;
  }

  private getDayNumber(value: unknown) {
    if (!value || typeof value !== 'object') {
      return 0;
    }

    return Number((value as { dayNumber?: unknown }).dayNumber) || 0;
  }

  private parseJson(text: string): unknown {
    const trimmed = this.cleanJsonText(text);

    try {
      return JSON.parse(trimmed);
    } catch {
      const jsonStart = trimmed.indexOf('{');
      const jsonEnd = trimmed.lastIndexOf('}');

      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new BadRequestException('AI returned non-JSON response');
      }

      const candidate = trimmed.slice(jsonStart, jsonEnd + 1);

      try {
        return JSON.parse(candidate);
      } catch (error) {
        this.logger.warn(
          `AI returned invalid JSON: ${
            error instanceof Error ? error.message : String(error)
          }. Preview: ${candidate.slice(0, 500)}`,
        );
        throw new BadRequestException('AI returned invalid JSON');
      }
    }
  }

  private async parseOrRepairJson(text: string) {
    try {
      return this.parseJson(text);
    } catch (error) {
      if (!(error instanceof BadRequestException)) {
        throw error;
      }

      const repaired = await this.geminiService.generateText(
        `
Виправ цей текст у СУВОРО валідний JSON без markdown і без пояснень.
Збережи початкову структуру JSON і всі наявні поля. Не додавай пояснень.

Текст:
${text}
`,
        {
          temperature: 0,
          maxOutputTokens: 8000,
          responseMimeType: 'application/json',
        },
      );

      return this.parseJson(repaired);
    }
  }

  private async ensureProgramShape(
    program: unknown,
    trainingDaysPerWeek: number,
  ) {
    if (this.hasExpectedProgramShape(program, trainingDaysPerWeek)) {
      return program;
    }

    const fixed = await this.geminiService.generateText(
      `
Виправ JSON програми так, щоб він точно відповідав правилам.
Поверни тільки валідний JSON без markdown.

Правила:
- trainingPlan.days має містити рівно ${trainingDaysPerWeek} тренувальних дні, без днів відпочинку.
- Кожен trainingPlan.days item має 4-6 вправ.
- nutritionPlan.days має містити рівно 28 днів, dayNumber від 1 до 28 без пропусків.
- У кожному nutritionPlan day має бути 3-4 meals.
- Кожен foods item має мати name, grams і calories для цієї кількості grams.
- Збережи структуру trainingPlan, nutritionPlan, notes.
- Не використовуй id, тільки назви вправ, страв та інгредієнтів.

Поточний JSON:
${JSON.stringify(program)}
`,
      {
        temperature: 0.2,
        maxOutputTokens: 10000,
        responseMimeType: 'application/json',
      },
    );

    const parsed = this.parseJson(fixed);

    if (!this.hasExpectedProgramShape(parsed, trainingDaysPerWeek)) {
      throw new BadRequestException(
        'AI returned an incomplete program. Please generate again.',
      );
    }

    return parsed;
  }

  private hasExpectedProgramShape(
    program: unknown,
    trainingDaysPerWeek: number,
  ) {
    if (!program || typeof program !== 'object') {
      return false;
    }

    const candidate = program as {
      trainingPlan?: { days?: unknown[] };
      nutritionPlan?: {
        days?: Array<{ dayNumber?: unknown; meals?: unknown[] }>;
      };
    };
    const trainingDays = candidate.trainingPlan?.days;
    const nutritionDays = candidate.nutritionPlan?.days;

    if (
      !Array.isArray(trainingDays) ||
      trainingDays.length !== trainingDaysPerWeek
    ) {
      return false;
    }

    if (!Array.isArray(nutritionDays) || nutritionDays.length !== 28) {
      return false;
    }

    return nutritionDays.every((day, index) => {
      return (
        day?.dayNumber === index + 1 &&
        Array.isArray(day.meals) &&
        day.meals.length >= 3 &&
        day.meals.every((meal) => {
          if (!meal || typeof meal !== 'object') {
            return false;
          }

          const candidate = meal as { mealType?: unknown; foods?: unknown[] };

          return (
            typeof candidate.mealType === 'string' &&
            candidate.mealType.trim().length > 0 &&
            Array.isArray(candidate.foods) &&
            candidate.foods.length > 0 &&
            candidate.foods.every((food) => {
              if (!food || typeof food !== 'object') {
                return false;
              }

              const foodCandidate = food as {
                name?: unknown;
                grams?: unknown;
                calories?: unknown;
              };

              return (
                typeof foodCandidate.name === 'string' &&
                Number(foodCandidate.grams) > 0 &&
                Number(foodCandidate.calories) >= 0
              );
            })
          );
        })
      );
    });
  }

  private cleanJsonText(text: string) {
    return text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .replace(/^\uFEFF/, '');
  }

  private buildFallbackProgram(trainingDaysPerWeek: number) {
    const exerciseTemplates: AiExercise[] = [
      {
        name: 'Присідання з власною вагою',
        muscleGroup: 'Ноги',
        equipment: null,
        sets: 3,
        reps: 12,
      },
      {
        name: 'Віджимання від підлоги',
        muscleGroup: 'Груди',
        equipment: null,
        sets: 3,
        reps: 10,
      },
      {
        name: 'Планка на передпліччях',
        muscleGroup: 'Кор',
        equipment: 'Килимок',
        sets: 3,
        reps: 30,
      },
      {
        name: 'Випади назад',
        muscleGroup: 'Ноги',
        equipment: null,
        sets: 3,
        reps: 12,
      },
      {
        name: 'Тяга гантелей у нахилі',
        muscleGroup: 'Спина',
        equipment: 'Гантелі',
        sets: 3,
        reps: 10,
      },
      {
        name: 'Жим гантелей над головою',
        muscleGroup: 'Плечі',
        equipment: 'Гантелі',
        sets: 3,
        reps: 10,
      },
      {
        name: 'Сідничний місток',
        muscleGroup: 'Сідниці',
        equipment: 'Килимок',
        sets: 3,
        reps: 14,
      },
      {
        name: 'Скручування на прес',
        muscleGroup: 'Кор',
        equipment: 'Килимок',
        sets: 3,
        reps: 15,
      },
    ];
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const usedDishNames = new Set<string>();
    let exerciseCursor = 0;

    const trainingPlanDays = Array.from({ length: 7 }, (_, dayIndex) => {
      const dayNumber = dayIndex + 1;

      if (dayIndex >= trainingDaysPerWeek) {
        return {
          dayNumber,
          focus: 'Відновлення',
          exercises: [],
        };
      }

      const exercises = Array.from({ length: 5 }, () => {
        const exercise =
          exerciseTemplates[exerciseCursor % exerciseTemplates.length];
        exerciseCursor += 1;
        return {
          ...exercise,
          sets: exercise.sets + (exerciseCursor % 2),
        };
      });

      return {
        dayNumber,
        focus: this.getFallbackFocus(dayIndex),
        exercises,
      };
    });

    const nutritionDays = Array.from({ length: 28 }, (_, dayIndex) => {
      const dayNumber = dayIndex + 1;
      const mealsCount = dayIndex % 2 === 0 ? 4 : 3;

      const meals = Array.from({ length: mealsCount }, (_, mealIndex) => {
        const mealType = mealTypes[mealIndex];
        const dishName = this.getUniqueFallbackDishName(
          mealType,
          dayIndex,
          usedDishNames,
        );

        return {
          mealType,
          dishName,
          foods: this.getFallbackFoods(mealType, dayIndex),
        };
      });

      return {
        dayNumber,
        meals,
      };
    });

    return {
      trainingPlan: {
        title: 'AI план тренувань на тиждень',
        days: trainingPlanDays,
      },
      nutritionPlan: {
        days: nutritionDays,
      },
      notes:
        'План згенеровано AI без API Ninjas і без прив’язки до каталогів id.',
    };
  }

  private getFallbackFocus(dayIndex: number) {
    const focuses = [
      'Full body',
      'Ноги та кор',
      'Верх тіла',
      'Функціональна сила',
    ];
    return focuses[dayIndex % focuses.length];
  }

  private getFallbackFoods(mealType: string, dayIndex: number): AiFood[] {
    const breakfasts = [
      [
        { name: 'Вівсянка', grams: 70, calories: 272 },
        { name: 'Банан', grams: 120, calories: 107 },
        { name: 'Грецький йогурт', grams: 150, calories: 110 },
      ],
      [
        { name: 'Яйця', grams: 120, calories: 172 },
        { name: 'Томати', grams: 100, calories: 18 },
        { name: 'Цільнозерновий хліб', grams: 60, calories: 148 },
      ],
    ];
    const lunches = [
      [
        { name: 'Куряче філе', grams: 160, calories: 264 },
        { name: 'Рис', grams: 150, calories: 195 },
        { name: 'Броколі', grams: 120, calories: 41 },
      ],
      [
        { name: 'Індичка', grams: 150, calories: 203 },
        { name: 'Гречка', grams: 160, calories: 176 },
        { name: 'Овочевий салат', grams: 140, calories: 35 },
      ],
    ];
    const dinners = [
      [
        { name: 'Лосось', grams: 150, calories: 312 },
        { name: 'Картопля', grams: 180, calories: 139 },
        { name: 'Зелений салат', grams: 120, calories: 30 },
      ],
      [
        { name: 'Тофу', grams: 160, calories: 122 },
        { name: 'Овочі вок', grams: 180, calories: 81 },
        { name: 'Рис', grams: 120, calories: 156 },
      ],
    ];
    const snacks = [
      [
        { name: 'Творог', grams: 180, calories: 216 },
        { name: 'Ягоди', grams: 80, calories: 40 },
      ],
      [
        { name: 'Грецький йогурт', grams: 170, calories: 124 },
        { name: 'Горіхи', grams: 20, calories: 121 },
        { name: 'Яблуко', grams: 120, calories: 62 },
      ],
    ];

    if (mealType === 'breakfast') {
      return breakfasts[dayIndex % breakfasts.length];
    }

    if (mealType === 'lunch') {
      return lunches[dayIndex % lunches.length];
    }

    if (mealType === 'dinner') {
      return dinners[dayIndex % dinners.length];
    }

    return snacks[dayIndex % snacks.length];
  }

  private getUniqueFallbackDishName(
    mealType: string,
    dayIndex: number,
    usedDishNames: Set<string>,
  ) {
    const breakfastNames = [
      'Сирники з ягідним соусом',
      'Вівсяний боул з фруктами',
      'Омлет з зеленню та томатами',
      'Йогуртовий боул з гранолою',
      'Рисовий пудинг з фруктами',
      'Запечені яйця зі шпинатом',
      'Сирна запіканка з ягодами',
    ];
    const lunchNames = [
      'Курка теріякі з рисом',
      'Паста з тунцем і томатами',
      'Індичка з гречкою та овочами',
      'Теплий боул з куркою і броколі',
      'Рис з лососем та овочами',
      'Тофу в соусі з рисом',
      'Овочеве рагу з індичкою',
    ];
    const dinnerNames = [
      'Лосось запечений з овочами',
      'Тефтелі з індички з гарніром',
      'Риба на грилі з салатом',
      'Тушковане рагу з квасолею',
      'Куряче філе з броколі',
      'Тофу з овочами вок',
      'Рибне філе з картоплею',
    ];
    const snackNames = [
      'Творожний крем з фруктами',
      'Йогурт з горіхами і ягодами',
      'Фруктовий смузі боул',
      'Легкий протеїновий перекус',
      'Сирний мус з ягодами',
      'Йогуртовий десерт з бананом',
      'Фруктова тарілка з творогом',
    ];
    const suffixes = [
      'по-домашньому',
      'з пряними травами',
      'у легкому соусі',
      'по-середземноморськи',
      'з зеленню',
      'з лимонною ноткою',
    ];

    let baseName: string;

    if (mealType === 'breakfast') {
      baseName = breakfastNames[dayIndex % breakfastNames.length];
    } else if (mealType === 'lunch') {
      baseName = lunchNames[dayIndex % lunchNames.length];
    } else if (mealType === 'dinner') {
      baseName = dinnerNames[dayIndex % dinnerNames.length];
    } else {
      baseName = snackNames[dayIndex % snackNames.length];
    }

    if (!usedDishNames.has(baseName)) {
      usedDishNames.add(baseName);
      return baseName;
    }

    for (let index = 0; index < suffixes.length; index += 1) {
      const candidate = `${baseName} ${suffixes[(dayIndex + index) % suffixes.length]}`;
      if (!usedDishNames.has(candidate)) {
        usedDishNames.add(candidate);
        return candidate;
      }
    }

    const fallback = `${baseName} #${dayIndex + 1}`;
    usedDishNames.add(fallback);
    return fallback;
  }
}
