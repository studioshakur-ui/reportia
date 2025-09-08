import { useEffect, useState, useCallback } from 'react';
import RoleGate from './pages/RoleGate.jsx';
import ManagerHome from './manager/index.jsx';
import CapoHome from './capo/index.jsx';

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
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (path.startsWith('/manager')) return <ManagerHome navigate={navigate} />;
  if (path.startsWith('/capo')) return <CapoHome navigate={navigate} />;

  return <RoleGate navigate={navigate} />;
}
