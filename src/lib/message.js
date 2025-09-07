// src/lib/message.js
export default function buildMessage({
  dateKey,
  taskLabel,
  impiantoId,
  capoName,
  rows,          // [{ id, group, activityId, hours, qty }]
  activities,    // catalogue activités
  workers,       // pour retrouver les noms
  lang = "fr",
}) {
  const T = (fr, it) => (lang === "it" ? it : fr);
  const byAct = Object.fromEntries((activities||[]).map(a => [a.id, a]));
  const byId  = Object.fromEntries((workers||[]).map(w => [w.id, w]));

  const lines = [];
  lines.push(T(`Rapport ${dateKey}`, `Rapporto ${dateKey}`));
  lines.push(T(`Tâche: ${taskLabel}`, `Attività: ${taskLabel}`));
  lines.push(T(`Impianto: ${impiantoId}`, `Impianto: ${impiantoId}`));
  if (capoName) lines.push(T(`Capo Squadra: ${capoName}`, `Capo Squadra: ${capoName}`));

  lines.push("");
  lines.push(T("Équipe & activités:", "Squadra & attività:"));

  let tot = 0;
  for (const r of rows || []) {
    const name = byId[r.id]?.name || r.id;
    const h = Number(r.hours) || 0;
    tot += h;
    const act = byAct[r.activityId];
    const parts = [`- ${name}: ${h}h`];
    if (act?.label) parts.push(`• ${act.label}`);
    if (r.qty) {
      const unit = act?.unit || "";
      parts.push(`• ${r.qty}${unit ? " " + unit : ""}`);
    }
    if (r.group) parts.push(T(`(Groupe ${r.group})`, `(Gruppo ${r.group})`));
    lines.push(parts.join("  "));
  }

  lines.push("");
  lines.push(T(`Total heures: ${tot}h`, `Ore totali: ${tot}h`));
  return lines.join("\n");
}
