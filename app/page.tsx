'use client';

import { useAuth } from '@/components/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Brain, LineChart, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white dark:bg-neutral-950 px-6 py-12 transition-colors">
      {/* Background Blobs */}
      <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-purple-600/10 dark:bg-purple-600/20 blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-blue-600/10 dark:bg-blue-600/20 blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center"
      >
        <div className="mb-6 flex justify-center">
          <div className="rounded-2xl bg-neutral-100 dark:bg-white/5 p-4 ring-1 ring-neutral-200 dark:ring-white/10 backdrop-blur-xl">
            <Brain className="h-12 w-12 text-purple-600 dark:text-purple-500" />
          </div>
        </div>
        
        <h1 className="bg-gradient-to-b from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl">
          NEET Error <br /> Notebook AI
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-neutral-600 dark:text-neutral-400">
          Transform your mistakes into mastery. AI-powered solution generation, 
          NCERT references, and smart tracking for NEET aspirants.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            onClick={signInWithGoogle}
            className="group relative flex items-center justify-center gap-3 rounded-full bg-neutral-900 dark:bg-white px-8 py-4 text-sm font-semibold text-white dark:text-black transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5 bg-white rounded-full p-0.5" />
            Continue with Google
            <Sparkles className="h-4 w-4 text-purple-400 dark:text-purple-600 transition-transform group-hover:scale-125" />
          </button>
          <p className="text-xs text-neutral-500">Secure. Isolated. Personal.</p>
        </div>
      </motion.div>

      {/* Feature Grid */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="mt-24 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:max-w-4xl"
      >
        <FeatureCard 
          icon={<BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-500" />}
          title="NCERT References"
          desc="Automatic paragraph-level references for Bio mistakes."
        />
        <FeatureCard 
          icon={<Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-500" />}
          title="AI Solutions"
          desc="Step-by-step logic & similar practice questions."
        />
        <FeatureCard 
          icon={<LineChart className="h-5 w-5 text-green-600 dark:text-green-500" />}
          title="Heatmap Tracking"
          desc="Visualize your consistency and progress over time."
        />
      </motion.div>

      {/* Developer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="mt-16 text-center text-sm text-neutral-500"
      >
        <p>
          Developed by <span className="text-purple-600 dark:text-purple-400 font-medium">shadowXg</span>
        </p>
        <p className="mt-1">
          GitHub: <a href="https://github.com/MangalNathYadav" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">MangalNathYadav</a>
        </p>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-white/5 bg-neutral-50 dark:bg-white/5 p-6 backdrop-blur-sm shadow-sm transition-colors">
      <div className="mb-4 flex items-center gap-3">
        {icon}
        <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{desc}</p>
    </div>
  );
}
