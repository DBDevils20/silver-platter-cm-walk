import { useEffect, useRef, useState } from 'react';
import { parseMeasurement } from '../utils/measureParse';

interface MeasureInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Numeric feet input that accepts pasted measurements from the phone's
 * Measure app (8' 4", 96", 2.54 m, …) and converts them to decimal feet,
 * briefly showing what was converted.
 */
export function MeasureInput({ value, onChange }: MeasureInputProps) {
  const [converted, setConverted] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function applyParse(text: string): boolean {
    const parsed = parseMeasurement(text);
    if (!parsed) return false;
    onChange(String(parsed.feet));
    setConverted(`${parsed.from.toUpperCase()} → ${parsed.feet} FT`);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setConverted(null), 4000);
    return true;
  }

  return (
    <div>
      <input
        className="input tnum"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => void applyParse(e.target.value)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          if (parseMeasurement(text)) {
            e.preventDefault();
            applyParse(text);
          }
        }}
      />
      {converted && <span className="chip chip-info mt-1.5 inline-block">{converted}</span>}
    </div>
  );
}
