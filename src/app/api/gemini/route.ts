import { NextRequest, NextResponse } from 'next/server';
import { analyzeFramesWithGemini } from '@/utils/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { frames } = body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json(
        { error: 'Frames array is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const components = await analyzeFramesWithGemini(frames, apiKey);

    return NextResponse.json({ components });
  } catch (error: any) {
    console.error('Gemini API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze frames' },
      { status: 500 }
    );
  }
}

