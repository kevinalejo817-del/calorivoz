import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_GOAL, fetchDailyGoal, updateDailyGoal } from '../services/supabase/profile';

export function useProfile(userId: string, email: string | undefined) {
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchDailyGoal(userId, email)
      .then((g) => active && (setGoal(g), setError(null)))
      .catch((e) => active && setError(e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId, email]);

  const saveGoal = useCallback(
    async (next: number) => {
      const saved = await updateDailyGoal(userId, next);
      setGoal(saved);
    },
    [userId],
  );

  return { goal, loading, error, saveGoal };
}
