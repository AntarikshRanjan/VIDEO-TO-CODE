import { NextRequest, NextResponse } from 'next/server';
import { generateCodeWithHuggingFace } from '@/utils/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { components, responses } = body;

    if (!components || !Array.isArray(components)) {
      return NextResponse.json(
        { error: 'Components array is required' },
        { status: 400 }
      );
    }

    const token = process.env.HUGGING_FACE_TOKEN;
    const result = await generateCodeWithHuggingFace(
      components,
      responses || {},
      token
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Code generation API route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate code' },
      { status: 500 }
    );
  }
}

