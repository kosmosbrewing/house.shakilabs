export interface SignedBarGeometry {
  start: number;
  width: number;
  zero: number;
}

export function signedBarGeometry(value: number, minimum: number, maximum: number): SignedBarGeometry {
  const domainMinimum = Math.min(0, Number.isFinite(minimum) ? minimum : 0);
  const domainMaximum = Math.max(0, Number.isFinite(maximum) ? maximum : 0);
  const span = domainMaximum - domainMinimum;
  if (!Number.isFinite(value) || span <= 0) return { start: 0, width: 0, zero: 0 };

  const zero = ((0 - domainMinimum) / span) * 100;
  const position = ((Math.min(domainMaximum, Math.max(domainMinimum, value)) - domainMinimum) / span) * 100;
  return { start: Math.min(zero, position), width: Math.abs(position - zero), zero };
}

export function normalizeSegments(values: readonly number[]): number[] {
  const safe = values.map((value) => Number.isFinite(value) && value > 0 ? value : 0);
  const total = safe.reduce((sum, value) => sum + value, 0);
  return total > 0 ? safe.map((value) => value / total) : safe;
}
