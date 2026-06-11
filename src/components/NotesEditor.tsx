import { useEffect, useRef, useState } from 'react';

interface SpeechResultAlternative {
  transcript: string;
}

interface SpeechResultItem {
  isFinal: boolean;
  0: SpeechResultAlternative;
}

interface SpeechResultEvent {
  results: ArrayLike<SpeechResultItem>;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function NotesEditor({ value, onChange, placeholder = 'FIELD NOTES', minHeight = 64 }: NotesEditorProps) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const baseTextRef = useRef('');
  const supported = getRecognitionCtor() !== null;

  useEffect(() => {
    return () => {
      recRef.current?.stop();
    };
  }, []);

  function toggleDictation() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = navigator.language || 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    baseTextRef.current = value.trim().length > 0 ? value.replace(/\s+$/, '') + ' ' : '';
    rec.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onChange(baseTextRef.current + transcript);
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };
    rec.onerror = () => {
      recRef.current = null;
      setListening(false);
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <div className="space-y-2">
      <textarea
        className="input"
        style={{ minHeight }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {supported && (
        <button
          type="button"
          className={`item-action ${listening ? 'is-listening' : ''}`}
          onClick={toggleDictation}
        >
          <span>●</span>
          {listening ? 'Listening · Tap to Stop' : 'Dictate'}
        </button>
      )}
    </div>
  );
}
