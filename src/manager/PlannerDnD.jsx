import { useEffect, useMemo, useState } from 'react';
import DndProvider from '../dnd/DndProvider.jsx';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { getCapis, getOperai, fetchRosterForWeek, saveRoster } from '../services/rosterService.js';

function mondayOf(date) {
  const d = new Date(date); const day = d.getDay(); const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff); d.setHours(0,0,0,0); return d;
}
function toISO(d) { return d.toISOString().slice(0,10); }

function WorkerChip({ w }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `w-${w.id}`, data: { type: 'worker', worker: w }
  });
  const style = { transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, zIndex: isDragging ? 50 : 'auto', touchAction:'none' };
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}
      className="px-3 py-1 rounded-full border bg-white/80 dark:bg-zinc-900/50 text-sm">
      {w.full_name}
    </div>
  );
}
function CapoDrop({ capo, members }) {
  const { isOver, setNodeRef } = useDroppable({ id: `c-${capo.id}`, data: { type: 'capo', capo } });
  return (
    <div ref={setNodeRef} className={`rounded-xl border p-3 min-h-[72px] ${isOver ? 'ring-2 ring-violet-400' : ''}`}>
      <div className="font-semibold mb-2">{capo.full_name}</div>
      <div className="flex flex-wrap gap-2">
        {members.map(m => <span key={m.id} className="px-2 py-1 rounded-full bg-violet-600/10 border text-sm">{m.full_name}</span>)}
      </div>
    </div>
  );
}

export default function PlannerDnD() {
  const [week, setWeek] = useState(toISO(mondayOf(new Date())));
  const [capis, setCapis] = useState([]); const [operai, setOperai] = useState([]);
  const [assign, setAssign] = useState({}); // { capoId: [workerId] }
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');

  useEffect(() => { (async () => {
    const [c, o] = await Promise.all([getCapis(), getOperai()]);
    setCapis(c); setOperai(o);
  })(); }, []);
  useEffect(() => { (async () => {
    const data = await fetchRosterForWeek(week);
    const map = {}; data.forEach(r => map[r.capo_id] = r.members || []);
    setAssign(map);
  })(); }, [week]);

  const pool = useMemo(() => operai.filter(w => !Object.values(assign).some(arr => arr.includes(w.id))), [operai, assign]);

  async function onDragEnd(evt) {
    const { active, over } = evt; if (!over) return;
    const data = active.data?.current; if (data?.type !== 'worker') return;
    const tgt = over.id?.toString().startsWith('c-') ? over.id.slice(2) : null; if (!tgt) return;
    const w = data.worker;
    setAssign(prev => {
      const next = structuredClone(prev);
      Object.keys(next).forEach(k => next[k] = next[k].filter(id => id !== w.id));
      (next[tgt] ||= []).push(w.id);
      return next;
    });
    if (navigator.vibrate) navigator.vibrate(10);
  }

  async function save() {
    setBusy(true); setMsg('');
    try {
      const list = Object.keys(assign).map(capoId => ({ capo_id: capoId, team_id: null, members: assign[capoId] }));
      await saveRoster(week, list);
      setMsg('Pianificazione salvata. (Si sincronizza se offline)');
    } catch (e) { setMsg('Errore salvataggio.'); }
    setBusy(false);
  }

  return (
    <DndProvider onDragEnd={onDragEnd}>
      <div className="flex items-end gap-3 mb-4">
        <label className="text-sm">Settimana (lunedì)
          <input type="date" value={week} onChange={(e)=>setWeek(toISO(mondayOf(e.target.value)))}
            className="mt-1 rounded-lg border px-3 py-2 bg-white/70 dark:bg-zinc-900/50"/>
        </label>
        <button onClick={save} disabled={busy}
          className="px-4 py-2 rounded-xl text-white bg-gradient-to-tr from-violet-600 to-fuchsia-500 shadow-lg disabled:opacity-60">
          {busy ? 'Salvataggio…' : 'Salva pianificazione'}
        </button>
        {msg && <span className="text-sm opacity-80">{msg}</span>}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl border p-3 bg-white/70 dark:bg-zinc-900/50">
          <div className="font-semibold mb-2">Operai disponibili</div>
          <div className="flex flex-wrap gap-2">
            {pool.map(w => <WorkerChip key={w.id} w={w} />)}
          </div>
        </div>
        <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
          {capis.map(c => (
            <CapoDrop key={c.id} capo={c} members={(assign[c.id]||[]).map(id => operai.find(o=>o.id===id)).filter(Boolean)} />
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
