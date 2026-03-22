import { 
  ref, 
  push, 
  set, 
  get, 
  query, 
  orderByChild, 
  equalTo, 
  serverTimestamp 
} from 'firebase/database';
import { rtdb } from './config';

export interface SimilarQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

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

export interface MistakeEntry {
  id?: string;
  userId: string;
  imageBase64: string;
  subject: string;
  chapter: string;
  mistakeType: string;
  notes?: string;
  createdAt: number;
  nextReattemptAt: number;
  attemptCount: number;
  isMastered?: boolean;
  aiAnalysis: AIAnalysisResult;
  similarQuestionsPracticed?: boolean[];
  similarQuestionsResults?: ("correct" | "incorrect" | null)[];
}

export async function saveMistake(mistake: Omit<MistakeEntry, 'id' | 'createdAt'>) {
  const mistakesRef = ref(rtdb, 'mistakes');
  const newMistakeRef = push(mistakesRef);

  const data = {
    ...mistake,
    createdAt: serverTimestamp(),
    similarQuestionsPracticed: new Array(mistake.aiAnalysis.similarQuestions.length).fill(false),
  };
  
  await set(newMistakeRef, data);
  return newMistakeRef.key;
}

// Better update helper for RTDB
import { update as rtdbUpdate } from 'firebase/database';
export async function patchMistake(id: string, updates: Partial<MistakeEntry>) {
  const mistakeRef = ref(rtdb, `mistakes/${id}`);
  await rtdbUpdate(mistakeRef, updates);
}

export async function getUserMistakes(userId: string) {
  const mistakesRef = ref(rtdb, 'mistakes');
  const q = query(mistakesRef, orderByChild('userId'), equalTo(userId));
  
  const snapshot = await get(q);
  if (!snapshot.exists()) return [];
  
  const data = snapshot.val();
  return Object.entries(data).map(([id, value]) => ({
    id,
    ...(value as any),
  } as MistakeEntry)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getUserStats(userId: string) {
  const mistakes = await getUserMistakes(userId);
  
  const stats = {
    total: mistakes.length,
    subjectWise: {} as Record<string, number>,
    typeWise: {} as Record<string, number>,
    weakChapters: [] as { chapter: string, count: number }[]
  };

  const chapterMap: Record<string, number> = {};

  mistakes.forEach(m => {
    stats.subjectWise[m.subject] = (stats.subjectWise[m.subject] || 0) + 1;
    stats.typeWise[m.mistakeType] = (stats.typeWise[m.mistakeType] || 0) + 1;
    chapterMap[m.chapter] = (chapterMap[m.chapter] || 0) + 1;
  });

  stats.weakChapters = Object.entries(chapterMap)
    .map(([chapter, count]) => ({ chapter, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return stats;
}
