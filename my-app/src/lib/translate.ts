

export type Language = 'en' | 'es';

/**
 * Translate text using secure API route
 */
export async function translateText(
  text: string,
  targetLanguage: Language,
  sourceLanguage: Language = 'en'
): Promise<string> {
  // If source and target are the same, return original text
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.translations;
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text on error
    return text;
  }
}


export async function translateBatch(
  texts: string[],
  targetLanguage: Language,
  sourceLanguage: Language = 'en'
): Promise<string[]> {
  if (sourceLanguage === targetLanguage) {
    return texts;
  }

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        targetLanguage,
        sourceLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.translations;
  } catch (error) {
    console.error('Translation error:', error);
    return texts;
  }
}

