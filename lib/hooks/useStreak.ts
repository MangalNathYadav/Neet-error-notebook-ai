'use client';

import { useEffect, useState } from 'react';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { rtdb } from '@/lib/firebase/config';

export function useStreak(userId: string | undefined) {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const updateStreak = async () => {
      const streakRef = ref(rtdb, `streaks/${userId}`);
      const snap = await get(streakRef);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      if (snap.exists()) {
        const data = snap.val();
        const lastActiveDate = new Date(data.lastActive);
        const lastActive = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate()).getTime();
        
        const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day
          const newStreak = (data.count || 0) + 1;
          await set(streakRef, { count: newStreak, lastActive: Date.now() });
          setStreak(newStreak);
        } else if (diffDays > 1) {
          // Lost streak
          await set(streakRef, { count: 1, lastActive: Date.now() });
          setStreak(1);
        } else {
          // Same day
          setStreak(data.count || 0);
        }
      } else {
        // First time
        await set(streakRef, { count: 1, lastActive: Date.now() });
        setStreak(1);
      }
    };

    updateStreak();
  }, [userId]);

  return streak;
}
