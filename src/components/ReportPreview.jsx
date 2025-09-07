import React, { useMemo } from "react";

function buildMessage(dateKey, tasks, v) {
  const task = tasks.find((t) => t.id === v.taskId);
  const lines = [];
  lines.push(`Rapport ${dateKey}`);
  lines.push(`Tâche: ${task?.name || "-"}`);
  lines.push(`Impianto: ${v.impianto || "-"}`);
  lines.push("");
  lines.push("Équipe & activités:");
  const team = [...(v.team || [])];
  if (v.includeCapo && v.capoName) {
    team.unshift({ id: "capo", name: v.capoName, hours: 8, activity: v.activity || task?.name });
  }
  let tot = 0;
  for (const p of team) {
    const h = p.hours ?? 0;
    tot += h;
    const parts = [`- ${p.name}: ${h}h`];
    if (p.activity) parts.push(`— ${p.activity}`);
    if (p.qty) parts.push(`— ${p.qty}pz`);
    lines.push(parts.join(" "));
  }
  lines.push("");
  lines.push(`Total heures: ${tot}h`);
  return lines.join("\n");
}

export default function ReportPreview({ dateKey, tasks, value, onSaveLocal, onCopy, onSend }) {
  const msg = useMemo(() => buildMessage(dateKey, tasks, value), [dateKey, tasks, value]);

  return (
    <>
      <div className="text-lg font-semibold mb-2">Aperçu du message</div>
      <pre className="bg-slate-50 rounded-xl p-4 text-sm whitespace-pre-wrap">{msg}</pre>

      <div className="mt-3 flex gap-2">
        <button onClick={onSaveLocal} className="btn btn-outline">Enregistrer (local)</button>
        <button onClick={() => onCopy(msg)} className="btn btn-outline">Copier le rapport (WhatsApp)</button>
        <button onClick={onSend} className="btn btn-primary">Envoyer</button>
      </div>
    </>
  );
}
