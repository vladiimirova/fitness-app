import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../ai/gemini.service';

const dictionary: Record<string, string> = {
  abdominals: 'Прес',
  abs: 'Прес',
  back: 'Спина',
  biceps: 'Біцепс',
  calves: 'Ікри',
  chest: 'Груди',
  glutes: 'Сідниці',
  hamstrings: 'Задня поверхня стегна',
  lats: 'Найширші м’язи спини',
  legs: 'Ноги',
  lower_back: 'Поперек',
  middle_back: 'Середина спини',
  quadriceps: 'Квадрицепс',
  shoulders: 'Плечі',
  triceps: 'Трицепс',
};

const phraseDictionary: Record<string, string> = {
  'alternate hammer curl': 'Почергові молоткові згинання',
  'barbell bench press': 'Жим штанги лежачи',
  'barbell curl': 'Згинання рук зі штангою',
  'biceps curl to shoulder press': 'Згинання рук на біцепс і жим на плечі',
  'cable crossover': 'Кросовер у блоці',
  'cable v bar push down': 'Розгинання рук на трицепс з трикутною рукояткою',
  'dumbbell bench press': 'Жим гантелей лежачи',
  'dumbbell floor press': 'Жим гантелей з підлоги',
  'dumbbell bicep curl': 'Згинання рук з гантелями',
  'dumbbell biceps curl': 'Згинання рук з гантелями',
  'dumbbell fly': 'Розведення гантелей лежачи',
  'dumbbell flyes': 'Розведення гантелей лежачи',
  'dumbbell front raise to lateral raise': 'Підйом гантелей перед собою і в сторони',
  'chest dip': 'Віджимання на брусах для грудей',
  'chest dips': 'Віджимання на брусах для грудей',
  'clean and press': 'Підйом на груди і жим',
  'close grip bench press': 'Жим штанги лежачи вузьким хватом',
  'concentration curl': 'Концентроване згинання на біцепс',
  'decline ez bar skullcrusher': 'Французький жим вигнутої штанги лежачи під нахилом',
  'ez bar curl': 'Згинання рук з вигнутою штангою',
  'ez bar skullcrusher': 'Французький жим вигнутої штанги',
  'ez bar spider curl': 'Згинання рук з вигнутою штангою на лаві Скотта',
  'hammer curls': 'Молоткові згинання',
  'incline dumbbell bench press': 'Жим гантелей лежачи на похилій лаві',
  'incline dumbbell reverse fly': 'Зворотне розведення гантелей на похилій лаві',
  'incline hammer curls': 'Молоткові згинання на похилій лаві',
  'low cable cross over': 'Кросовер з нижнього блока',
  'low cable crossover': 'Кросовер з нижнього блока',
  'low block cross over': 'Кросовер з нижнього блока',
  'low block crossover': 'Кросовер з нижнього блока',
  'medium grip barbell bench press': 'Жим штанги лежачи середнім хватом',
  'barbell bench press medium grip': 'Жим штанги лежачи середнім хватом',
  'military press': 'Армійський жим',
  pushups: 'Віджимання',
  'reverse grip triceps pushdown': 'Розгинання рук на трицепс зворотним хватом',
  'seated barbell shoulder press': 'Жим штанги на плечі сидячи',
  'seated dumbbell press': 'Жим гантелей сидячи',
  'seated triceps press': 'Французький жим сидячи',
  'single arm cable triceps extension': 'Розгинання однієї руки на трицепс у блоці',
  'single arm kettlebell push press': 'Поштовх гирі однією рукою',
  'single arm lateral raise': 'Боковий підйом однією рукою',
  'single arm dumbbell lateral raise': 'Боковий підйом гантелі однією рукою',
  'single arm palm in dumbbell shoulder press': 'Жим гантелі над головою однією рукою нейтральним хватом',
  'standing dumbbell shoulder press': 'Жим гантелей стоячи',
  'triceps dip': 'Віджимання на брусах для трицепса',
  'triceps pushdown rope attachment': 'Розгинання рук на трицепс з канатною рукояткою',
  'weighted bench dip': 'Зворотні віджимання від лави з вагою',
  'wide grip barbell curl': 'Згинання рук зі штангою широким хватом',
  'wide grip decline barbell bench press': 'Жим штанги лежачи широким хватом під нахилом вниз',
  'zottman curl': 'Згинання Зоттмана',
  'bent over dumbbell reverse fly': 'Зворотне розведення гантелей у нахилі',
  'bent over reverse dumbbell fly': 'Зворотне розведення гантелей у нахилі',
  'flexor incline dumbbell curls': 'Згинання рук з гантелями на похилій лаві',
  'barbell squat': 'Присідання зі штангою',
  'bodyweight squat': 'Присідання з власною вагою',
  'incline dumbbell curl': 'Згинання рук з гантелями на похилій лаві',
  'incline dumbbell curls': 'Згинання рук з гантелями на похилій лаві',
  'lat pulldown': 'Тяга верхнього блока',
  deadlift: 'Станова тяга',
  lunges: 'Випади',
  'biceps curl': 'Згинання рук на біцепс',
  'dumbbell curl': 'Згинання рук з гантелями',
  'front raise': 'Підйом гантелей перед собою',
  'hammer curl': 'Молоткові згинання',
  'lateral raise': 'Підйом гантелей у сторони',
  'leg press': 'Жим ногами',
  'pull ups': 'Підтягування',
  'push ups': 'Віджимання',
  'romanian deadlift': 'Румунська тяга',
  'seated cable rows': 'Тяга горизонтального блока сидячи',
  'shoulder press': 'Жим на плечі',
  'triceps pushdown': 'Розгинання рук на трицепс',
  'triceps extension': 'Розгинання рук на трицепс',
  plank: 'Планка',
  crunches: 'Скручування',
};

