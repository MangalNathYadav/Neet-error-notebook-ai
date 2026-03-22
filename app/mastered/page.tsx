'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/components/auth/AuthContext';
import { getUserMistakes, MistakeEntry, patchMistake } from '@/lib/firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCcw, Search, BookOpen, AlertCircle, Sparkles, ChevronDown, ChevronUp, CheckCircle2, ZoomIn } from 'lucide-react';
import { ImageModal } from '@/components/ui/ImageModal';
import { Button } from '@/components/ui/Button';

export default function MasteredPage() {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const allMistakes = await getUserMistakes(user.uid);
        const masteredMistakes = allMistakes.filter(m => m.isMastered);
        setMistakes(masteredMistakes);
        setLoading(false);
      };
      fetchData();
    }
  }, [user]);

  const handleUnmaster = async (mistakeId: string) => {
    const current = mistakes.find(m => m.id === mistakeId);
    if (!current || !current.id) return;
    
    // Set nextReattemptAt to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await patchMistake(current.id, {
      isMastered: false,
      nextReattemptAt: tomorrow.getTime(),
    });

    setMistakes(prev => prev.filter(m => m.id !== mistakeId));
    if (expandedId === mistakeId) setExpandedId(null);
  };

  const filteredMistakes = mistakes.filter(m => {
    return m.chapter.toLowerCase().includes(searchQuery.toLowerCase()) || 
           m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (m.aiAnalysis.finalAnswer && m.aiAnalysis.finalAnswer.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <RefreshCcw className="h-8 w-8 text-yellow-500 animate-spin" />
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
            <div className="flex items-center gap-3 mb-1">
              <div className="rounded-xl bg-yellow-100 dark:bg-yellow-500/20 p-2">
                <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-600 to-amber-500 bg-clip-text text-transparent dark:from-yellow-400 dark:to-yellow-200">
                Mastered
              </h1>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 font-medium max-w-lg mt-2">
              Questions you have successfully learned and conquered. Great job!
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
            <input 
              type="text" 
              placeholder="Search mastered..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/5 pl-10 pr-4 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>
        </header>

        {filteredMistakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-white/5 rounded-3xl border border-neutral-200 dark:border-white/5">
            <BookOpen className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mb-4" />
            <h3 className="text-xl font-bold text-neutral-600 dark:text-neutral-400">No Mastered Questions Yet</h3>
            <p className="text-neutral-500 mt-1 max-w-sm">
              Keep re-attempting your mistakes. Once you clearly understand a concept, mark it as mastered to see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredMistakes.map((mistake, index) => {
                const isExpanded = expandedId === mistake.id;

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
                        <div className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg flex-shrink-0 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                          <CheckCircle2 size={24} />
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
                            {mistake.aiAnalysis.finalAnswer || mistake.chapter || "Mastered Concept"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start mt-2 sm:mt-0">
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
                            {/* Left: Image */}
                            <div className="space-y-6">
                              <div 
                                className="relative aspect-video rounded-xl overflow-hidden border bg-neutral-100 dark:bg-black border-neutral-200 dark:border-neutral-800 group cursor-pointer"
                                onClick={() => setFullscreenImage(mistake.imageBase64)}
                              >
                                <img src={mistake.imageBase64} alt="Mastered Content" className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 flex items-center justify-center pointer-events-none">
                                  <ZoomIn className="text-white opacity-0 transition-opacity group-hover:opacity-100" size={32} />
                                </div>
                              </div>
                            </div>

                            {/* Right: Solution & Actions */}
                            <div className="space-y-6">
                              <div className="rounded-xl p-5 border bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700">
                                <div className="flex items-center gap-2 mb-4 font-bold text-neutral-800 dark:text-neutral-200">
                                  <Sparkles size={18} className="text-yellow-500 dark:text-yellow-400" /> AI Logic Reference
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest mb-1 text-neutral-400 dark:text-neutral-500">Final Answer</h4>
                                    <p className="font-medium text-neutral-900 dark:text-white">{mistake.aiAnalysis.finalAnswer}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold uppercase tracking-widest mb-1 text-neutral-400 dark:text-neutral-500">Concept</h4>
                                    <p className="text-sm leading-relaxed whitespace-pre-line text-neutral-700 dark:text-neutral-300">
                                      {mistake.aiAnalysis.explanation}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button onClick={() => handleUnmaster(mistake.id!)} variant="secondary" className="w-full flex justify-center items-center">
                                  Return to Reattempt Queue <AlertCircle size={16} className="ml-2" />
                                </Button>
                              </div>
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
        )}
      </div>
    </DashboardLayout>
  );
}
