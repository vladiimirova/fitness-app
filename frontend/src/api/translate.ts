export async function translateText(text: string): Promise<string> {
  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: 'uk',
        format: 'text',
      }),
    });

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Translate error:', error);
    return text;
  }
}