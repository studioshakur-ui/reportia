import TopHeader from '../components/TopHeader.jsx';
import { useEffect, useState } from 'react';
import DraggableLines from './DraggableLines.jsx';
import { createDraft, saveDraft, submitReport, attachFileLocal, buildReportPdf } from '../services/reportService.js';
import { getCapis, getOperai } from '../services/rosterService.js';
import { runQueue } from '../store/offlineQueue.js';

export default function CapoHome() {
  const [id, setId] = useState(null);
  const [data, setData] = useState(new Date().toISOString().slice(0,10));
  const [cn, setCn] = useState('');
  const [oreTot, setOreTot] = useState('0');
  const [note, setNote] = useState('');
  const [operai, setOperai] = useState([]);
  const [righe, setRighe] = useState([
    { worker_id:'', ore:0, descrizione:'', prodotto_qty:0, prodotto_unit:'n', previsto:0, note:'' }
  ]);
  const [msg, setMsg] = useState('');

  useEffect(() => { (async () => {
    const ops = await getOperai();
    setOperai(ops);
    const rid = await createDraft({ date: data, hours_total: Number(oreTot), cn, notes: note, lines: righe });
    setId(rid);
  })(); }, []);

  async function salva() {
    try {
      await saveDraft(id, { date: data, hours_total: Number(oreTot), cn, notes: note, lines: righe });
      setMsg('Bozza salvata in locale.');
    } catch { setMsg('Errore salvataggio.'); }
  }
  async function invia() {
    try {
      await saveDraft(id, { date: data, hours_total: Number(oreTot), cn, notes: note, lines: righe });
      await submitReport(id);
      setMsg('Inviato. Sincronizza quando online.');
    } catch { setMsg('Errore invio.'); }
  }
  async function allega(index, file) {
    try {
      await attachFileLocal(id, file, index);
      setMsg('Allegato aggiunto (upload in coda).');
    } catch { setMsg('Errore allegato.'); }
  }
  async function pdf() {
    const header = { capo: 'Capo Squadra', data, cn };
    const lines = righe.map(r => ({
      operatore_name: operai.find(o=>o.id===r.worker_id)?.full_name || '',
      ore: r.ore, descrizione: r.descrizione, prodotto_qty: r.prodotto_qty, previsto: r.previsto, note: r.note
    }));
    const blob = await buildReportPdf({ header, lines });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `rapportino_${data}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }
  async function syncNow() {
    await runQueue(() => {});
    setMsg('Sync completata (se errori, riprova).');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-100">
      <TopHeader />
      <main className="max-w-4xl mx-auto p-4 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Rapportino</h1>
          <div className="flex gap-2">
            <button onClick={syncNow} className="rounded-xl px-3 py-2 bg-violet-600 text-white">Sincronizza</button>
            <button onClick={pdf} className="rounded-xl px-3 py-2 border">PDF</button>
          </div>
        </header>

        <section className="grid md:grid-cols-4 gap-3 rounded-xl border p-3 bg-white/5">
          <label className="text-sm md:col-span-1">Data
            <input type="date" value={data} onChange={(e)=>setData(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1 bg-white/80 dark:bg-zinc-900/50"/>
          </label>
          <label className="text-sm md:col-span-1">Ore totali
            <input type="number" value={oreTot} onChange={(e)=>setOreTot(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1 bg-white/80 dark:bg-zinc-900/50"/>
          </label>
          <label className="text-sm md:col-span-2">CN
            <input value={cn} onChange={(e)=>setCn(e.target.value)} className="mt-1 w-full rounded-md border px-2 py-1 bg-white/80 dark:bg-zinc-900/50"/>
          </label>
          <label className="text-sm md:col-span-4">Note
            <textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={2} className="mt-1 w-full rounded-md border px-2 py-1 bg-white/80 dark:bg-zinc-900/50"/>
          </label>
        </section>

        <DraggableLines
          initial={righe}
          operai={operai}
          onChangeOrder={setRighe}
          onAttachAt={(i,file)=>allega(i,file)}
        />

        <footer className="sticky bottom-0 left-0 right-0 py-3 bg-gradient-to-t from-black/30 via-black/10 to-transparent backdrop-blur">
          <div className="max-w-4xl mx-auto flex gap-2 justify-end px-4">
            <button onClick={salva} className="rounded-xl px-4 py-2 border">Salva bozza</button>
            <button onClick={invia} className="rounded-xl px-4 py-2 bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white">Invia</button>
          </div>
        </footer>

        {msg && <p className="text-sm opacity-80">{msg}</p>}
      </main>
    </div>
  );
}
