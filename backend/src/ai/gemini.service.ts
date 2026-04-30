import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type GenerateTextOptions = {
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'application/json' | 'text/plain';
};

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey = process.env.GEMINI_API_KEY?.trim();
  private readonly model = this.normalizeModelName(process.env.GEMINI_MODEL);

  async generateText(prompt: string, options?: GenerateTextOptions) {
    if (!this.apiKey) {
      this.logger.warn('GEMINI_API_KEY is not configured');
      throw new ServiceUnavailableException('GEMINI_API_KEY is not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: options?.temperature ?? 0.2,
            maxOutputTokens: options?.maxOutputTokens ?? 2000,
            responseMimeType: options?.responseMimeType,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.warn(
        `Gemini API request failed: ${response.status} ${errorText}`,
      );

      if (response.status === 429) {
        throw new ServiceUnavailableException(
          'Квота Gemini API вичерпана. Зачекай ліміт або заміни GEMINI_API_KEY.',
        );
      }

      if (response.status === 400 && errorText.includes('API_KEY_INVALID')) {
        throw new ServiceUnavailableException(
          'GEMINI_API_KEY невалідний. Створи новий ключ у Google AI Studio, збережи .env і перезапусти backend.',
        );
      }

      throw new ServiceUnavailableException('Gemini API request failed');
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new ServiceUnavailableException(
        'Gemini API returned an empty response',
      );
    }

    return text;
  }

  private normalizeModelName(model?: string) {
    return (model || 'gemini-1.5-flash').trim().replace(/^models\//, '');
  }
}
