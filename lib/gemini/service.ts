import { model } from './config';
import { SimilarQuestion } from '@/lib/firebase/database';

export interface AIAnalysisResult {
  solution: string;
  finalAnswer: string;
  explanation: string;
  similarQuestions: SimilarQuestion[];
  ncertReference?: {
    chapter: string;
    paragraph: string;
  };
}

export async function generateMoreSimilarQuestions(
  solution: string,
  explanation: string,
  subject: string,
  count: number = 2
): Promise<SimilarQuestion[]> {
  const prompt = `
    You are an expert NEET tutor. 
    Based on the following solution and concept explanation, generate ${count} NEW similar MCQ-style practice questions.
    
    Solution: ${solution}
    Explanation: ${explanation}
    Subject: ${subject}
    
    Return ONLY a JSON array of objects: 
    [
      {
        "question": "question text",
        "options": ["opt1", "opt2", "opt3", "opt4"],
        "correctAnswerIndex": 0
      }
    ]
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as SimilarQuestion[];
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return [];
  }
}

export async function analyzeQuestionImage(
  imageBuffer: ArrayBuffer, 
  mimeType: string, 
  subject: string
): Promise<AIAnalysisResult> {
  const prompt = `
    You are an expert NEET (medical entrance exam) tutor. 
    Analyze the attached image which is a question from the subject: ${subject}.
    
    1. Provide a step-by-step solution.
    2. State the final answer clearly.
    3. Explain the core concept behind this question.
    4. Generate 2 similar MCQ questions based on the same concept for practice. 
       Each similar question MUST have:
       - The question text.
       - Exactly 4 options.
       - The index of the correct answer (0-3).
    
    ${(subject === 'Botany' || subject === 'Zoology') ? 
      '5. Since this is Biology, extract the specific NCERT chapter name and relevant paragraph context.' : ''}
    
    Format the response MUST be a valid JSON object:
    {
      "solution": "step-by-step text",
      "finalAnswer": "option text",
      "explanation": "concept explanation text",
      "similarQuestions": [
        {
          "question": "question text",
          "options": ["opt1", "opt2", "opt3", "opt4"],
          "correctAnswerIndex": 0
        }
      ],
      "ncertReference": { "chapter": "chapter name", "paragraph": "paragraph description" } (only if biology)
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: Buffer.from(imageBuffer).toString("base64"),
          mimeType
        }
      }
    ]);

    const responseText = result.response.text();
    // Clean JSON if Gemini wraps it in markdown blocks
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze question image.");
  }
}
