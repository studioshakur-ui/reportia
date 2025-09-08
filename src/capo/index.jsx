import TopHeader from '../components/TopHeader';
import { createReportLocal } from '../services/reportService';
import { useState } from 'react';

export default function CapoToday() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState('0');
  const [msg, setMsg] = useState('');

  async function save() {
    try {
      const id = await createReportLocal({
        date,
        hours_total: Number(hours),
      });
      setMsg(`Brouillon créé (${id}). Se synchronisera quand online.`);
    } catch (e) {
      console.error(e);
      setMsg('Erreur lors de la sauvegarde.');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopHeader />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Nouveau rapport</h1>
        <div className="mt-4 grid gap-4">
          <label className="text-sm">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 bg-white/70 dark:bg-zinc-900/50"
            />
          </label>
          <label className="text-sm">
            Heures totales
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 bg-white/70 dark:bg-zinc-900/50"
            />
          </label>
          <button
            onClick={save}
            className="rounded-xl px-5 py-2.5 font-semibold bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white shadow-lg"
          >
            Enregistrer (offline)
          </button>
          {msg && <p className="text-sm opacity-70">{msg}</p>}
        </div>
      </main>
    </div>
  );
}
