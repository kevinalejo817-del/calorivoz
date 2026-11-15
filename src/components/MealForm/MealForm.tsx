import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, Mic, Play, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useSpeech } from '../../hooks/useSpeech';
import { MEAL_TYPES, type MealSource, type MealType } from '../../types';

const MEAL_ICONS: Record<MealType, string> = { Desayuno: '☀️', Almuerzo: '🍽️', Cena: '🌙', Snack: '🍎' };

const EXAMPLES: { text: string; meal: MealType; icon: string }[] = [
  { text: 'Pechuga a la plancha con arroz y ensalada', meal: 'Almuerzo', icon: '🥗' },
  { text: 'Avena con plátano y nueces', meal: 'Desayuno', icon: '🥣' },
  { text: '2 tacos al pastor y un agua de jamaica', meal: 'Cena', icon: '🌮' },
];

// Simulador de dictado para entornos donde el micrófono está bloqueado.
const VOICE_SIMULATION_SAMPLES: { meal: MealType; text: string }[] = [
  { meal: 'Almuerzo', text: 'Salmón a la plancha con puré de papa y espárragos salteados' },
  { meal: 'Desayuno', text: 'Dos panqueques de avena con fresas frescas y un café americano' },
  { meal: 'Snack', text: 'Un yogurt griego natural con un puñado de almendras y miel' },
  { meal: 'Cena', text: 'Ensalada César con pollo a la parrilla y una limonada sin azúcar' },
];

interface SubmitPayload {
  description: string;
  mealType: MealType;
  source: MealSource;
}

interface Props {
  mealType: MealType;
  onMealTypeChange: (t: MealType) => void;
  analyzing: boolean;
  /** Devuelve true si la comida se guardó (para limpiar el campo). */
  onSubmit: (p: SubmitPayload) => Promise<boolean>;
}

