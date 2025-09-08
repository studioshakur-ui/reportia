import { useState } from 'react';
import TopHeader from '../components/TopHeader';
import SyncButton from '../components/SyncButton';

function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 12.5l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M14.5 9.5a2.5 2.5 0 105 0 2.5 2.5 0 00-5 0z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 18c0-3 3-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15.5 18c.3-1.8 1.9-3.2 4-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function RoleGate({ navigate }) {
  const [role, setRole] = useState('manager');

  function vai() {
    const to = role === 'manager' ? '/manager' : '/capo';
    if (typeof navigate === 'function') navigate(to);
    else {
      window.history.pushState({}, '', to);
      window.dispatchEvent(new Event('popstate'));
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <TopHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-black/5 dark:border-white/10 shadow-sm bg-white/60 dark:bg-zinc-900/50 p-6 sm:p-8">
          <h1 className="text-3xl font-black tracking-tight">Accesso</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Scegli il tuo ruolo per entrare nel piano e nei rapportini.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Card Manager */}
            <button
              onClick={() => setRole('manager')}
              className={`text-left p-5 rounded-2xl border transition ${
                role === 'manager'
                  ? 'border-violet-400 ring-2 ring-violet-200 dark:ring-violet-700 bg-violet-500/5'
                  : 'border-black/10 dark:border-white/10 hover:bg-white/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-600 text-white">
                  <ShieldIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold">Manager</div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Valida, pianifica, monitora.</p>
                </div>
              </div>
            </button>

            {/* Card Capo Squadra */}
            <button
              onClick={() => setRole('capo')}
              className={`text-left p-5 rounded-2xl border transition ${
                role === 'capo'
                  ? 'border-violet-400 ring-2 ring-violet-200 dark:ring-violet-700 bg-violet-500/5'
                  : 'border-black/10 dark:border-white/10 hover:bg-white/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-fuchsia-600 text-white">
                  <UsersIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold">Capo Squadra</div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Rapportino rapido, anomalie.</p>
                </div>
              </div>
            </button>

            {/* Permessi + Sync */}
            <div className="rounded-xl border border-black/10 dark:border-white/10 p-5 bg-white/70 dark:bg-zinc-900/50">
              <div className="text-sm font-semibold mb-2">Accessi e permessi</div>
              <ul className="text-xs space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>• Manager: planning, organigramma, catalogo.</li>
                <li>• Capo: rapportini, attività, export PDF.</li>
                <li>• Offline: creazione locale + sincronizzazione.</li>
              </ul>
              <div className="mt-4">
                <SyncButton />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={vai}
              className="rounded-xl px-5 py-2.5 font-semibold bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white shadow-lg"
            >
              Entra
            </button>
            <button
              onClick={() => setRole('manager')}
              className="rounded-xl px-4 py-2 border border-black/10 dark:border-white/10"
            >
              Reimposta
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
