import { useEffect } from 'react';
import RoleGate from './pages/RoleGate';
import ManagerDashboard from './manager';
import CapoToday from './capo';

export default function App() {
  // mini routeur par chemin
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  useEffect(()=>{}, [path]);

  if (path.startsWith('/manager')) return <ManagerDashboard/>;
  if (path.startsWith('/capo')) return <CapoToday/>;
  return <RoleGate/>;
}
