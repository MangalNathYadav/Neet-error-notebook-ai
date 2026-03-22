'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Code2, Sparkles, UserCircle } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  // Prevent scrolling on body when modal is open
  if (typeof document !== 'undefined') {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-2xl"
          >
            <div className="relative h-28 bg-gradient-to-br from-purple-600 to-blue-600">
              <button 
                onClick={onClose}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-colors hover:bg-black/40"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="px-6 pb-8 pt-4 relative">
              <div className="absolute -top-12 left-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-white dark:bg-neutral-900 p-1.5 shadow-xl border border-neutral-100 dark:border-neutral-800">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 text-purple-600 dark:text-purple-400">
                  <Code2 size={28} />
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white">NEET Error AI</h2>
                  <Sparkles size={16} className="text-amber-500" />
                </div>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  A radically simple, uniquely themed error-correcting notebook designed exclusively to help medical aspirants master NCERT concepts efficiently.
                </p>

                <div className="my-5 h-px w-full bg-neutral-200 dark:bg-white/10" />

                <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">Developer Information</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-white/5 p-3 px-4 border border-neutral-200 dark:border-white/5 shadow-sm dark:shadow-none">
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Creator</span>
                    <span className="font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 text-sm">
                       <UserCircle size={16} className="text-purple-500" />
                       shadowXg
                    </span>
                  </div>
                  
                  <a 
                    href="https://github.com/MangalNathYadav" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl bg-neutral-50 dark:bg-white/5 p-3 px-4 transition-all hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:border-purple-200 dark:hover:border-purple-500/30 border border-neutral-200 dark:border-white/5 group shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 group-hover:text-purple-600 dark:group-hover:text-purple-300">
                      <Github size={18} />
                      GitHub Profile
                    </div>
                    <span className="font-bold text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 text-sm">
                      MangalNathYadav
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
