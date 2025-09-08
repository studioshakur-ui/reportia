// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Sun, Moon, Settings, LogOut, ClipboardList } from "lucide-react";

import { KEYS, loadJSON, saveJSON } from "./lib/storage";
import { startOfWeek, isoDayKey } from "./lib/time";
import {
  DEFAULT_TASKS,
  DEFAULT_IMPIANTI,
  DEFAULT_ACTIVITIES,
  DEFAULT_WORKERS,
} from "./constants/defaults";

import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import SectionTitle from "./components/ui/SectionTitle";

import ManagerMenu from "./features/manager/ManagerMenu";
import ManagerPlanner from "./features/manager/ManagerPlanner";
import OrgBoard from "./features/manager/OrgBoard";
import CatalogueManager from "./features/manager/CatalogueManager";
import CapoHome from "./features/capo/CapoHome";

import ErrorBoundary from "./components/ErrorBoundary";
import { t } from "./lib/i18n";
import { safeInitOffline } from "./lib/offline";
import { getSessionSafe } from "./lib/supabase";

// Désactive SW (évite écran noir iOS si cache corrompu)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
}

export default function App() {
  // ---- Stato locale/Cache (caricati da localStorage via util) ----
  const [tasks, setTasks] = useState(() => loadJSON(KEYS.TASKS, DEFAULT_TASKS));
  const [impianti, setImpianti] = useState(() => loadJSON(KEYS.IMPIANTI, DEFAULT_IMPIANTI));
  const [activities, setActivities] = useState(() => loadJSON(KEYS.ACTIVITIES, DEFAULT_ACTIVITIES));
  const [workers, setWorkers] = useState(() => loadJSON(KEYS.WORKERS, DEFAULT_WORKERS));

  // ---- Altri stati UI / controllo accesso ----
  const [role, setRole] = useState("capo"); // "manager" | "capo"
  const [isAssigned, setIsAssigned] = useState(false);
  const [booted, setBooted] = useState(false);

  const bypass = import.meta.env.VITE_BYPASS_ASSIGNMENT === "true";
  const readOnly = useMemo(() => !isAssigned && bypass, [isAssigned, bypass]);

  // ---- Bootstrap sicuro (non blocca il rendering) ----
  useEffect(() => {
    (async () => {
      await safeInitOffline();
      await getSessionSafe().catch(() => null);
      // TODO: sostituire con check reale su Supabase (assegnazioni del giorno)
      setIsAssigned(false);
      setBooted(true);
    })();
  }, []);

  // ---- Persistenza locale ogni volta che cambiano i dati ----
  useEffect(() => saveJSON(KEYS.TASKS, tasks), [tasks]);
  useEffect(() => saveJSON(KEYS.IMPIANTI, impianti), [impianti]);
  useEffect(() => saveJSON(KEYS.ACTIVITIES, activities), [activities]);
  useEffect(() => saveJSON(KEYS.WORKERS, workers), [workers]);

  if (!booted) return null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#111] text-white">
        {/* HEADER */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="text-2xl font-extrabold">{t("appName")}</div>
          <div className="text-xs opacity-60 ml-2">{t("syncing")} · {t("offline")}</div>

          <div className="ml-auto flex gap-2">
            <button
              className={`px-3 py-1 rounded-full border ${role === "manager" ? "bg-white text-black" : "bg-transparent"}`}
              onClick={() => setRole("manager")}
            >
              {t("role_manager")}
            </button>
            <button
              className={`px-3 py-1 rounded-full border ${role === "capo" ? "bg-white text-black" : "bg-transparent"}`}
              onClick={() => setRole("capo")}
            >
              {t("role_capo")}
            </button>
          </div>
        </header>

        {/* GUARD DI ACCESSO */}
        {!isAssigned && !bypass ? (
          <div className="mx-4 mt-6 rounded-2xl p-5 bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold">{t("restricted_title")}</h2>
            <p className="opacity-80 mt-1">{t("restricted_msg")}</p>
          </div>
        ) : (
          <>
            {role === "manager" ? (
              <main className="p-4 space-y-6">
                <SectionTitle title={`${t("appName")} — ${t("role_manager")}`} />
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
                <OrgBoard
                  workers={workers}
                  onWorkersChange={setWorkers}
                />
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
          </>
        )}

        {/* FOOTER */}
        <footer className="px-4 py-10 opacity-60 text-xs">
          © 2025 {t("appName")} — Sync Supabase, cache offline & PDF. Cloud: Supabase
        </footer>
      </div>
    </ErrorBoundary>
  );
}  );
}    loadJSON(KEYS.IMPIANTI, DEFAULT_IMPIANTI)
  );
  const [activities, setActivities] = useState(() =>
    loadJSON(KEYS.ACTIVITIES, DEFAULT_ACTIVITIES)
  );
  const [plan, setPlan] = useState(() => loadJSON(KEYS.PLAN, {}));
  const [status, setStatus] = useState(() => loadJSON(KEYS.STATUS, {}));
  const [reports, setReports] = useState(() => loadJSON(KEYS.REPORT, []));

  const [activeTab, setActiveTab] = useState(() =>
    user?.role === "manager" ? "manager" : "capo"
  );

  const today = new Date();
  const todayKey = isoDayKey(today);
  const range = useMemo(() => weekRange(today), [today]);

  // HYDRATE
  useEffect(() => {
    (async () => {
      try {
        await flushOutbox();

        const w = await fetchWorkers();
        if (w) {
          setWorkers(w);
          saveJSON(KEYS.WORKERS, w);
        }

        const cat = await fetchCatalog();
        if (cat) {
          setTasks(cat.tasks || []);
          setImpianti(cat.impianti || []);
          setActivities(cat.activities || []);
          saveJSON(KEYS.TASKS, cat.tasks || []);
          saveJSON(KEYS.IMPIANTI, cat.impianti || []);
          saveJSON(KEYS.ACTIVITIES, cat.activities || []);
        }

        const p = await fetchPlan(range);
        const mergedPlan = { ...loadJSON(KEYS.PLAN, {}), ...p };
        setPlan(mergedPlan);
        saveJSON(KEYS.PLAN, mergedPlan);

        const s = await fetchStatus();
        if (s) {
          setStatus(s);
          saveJSON(KEYS.STATUS, s);
        }
      } catch (e) {
        console.warn("[hydrate] offline", e?.message || e);
      }
    })();
  }, [range.start, range.end]);

  // REALTIME
  useEffect(() => {
    const unsub = subscribePlan((row) => {
      const { day, payload } = row;
      setPlan((prev) => {
        const next = { ...prev, [day]: payload || {} };
        saveJSON(KEYS.PLAN, next);
        return next;
      });
    });
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  // HELPERS
  async function saveWorkersAll(nextWorkers) {
    setWorkers(nextWorkers);
    saveJSON(KEYS.WORKERS, nextWorkers);
    try {
      await replaceWorkers(nextWorkers);
    } catch {}
  }

  async function saveCatalogAll(nextTasks, nextImpianti, nextActivities) {
    setTasks(nextTasks);
    setImpianti(nextImpianti);
    setActivities(nextActivities);
    saveJSON(KEYS.TASKS, nextTasks);
    saveJSON(KEYS.IMPIANTI, nextImpianti);
    saveJSON(KEYS.ACTIVITIES, nextActivities);
    try {
      await replaceCatalog({
        tasks: nextTasks,
        impianti: nextImpianti,
        activities: nextActivities,
      });
    } catch {}
  }

  async function saveDayPlan(dayKey, data) {
    setPlan((prev) => {
      const next = { ...prev };
      if (data === undefined) delete next[dayKey];
      else next[dayKey] = data;
      saveJSON(KEYS.PLAN, next);
      return next;
    });
    try {
      await upsertDayPlan(dayKey, data);
    } catch {}
  }

  async function saveStatusAll(nextStatus) {
    setStatus(nextStatus);
    saveJSON(KEYS.STATUS, nextStatus);
    try {
      await saveStatusCloud(nextStatus);
    } catch {}
  }

  // RENDER
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            <h1 className="text-2xl font-extrabold">Reportia</h1>
            <span className="text-xs opacity-60">
              — Sync Supabase + Offline
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setDark((v) => !v)}
              title="Toggle theme"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant={activeTab === "manager" ? "primary" : "ghost"}
              onClick={() => setActiveTab("manager")}
            >
              Manager
            </Button>
            <Button
              variant={activeTab === "capo" ? "primary" : "ghost"}
              onClick={() => setActiveTab("capo")}
            >
              Capo
            </Button>
          </div>
        </div>

        {activeTab === "manager" ? (
          <>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Card>
                <SectionTitle
                  title="Menu Manager"
                  subtitle="Actions rapides"
                  right={<Settings className="w-4 h-4 opacity-60" />}
                />
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
