import { useState, useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function TopHeader() {
  const online = useNetworkStatus();
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
  }, [theme]);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-br from-violet-500/20 via-violet-400/10 to-fuchsia-400/10 backdrop-blur ring-1 ring-black/5 dark:ring-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 shadow-lg" />
          <div className="leading-tight">
            <div className="text-sm uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Reportia</div>
            <div className="text-base font-semibold">Naval Planner</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${online ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
            <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {online ? 'Online' : 'Offline'}
          </span>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-800/60">
            {theme === 'dark' ? 'Scuro' : 'Chiaro'}
          </button>
          <button className="px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-zinc-800/60">
            Impostazioni
          </button>
        </div>
      </div>
    </header>
  );
}
