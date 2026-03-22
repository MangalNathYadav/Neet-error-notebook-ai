'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthContext';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Flame,
  Calendar
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUserStats } from '@/lib/firebase/database';
import { useStreak } from '@/lib/hooks/useStreak';
import { ref, query, orderByChild, endAt, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const streak = useStreak(user?.uid);
  const [reattemptsDue, setReattemptsDue] = useState(0);

  useEffect(() => {
    if (user) {
      getUserStats(user.uid).then(setStats);
      
      const fetchReattempts = async () => {
        const now = Date.now();
        const mistakesRef = ref(rtdb, 'mistakes');
        const q = query(
          mistakesRef,
          orderByChild('nextReattemptAt'),
          endAt(now)
        );
        const snap = await get(q);
        if (snap.exists()) {
          const data = snap.val();
          const count = Object.values(data).filter((m: any) => m.userId === user.uid).length;
          setReattemptsDue(count);
        } else {
          setReattemptsDue(0);
        }
      };
      fetchReattempts();
    }
  }, [user]);

  return (
    <DashboardLayout>
      <header className="mb-10">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-neutral-600 dark:text-neutral-500"
        >
          Welcome back,
        </motion.p>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-neutral-900 dark:text-white mt-1"
        >
          {user?.displayName || 'Student'}
        </motion.h1>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Mistakes" 
          value={stats?.total || 0} 
          icon={<AlertTriangle className="text-yellow-500" />}
          delay={0}
        />
        <StatCard 
          title="Daily Streak" 
          value={`${streak} days`} 
          icon={<Flame className="text-orange-500" />}
          delay={0.1}
        />
        <StatCard 
          title="Subjects Tracked" 
          value={Object.keys(stats?.subjectWise || {}).length} 
          icon={<CheckCircle2 className="text-green-500" />}
          delay={0.2}
        />
        <StatCard 
          title="Reattempts Due" 
          value={reattemptsDue} 
          icon={<TrendingUp className="text-blue-500" />}
          delay={0.3}
        />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Placeholder for Weak Chapters */}
        <div className="rounded-3xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm dark:shadow-none p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold flex items-center gap-3 mb-6 text-neutral-900 dark:text-white">
            <TrendingUp size={20} className="text-purple-500 dark:text-purple-400" />
            Weak Chapters
          </h2>
          <div className="space-y-4">
            {stats?.weakChapters?.length > 0 ? (
              stats.weakChapters.map((ch: any) => (
                <div key={ch.chapter} className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-white/5">
                  <span className="text-neutral-700 dark:text-neutral-300">{ch.chapter}</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{ch.count} errors</span>
                </div>
              ))
            ) : (
              <p className="text-neutral-500 italic">No errors logged yet.</p>
            )}
          </div>
        </div>

        {/* Placeholder for Heatmap */}
        <div className="rounded-3xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm dark:shadow-none p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold flex items-center gap-3 mb-6 text-neutral-900 dark:text-white">
            <Calendar size={20} className="text-blue-500 dark:text-blue-400" />
            Activity Heatmap
          </h2>
          <div className="h-48 rounded-2xl bg-neutral-50 dark:bg-white/5 flex items-center justify-center border border-dashed border-neutral-300 dark:border-white/10">
             <p className="text-neutral-500 text-sm italic">Coming Soon...</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon, delay }: { title: string, value: string | number, icon: React.ReactNode, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-3xl border border-neutral-200 dark:border-white/5 bg-white dark:bg-white/5 p-6 shadow-sm dark:shadow-none backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
    </motion.div>
  );
}
