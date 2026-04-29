import { Injectable, Logger } from '@nestjs/common';
import { translate } from '@vitalets/google-translate-api';

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);
  private readonly cache = new Map<string, string>();

  async translateToUkrainian(text: string): Promise<string> {
    if (!text || !text.trim()) {
      return text;
    }

    const cacheKey = `uk:${text}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const result = await translate(text, {
        from: 'en',
        to: 'uk',
      });

      const translatedText = result.text || text;

      this.cache.set(cacheKey, translatedText);

      return translatedText;
    } catch (error) {
      this.logger.warn(`Translate failed for text: ${text}`);
      return text;
    }
  }
}