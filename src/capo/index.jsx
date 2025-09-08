import TopHeader from '../components/TopHeader';
import { createReportLocal } from '../services/reportService';
import { useState } from 'react';

export default function CapoToday() {
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [ore, setOre] = useState('0');
  const [msg, setMsg] = useState('');

  async function salva() {
    try {
      const id = await createReportLocal({
        date: data,
        hours_total: Number(ore),
      });
      setMsg(`Bozza creata (${id}). Si sincronizzerà quando sei online.`);
    } catch (e) {
      console.error(e);
      setMsg('Errore durante il salvataggio.');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopHeader />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Nuovo rapportino</h1>
        <div className="mt-4 grid gap-4">
          <label className="text-sm">
            Data
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 bg-white/70 dark:bg-zinc-900/50"
            />
          </label>
          <label className="text-sm">
            Ore totali
            <input
              type="number"
              value={ore}
              onChange={(e) => setOre(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 bg-white/70 dark:bg-zinc-900/50"
            />
          </label>
          <button
            onClick={salva}
            className="rounded-xl px-5 py-2.5 font-semibold bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white shadow-lg"
          >
            Salva (offline)
          </button>
          {msg && <p className="text-sm opacity-70">{msg}</p>}
        </div>
      </main>
    </div>
  );
}
