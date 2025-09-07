import { z } from "zod";

export const TeamMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hours: z.number().min(0).max(24),
  activity: z.string().optional(),
  qty: z.number().min(0).optional(),
});

export const DayPlanSchema = z.object({
  taskId: z.string().min(1),
  impianto: z.string().min(1),
  capoName: z.string().min(1),
  includeCapo: z.boolean(),
  team: z.array(TeamMemberSchema),
  closed: z.boolean().optional(),
  updatedAt: z.number().optional(),
});

export type DayPlanInput = z.infer<typeof DayPlanSchema>;