export default function MealForm({ mealType, onMealTypeChange, analyzing, onSubmit }: Props) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [simulating, setSimulating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Refs para evitar valores obsoletos dentro de temporizadores y callbacks de voz.
  const textRef = useRef(text);
  textRef.current = text;
  const mealTypeRef = useRef(mealType);
  mealTypeRef.current = mealType;
  const analyzingRef = useRef(analyzing);
  analyzingRef.current = analyzing;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simIndex = useRef(0);

  const run = useCallback(async (description: string, type: MealType, source: MealSource) => {
    const ok = await onSubmitRef.current({ description, mealType: type, source });
    if (ok) setText('');
  }, []);

  const speech = useSpeech({
    lang: 'es-ES',
    onTranscript: setText,
    onEnd: (finalText) => {
      if (finalText.trim().length < 3 || analyzingRef.current) return;
      if (autoTimer.current) clearTimeout(autoTimer.current);
      autoTimer.current = setTimeout(() => {
        const current = textRef.current.trim();
        if (current.length >= 3 && !analyzingRef.current) void run(current, mealTypeRef.current, 'voice');
      }, 650);
    },
    onNoSpeech: () => toast.show('No detectamos voz. Intenta acercarte al micrófono o usa un ejemplo.', 'warning'),
  });

  useEffect(
    () => () => {
      if (simTimer.current) clearInterval(simTimer.current);
      if (autoTimer.current) clearTimeout(autoTimer.current);
    },
    [],
  );

  const listening = speech.listening || simulating;

  const stopSimulation = () => {
    if (simTimer.current) clearInterval(simTimer.current);
    simTimer.current = null;
    setSimulating(false);
  };

  const handleMic = () => {
    if (analyzing) return;
    if (listening) {
      stopSimulation();
      speech.stop();
      return;
    }
    if (!speech.supported) {
      speech.setNotice('El reconocimiento de voz nativo no está disponible en este navegador.');
      return;
    }
    speech.start();
  };

  const runSimulation = () => {
    if (listening || analyzing) return;
    const sample = VOICE_SIMULATION_SAMPLES[simIndex.current % VOICE_SIMULATION_SAMPLES.length];
    simIndex.current += 1;
    onMealTypeChange(sample.meal);
    setText('');
    setSimulating(true);

    const words = sample.text.split(' ');
    let i = 0;
    let acc = '';
    simTimer.current = setInterval(() => {
      if (i < words.length) {
        acc = (acc + ' ' + words[i]).trim();
        setText(acc);
        i += 1;
      } else {
        stopSimulation();
        autoTimer.current = setTimeout(() => void run(sample.text, sample.meal, 'voice_simulated'), 450);
      }
    }, 220);
  };

  const handleCalculate = () => {
    const description = text.trim();
    if (!description) {
      toast.show('Escribe o dicta qué comiste antes de calcular.', 'warning');
      textareaRef.current?.focus();
      return;
    }
    void run(description, mealType, 'text');
  };

  const handleExample = (ex: (typeof EXAMPLES)[number]) => {
    if (analyzing) return;
    onMealTypeChange(ex.meal);
    setText(ex.text);
    void run(ex.text, ex.meal, 'quick_example');
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-900">Registrar Comida</h1>
          <p className="text-sm text-slate-500">Dicta con tu voz o escribe lo que comiste con naturalidad</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Momento del día</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="group" aria-label="Momento del día">
          {MEAL_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onMealTypeChange(t)}
              aria-pressed={mealType === t}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                mealType === t
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{MEAL_ICONS[t]}</span> {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-b from-emerald-50/70 to-slate-50/70 border border-emerald-100/90 p-5 mb-5 flex flex-col items-center text-center">
        <div className="relative flex items-center justify-center my-2">
          {listening && (
            <>
              <span className="absolute w-16 h-16 rounded-full bg-emerald-400/40 mic-wave-1 pointer-events-none" />
              <span className="absolute w-16 h-16 rounded-full bg-emerald-500/30 mic-wave-2 pointer-events-none" />
            </>
          )}
          <button
            type="button"
            onClick={handleMic}
            disabled={analyzing}
            aria-label="Hablar comida"
            aria-pressed={listening}
            className={`relative z-10 w-16 h-16 rounded-full active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed ${
              listening ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Mic className="w-7 h-7" strokeWidth={2.2} />
          </button>
        </div>

        {listening && (
          <div className="flex items-center justify-center gap-1 h-6 mt-1">
            <span className="w-1 bg-emerald-500 rounded-full eq-bar-1" />
            <span className="w-1 bg-emerald-600 rounded-full eq-bar-2" />
            <span className="w-1 bg-emerald-500 rounded-full eq-bar-3" />
            <span className="w-1 bg-emerald-600 rounded-full eq-bar-4" />
          </div>
        )}

        <p className={`font-display font-bold text-sm mt-2 ${listening ? 'text-rose-700' : 'text-emerald-900'}`}>
          {listening ? 'Escuchando tu comida...' : 'Hablar comida'}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 max-w-md">
          {listening
            ? 'Habla con claridad (ej. "Dos huevos revueltos y un jugo de naranja")'
            : 'Pulsa el micrófono y di lo que comiste; lo transcribiremos y calcularemos automáticamente.'}
        </p>

        {speech.notice && !listening && (
          <div className="mt-4 w-full text-left rounded-xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <CircleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <p className="font-semibold text-amber-950">{speech.notice}</p>
                <p className="text-amber-800 mt-0.5">
                  Puedes escribir tu comida abajo o probar nuestro simulador de dictado por voz en vivo:
                </p>
                <button
                  type="button"
                  onClick={runSimulation}
                  disabled={analyzing}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" strokeWidth={2.2} />
                  Simular dictado por voz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="mealInput" className="sr-only">Descripción de tu comida</label>
          <textarea
            id="mealInput"
            ref={textareaRef}
            rows={3}
            maxLength={600}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCalculate();
              }
            }}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white px-4 py-3.5 pr-10 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 transition-all resize-none"
            placeholder="Describe tu comida, ej: '2 huevos revueltos, 1 tostada con aguacate y un café con leche'"
          />
          {text.trim().length > 0 && (
            <button
              type="button"
              title="Limpiar texto"
              onClick={() => {
                setText('');
                textareaRef.current?.focus();
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Prueba con un ejemplo rápido:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.text}
                type="button"
                onClick={() => handleExample(ex)}
                disabled={analyzing}
                className="text-left text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200/70 hover:border-emerald-200 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {ex.icon} {ex.text}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={analyzing}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-display font-bold text-base shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {analyzing ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <path d="m19 9-7 7-7-7" />
              </svg>
            )}
            <span>{analyzing ? 'Analizando nutrientes con IA...' : 'Calcular Calorías'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
