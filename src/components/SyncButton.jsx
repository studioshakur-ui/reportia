import { useState } from 'react';
import { runQueue } from '../store/offlineQueue';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function SyncButton() {
  const online = useNetworkStatus();
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  async function sync() {
    setBusy(true);
    await runQueue(() => {});
    setBusy(false);
    setOk(true);
    setTimeout(() => setOk(false), 1500);
  }

  return (
    <button
      onClick={sync}
      disabled={!online || busy}
      className="rounded-xl px-4 py-2 font-semibold bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white shadow-lg disabled:opacity-50"
    >
      {busy ? 'Sincronizzazione…' : ok ? 'Sincronizzato ✓' : 'Sincronizza ora'}
    </button>
  );
}
