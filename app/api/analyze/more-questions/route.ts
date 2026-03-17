import { NextResponse } from 'next/server';
import { generateMoreSimilarQuestions } from '@/lib/gemini/service';

export async function POST(req: Request) {
  try {
    const { solution, explanation, subject, count } = await req.json();

    if (!solution || !explanation || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const moreQuestions = await generateMoreSimilarQuestions(solution, explanation, subject, count);
    return NextResponse.json({ questions: moreQuestions });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to generate more questions' }, { status: 500 });
  }
}
