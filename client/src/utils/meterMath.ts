export type ThresholdState = "above" | "equal" | "below";

export interface ThresholdMeterGeometry {
  valuePercent: number;
  thresholdPercent: number;
  basePercent: number;
  excessStartPercent: number;
  excessPercent: number;
  state: ThresholdState;
  valueClamped: boolean;
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export function meterPercent(value: number, minimum: number, maximum: number): number {
  const safeMinimum = finiteOr(minimum, 0);
  const safeMaximum = finiteOr(maximum, safeMinimum);
  if (safeMaximum <= safeMinimum) return 0;

  const safeValue = finiteOr(value, safeMinimum);
  const clamped = Math.min(safeMaximum, Math.max(safeMinimum, safeValue));
  return ((clamped - safeMinimum) / (safeMaximum - safeMinimum)) * 100;
}

export function thresholdState(value: number, threshold: number, tolerance = 0): ThresholdState {
  const safeTolerance = Math.max(0, finiteOr(tolerance, 0));
  if (value > threshold + safeTolerance) return "above";
  if (value < threshold - safeTolerance) return "below";
  return "equal";
}

export function thresholdMeterGeometry(
  value: number,
  threshold: number,
  minimum: number,
  maximum: number,
  tolerance = 0,
): ThresholdMeterGeometry {
  const safeValue = finiteOr(value, minimum);
  const safeThreshold = finiteOr(threshold, minimum);
  const valuePercent = meterPercent(safeValue, minimum, maximum);
  const thresholdPercent = meterPercent(safeThreshold, minimum, maximum);
  const state = thresholdState(safeValue, safeThreshold, tolerance);
  const basePercent = state === "above" ? thresholdPercent : valuePercent;

  return {
    valuePercent,
    thresholdPercent,
    basePercent,
    excessStartPercent: thresholdPercent,
    excessPercent: state === "above" ? Math.max(0, valuePercent - thresholdPercent) : 0,
    state,
    valueClamped: safeValue < minimum || safeValue > maximum,
  };
}

export function thresholdScaleMaximum(
  value: number,
  threshold: number,
  minimum = 0,
  step = 1,
  headroom = 1.2,
): number {
  const safeMinimum = finiteOr(minimum, 0);
  const safeStep = finiteOr(step, 1) > 0 ? step : 1;
  const safeHeadroom = finiteOr(headroom, 1.2) >= 1 ? headroom : 1;
  const peak = Math.max(safeMinimum, finiteOr(value, safeMinimum), finiteOr(threshold, safeMinimum));
  const span = peak - safeMinimum;
  if (span <= 0) return safeMinimum + safeStep;

  const steps = Math.max(1, Math.ceil((span * safeHeadroom) / safeStep));
  const precision = Math.max(0, Math.ceil(-Math.log10(safeStep)) + 2);
  return Number((safeMinimum + steps * safeStep).toFixed(precision));
}
