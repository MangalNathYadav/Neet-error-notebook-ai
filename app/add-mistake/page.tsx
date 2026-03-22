'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Camera, 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  X,
  Loader2,
  ZoomIn
} from 'lucide-react';
import { ImageModal } from '@/components/ui/ImageModal';
import { useAuth } from '@/components/auth/AuthContext';
import { fileToBase64 } from '@/lib/firebase/storage';
import { analyzeQuestionImage, AIAnalysisResult } from '@/lib/gemini/service';
import { saveMistake } from '@/lib/firebase/database';
import { useRouter } from 'next/navigation';

const SUBJECTS = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
const MISTAKE_TYPES = ['Conceptual', 'Silly', 'Calculation', 'Guess'];

export default function AddMistakePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [mistakeType, setMistakeType] = useState('');
  const [notes, setNotes] = useState('');
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setStep(2);
    }
  };

  const processMistake = async () => {
    if (!user || !image || !subject) return;
    setLoading(true);
    setStep(3);

    try {
      // 1. Get Base64 Image (Replacing Storage upload)
      const imageBase64 = await fileToBase64(image);
      
      // 2. AI Analysis
      const arrayBuffer = await image.arrayBuffer();
      const analysis = await analyzeQuestionImage(arrayBuffer, image.type, subject);
      setAiResult(analysis);

      // 3. Save to RTDB
      const reattemptDate = new Date();
      reattemptDate.setDate(reattemptDate.getDate() + 3);

      await saveMistake({
        userId: user.uid,
        subject,
        chapter,
        mistakeType: mistakeType as any,
        notes,
        imageBase64,
        aiAnalysis: analysis,
        nextReattemptAt: reattemptDate.getTime(),
        attemptCount: 1,
        // Optional: you can add initially isMastered: false here
      });

      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
      setStep(2);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Add New Mistake</h1>
            <p className="text-neutral-600 dark:text-neutral-500">Step {step} of 3</p>
          </div>
          {step > 1 && !loading && (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              <ChevronLeft size={16} /> Back
            </Button>
          )}
        </header>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-white/5 transition-all hover:border-purple-400 dark:hover:border-purple-500/50 hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <div className="mb-4 rounded-full bg-white dark:bg-white/10 p-4 transition-transform group-hover:scale-110 shadow-sm dark:shadow-none">
                  <Camera className="h-8 w-8 text-neutral-400 group-hover:text-purple-500 dark:group-hover:text-purple-400" />
                </div>
                <p className="font-medium text-neutral-700 dark:text-neutral-300">Take a photo or upload</p>
                <p className="text-sm text-neutral-500 mt-1">Supports JPG, PNG</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <ImageModal src={fullscreenImage} onClose={() => setFullscreenImage(null)} />
              <div 
                className="relative aspect-video rounded-3xl overflow-hidden border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 group cursor-pointer"
                onClick={() => setFullscreenImage(imagePreview)}
              >
                <img src={imagePreview!} alt="Mistake" className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20 flex items-center justify-center pointer-events-none">
                  <ZoomIn className="text-white opacity-0 transition-opacity group-hover:opacity-100" size={32} />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setStep(1); }}
                  className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/50 text-neutral-900 dark:text-white backdrop-blur-md hover:bg-white dark:hover:bg-black/70 shadow-sm z-10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Subject</label>
                    <div className="grid grid-cols-1 gap-2">
                      <select 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="h-12 w-full rounded-2xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/5 px-4 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none shadow-sm dark:shadow-none"
                      >
                        <option value="" disabled className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Select Subject</option>
                        {SUBJECTS.map(s => <option key={s} value={s} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Mistake Type</label>
                    <select 
                      value={mistakeType}
                      onChange={(e) => setMistakeType(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/5 px-4 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none shadow-sm dark:shadow-none"
                    >
                      <option value="" disabled className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">Select Type</option>
                      {MISTAKE_TYPES.map(t => <option key={t} value={t} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Chapter</label>
                  <Input 
                    placeholder="Enter chapter name..." 
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    className="h-12 bg-white dark:bg-white/5 border-neutral-200 dark:border-white/5 text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Additional Notes (Optional)</label>
                  <textarea 
                    placeholder="Add your own solution or insights..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex min-h-[120px] w-full rounded-2xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/5 px-4 py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm dark:shadow-none"
                  />
                </div>
              </div>

              <Button 
                onClick={processMistake} 
                className="w-full"
                disabled={!subject || !chapter || !mistakeType}
              >
                Let AI Analyze <Sparkles size={18} className="ml-1" />
              </Button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              {loading ? (
                <>
                  <div className="relative mb-8">
                    <Loader2 className="h-16 w-16 text-purple-600 dark:text-purple-500 animate-spin" />
                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 dark:text-yellow-400 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 italic">Gemini is thinking...</h2>
                  <p className="text-neutral-600 dark:text-neutral-500">Generating step-by-step solution and references.</p>
                </>
              ) : (
                <>
                  <div className="mb-8 rounded-full bg-green-100 dark:bg-green-500/10 p-6">
                    <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Mistake Automatically Logged</h2>
                  <p className="text-neutral-600 dark:text-neutral-500 mb-8 max-w-sm">
                    AI solution generated. This mistake will be resurfaced in 3 days for reattempt.
                  </p>
                  <div className="flex w-full flex-col gap-3">
                    <Button onClick={() => router.push('/notebook')} className="w-full">
                      View in Notebook
                    </Button>
                    <Button variant="secondary" onClick={() => {
                        setStep(1);
                        setImage(null);
                        setImagePreview(null);
                        setSubject('');
                        setChapter('');
                        setMistakeType('');
                        setNotes('');
                        setAiResult(null);
                    }} className="w-full">
                      Add Another
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
