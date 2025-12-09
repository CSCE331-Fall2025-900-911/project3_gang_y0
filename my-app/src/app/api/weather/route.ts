import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500 }
      );
    }

    // Get location from query parameter
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get('q') || '77840';

    // Call WeatherAPI current weather endpoint
    const response = await fetch(
      `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('WeatherAPI error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch weather data', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    const tempF = data.current.temp_f;

    // Determine season based on temperature ranges
    // Summer: >80 F
    // Fall/Spring: 70-80 F
    // Winter: <70 F
    let season: string;
    if (tempF > 80) {
      season = 'summer';
    } else if (tempF >= 70 && tempF <= 80) {
      season = 'fall/spring';
    } else {
      season = 'winter';
    }

    return NextResponse.json({
      success: true,
      temperature: tempF,
      season,
      location: data.location,
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

