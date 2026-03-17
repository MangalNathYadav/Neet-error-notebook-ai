'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, BookOpen, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SimilarQuestion } from '@/lib/firebase/database';

interface MCQPracticeProps {
  question: SimilarQuestion | string;
  onResult?: (result: 'correct' | 'incorrect') => void;
  ncertRef?: { chapter: string; paragraph: string };
}

export function MCQPractice({ question, onResult, ncertRef }: MCQPracticeProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fallback for old string format questions
  if (typeof question === 'string') {
    return (
      <div className="p-5 rounded-2xl border border-white/5 bg-black/20 flex items-center justify-center min-h-[100px] group">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-purple-500 animate-spin" />
          <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest animate-pulse">
            Making Interactive...
          </p>
        </div>
      </div>
    );
  }

  const isCorrect = selectedOption === question.correctAnswerIndex;

  const handleSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
    onResult?.(isCorrect ? 'correct' : 'incorrect');
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/5 bg-black/20 p-5">
        <h4 className="text-sm font-medium text-white mb-4 leading-relaxed">
          {question.question}
        </h4>

        <div className="space-y-2">
          {question.options.map((option, idx) => {
            let state = 'default';
            if (isSubmitted) {
              if (idx === question.correctAnswerIndex) state = 'correct';
              else if (idx === selectedOption) state = 'incorrect';
              else state = 'dimmed';
            } else if (selectedOption === idx) {
              state = 'selected';
            }

            return (
              <button
                key={idx}
                disabled={isSubmitted}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-4 rounded-xl text-sm transition-all border ${
                  state === 'correct' ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                  state === 'incorrect' ? 'bg-red-500/10 border-red-500/50 text-red-400' :
                  state === 'selected' ? 'bg-purple-500/10 border-purple-500/50 text-white' :
                  state === 'dimmed' ? 'bg-white/5 border-white/5 opacity-50 text-neutral-500' :
                  'bg-white/5 border-white/5 hover:border-white/20 text-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {state === 'correct' && <CheckCircle2 size={16} />}
                  {state === 'incorrect' && <XCircle size={16} />}
                </div>
              </button>
            );
          })}
        </div>

        {!isSubmitted ? (
          <Button 
            onClick={handleSubmit} 
            disabled={selectedOption === null}
            className="w-full mt-6"
            variant="primary"
          >
            Check Answer
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            {isCorrect ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                <Sparkles size={18} />
                <span className="text-sm font-bold">Excellent! You've mastered this concept.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle size={18} />
                  <span className="text-sm font-bold">Not quite. Time to revise.</span>
                </div>
                
                {ncertRef && (
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-blue-400">
                      <BookOpen size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">NCERT Remediation</span>
                    </div>
                    <p className="text-xs text-blue-200/70 font-medium">Chapter: {ncertRef.chapter}</p>
                    <p className="text-[11px] text-neutral-400 leading-relaxed italic">
                      "{ncertRef.paragraph}"
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-2">
                      Please read this section in your NCERT textbook before retesting.
                    </p>
                  </div>
                )}
                
                <Button onClick={handleReset} variant="secondary" className="w-full py-2 h-auto text-xs">
                  <RotateCcw size={14} className="mr-2" /> Try Again
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
