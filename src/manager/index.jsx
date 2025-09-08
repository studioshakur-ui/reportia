import TopHeader from '../components/TopHeader.jsx';
import PlannerDnD from './PlannerDnD.jsx';
import Rapportini from './rapportini.jsx';
import ImportDati from './import.jsx';
import { useMemo } from 'react';

export default function ManagerHome({ navigate }) {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/manager';
  const tab = useMemo(() => {
    if (path.includes('/planner')) return 'planner';
    if (path.includes('/import')) return 'import';
    return 'rapportini';
  }, [path]);

  function go(t) {
    const to = t==='planner' ? '/manager/planner' : t==='import' ? '/manager/import' : '/manager/rapportini';
    window.history.pushState({}, '', to);
    window.dispatchEvent(new Event('popstate'));
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-100">
      <TopHeader />
      <main className="max-w-6xl mx-auto p-4">
        <div className="flex gap-2 mb-4">
          <button onClick={()=>go('planner')} className={`px-3 py-2 rounded-xl border ${tab==='planner'?'bg-violet-600 text-white':''}`}>Planner</button>
          <button onClick={()=>go('rapportini')} className={`px-3 py-2 rounded-xl border ${tab==='rapportini'?'bg-violet-600 text-white':''}`}>Validazione</button>
          <button onClick={()=>go('import')} className={`px-3 py-2 rounded-xl border ${tab==='import'?'bg-violet-600 text-white':''}`}>Import dati</button>
        </div>
        {tab==='planner' ? <PlannerDnD /> : tab==='import' ? <ImportDati /> : <Rapportini />}
      </main>
    </div>
  );
}
