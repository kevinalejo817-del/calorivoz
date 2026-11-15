import { useEffect, useState } from 'react';
import { startOfLocalDay } from '../utils/date';

/** Fecha local de hoy; se actualiza sola al pasar la medianoche. */
export function useToday(): Date {
  const [today, setToday] = useState(() => startOfLocalDay(new Date()));
  useEffect(() => {
    const id = setInterval(() => {
      const now = startOfLocalDay(new Date());
      setToday((prev) => (prev.getTime() === now.getTime() ? prev : now));
    }, 30_000);
    return () => clearInterval(id);
  }, []);
  return today;
}
