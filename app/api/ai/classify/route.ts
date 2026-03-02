import { NextRequest, NextResponse } from 'next/server';
import { classifyImage, classifyText } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { image_url, text } = body as { image_url?: string; text?: string };

  if (image_url) {
    const result = await classifyImage(image_url, text);
    return NextResponse.json(result);
  }

  if (text) {
    const result = classifyText(text);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: 'Provide image_url or text' }, { status: 400 });
}
