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
    savedProgramId?: number;
    savedAt?: Date;
  };
  program: unknown;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

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

  async generateProgramForUser(userId: number) {
    const profile = await this.profileService.getMyProfile(userId);

    if (!profile) {
      throw new BadRequestException(
        'Profile is required for AI program generation',
      );
    }

    const variationToken = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const trainingResponse = await this.generateJsonStep(
      'генерація тренувань',
      this.buildTrainingPrompt(profile, variationToken),
      {
        temperature: 0.6,
        maxOutputTokens: 3000,
        responseMimeType: 'application/json',
      },
    );
    const trainingPlan = this.extractTrainingPlan(
      await this.parseOrRepairJson(trainingResponse),
    );
    const nutritionDays: unknown[] = [];

    for (let weekIndex = 0; weekIndex < 4; weekIndex += 1) {
      const startDay = weekIndex * 7 + 1;
      const endDay = startDay + 6;
      nutritionDays.push(
        ...(await this.generateNutritionDaysForRange(
          profile,
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
        generationMode: 'ai_generated_names',
        usesApiNinjas: false,
        variationToken,
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

    return latest.payload;
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
    try {
      return await this.geminiService.generateText(prompt, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`AI step failed (${label}): ${message}`);
      throw new ServiceUnavailableException(
        `AI не зміг виконати етап: ${label}`,
      );
    }
  }

  private async generateNutritionDaysForRange(
    profile: AiProfile,
    startDay: number,
    endDay: number,
    variationToken: string,
  ) {
    try {
      const nutritionResponse = await this.generateJsonStep(
        `генерація харчування, дні ${startDay}-${endDay}`,
        this.buildNutritionPrompt(profile, startDay, endDay, variationToken),
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

  private buildTrainingPrompt(profile: AiProfile, variationToken: string) {
    return `
Ти AI-модуль фітнес-застосунку. Згенеруй ТІЛЬКИ план тренувань українською.

Профіль користувача:
- Ім'я: ${profile.name}
- Вік: ${profile.age}
- Стать: ${profile.gender}
- Вага: ${profile.weight} кг
- Зріст: ${profile.height} см
- Ціль: ${profile.goal}
- Активність: ${profile.activityLevel}
- Тренувань на тиждень: ${profile.trainingDaysPerWeek}
- Рівень: ${profile.experienceLevel}

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
- Не використовуй id.
- Не використовуй коментарі, одинарні лапки, trailing comma або markdown.
- Variation token: ${variationToken}
`;
  }

  private buildNutritionPrompt(
    profile: AiProfile,
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
- Зріст: ${profile.height} см
- Ціль: ${profile.goal}
- Активність: ${profile.activityLevel}
- Рівень: ${profile.experienceLevel}

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