const wordDictionary: Record<string, string> = {
  alternate: 'почерговий',
  alternating: 'почерговий',
  arm: 'рука',
  arms: 'руки',
  back: 'спина',
  barbell: 'штанга',
  bench: 'лава',
  bent: 'нахил',
  biceps: 'біцепс',
  bodyweight: 'власна вага',
  cable: 'блок',
  calf: 'ікра',
  calves: 'ікри',
  chest: 'груди',
  close: 'вузький',
  concentration: 'концентрований',
  curl: 'згинання',
  curls: 'згинання',
  decline: 'негативний нахил',
  dip: 'віджимання на брусах',
  dips: 'віджимання на брусах',
  dumbbell: 'гантель',
  dumbbells: 'гантелі',
  extension: 'розгинання',
  extensions: 'розгинання',
  flat: 'горизонтальний',
  flexor: 'згинання',
  fly: 'розведення',
  front: 'передній',
  glute: 'сідничний',
  glutes: 'сідниці',
  grip: 'хват',
  hack: 'гак',
  hamstring: 'задня поверхня стегна',
  incline: 'похилий',
  kickback: 'відведення назад',
  lateral: 'боковий',
  leg: 'нога',
  legs: 'ноги',
  lying: 'лежачи',
  machine: 'тренажер',
  military: 'армійський',
  one: 'одна',
  over: 'над',
  bar: 'гриф',
  block: 'блок',
  cross: 'кросовер',
  crossover: 'кросовер',
  ez: 'вигнута',
  floor: 'підлога',
  for: 'для',
  low: 'нижній',
  medium: 'середній',
  negative: 'негативний',
  neutral: 'нейтральний',
  palm: 'долоня',
  press: 'жим',
  pulldown: 'тяга вниз',
  pushdown: 'тяга вниз',
  pull: 'тяга',
  push: 'жим',
  raise: 'підйом',
  raises: 'підйоми',
  rear: 'задній',
  reverse: 'зворотний',
  row: 'тяга',
  rows: 'тяга',
  seated: 'сидячи',
  single: 'однією',
  skullcrusher: 'французький жим',
  shoulder: 'плечі',
  shoulders: 'плечі',
  squat: 'присідання',
  squats: 'присідання',
  standing: 'стоячи',
  stiff: 'прямі',
  straight: 'прямі',
  triceps: 'трицепс',
  two: 'дві',
  upright: 'вертикальна',
  wide: 'широкий',
  with: 'з',
};

function hasLatinLetters(text: string) {
  return /[a-z]/i.test(text);
}

function normalizeText(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[_/.-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function capitalizeFirst(text: string) {
  if (!text) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);
  private readonly cache = new Map<string, string>();

  constructor(private readonly geminiService: GeminiService) {}

  translateToUkrainian(text: string): string {
    if (!text || !text.trim()) {
      return text;
    }

    const normalizedText = normalizeText(text);

    if (dictionary[normalizedText]) {
      return dictionary[normalizedText];
    }

    if (phraseDictionary[normalizedText]) {
      return phraseDictionary[normalizedText];
    }

    const translatedText = normalizedText
      .split(' ')
      .map((part) => {
        return wordDictionary[part] ?? part;
      })
      .join(' ');

    return capitalizeFirst(translatedText);
  }

  async translateExerciseNamesToUkrainian(texts: string[]) {
    const uniqueTexts = Array.from(
      new Set(
        texts
          .map((text) => text.trim())
          .filter(Boolean),
      ),
    );

    const result = new Map<string, string>();
    const missingTexts: string[] = [];

    for (const text of uniqueTexts) {
      const cachedText = this.cache.get(text);

      if (cachedText) {
        result.set(text, cachedText);
      } else {
        missingTexts.push(text);
      }
    }

    if (!missingTexts.length) {
      return result;
    }

    try {
      const prompt = `
Переклади назви фітнес-вправ з англійської на українську.
Використовуй природні спортивні назви, без транслітерації, без російської мови.
Поверни тільки валідний JSON-об'єкт, де ключ - оригінальна назва, значення - переклад.

Назви:
${JSON.stringify(missingTexts, null, 2)}
`;

      const responseText = await this.geminiService.generateText(prompt);
      const translations = this.parseJsonObject(responseText);

      for (const originalText of missingTexts) {
        const translatedText =
          this.findTranslation(translations, originalText) ||
          this.translateToUkrainian(originalText);

        if (!hasLatinLetters(translatedText)) {
          this.cache.set(originalText, translatedText);
        }

        result.set(originalText, translatedText);
      }
    } catch (error) {
      this.logger.warn(
        `AI exercise translation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      for (const originalText of missingTexts) {
        const translatedText = this.translateToUkrainian(originalText);

        result.set(originalText, translatedText);
      }
    }

    return result;
  }

  private findTranslation(translations: Record<string, string>, originalText: string) {
    const directTranslation = translations[originalText];

    if (directTranslation) {
      return directTranslation;
    }

    const normalizedOriginalText = normalizeText(originalText);
    const match = Object.entries(translations).find(([key]) => {
      return normalizeText(key) === normalizedOriginalText;
    });

    return match?.[1];
  }

  private parseJsonObject(text: string): Record<string, string> {
    const cleanedText = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedText) as Record<string, unknown>;
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string') {
        result[key] = value;
      }
    }

    return result;
  }
}
