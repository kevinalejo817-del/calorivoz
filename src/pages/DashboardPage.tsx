import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../components/Header/Header';
import DailySummary from '../components/Dashboard/DailySummary';
import MealForm from '../components/MealForm/MealForm';
import MealHistory from '../components/MealHistory/MealHistory';
import GoalModal from '../components/GoalModal/GoalModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useMeals } from '../hooks/useMeals';
import { useProfile } from '../hooks/useProfile';
import { useToday } from '../hooks/useToday';
import { analyzeMeal } from '../services/nutrition/analyze';
import type { MealSource, MealType } from '../types';
import { addDays, consumedAtFor, isSameLocalDay } from '../utils/date';
import { friendlyError, isSessionExpired } from '../utils/errors';
import { fmt, sumItems } from '../utils/macros';

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  const today = useToday();

  const [picked, setPicked] = useState<Date | null>(null); // null = seguir "hoy"
  const day = picked ?? today;
  const isToday = isSameLocalDay(day, today);

  const userId = user!.id;
  const profile = useProfile(userId, user!.email);
  const meals = useMeals(userId, day);

  const [mealType, setMealType] = useState<MealType>('Desayuno');
  const [analyzing, setAnalyzing] = useState(false);
  const lock = useRef(false); // evita registros duplicados por doble clic
  const [goalOpen, setGoalOpen] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  const handleError = useCallback(
    (err: unknown, fallback: string) => {
      if (isSessionExpired(err)) {
        toast.show('Tu sesión expiró. Inicia sesión de nuevo.', 'warning');
        void signOut();
        return;
      }
      toast.show(friendlyError(err, fallback), 'error');
    },
    [toast, signOut],
  );

  // Errores de carga: avisar una vez por error.
  const reportedLoad = useRef<unknown>(null);
  useEffect(() => {
    if (meals.loadError && reportedLoad.current !== meals.loadError) {
      reportedLoad.current = meals.loadError;
      handleError(meals.loadError, 'No se pudieron cargar tus comidas.');
    }
  }, [meals.loadError, handleError]);
  useEffect(() => {
    if (profile.error) handleError(profile.error, 'No se pudo cargar tu meta diaria.');
  }, [profile.error, handleError]);

  const handleSubmit = async (p: { description: string; mealType: MealType; source: MealSource }) => {
    if (lock.current) return false;
    lock.current = true;
    setAnalyzing(true);
    try {
      const outcome = await analyzeMeal(p.description, p.mealType);
      await meals.addMeal({
        mealType: p.mealType,
        description: p.description,
        source: p.source,
        engine: outcome.engine,
        tip: outcome.result.tip,
        consumedAt: consumedAtFor(day),
        items: outcome.result.items,
      });
      const kcal = Math.round(sumItems(outcome.result.items).calories);
      toast.show(`¡${p.mealType} registrado! (+${fmt(kcal)} kcal)`, 'success');
      if (outcome.engine === 'fallback') {
        toast.show(
          `${outcome.fallbackReason ?? 'Gemini no está disponible.'} Se usó el motor de respaldo: es una estimación aproximada.`,
          'warning',
        );
      }
      return true;
    } catch (err) {
      handleError(err, 'No se pudo guardar la comida. Inténtalo de nuevo.');
      return false;
    } finally {
      lock.current = false;
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await meals.removeMeal(id);
      toast.show('Registro eliminado', 'info');
    } catch (err) {
      handleError(err, 'No se pudo eliminar el registro.');
    }
  };

  const handleClearDay = async () => {
    try {
      await meals.clearDay();
      toast.show(isToday ? 'Historial del día limpiado' : 'Historial del día limpiado', 'info');
    } catch (err) {
      handleError(err, 'No se pudo limpiar el historial.');
    }
  };

  const handleSaveGoal = async (goal: number) => {
    setSavingGoal(true);
    try {
      await profile.saveGoal(goal);
      setGoalOpen(false);
      toast.show(`Meta diaria actualizada a ${fmt(goal)} kcal`, 'success');
    } catch (err) {
      handleError(err, 'No se pudo guardar la meta.');
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <>
      <Header
        today={today}
        goal={profile.goal}
        userEmail={user?.email}
        onOpenGoal={() => setGoalOpen(true)}
        onSignOut={() => void signOut()}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <section className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <DailySummary goal={profile.goal} totals={meals.totals} isToday={isToday} />
          </section>

          <div className="lg:col-span-7 space-y-6">
            <MealForm
              mealType={mealType}
              onMealTypeChange={setMealType}
              analyzing={analyzing}
              onSubmit={handleSubmit}
            />
            <MealHistory
              meals={meals.meals}
              loading={meals.loading}
              hasError={Boolean(meals.loadError)}
              onRetry={() => void meals.reload()}
              isToday={isToday}
              day={day}
              canGoNext={!isToday}
              onPrevDay={() => setPicked(addDays(day, -1))}
              onNextDay={() => {
                const next = addDays(day, 1);
                setPicked(isSameLocalDay(next, today) ? null : next);
              }}
              onGoToday={() => setPicked(null)}
              busyIds={meals.busyIds}
              clearing={meals.clearing}
              onDelete={(id) => void handleDelete(id)}
              onClearDay={handleClearDay}
            />
          </div>
        </div>
      </main>

      <GoalModal
        open={goalOpen}
        currentGoal={profile.goal}
        saving={savingGoal}
        onClose={() => setGoalOpen(false)}
        onSave={handleSaveGoal}
      />
    </>
  );
}
