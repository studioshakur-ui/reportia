import { useState } from 'react';
import TopHeader from '../components/TopHeader';
import SyncButton from '../components/SyncButton';
import { Shield, Users } from 'lucide-react';

export default function RoleGate() {
  const [role, setRole] = useState('manager');

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <TopHeader/>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-black/5 dark:border-white/10 shadow-sm bg-white/60 dark:bg-zinc-900/50 p-6 sm:p-8">
          <h1 className="text-3xl font-black tracking-tight">Connexion</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Choisis ton rôle pour accéder au plan et aux rapports.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <button onClick={()=>setRole('manager')} className={`text-left p-5 rounded-2xl border transition ${role==='manager' ? 'border-violet-400 ring-2 ring-violet-200 dark:ring-violet-700 bg-violet-500/5' : 'border-black/10 dark:border-white/10 hover:bg-white/50 dark:hover:bg-zinc-800/40'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-600 text-white"><Shield size={18}/></div>
                <div>
                  <div className="font-semibold">Manager</div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Valider, planifier, suivre.</p>
                </div>
              </div>
            </button>

            <button onClick={()=>setRole('capo')} className={`text-left p-5 rounded-2xl border transition ${role==='capo' ? 'border-violet-400 ring-2 ring-violet-200 dark:ring-violet-700 bg-violet-500/5' : 'border-black/10 dark:border-white/10 hover:bg-white/50 dark:hover:bg-zinc-800/40'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-fuchsia-600 text-white"><Users size={18}/></div>
                <div>
                  <div className="font-semibold">Capo Squadra</div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Rapports rapides, anomalies.</p>
                </div>
              </div>
            </button>

            <div className="rounded-xl border border-black/10 dark:border-white/10 p-5 bg-white/70 dark:bg-zinc-900/50">
              <div className="text-sm font-semibold mb-2">Accès & permissions</div>
              <ul className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>• Manager : planning, organigramme, catalogue.</li>
                <li>• Capo : rapports, activités, export PDF.</li>
                <li>• Offline : création locale + synchronisation.</li>
              </ul>
              <div className="mt-4"><SyncButton/></div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={()=>{ window.location.href = role==='manager' ? '/manager' : '/capo'; }}
              className="rounded-xl px-5 py-2.5 font-semibold bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white shadow-lg">
              Se connecter
            </button>
            <button onClick={()=>setRole('manager')} className="rounded-xl px-4 py-2 border border-black/10 dark:border-white/10">Réinitialiser</button>
          </div>
        </div>
      </main>
    </div>
  );
}
