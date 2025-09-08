import { useState } from 'react';
import TopHeader from '../components/TopHeader.jsx';

export default function RoleGate({ navigate }) {
  const [role, setRole] = useState('manager');
  const vai = () => {
    const to = role === 'manager' ? '/manager/rapportini' : '/capo';
    typeof navigate === 'function' ? navigate(to) : (window.history.pushState({},'',to), window.dispatchEvent(new Event('popstate')));
  };
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-100">
      <TopHeader />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-black">Accesso</h1>
        <p className="text-sm opacity-70 mt-1">Scegli il ruolo.</p>
        <div className="grid sm:grid-cols-3 gap-3 mt-6">
          <button onClick={()=>setRole('manager')} className={`p-5 rounded-2xl border ${role==='manager'?'bg-violet-600 text-white':''}`}>Manager</button>
          <button onClick={()=>setRole('capo')} className={`p-5 rounded-2xl border ${role==='capo'?'bg-violet-600 text-white':''}`}>Capo Squadra</button>
          <div className="p-5 rounded-2xl border">
            <div className="text-sm font-semibold mb-2">Modalità</div>
            <ul className="text-xs opacity-80 space-y-1">
              <li>• Offline-first</li>
              <li>• PDF identico al cartaceo</li>
              <li>• Drag & Drop mobile/desktop</li>
            </ul>
          </div>
        </div>
        <div className="mt-6"><button onClick={vai} className="px-5 py-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white">Entra</button></div>
      </main>
    </div>
  );
}
