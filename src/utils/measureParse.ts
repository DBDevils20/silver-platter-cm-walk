export interface ParsedMeasurement {
  /** Converted value in decimal feet, rounded to 2 places. */
  feet: number;
  /** The original text the conversion came from, for display. */
  from: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Parse a measurement string as produced by the iPhone/Android Measure apps
 * (clipboard copy) or typed by hand, converting to decimal feet.
 *
 * Returns null for plain numbers (already feet — leave untouched) and for
 * anything unrecognized.
 */
export function parseMeasurement(raw: string): ParsedMeasurement | null {
  const from = raw.trim();
  // Normalize curly quotes and unicode prime marks (the Measure app copies 8′ 4″).
  const s = from
    .toLowerCase()
    .replace(/[‘’′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/,/g, '.');
  if (!s) return null;

  // Plain number: already decimal feet, no conversion needed.
  if (/^\d+(\.\d+)?$/.test(s)) return null;

  // Feet, optionally with inches: 8' / 8' 4" / 8'4" / 8 ft 4 in / 8 feet 4 inches
  let m = /^(\d+(?:\.\d+)?)\s*(?:'|ft\.?|feet)\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in\.?|inches)?)?$/.exec(s);
  if (m) {
    const feet = parseFloat(m[1]) + (m[2] ? parseFloat(m[2]) / 12 : 0);
    return { feet: round2(feet), from };
  }

  // Inches only: 96" / 96 in / 96 inches
  m = /^(\d+(?:\.\d+)?)\s*(?:"|in\.?|inches)$/.exec(s);
  if (m) return { feet: round2(parseFloat(m[1]) / 12), from };

  // Metric: meters / centimeters / millimeters
  m = /^(\d+(?:\.\d+)?)\s*(m|meters?|metres?)$/.exec(s);
  if (m) return { feet: round2(parseFloat(m[1]) * 3.28084), from };
  m = /^(\d+(?:\.\d+)?)\s*(cm|centimeters?|centimetres?)$/.exec(s);
  if (m) return { feet: round2(parseFloat(m[1]) * 0.0328084), from };
  m = /^(\d+(?:\.\d+)?)\s*(mm|millimeters?|millimetres?)$/.exec(s);
  if (m) return { feet: round2(parseFloat(m[1]) * 0.00328084), from };

  return null;
}
