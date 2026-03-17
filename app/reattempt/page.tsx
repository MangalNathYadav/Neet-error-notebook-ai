'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/components/auth/AuthContext';
import { ref, query, orderByChild, endAt, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import { MistakeEntry, patchMistake, getUserMistakes } from '@/lib/firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, RefreshCcw, CheckCircle2, Calendar, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MCQPractice } from '@/components/practice/MCQPractice';

export default function ReattemptPage() {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [upgradingIndices, setUpgradingIndices] = useState<Record<string, Set<number>>>({});

  const handleUpgradeQuestion = async (mistakeId: string, index: number) => {
    const current = mistakes.find(m => m.id === mistakeId);
    if (!current) return;

    setUpgradingIndices(prev => ({
      ...prev,
      [mistakeId]: new Set(prev[mistakeId] || []).add(index)
    }));

    try {
      const res = await fetch('/api/analyze/more-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solution: current.aiAnalysis.solution,
          explanation: current.aiAnalysis.explanation,
          subject: current.subject,
          count: 1
        })
      });

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        const updatedQuestions = [...current.aiAnalysis.similarQuestions];
        updatedQuestions[index] = data.questions[0];

        await patchMistake(current.id!, {
          aiAnalysis: { ...current.aiAnalysis, similarQuestions: updatedQuestions }
        });

        // Update local state
        setMistakes(prev => prev.map(m => 
          m.id === mistakeId 
            ? { ...m, aiAnalysis: { ...m.aiAnalysis, similarQuestions: updatedQuestions } }
            : m
        ));
      }
    } catch (error) {
      console.error('Failed to upgrade question:', error);
    }
  };

  const handleGenerateMore = async () => {
    const current = mistakes[currentIndex];
    if (!current.id) return;

    setLoading(true);
    try {
      const res = await fetch('/api/analyze/more-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solution: current.aiAnalysis.solution,
          explanation: current.aiAnalysis.explanation,
          subject: current.subject
        })
      });

      const data = await res.json();
      if (data.questions) {
        const updatedQuestions = [...current.aiAnalysis.similarQuestions, ...data.questions];
        await patchMistake(current.id, {
          aiAnalysis: { ...current.aiAnalysis, similarQuestions: updatedQuestions }
        });
        setMistakes(prev => prev.map((m, i) => 
          i === currentIndex 
            ? { ...m, aiAnalysis: { ...m.aiAnalysis, similarQuestions: updatedQuestions } }
            : m
        ));
      }
    } catch (error) {
      console.error('Failed to generate more questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < mistakes.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowSolution(false);
    } else {
      setMistakes([]);
    }
  };

  const handleMastered = async () => {
    const current = mistakes[currentIndex];
    if (!current.id) return;
    const nextDate = new Date();
    const interval = (current.attemptCount || 1) * 7; 
    nextDate.setDate(nextDate.getDate() + interval);
    await patchMistake(current.id, {
      nextReattemptAt: nextDate.getTime(),
      attemptCount: (current.attemptCount || 1) + 1
    });
    handleNext();
  };

  const toggleSimilarQuestion = async (index: number) => {
    const current = mistakes[currentIndex];
    if (!current.id) return;

    const practiced = [...(current.similarQuestionsPracticed || [])];
    // Ensure the array is long enough
    while (practiced.length <= index) practiced.push(false);
    
    practiced[index] = !practiced[index];

    await patchMistake(current.id, {
      similarQuestionsPracticed: practiced
    });

    // Update local state
    const updatedMistakes = [...mistakes];
    updatedMistakes[currentIndex] = { ...current, similarQuestionsPracticed: practiced };
    setMistakes(updatedMistakes);
  };

  // Auto-upgrade legacy questions
  useEffect(() => {
    const current = mistakes[currentIndex];
    if (!current || !current.id || !showSolution) return;

    current.aiAnalysis.similarQuestions.forEach((q, i) => {
      if (typeof q === 'string' && !upgradingIndices[current.id!]?.has(i)) {
        handleUpgradeQuestion(current.id!, i);
      }
    });
  }, [currentIndex, mistakes, showSolution, upgradingIndices]);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const now = Date.now();
        const mistakesRef = ref(rtdb, 'mistakes');
        
        // Try to fetch due mistakes first
        const q = query(
          mistakesRef,
          orderByChild('nextReattemptAt'),
          endAt(now)
        );
        
        const snap = await get(q);
        let items: MistakeEntry[] = [];
        
        if (snap.exists()) {
          items = Object.entries(snap.val())
            .map(([id, val]) => ({ id, ...(val as any) } as MistakeEntry))
            .filter(m => m.userId === user.uid)
            .sort((a, b) => a.nextReattemptAt - b.nextReattemptAt);
        }

        if (items.length === 0) {
          // Fallback to all mistakes for "Practice Mode"
          const allMistakes = await getUserMistakes(user.uid);
          setMistakes(allMistakes);
          setIsPracticeMode(true);
        } else {
          setMistakes(items);
          setIsPracticeMode(false);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <RefreshCcw className="h-8 w-8 text-purple-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (mistakes.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center px-4">
          <div className="mb-6 rounded-full bg-purple-500/10 p-6">
            <CheckCircle2 className="h-12 w-12 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're all caught up!</h2>
          <p className="text-neutral-500 max-w-sm">
            No mistakes are due for reattempt right now. Keep practicing and adding new errors to your notebook.
          </p>
          <Button onClick={() => window.location.reload()} className="mt-8" variant="secondary">
            Refresh
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentMistake = mistakes[currentIndex];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">Reattempt Mode</h1>
              {isPracticeMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold uppercase tracking-wider">
                  Practice Mode
                </span>
              )}
            </div>
            <p className="text-neutral-500 italic">Question {currentIndex + 1} of {mistakes.length}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-purple-400 font-bold">
            {currentMistake.attemptCount || 1}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Question Side */}
          <div className="space-y-6">
            <motion.div 
              key={currentMistake.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-neutral-900 group"
            >
              <img src={currentMistake.imageBase64} alt="Mistake" className="h-full w-full object-contain" />
              {!showSolution && (
                <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button onClick={() => setShowSolution(true)} variant="primary">
                    Reveal Solution
                  </Button>
                </div>
              )}
            </motion.div>

            <div className="rounded-3xl border border-white/5 bg-white/5 p-6">
              <div className="flex items-center gap-2 mb-3 text-purple-400">
                <Target size={18} />
                <h3 className="font-bold">Your Task</h3>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Solve this question again on paper. Once done, check the AI solution to verify your steps and final answer.
              </p>
            </div>
          </div>

          {/* Solution & Practice Side */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {showSolution ? (
                <motion.div
                  key="solution"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="rounded-3xl border border-purple-500/30 bg-purple-500/5 p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-purple-400">
                        <Sparkles size={18} />
                        <h3 className="font-bold">AI Logic</h3>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 bg-purple-500/20 rounded-lg text-purple-300">
                        {currentMistake.mistakeType}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Final Answer</h4>
                        <p className="text-white font-medium">{currentMistake.aiAnalysis.finalAnswer}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Step-by-Step</h4>
                        <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                          {currentMistake.aiAnalysis.solution}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Similar Questions Practice */}
                  <div className="rounded-3xl border border-white/5 bg-white/5 p-6">
                    <div className="flex items-center gap-2 mb-4 text-blue-400">
                      <BookOpen size={18} />
                      <h3 className="font-bold">Interactive Practice</h3>
                    </div>
                    <div className="space-y-6">
                      {currentMistake.aiAnalysis.similarQuestions.map((q, i) => (
                        <MCQPractice
                          key={`${currentMistake.id}-${i}`}
                          question={q}
                          ncertRef={currentMistake.aiAnalysis.ncertReference}
                          onResult={(result) => {
                            const results = [...(currentMistake.similarQuestionsResults || [])];
                            while (results.length <= i) results.push(null);
                            results[i] = result;
                            
                            patchMistake(currentMistake.id!, {
                              similarQuestionsResults: results
                            });
                          }}
                        />
                      ))}

                      <Button 
                        onClick={handleGenerateMore} 
                        variant="secondary" 
                        className="w-full border-dashed border-white/10 hover:border-purple-500/50"
                      >
                        < Sparkles size={14} className="mr-2" /> 
                        {currentMistake.aiAnalysis.similarQuestions.length > 0 ? "Generate More Questions" : "Generate Questions"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleMastered} variant="primary" className="flex-1">
                      Mastered <CheckCircle2 size={18} className="ml-2" />
                    </Button>
                    <Button onClick={handleNext} variant="secondary" className="flex-1">
                      Skip for Now
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 rounded-3xl border border-white/5 bg-white/5 dashed"
                >
                  <div className="mb-4 rounded-full bg-white/5 p-4">
                    <AlertCircle className="h-8 w-8 text-neutral-600" />
                  </div>
                  <h3 className="font-bold text-neutral-400 mb-2">Solution Hidden</h3>
                  <p className="text-sm text-neutral-500 max-w-[200px]">
                    Try solving it yourself before revealing the AI logic.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
