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
  Target
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logOut } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
    </div>
  );

  const navItems = [
    { label: 'Overview', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { label: 'Notebook', icon: <BookOpen size={20} />, href: '/notebook' },
    { label: 'Reattempt', icon: <Target size={20} />, href: '/reattempt' },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-50">
      {/* Mobile Header */}
      <header className="fixed top-0 z-40 flex w-full items-center justify-between border-b border-white/5 bg-neutral-950/80 px-6 py-4 backdrop-blur-md lg:hidden">
        <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          NEET AI
        </span>
        <button onClick={() => setSidebarOpen(true)} className="text-neutral-400">
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar / Mobile Nav */}
      <AnimatePresence>
        {(isSidebarOpen || true) && (
          <motion.aside 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/5 bg-neutral-950 px-6 py-8 transition-transform lg:static lg:translate-x-0 ${isSidebarOpen ? 'block' : 'hidden lg:block'}`}
          >
            <div className="flex items-center justify-between mb-10">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                NEET Error AI
              </span>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-neutral-400">
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-neutral-400 transition-all hover:bg-white/5 hover:text-white"
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-8 left-6 right-6 space-y-4">
              <Link 
                href="/add-mistake"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-lg shadow-purple-500/20"
              >
                <PlusCircle size={18} />
                Add Mistake
              </Link>

              <button 
                onClick={logOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-neutral-500 transition-all hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 px-6 py-8 lg:px-12 lg:py-12 mt-16 lg:mt-0 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
