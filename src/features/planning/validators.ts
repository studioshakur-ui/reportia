import { DayPlanSchema } from "../../schemas";

export function validateBeforeSave(plan: any): { ok: boolean; errors?: string[] } {
  const parsed = DayPlanSchema.safeParse(plan);
  if (parsed.success) return { ok: true };
  const errs = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`);
  return { ok:false, errors: errs };
}
