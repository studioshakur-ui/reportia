import TopHeader from '../components/TopHeader';
import { fetchSubmittedReports } from '../services/reportService';
import { useEffect, useState } from 'react';

export default function ManagerDashboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchSubmittedReports();
        setRows(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <TopHeader />
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold">À valider</h1>
        {loading ? (
          <p className="mt-4 text-sm opacity-70">Chargement…</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm opacity-70">Aucun rapport soumis.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-black/10 dark:border-white/10 p-4 bg-white/70 dark:bg-zinc-900/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">
                      {r.date} — CN {r.cn ?? '-'}
                    </div>
                    <div className="text-xs opacity-70">
                      Heures: {r.hours_total ?? 0} — Statut: {r.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white">
                      Approuver
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-rose-600 text-white">
                      Refuser
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
