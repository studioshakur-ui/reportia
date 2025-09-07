// src/App.jsx
import React, { useEffect, useState } from "react";
import { Sun, Moon, Settings, LogOut, ClipboardList } from "lucide-react";

import { KEYS, loadJSON, saveJSON } from "./lib/storage";
import { startOfWeek, isoDayKey } from "./lib/time";
import { DEFAULT_TASKS, DEFAULT_IMPIANTI, DEFAULT_ACTIVITIES, DEFAULT_WORKERS } from "./constants/defaults";

import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import SectionTitle from "./components/ui/SectionTitle";
import ManagerMenu from "./features/manager/ManagerMenu";
import ManagerPlanner from "./features/manager/ManagerPlanner";
import OrgBoard from "./features/manager/OrgBoard";
import CatalogueManager from "./features/manager/CatalogueManager";
import WorkersAdmin from "./features/manager/WorkersAdmin";
import CapoPanel from "./features/capo/CapoPanel";
import LoginInline from "./features/auth/LoginInline";
import ExcelImporter from "./lib/excel"; // import de la liste simple (optionnel)

export default function App() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState("capo");
  const [plan, setPlan] = useState(() => loadJSON(KEYS.PLAN, {}));
  const [reports, setReports] = useState(() => loadJSON(KEYS.REPORT, {}));
  const [workers, setWorkers] = useState(() => loadJSON(KEYS.WORKERS, DEFAULT_WORKERS));
  const [user, setUser] = useState(() => loadJSON(KEYS.USER, null));
  const [tasks, setTasks] = useState(() => loadJSON(KEYS.TASKS, DEFAULT_TASKS));
  const [impianti, setImpianti] = useState(() => loadJSON(KEYS.IMPIANTI, DEFAULT_IMPIANTI));
  const [activities, setActivities] = useState(() => loadJSON(KEYS.ACTIVITIES, DEFAULT_ACTIVITIES));
  const [status, setStatus] = useState(() => loadJSON(KEYS.STATUS, {}));

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark"); else root.classList.remove("dark");
  }, [dark]);

  const todayKey = isoDayKey(new Date());
  const logout = () => { setUser(null); saveJSON(KEYS.USER, null); setView("capo"); };

  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_600px_at_20%_-10%,rgba(99,102,241,0.12),transparent),radial-gradient(800px_500px_at_80%_-10%,rgba(168,85,247,0.12),transparent)] dark:bg-[radial-gradient(1000px_600px_at_20%_-10%,rgba(99,102,241,0.18),transparent),radial-gradient(800px_500px_at_80%_-10%,rgba(168,85,247,0.18),transparent)] text-neutral-900 dark:text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 md:py-8">

        {/* Topbar */}
        <div className="flex items-center justify-between gap-3 mb-5 md:mb-8">
          <div className="flex items-center gap-3">
            <img
              src="/brand.svg"
              alt=""
              className="w-10 h-10 rounded-2xl ring-1 ring-black/10 dark:ring-white/10 object-contain"
              onError={(e)=>{ e.currentTarget.style.display="none"; }}
            />
            <div>
              <div className="font-extrabold tracking-tight text-lg md:text-xl">Naval Planner</div>
              <div className="text-xs text-black/60 dark:text-white/60">Manager (planning & organigramme) • Capo (groupes + PDF) • Catalogue</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Sun} onClick={() => setDark(false)} />
            <Button variant="outline" size="sm" icon={Moon} onClick={() => setDark(true)} />
            {/* Import simple (liste d’opérateurs) — garde si utile */}
            <ExcelImporter onWorkers={(list)=>{ setWorkers(list); saveJSON(KEYS.WORKERS, list); }} />
            {user ? <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>Se déconnecter</Button> : null}
            <Button variant="ghost" size="sm" icon={Settings}>Paramètres</Button>
          </div>
        </div>

        {/* Auth */}
        {!user && (
          <Card>
            <SectionTitle title="Connexion" subtitle="Choisis ton rôle." />
            <LoginInline workers={workers} onLogin={(u)=>{ setUser(u); saveJSON(KEYS.USER, u); setView(u.role === "manager" ? "m-planning" : "capo"); }} />
          </Card>
        )}

        {user && (
          <>
            {/* Navigation */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {user.role === "manager" && (<ManagerMenu current={view} onSelect={(v)=>setView(v)} />)}
              <button onClick={() => setView("capo")}
                className={`px-4 py-2 rounded-2xl text-sm border ${view === "capo" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-neutral-900 border-black/10 dark:border-white/10"}`}>
                <span className="inline-flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Capo</span>
              </button>
            </div>

            {/* Views */}
            <div className="space-y-6">
              {user.role==="manager" && view==="m-catalogue" && (
                <>
                  <CatalogueManager
                    tasks={tasks} setTasks={setTasks}
                    impianti={impianti} setImpianti={setImpianti}
                    activities={activities} setActivities={setActivities}
                  />
                  <WorkersAdmin workers={workers} setWorkers={setWorkers} />
                </>
              )}
              {user.role==="manager" && view==="m-organigram" && (
                <OrgBoard
                  workers={workers}
                  setWorkers={setWorkers}
                  plan={plan}
                  setPlan={setPlan}
                  tasks={tasks}
                  impianti={impianti}
                  isManager
                />
              )}
              {user.role==="manager" && view==="m-planning" && (
                <ManagerPlanner weekStart={startOfWeek()} plan={plan} setPlan={setPlan} workers={workers} tasks={tasks} impianti={impianti} />
              )}
              {view==="capo" && (
                <CapoPanel
                  todayKey={todayKey}
                  plan={plan}
                  workers={workers}
                  user={user}
                  reports={reports}
                  setReports={setReports}
                  tasks={tasks}
                  impianti={impianti}
                  activities={activities}
                  status={status}
                  setStatus={setStatus}
                />
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-10 text-xs text-black/60 dark:text-white/60 flex flex-wrap items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} Naval Planner — Catalogue, Organigramme drag & drop, groupes Capo + PDF.</div>
        </div>
      </div>
    </div>
  );
}
