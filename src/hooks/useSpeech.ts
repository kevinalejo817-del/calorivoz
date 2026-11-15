import { useCallback, useEffect, useRef, useState } from 'react';

interface Options {
  lang?: string;
  /** Texto reconocido (parcial o final) mientras se habla. */
  onTranscript: (text: string) => void;
  /** Al terminar la escucha; recibe el texto final reconocido ('' si no hubo). */
  onEnd: (text: string) => void;
  onNoSpeech?: () => void;
}

function getCtor() {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

/** Reconocimiento de voz con Web Speech API (es-ES por defecto). */
export function useSpeech(options: Options) {
  const optsRef = useRef(options);
  optsRef.current = options;

  const supported = Boolean(getCtor());
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState<string | null>(
    supported ? null : 'Tu navegador actual no soporta la API nativa de reconocimiento de voz.',
  );
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ya detenido */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setNotice('El reconocimiento de voz nativo no está disponible en este navegador.');
      return;
    }
    const rec = new Ctor();
    rec.lang = optsRef.current.lang ?? 'es-ES';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalTranscript = '';
    let latest = '';

    rec.onstart = () => {
      finalTranscript = '';
      latest = '';
      setNotice(null);
      setListening(true);
    };

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t;
        else interim += t;
      }
      const current = (finalTranscript || interim).trim();
      if (current) {
        latest = current;
        optsRef.current.onTranscript(current);
      }
    };

    rec.onerror = (event) => {
      setListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setNotice('El permiso del micrófono fue bloqueado por el navegador o el entorno de vista previa.');
      } else if (event.error === 'no-speech') {
        optsRef.current.onNoSpeech?.();
      } else if (event.error !== 'aborted') {
        setNotice('No se pudo conectar con el servicio de voz en este entorno.');
      }
    };

    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      optsRef.current.onEnd(latest);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setListening(false);
      setNotice('No se pudo activar el micrófono en este entorno.');
    }
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported, listening, notice, setNotice, start, stop };
}
