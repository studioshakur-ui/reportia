import type { DayCapoPlan, TeamMember } from "../../types";

/**
 * Génère le message WhatsApp (FR/IT) pour un plan de jour + capo.
 */
export function buildMessage(
  dateKey: string,
  taskName: string,
  plan: DayCapoPlan,
  lang: "fr" | "it" = "fr"
): string {
  const T = (fr: string, it: string) => (lang === "fr" ? fr : it);
  const lines: string[] = [];

  lines.push(T(`Rapport ${dateKey}`, `Rapporto ${dateKey}`));
  lines.push(T(`Tâche: ${taskName || "-"}`, `Attività: ${taskName || "-"}`));
  lines.push(T(`Impianto: ${plan.impianto || "-"}`, `Impianto: ${plan.impianto || "-"}`));
  lines.push("");

  lines.push(T("Équipe & activités:", "Squadra & attività:"));

  const team: TeamMember[] = [...(plan.team || [])];
  if (plan.includeCapo && plan.capoName) {
    team.unshift({ id: "capo", name: plan.capoName, hours: 8, activity: taskName, qty: 0 });
  }

  let tot = 0;
  for (const p of team) {
    const h = Number(p.hours) || 0;
    tot += h;
    const parts = [`- ${p.name}: ${h}h`];
    if (p.activity) parts.push(`— ${p.activity}`);
    if (p.qty) parts.push(`— ${p.qty}pz`);
    lines.push(parts.join(" "));
  }

  lines.push("");
  lines.push(T(`Total heures: ${tot}h`, `Ore totali: ${tot}h`));
  return lines.join("\n");
}
