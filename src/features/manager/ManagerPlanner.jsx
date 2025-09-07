import React, { useMemo, useState, useEffect } from "react";
import Card from "../../components/ui/Card";
import SectionTitle from "../../components/ui/SectionTitle";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { CalendarDays, Save, Check, Search } from "lucide-react";
import { fmtDate, addDays, isoDayKey } from "../../lib/time";
import { saveJSON, KEYS } from "../../lib/storage";
import { DAYS_ORDER } from "../../constants/defaults";
import Select from "../../components/ui/Select";

export default function ManagerPlanner({ weekStart, plan, setPlan, workers, tasks, impianti }) {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const dayDate = useMemo(() => addDays(weekStart, selectedDayIdx), [weekStart, selectedDayIdx]);
  const dayKey  = isoDayKey(dayDate);

  const current = plan[dayKey] || { taskId: tasks[0]?.id, impiantoId: impianti[0], team: [], capoId: "" };
  const setCurrent = (next) => { const updated = { ...plan, [dayKey]: { ...current, ...next } }; setPlan(updated); saveJSON(KEYS.PLAN, updated); };

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
  const saveDay = () => {
    const finalTeam = includeCapo && capoId ? [capoId, ...teamOperai] : [...teamOperai];
    const uniqueTeam = Array.from(new Set(finalTeam.filter(id => workers.some(w=>w.id===id))));
    setCurrent({ taskId, impiantoId, capoId, team: uniqueTeam });
    setSavedFx(true);
    setTimeout(()=>setSavedFx(false), 1200);
  };

  return (
    <div className="space-y-4">
      <SectionTitle icon={CalendarDays} title="Planning hebdomadaire (Manager)" subtitle={`Semaine du ${fmtDate(weekStart)} — ${fmtDate(addDays(weekStart, 6))}`} />

      {/* Choix des jours - scroll-snap mobile */}
      <Card>
        <div className="-mx-2 px-2 overflow-x-auto no-scrollbar flex gap-2 snap-x snap-mandatory">
          {DAYS_ORDER.map((d, i) => {
            const active = i === selectedDayIdx;
            return (
              <button
                key={d}
                onClick={() => setSelectedDayIdx(i)}
                className={`snap-start shrink-0 w-16 h-16 rounded-2xl grid place-items-center text-xs font-semibold border transition-all
                  ${active ? "bg-brand-600 text-white border-brand-600" : "bg-surface text-text border-black/10 hover:bg-bg"}`}
              >
                <div>{d}</div>
                <div className="opacity-70">{fmtDate(addDays(weekStart, i))}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="p-4 space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Tâche</label>
                <div className="mt-2">
                  <Select value={taskId} onChange={(e)=> setTaskId(e.target.value)}>
                    {tasks.map(t => (<option key={t.id} value={t.id}>{t.label}</option>))}
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Impianto</label>
                <div className="mt-2">
                  <Select value={impiantoId} onChange={(e)=> setImpiantoId(e.target.value)}>
                    {impianti.map(i => (<option key={i} value={i}>{i}</option>))}
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Capo Squadra</label>
                <div className="mt-2">
                  <Select value={capoId} onChange={(e)=> setCapoId(e.target.value)}>
                    <option value="">— Aucun —</option>
                    {capi.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </Select>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input id="inclCapo" type="checkbox" checked={includeCapo} onChange={(e)=>setIncludeCapo(e.target.checked)} />
                  <label htmlFor="inclCapo" className="text-sm">Inclure le Capo dans l’équipe (compte heures)</label>
                </div>
              </div>
            </div>

            {/* Recherche & résultats cliquables */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                <input
                  value={q}
                  onChange={(e)=>setQ(e.target.value)}
                  placeholder="Rechercher un operaio…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl2 border border-black/10 dark:border-white/10 bg-surface text-text"
                />
              </div>

              <div className="max-h-48 overflow-auto rounded-xl border border-black/10 dark:border-white/10">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-sm opacity-70">Aucun résultat</div>
                ) : (
                  filtered.map(o => (
                    <button key={o.id} onClick={()=>addMember(o.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-bg flex items-center justify-between">
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
                    <div key={id} className="flex items-center justify-between border border-black/10 dark:border-white/10 rounded-xl2 px-3 py-2">
                      <div className="flex-1">
                        <Select className="w-full" value={id} onChange={(e)=>swapMember(id, e.target.value)}>
                          {opts.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </Select>
                      </div>
                      <button onClick={() => removeMember(id)} className="ml-2 text-danger text-xs font-semibold hover:underline">Retirer</button>
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
          <div className="p-4">
            <h3 className="font-semibold mb-2">Raccourcis tâche</h3>
            <div className="space-y-2">
              {tasks.map(t => (
                <Button key={t.id} variant="ghost" className="w-full justify-between" onClick={() => setTaskId(t.id)}>
                  <span>{t.label}</span><Badge>{t.defaultTeamSize} pers. (réf.)</Badge>
                </Button>
              ))}
              <hr className="border-black/10 dark:border-white/10" />
              <div className="text-xs" style={{color:"rgb(var(--muted))"}}>
                Ces raccourcis changent la <b>tâche</b> uniquement.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
