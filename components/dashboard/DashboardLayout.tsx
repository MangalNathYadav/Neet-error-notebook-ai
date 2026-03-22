'use client';

import { useAuth } from '@/components/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X,
  Target,
  CheckCircle2,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { AboutModal } from '@/components/ui/AboutModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logOut } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAboutModalOpen, setAboutModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
    </div>
  );

  const navItems = [
    { label: 'Overview', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { label: 'Notebook', icon: <BookOpen size={20} />, href: '/notebook' },
    { label: 'Reattempt', icon: <Target size={20} />, href: '/reattempt' },
    { label: 'Mastered', icon: <CheckCircle2 size={20} />, href: '/mastered' },
  ];

  const bottomNavItems = [
    { label: 'Overview', icon: <LayoutDashboard size={22} />, href: '/dashboard' },
    { label: 'Notebook', icon: <BookOpen size={22} />, href: '/notebook' },
    { label: 'Add', icon: <PlusCircle size={28} className="text-white" />, href: '/add-mistake', special: true },
    { label: 'Reattempt', icon: <Target size={22} />, href: '/reattempt' },
    { label: 'Mastered', icon: <CheckCircle2 size={22} />, href: '/mastered' },
  ];

  return (
    <div className="flex min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors">
      {/* Mobile Header */}
      <header className="fixed top-0 z-40 flex w-full items-center justify-between border-b border-neutral-200 dark:border-white/5 bg-white/80 dark:bg-neutral-950/80 px-6 py-4 backdrop-blur-md lg:hidden">
        <span className="text-lg font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
          NEET Error AI
        </span>
        <div className="flex items-center gap-4">
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="text-neutral-500 hover:text-purple-500 dark:text-neutral-400 dark:hover:text-purple-400 transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
          <button 
            onClick={() => setAboutModalOpen(true)}
            className="text-neutral-500 hover:text-purple-500 dark:text-neutral-400 dark:hover:text-purple-400 transition-colors"
          >
            <Info size={20} />
          </button>
          <button 
            onClick={logOut}
            className="text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Sidebar / Mobile Nav */}
      <AnimatePresence>
        {(isSidebarOpen || true) && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-neutral-200 dark:border-white/5 bg-white dark:bg-neutral-950 px-6 py-8 transition-transform lg:static lg:translate-x-0 ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                NEET Error AI
              </span>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-neutral-600 dark:text-neutral-400">
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-8 left-6 right-6 space-y-4">
              {mounted && (
                <button
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
                >
                  {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                  {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              )}

              <button 
                onClick={() => setAboutModalOpen(true)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 transition-all hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
              >
                <Info size={18} />
                About Developer
              </button>

              <Link 
                href="/add-mistake"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-lg shadow-purple-500/20"
              >
                <PlusCircle size={18} />
                Add Mistake
              </Link>

              <button 
                onClick={logOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-500 transition-all hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-neutral-200 dark:border-white/5 bg-white/90 dark:bg-neutral-950/95 pb-safe pt-2 px-2 pb-4 backdrop-blur-xl lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.2)]">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${
              item.special 
                ? '-mt-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 p-4 shadow-lg shadow-purple-500/30 text-white hover:scale-105 active:scale-95' 
                : 'text-neutral-500 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 active:scale-95 hover:bg-neutral-100/50 dark:hover:bg-white/5 rounded-2xl'
            }`}
          >
            {item.icon}
            {!item.special && <span className="text-[10px] font-medium tracking-wide">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-12 mt-16 mb-20 lg:mt-0 lg:mb-0 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setAboutModalOpen(false)} />
    </div>
  );
}
