// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

// Utils locali
import { KEYS, loadJSON, saveJSON } from "./lib/storage";
import {
  DEFAULT_TASKS,
  DEFAULT_IMPIANTI,
  DEFAULT_ACTIVITIES,
  DEFAULT_WORKERS,
} from "./constants/defaults";

// Features
import ManagerMenu from "./features/manager/ManagerMenu";
import ManagerPlanner from "./features/manager/ManagerPlanner";
import OrgBoard from "./features/manager/OrgBoard";
import CatalogueManager from "./features/manager/CatalogueManager";
import CapoHome from "./features/capo/CapoHome";

// Robustesse
import ErrorBoundary from "./components/ErrorBoundary";
import { t } from "./lib/i18n";
import { safeInitOffline } from "./lib/offline";
import { getSessionSafe } from "./lib/supabase";

// ⚠️ Désactive tout SW (évite écran noir iOS si cache corrompu)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
}

export default function App() {
  // ====== Stato persistito (localStorage) ======
  const [tasks, setTasks] = useState(() => loadJSON(KEYS.TASKS, DEFAULT_TASKS));
  const [impianti, setImpianti] = useState(() => loadJSON(KEYS.IMPIANTI, DEFAULT_IMPIANTI));
  const [activities, setActivities] = useState(() => loadJSON(KEYS.ACTIVITIES, DEFAULT_ACTIVITIES));
  const [workers, setWorkers] = useState(() => loadJSON(KEYS.WORKERS, DEFAULT_WORKERS));

  // ====== Stato UI / ruolo / accesso ======
  const [role, setRole] = useState("capo"); // "manager" | "capo"
  const [isAssigned, setIsAssigned] = useState(false);
  const [booted, setBooted] = useState(false);

  // Env (Netlify) : permettere lettura se non assegnato
  const bypass = import.meta.env.VITE_BYPASS_ASSIGNMENT === "true";
  const readOnly = useMemo(() => !isAssigned && bypass, [isAssigned, bypass]);

  // ====== Bootstrap non bloccante (offline + session) ======
  useEffect(() => {
    (async () => {
      await safeInitOffline();
      await getSessionSafe().catch(() => null);

      // TODO: sostituire con controllo reale su Supabase (assignments per oggi)
      setIsAssigned(false);

      setBooted(true);
    })();
  }, []);

  // ====== Persistenza locale ======
  useEffect(() => saveJSON(KEYS.TASKS, tasks), [tasks]);
  useEffect(() => saveJSON(KEYS.IMPIANTI, impianti), [impianti]);
  useEffect(() => saveJSON(KEYS.ACTIVITIES, activities), [activities]);
  useEffect(() => saveJSON(KEYS.WORKERS, workers), [workers]);

  // ====== Azioni header ======
  function handleExportPDF() {
    alert("Esporta PDF — funzione in arrivo.");
  }

  function handleSyncNow() {
    alert("Sync — funzione in arrivo.");
  }

  if (!booted) return null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#111] text-white">
        {/* ====== HEADER ====== */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="text-2xl font-extrabold">{t("appName")}</div>
          <div className="text-xs opacity-60 ml-2">
            {t("syncing")} · {t("offline")}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleSyncNow}
              className="px-3 py-1 rounded-full border border-white/20 text-xs"
            >
              {t("sync_now")}
            </button>

            <button
              onClick={handleExportPDF}
              className="px-3 py-1 rounded-full border border-white/20 text-xs flex items-center gap-1"
            >
              <ClipboardList className="w-4 h-4" /> {t("pdf")}
            </button>

            {/* Switch ruolo */}
            <div className="ml-2 flex gap-2">
              <button
                className={`px-3 py-1 rounded-full border ${
                  role === "manager" ? "bg-white text-black" : "bg-transparent"
                }`}
                onClick={() => setRole("manager")}
              >
                {t("role_manager")}
              </button>
              <button
                className={`px-3 py-1 rounded-full border ${
                  role === "capo" ? "bg-white text-black" : "bg-transparent"
                }`}
                onClick={() => setRole("capo")}
              >
                {t("role_capo")}
              </button>
            </div>
          </div>
        </header>

        {/* ====== GUARD DI ACCESSO ====== */}
        {!isAssigned && !bypass ? (
          <div className="mx-4 mt-6 rounded-2xl p-5 bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold">{t("restricted_title")}</h2>
            <p className="opacity-80 mt-1">{t("restricted_msg")}</p>
          </div>
        ) : (
          <>
            {role === "manager" ? (
              /* ====== VISTA MANAGER COMPLETA ====== */
              <main className="p-4 space-y-6">
                <ManagerMenu />

                <ManagerPlanner
                  tasks={tasks}
                  impianti={impianti}
                  activities={activities}
                  workers={workers}
                  onTasksChange={setTasks}
                  onImpiantiChange={setImpianti}
                  onActivitiesChange={setActivities}
                  onWorkersChange={setWorkers}
                />

                <OrgBoard workers={workers} onWorkersChange={setWorkers} />

                <CatalogueManager
                  activities={activities}
                  impianti={impianti}
                  onActivitiesChange={setActivities}
                  onImpiantiChange={setImpianti}
                />
              </main>
            ) : (
              /* ====== VISTA CAPO ====== */
              <main>
                <CapoHome readOnly={readOnly} />
              </main>
            )}
          </>
        )}

        {/* ====== FOOTER ====== */}
        <footer className="px-4 py-10 opacity-60 text-xs">
          © 2025 {t("appName")} — Sync Supabase, cache offline & PDF. Cloud: Supabase
        </footer>
      </div>
    </ErrorBoundary>
  );
}                
                <ManagerMenu
                  workers={workers}
                  setWorkers={saveWorkersAll}
                  tasks={tasks}
                  setTasks={(t) => saveCatalogAll(t, impianti, activities)}
                  impianti={impianti}
                  setImpianti={(i) => saveCatalogAll(tasks, i, activities)}
                  activities={activities}
                  setActivities={(a) => saveCatalogAll(tasks, impianti, a)}
                  user={user}
                  setUser={(u) => {
                    setUser(u);
                    saveJSON(KEYS.USER, u);
                  }}
                />
              </Card>

              <Card>
                <SectionTitle
                  title="Organigramme"
                  subtitle="Drag & drop"
                />
                <OrgBoard workers={workers} setWorkers={saveWorkersAll} />
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <SectionTitle
                  title="Planning Semaine"
                  subtitle={`${range.start} → ${range.end}`}
                />
                <ManagerPlanner
                  plan={plan}
                  setDay={(dayKey, payload) => saveDayPlan(dayKey, payload)}
                  tasks={tasks}
                  impianti={impianti}
                  activities={activities}
                  workers={workers}
                  todayKey={todayKey}
                />
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Card>
                <SectionTitle
                  title="Catalogue"
                  subtitle="Tâches, Impianti, Activités"
                />
                <CatalogueManager
                  tasks={tasks}
                  setTasks={(t) => saveCatalogAll(t, impianti, activities)}
                  impianti={impianti}
                  setImpianti={(i) => saveCatalogAll(tasks, i, activities)}
                  activities={activities}
                  setActivities={(a) => saveCatalogAll(tasks, impianti, a)}
                />
              </Card>

              <Card>
                <SectionTitle
                  title="Personnel"
                  subtitle="Capi & Operai"
                />
                <WorkersAdmin
                  workers={workers}
                  setWorkers={saveWorkersAll}
                />
              </Card>
            </div>
          </>
        ) : (
          <div className="mt-6">
            <CapoPanel
              todayKey={todayKey}
              plan={plan}
              workers={workers}
              user={user}
              reports={reports}
              setReports={(r) => {
                setReports(r);
                saveJSON(KEYS.REPORT, r);
              }}
              tasks={tasks}
              impianti={impianti}
              activities={activities}
              status={status}
              setStatus={(s) => saveStatusAll(s)}
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-xs text-black/60 dark:text-white/60 flex flex-wrap items-center justify-between gap-2">
          <div>
            © {new Date().getFullYear()} Reportia — Sync Supabase, cache
            offline & PDF.
          </div>
          {supabase ? (
            <div className="opacity-70">Cloud: Supabase</div>
          ) : (
            <div className="opacity-70">Cloud: Offline (vars manquantes)</div>
          )}
        </div>
      </div>
    </div>
  );
}
