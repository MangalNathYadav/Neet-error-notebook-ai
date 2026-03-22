'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/components/auth/AuthContext';
import { ref, query, orderByChild, endAt, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';
import { MistakeEntry, patchMistake, getUserMistakes } from '@/lib/firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, RefreshCcw, CheckCircle2, Sparkles, BookOpen, AlertCircle, ChevronDown, ChevronUp, ZoomIn } from 'lucide-react';
import { ImageModal } from '@/components/ui/ImageModal';
import { Button } from '@/components/ui/Button';
import { MCQPractice } from '@/components/practice/MCQPractice';

export default function ReattemptPage() {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSolutionFor, setShowSolutionFor] = useState<Record<string, boolean>>({});
  const [upgradingIndices, setUpgradingIndices] = useState<Record<string, Set<number>>>({});
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const now = Date.now();
        const mistakesRef = ref(rtdb, 'mistakes');
        const q = query(mistakesRef, orderByChild('nextReattemptAt'), endAt(now));
        const snap = await get(q);
        let items: MistakeEntry[] = [];
        if (snap.exists()) {
          items = Object.entries(snap.val())
            .map(([id, val]) => ({ id, ...(val as any) } as MistakeEntry))
            .filter(m => m.userId === user.uid && !m.isMastered) // Exclude mastered questions
            .sort((a, b) => a.nextReattemptAt - b.nextReattemptAt);
        }
        if (items.length === 0) {
          const allMistakes = await getUserMistakes(user.uid);
          const practiceMistakes = allMistakes.filter(m => !m.isMastered);
          setMistakes(practiceMistakes);
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

  const handleUpgradeQuestion = async (mistakeId: string, index: number) => {
    const current = mistakes.find(m => m.id === mistakeId);
    if (!current) return;
    setUpgradingIndices(prev => ({ ...prev, [mistakeId]: new Set(prev[mistakeId] || []).add(index) }));
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
        await patchMistake(current.id!, { aiAnalysis: { ...current.aiAnalysis, similarQuestions: updatedQuestions } });
        setMistakes(prev => prev.map(m => m.id === mistakeId ? { ...m, aiAnalysis: { ...m.aiAnalysis, similarQuestions: updatedQuestions } } : m));
      }
    } catch (error) {
      console.error('Failed to upgrade question:', error);
    }
  };

  const handleGenerateMore = async (mistakeId: string) => {
    const current = mistakes.find(m => m.id === mistakeId);
    if (!current || !current.id) return;
    setGeneratingFor(mistakeId);
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
        await patchMistake(current.id, { aiAnalysis: { ...current.aiAnalysis, similarQuestions: updatedQuestions } });
        setMistakes(prev => prev.map(m => m.id === mistakeId ? { ...m, aiAnalysis: { ...m.aiAnalysis, similarQuestions: updatedQuestions } } : m));
      }
    } catch (error) {
      console.error('Failed to generate more questions:', error);
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleMastered = async (mistakeId: string) => {
    const current = mistakes.find(m => m.id === mistakeId);
    if (!current || !current.id) return;
    await patchMistake(current.id, {
      isMastered: true
    });
    setMistakes(prev => prev.filter(m => m.id !== mistakeId));
    if (expandedId === mistakeId) setExpandedId(null);
  };

  const handleResultUpdate = (mistakeId: string, index: number, result: "correct" | "incorrect") => {
    const current = mistakes.find(m => m.id === mistakeId);
    if (!current || !current.id) return;
    const results = [...(current.similarQuestionsResults || [])];
    while (results.length <= index) results.push(null);
    results[index] = result;
    patchMistake(current.id, { similarQuestionsResults: results });
    setMistakes(prev => prev.map(m => m.id === mistakeId ? { ...m, similarQuestionsResults: results } : m));
  };

  // Auto-upgrade legacy string questions
  useEffect(() => {
    mistakes.forEach(current => {
      if (!current || !current.id || !showSolutionFor[current.id]) return;
      current.aiAnalysis.similarQuestions.forEach((q, i) => {
        if (typeof q === 'string' && !upgradingIndices[current.id!]?.has(i)) {
          handleUpgradeQuestion(current.id!, i);
        }
      });
    });
  }, [mistakes, showSolutionFor, upgradingIndices]);

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
        <div className="flex h-[60vh] flex-col items-center justify-center text-center px-4 transition-colors bg-white dark:bg-transparent text-neutral-900 dark:text-white rounded-3xl">
          <div className="mb-6 rounded-full bg-purple-100 dark:bg-purple-500/10 p-6">
            <CheckCircle2 className="h-12 w-12 text-purple-600 dark:text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">You're all caught up!</h2>
          <p className="max-w-sm text-neutral-600 dark:text-neutral-500">
            No mistakes are due for reattempt right now. Keep practicing and adding new errors to your notebook.
          </p>
          <Button onClick={() => window.location.reload()} className="mt-8" variant="secondary">
            Refresh
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ImageModal src={fullscreenImage} onClose={() => setFullscreenImage(null)} />
      <div className="transition-colors min-h-[80vh] rounded-3xl p-6 lg:p-10 bg-neutral-50 dark:bg-transparent text-neutral-900 dark:text-white shadow-xl dark:shadow-none">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-extrabold tracking-tight">Reattempt List</h1>
              {isPracticeMode && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-500 border border-blue-200 dark:border-blue-500/30 font-bold uppercase tracking-wider">
                  Practice Mode
                </span>
              )}
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 font-medium">
              You have {mistakes.length} questions to review.
            </p>
          </div>
        </header>

        <div className="space-y-4">
          <AnimatePresence>
            {mistakes.map((mistake, index) => {
              const isExpanded = expandedId === mistake.id;
              const isShowSolution = showSolutionFor[mistake.id!] || false;

              return (
                <motion.div 
                  key={mistake.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-hidden rounded-2xl border transition-all bg-white dark:bg-neutral-900 border-neutral-200 dark:border-white/10 shadow-sm dark:shadow-none"
                >
                  <div 
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : mistake.id!)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg flex-shrink-0 bg-indigo-100 dark:bg-purple-500/20 text-indigo-700 dark:text-purple-400">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {mistake.subject}
                          </span>
                          <span className="text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide bg-rose-100 dark:bg-purple-500/20 text-rose-600 dark:text-purple-300">
                            {mistake.mistakeType}
                          </span>
                        </div>
                        <p className="font-semibold line-clamp-1 text-neutral-800 dark:text-neutral-200">
                          {mistake.aiAnalysis.finalAnswer || "Question needing review"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start mt-2 sm:mt-0">
                      <span className="text-sm font-medium text-neutral-500">
                        Attempt {mistake.attemptCount || 1}
                      </span>
                      {isExpanded ? <ChevronUp className="text-neutral-400 dark:text-neutral-500" /> : <ChevronDown className="text-neutral-400 dark:text-neutral-500" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-neutral-100 dark:border-neutral-800"
                      >
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Left: Image & Task */}
                          <div className="space-y-6">
                            <div 
                              className="relative aspect-video rounded-xl overflow-hidden border bg-neutral-100 dark:bg-black border-neutral-200 dark:border-neutral-800 group cursor-pointer"
                              onClick={() => setFullscreenImage(mistake.imageBase64)}
                            >
                              <img src={mistake.imageBase64} alt="Mistake Content" className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 flex items-center justify-center pointer-events-none">
                                <ZoomIn className="text-white opacity-0 transition-opacity group-hover:opacity-100" size={32} />
                              </div>
                              {!isShowSolution && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                  <Button onClick={() => setShowSolutionFor(prev => ({...prev, [mistake.id!]: true}))} variant="primary" className="shadow-lg">
                                    Reveal Solution
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="rounded-xl p-5 border bg-indigo-50 dark:bg-purple-900/10 border-indigo-100 dark:border-purple-500/20">
                              <div className="flex items-center gap-2 mb-2 font-bold text-indigo-700 dark:text-purple-400">
                                <Target size={18} /> Your Task
                              </div>
                              <p className="text-sm leading-relaxed text-indigo-900/70 dark:text-purple-200/70">
                                Solve this question again on paper. Once done, check the AI solution to verify your steps and final answer.
                              </p>
                            </div>
                          </div>

                          {/* Right: Solution & Actions */}
                          <div className="space-y-6">
                            {isShowSolution ? (
                              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="rounded-xl p-5 border bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700">
                                  <div className="flex items-center gap-2 mb-4 font-bold text-neutral-800 dark:text-neutral-200">
                                    <Sparkles size={18} className="text-amber-500 dark:text-amber-400" /> AI Logic
                                  </div>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="text-xs font-bold uppercase tracking-widest mb-1 text-neutral-400 dark:text-neutral-500">Final Answer</h4>
                                      <p className="font-medium text-neutral-900 dark:text-white">{mistake.aiAnalysis.finalAnswer}</p>
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold uppercase tracking-widest mb-1 text-neutral-400 dark:text-neutral-500">Step-by-Step</h4>
                                      <p className="text-sm leading-relaxed whitespace-pre-line text-neutral-700 dark:text-neutral-300">
                                        {mistake.aiAnalysis.solution}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-xl p-5 border bg-white dark:bg-neutral-800/30 border-neutral-200 dark:border-neutral-700 shadow-sm dark:shadow-none">
                                  <div className="flex items-center gap-2 mb-4 font-bold text-blue-600 dark:text-blue-400">
                                    <BookOpen size={18} /> Interactive Practice
                                  </div>
                                  <div className="space-y-6">
                                    {(mistake.aiAnalysis.similarQuestions || []).map((q, i) => (
                                      <MCQPractice
                                        key={`${mistake.id}-${i}`}
                                        question={q}
                                        ncertRef={mistake.aiAnalysis.ncertReference}
                                        onResult={(result) => handleResultUpdate(mistake.id!, i, result)}
                                      />
                                    ))}
                                    <Button 
                                      onClick={() => handleGenerateMore(mistake.id!)} 
                                      variant="secondary" 
                                      disabled={generatingFor === mistake.id}
                                      className="w-full border-dashed bg-neutral-50 dark:bg-transparent text-neutral-600 dark:text-white border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-transparent hover:border-neutral-400 dark:hover:border-purple-500/50"
                                    >
                                      {generatingFor === mistake.id ? <RefreshCcw size={14} className="mr-2 animate-spin" /> : <Sparkles size={14} className="mr-2" />}
                                      {(mistake.aiAnalysis.similarQuestions || []).length > 0 ? "Generate More Questions" : "Generate Questions"}
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                  <Button onClick={() => handleMastered(mistake.id!)} variant="primary" className="flex-1 shadow-md">
                                    Mark as Mastered <CheckCircle2 size={18} className="ml-2" />
                                  </Button>
                                  <Button onClick={() => setExpandedId(null)} variant="secondary" className="flex-1 bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-white hover:bg-neutral-300 dark:hover:bg-white/20">
                                    Review Later
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed bg-neutral-50 dark:bg-neutral-800/30 border-neutral-300 dark:border-neutral-700">
                                <AlertCircle className="h-10 w-10 mb-3 opacity-50 text-neutral-400 dark:text-neutral-500" />
                                <h3 className="font-bold mb-1 text-neutral-700 dark:text-neutral-300">Solution Hidden</h3>
                                <p className="text-sm max-w-[250px] text-neutral-500">
                                  Try solving it yourself before revealing the AI logic.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
