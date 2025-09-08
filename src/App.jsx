import { useEffect, useState, useCallback } from 'react';
import RoleGate from './pages/RoleGate';
import ManagerDashboard from './manager';
import CapoToday from './capo';

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname || '/');

  const navigate = useCallback((to) => {
    if (to === path) return;
    window.history.pushState({}, '', to);
    setPath(to);
  }, [path]);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    window.addEventListener('reportia:navigate', (e) => {
      if (e?.detail?.to) navigate(e.detail.to);
    });
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('reportia:navigate', () => {});
    };
  }, [navigate]);

  if (path.startsWith('/manager')) return <ManagerDashboard />;
  if (path.startsWith('/capo')) return <CapoToday />;

  return <RoleGate navigate={navigate} />;
}
