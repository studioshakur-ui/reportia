import React, { useMemo, useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { CalendarDays, ChevronDown, Save, Check, Search } from "lucide-react";
import { fmtDate, addDays, isoDayKey } from "../../lib/time";
import { saveJSON, KEYS } from "../../lib/storage";
import { DAYS_ORDER } from "../../constants/defaults";
import { savePlanSnapshot } from "../../lib/supabase";

export default function ManagerPlanner({ weekStart, plan, setPlan, workers, tasks, impianti }) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const dayDate = useMemo(() => addDays(weekStart, selectedDayIdx), [weekStart, selectedDayIdx]);
  const dayKey  = isoDayKey(dayDate);

  const current = plan[dayKey] || { taskId: tasks[0]?.id, impiantoId: impianti[0], team: [], capoId: "" };
  const setCurrent = (next) => { 
    const updated = { ...plan, [dayKey]: { ...current, ...next } };
    setPlan(updated); 
    saveJSON(KEYS.PLAN, updated); 
  };

  const [taskId, setTaskId] = useState(current.taskId);
  const [impiantoId, setImpiantoId] = useState(current.impiantoId);
  const capi = workers.filter(w => w.role === "capo");
  const [capoId, setCapoId] = useState(current.capoId || capi[0]?.id || "");
  const [includeCapo, setIncludeCapo] = useState((current.team||[]).includes(current.capoId));

  const operai = workers.filter(w => w.role === "operaio");
  const [teamOperai, setTeamOperai] = useState((current.team || []).filter(id => operai.some(o => o.id === id)));

  useEffect(() => {
    const c = plan[dayKey] || { taskId: tasks[0]?.id, impiantoId: impianti[0], team: [], capoId: "" };
    setTaskId(c.taskId); setImpiantoId(c.impiantoId); setCapoId(c.capoId || capi[0]?.id || "");
    setIncludeCapo((c.team||[]).includes(c.capoId));
    setTeamOperai((c.team||[]).filter(id => operai.some(o => o.id === id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey]);

  const [q, setQ] = useState("");
  const filtered = operai.filter(o => o.name.toLowerCase().includes(q.toLowerCase()) && !teamOperai.includes(o.id));

  const addMember = (id) => { if (!id || teamOperai.includes(id)) return; setTeamOperai([...teamOperai, id]); };
  const removeMember = (id) => setTeamOperai(teamOperai.filter(x => x !== id));
  const swapMember = (oldId, newId) => { if (!newId || oldId === newId || teamOperai.includes(newId)) return; setTeamOperai(teamOperai.map(x => (x === oldId ? newId : x))); };

  const [savedFx, setSavedFx] = useState(false);
  const saveDay = async () => {
    const finalTeam = includeCapo && capoId ? [capoId, ...teamOperai] : [...teamOperai];
    const uniqueTeam = Array.from(new Set(finalTeam.filter(id => workers.some(w=>w.id===id))));

    // 1) local
    setCurrent({ taskId, impiantoId, capoId, team: uniqueTeam });

    // 2) serveur (offline-friendly via outbox)
    savePlanSnapshot(dayKey, { taskId, impiantoId, capoId, team: uniqueTeam });

    setSavedFx(true);
    setTimeout(()=>setSavedFx(false), 1200);
  };

  return (
    <div className="space-y-4">
      <SectionTitle icon={CalendarDays} title="Planning hebdomadaire (Manager)" subtitle={`Semaine du ${fmtDate(weekStart)} — ${fmtDate(addDays(weekStart, 6))}`} />
      <Card>
        <div className="flex items-center gap-2 overflow-auto no-scrollbar">
          {DAYS_ORDER.map((d, i) => (
            <button key={d} onClick={() => setSelectedDayIdx(i)}
              className={`px-3 md:px-4 py-2 rounded-2xl text-sm md:text-base border transition-all ${i === selectedDayIdx ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-neutral-900 border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"}`}>
              <div className="font-semibold">{d}</div>
              <div className="text-xs opacity-70">{fmtDate(addDays(weekStart, i))}</div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Tâche</label>
                <div className="mt-2 relative">
                  <select className="w-full appearance-none bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 pr-10" value={taskId} onChange={(e)=> setTaskId(e.target.value)}>
                    {tasks.map(t => (<option key={t.id} value={t.id}>{t.label}</option>))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Impianto</label>
                <div className="mt-2 relative">
                  <select className="w-full appearance-none bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 pr-10" value={impiantoId} onChange={(e)=> setImpiantoId(e.target.value)}>
                    {impianti.map(i => (<option key={i} value={i}>{i}</option>))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Capo Squadra</label>
                <div className="mt-2 relative">
                  <select className="w-full appearance-none bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 rounded-2xl px-4 py-3 pr-10" value={capoId} onChange={(e)=> setCapoId(e.target.value)}>
                    <option value="">— Aucun —</option>
                    {capi.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input id="inclCapo" type="checkbox" checked={includeCapo} onChange={(e)=>setIncludeCapo(e.target.checked)} />
                  <label htmlFor="inclCapo" className="text-sm">Inclure le Capo dans l’équipe (compte heures)</label>
                </div>
              </div>
            </div>

            {/* Recherche & résultats */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Rechercher un operaio…" className="w-full pl-9 pr-3 py-2 border rounded-2xl" />
              </div>

              <div className="max-h-48 overflow-auto rounded-xl border border-black/10 dark:border-white/10">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-sm opacity-60">Aucun résultat</div>
                ) : (
                  filtered.map(o => (
                    <button key={o.id} onClick={()=>addMember(o.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between">
                      <span>{o.name}</span>
                      <Badge>Ajouter</Badge>
                    </button>
                  ))
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {teamOperai.map((id) => {
                  const me = operai.find(o => o.id === id);
                  const opts = [me, ...operai.filter(o => o && o.id !== id && !teamOperai.includes(o.id))].filter(Boolean);
                  return (
                    <div key={id} className="flex items-center justify-between border border-black/10 dark:border-white/10 rounded-2xl px-3 py-2">
                      <select className="flex-1 bg-white dark:bg-neutral-900 rounded-xl px-2 py-1 border" value={id} onChange={(e)=>swapMember(id, e.target.value)}>
                        {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                      <button onClick={() => removeMember(id)} className="ml-2 text-rose-600 text-xs font-semibold hover:underline">Retirer</button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant={savedFx ? "success" : "primary"}
                icon={savedFx ? Check : Save}
                className={savedFx ? "animate-[pulse_0.9s_ease_1]" : ""}
                onClick={saveDay}
              >
                {savedFx ? "Enregistré ✓" : "Enregistrer le jour"}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-2">Raccourcis tâche</h3>
          <div className="space-y-2">
            {tasks.map(t => (
              <Button key={t.id} variant="ghost" className="w-full justify-between" onClick={() => setTaskId(t.id)}>
                <span>{t.label}</span><Badge>{t.defaultTeamSize} pers. (réf.)</Badge>
              </Button>
            ))}
            <hr className="border-black/10 dark:border-white/10" />
            <div className="text-xs text-black/60 dark:text-white/60">Ces raccourcis changent la <b>tâche</b> uniquement.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
