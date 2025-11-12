import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    const { text, texts, targetLanguage, sourceLanguage = 'en' } = await request.json();

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Translate API key not configured' },
        { status: 500 }
      );
    }

   
    if (sourceLanguage === targetLanguage) {
      return NextResponse.json({
        translations: Array.isArray(texts) ? texts : [text],
      });
    }

    // Prepare texts array
    const textsToTranslate = Array.isArray(texts) ? texts : [text];

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: textsToTranslate,
          source: sourceLanguage,
          target: targetLanguage,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google Translate API error:', errorData);
      return NextResponse.json(
        { error: 'Translation failed', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translations = data.data.translations.map((t: any) => t.translatedText);

    return NextResponse.json({
      translations: Array.isArray(texts) ? translations : translations[0],
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

