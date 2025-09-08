// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";

import { KEYS, loadJSON, saveJSON } from "./lib/storage";
import {
  DEFAULT_TASKS,
  DEFAULT_IMPIANTI,
  DEFAULT_ACTIVITIES,
  DEFAULT_WORKERS,
} from "./constants/defaults";

import ManagerMenu from "./features/manager/ManagerMenu";
import ManagerPlanner from "./features/manager/ManagerPlanner";
import OrgBoard from "./features/manager/OrgBoard";
import CatalogueManager from "./features/manager/CatalogueManager";
import CapoHome from "./features/capo/CapoHome";

import ErrorBoundary from "./components/ErrorBoundary";
import { t } from "./lib/i18n";
import { safeInitOffline } from "./lib/offline";
import { getSessionSafe } from "./lib/supabase";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) =>
    regs.forEach((r) => r.unregister())
  );
}

export default function App() {
  // ====== Stato persistito (localStorage) ======
  const [tasks, setTasks] = useState(() => loadJSON(KEYS.TASKS, DEFAULT_TASKS));
  const [impianti, setImpianti] = useState(() =>
    loadJSON(KEYS.IMPIANTI, DEFAULT_IMPIANTI)
  );
  const [activities, setActivities] = useState(() =>
    loadJSON(KEYS.ACTIVITIES, DEFAULT_ACTIVITIES)
  );
  const [workers, setWorkers] = useState(() =>
    loadJSON(KEYS.WORKERS, DEFAULT_WORKERS)
  );

  // ====== Stato UI / ruolo / accesso ======
  const [role, setRole] = useState("capo"); // "manager" | "capo"
  const [isAssigned, setIsAssigned] = useState(false);
  const [booted, setBooted] = useState(false);

  const bypass = import.meta.env.VITE_BYPASS_ASSIGNMENT === "true";
  const readOnly = useMemo(() => !isAssigned && bypass, [isAssigned, bypass]);

  // ====== Bootstrap ======
  useEffect(() => {
    (async () => {
      await safeInitOffline();
      await getSessionSafe().catch(() => null);
      // TODO: sostituire con controllo reale su Supabase
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
    alert("Esporta PDF — da collegare.");
  }

  function handleSyncNow() {
    alert("Sync — da collegare a Supabase.");
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

        {/* ====== CONTENUTO ====== */}
        {!isAssigned && !bypass ? (
          <div className="mx-4 mt-6 rounded-2xl p-5 bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold">{t("restricted_title")}</h2>
            <p className="opacity-80 mt-1">{t("restricted_msg")}</p>
          </div>
        ) : role === "manager" ? (
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
          <main>
            <CapoHome readOnly={readOnly} />
          </main>
        )}

        {/* ====== FOOTER ====== */}
        <footer className="px-4 py-10 opacity-60 text-xs">
          © 2025 {t("appName")} — Sync Supabase, cache offline & PDF. Cloud: Supabase
        </footer>
      </div>
    </ErrorBoundary>
  );
}
