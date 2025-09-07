import type { TeamMember } from "../../types";

/**
 * Construit automatiquement une équipe en prenant les N premiers candidats.
 * - hours = 8 par défaut
 * - activity = defaultActivity
 * - qty = 0
 */
export function fillTeamByRefSize({
  refSize,
  candidates,
  defaultActivity,
}: {
  refSize: number;
  candidates: { id: string; name: string }[];
  defaultActivity: string;
}): TeamMember[] {
  const n = Math.max(0, Number(refSize) || 0);
  return candidates.slice(0, n).map((c) => ({
    id: c.id,
    name: c.name,
    hours: 8,
    activity: defaultActivity,
    qty: 0,
  }));
}
