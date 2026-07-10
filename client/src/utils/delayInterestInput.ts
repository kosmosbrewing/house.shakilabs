import { z } from "zod";

const annualRatePercentSchema = z.coerce.number().finite().min(1).max(30);
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month! - 1
    && date.getUTCDate() === day;
});

export function parseAnnualRatePercent(value: unknown): number | null {
  const parsed = annualRatePercentSchema.safeParse(value);
  return parsed.success ? parsed.data / 100 : null;
}

export function calculateInclusiveOverdueDays(startInput: unknown, endInput: unknown): number | null {
  const start = isoDateSchema.safeParse(startInput);
  const end = isoDateSchema.safeParse(endInput);
  if (!start.success || !end.success) return null;

  const startTime = Date.parse(`${start.data}T00:00:00Z`);
  const endTime = Date.parse(`${end.data}T00:00:00Z`);
  const days = Math.floor((endTime - startTime) / 86_400_000) + 1;
  return days >= 1 && days <= 730 ? days : null;
}
