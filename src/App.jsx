// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Sun, Moon, Settings, ClipboardList } from "lucide-react";
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
import WorkersAdmin from "./features/manager/WorkersAdmin";

import CapoPanel from "./features/capo/CapoPanel";

import {
  supabase,
  flushOutbox,
  fetchWorkers,
  replaceWorkers,
  fetchCatalog,
  replaceCatalog,
  fetchPlan,
  upsertDayPlan,
  fetchStatus,
  saveStatus as saveStatusCloud,
  saveReport,
  subscribePlan,
} from "./lib/supabase";

function weekRange(date = new Date()) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: isoDayKey(start), end: isoDayKey(end) };
}

export default function App() {
  // THEME
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // USER
  const [user, setUser] = useState(() => loadJSON(KEYS.USER, { role: "capo", name: "Capo" }));

  // DATA (cache local + cloud)
  const [workers, setWorkers] = useState(() => loadJSON(KEYS.WORKERS, DEFAULT_WORKERS));
  const [tasks, setTasks] = useState(() => loadJSON(KEYS.TASKS, DEFAULT_TASKS));
  const [impianti, setImpianti] = useState(() => loadJSON(KEYS.IMPIANTI, DEFAULT_IMPIANTI));
  const [activities, setActivities] = useState(() => loadJSON(KEYS.ACTIVITIES, DEFAULT_ACTIVITIES));
  const [plan, setPlan] = useState(() => loadJSON(KEYS.PLAN, {}));
  const [status, setStatus] = useState(() => loadJSON(KEYS.STATUS, {}));
  const [reports, setReports] = useState(() => loadJSON(KEYS.REPORT, []));

  // VIEW
  const [activeTab, setActiveTab] = useState(() => (user?.role === "manager" ? "manager" : "capo"));

  const today = new Date();
  const todayKey = isoDayKey(today);
  const range = useMemo(() => weekRange(today), [today]);

  // ------------------- HYDRATE -------------------
  useEffect(() => {
    (async () => {
      try {
        await flushOutbox();

        const w = await fetchWorkers();
        if (w) { setWorkers(w); saveJSON(KEYS.WORKERS, w); }

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
        setPlan(mergedPlan); saveJSON(KEYS.PLAN, mergedPlan);

        const s = await fetchStatus();
        if (s) { setStatus(s); saveJSON(KEYS.STATUS, s); }
      } catch (e) {
        console.warn("[hydrate] offline (cache local)", e?.message || e);
      }
    })();
  }, [range.start, range.end]);

  // ------------------- REALTIME (plan) ---------------
  useEffect(() => {
    const unsub = subscribePlan((row) => {
      const { day, payload } = row;
      setPlan((prev) => {
        const next = { ...prev, [day]: payload || {} };
        saveJSON(KEYS.PLAN, next);
        return next;
      });
    });
    return () => { if (typeof unsub === "function") unsub(); };
  }, []);

  // ------------------- WRITE-THROUGH HELPERS ----------
  async function saveWorkersAll(nextWorkers) {
    setWorkers(nextWorkers); saveJSON(KEYS.WORKERS, nextWorkers);
    try { await replaceWorkers(nextWorkers); } catch {}
  }

  async function saveCatalogAll(nextTasks, nextImpianti, nextActivities) {
    setTasks(nextTasks); setImpianti(nextImpianti); setActivities(nextActivities);
    saveJSON(KEYS.TASKS, nextTasks);
    saveJSON(KEYS.IMPIANTI, nextImpianti);
    saveJSON(KEYS.ACTIVITIES, nextActivities);
    try { await replaceCatalog({ tasks: nextTasks, impianti: nextImpianti, activities: nextActivities }); } catch {}
  }

  async function saveDayPlan(dayKey, payload) {
    const next = { ...plan, [dayKey]: payload };
    setPlan(next); saveJSON(KEYS.PLAN, next);
    try { await upsertDayPlan(dayKey, payload); } catch {}
  }

  async function saveStatusAll(nextStatus) {
    setStatus(nextStatus); saveJSON(KEYS.STATUS, nextStatus);
    try { await saveStatusCloud(nextStatus); } catch {}
  }

  // ------------------- RENDER -------------------
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            <h1 className="text-2xl font-extrabold">Reportia</h1>
            <span className="text-xs opacity-60">— Sync Supabase + Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setDark((v) => !v)} title="Toggle theme">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant={activeTab === "manager" ? "primary" : "ghost"} onClick={() => setActiveTab("manager")}>Manager</Button>
            <Button variant={activeTab === "capo" ? "primary" : "ghost"} onClick={() => setActiveTab("capo")}>Capo</Button>
          </div>
        </div>

        {activeTab === "manager" ? (
          <>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Card>
                <SectionTitle title="Menu Manager" subtitle="Actions rapides" right={<Settings className="w-4 h-4 opacity-60" />} />
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
                  setUser={(u) => { setUser(u); saveJSON(KEYS.USER, u); }}
                />
              </Card>

              <Card>
                <SectionTitle title="Organigramme" subtitle="Drag & drop" />
                <OrgBoard
                  workers={workers}
                  setWorkers={saveWorkersAll}
                />
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <SectionTitle title="Planning Semaine" subtitle={`${range.start} → ${range.end}`} />
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
                <SectionTitle title="Catalogue" subtitle="Tâches, Impianti, Activités" />
                <CatalogueManager
                  tasks={tasks} setTasks={(t)=>saveCatalogAll(t, impianti, activities)}
                  impianti={impianti} setImpianti={(i)=>saveCatalogAll(tasks, i, activities)}
                  activities={activities} setActivities={(a)=>saveCatalogAll(tasks, impianti, a)}
                />
              </Card>

              <Card>
                <SectionTitle title="Personnel" subtitle="Capi & Operai" />
                <WorkersAdmin
                  workers={workers}
                  setWorkers={saveWorkersAll}
                />
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6">
              <CapoPanel
                todayKey={todayKey}
                plan={plan}
                workers={workers}
                user={user}
                reports={reports}
                setReports={(r) => { setReports(r); saveJSON(KEYS.REPORT, r); }}
                tasks={tasks}
                impianti={impianti}
                activities={activities}
                status={status}
                setStatus={(s) => saveStatusAll(s)}
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-10 text-xs text-black/60 dark:text-white/60 flex flex-wrap items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} Reportia — Sync Supabase, cache offline & PDF.</div>
          {supabase ? <div className="opacity-70">Cloud: Supabase</div> : <div className="opacity-70">Cloud: Offline (vars manquantes)</div>}
        </div>
      </div>
    </div>
  );
}  const [activeTab, setActiveTab] = useState(() => (user?.role === "manager" ? "manager" : "capo"));

  const today = new Date();
  const todayKey = isoDayKey(today);
  const range = useMemo(() => weekRange(today), [today]);

  // ------------------- BOOTSTRAP / HYDRATE -------------------
  useEffect(() => {
    (async () => {
      try {
        // tente un flush des actions offline au boot
        await flushOutbox();

        // WORKERS (cloud → local)
        const w = await fetchWorkers();
        if (w) {
          setWorkers(w);
          saveJSON(KEYS.WORKERS, w);
        }

        // CATALOG (tasks/impianti/activities) (cloud → local)
        const cat = await fetchCatalog();
        if (cat) {
          setTasks(cat.tasks || []);
          setImpianti(cat.impianti || []);
          setActivities(cat.activities || []);
          saveJSON(KEYS.TASKS, cat.tasks || []);
          saveJSON(KEYS.IMPIANTI, cat.impianti || []);
          saveJSON(KEYS.ACTIVITIES, cat.activities || []);
        }

        // PLAN de la semaine (cloud → local merge)
        const p = await fetchPlan(range);
        const mergedPlan = { ...loadJSON(KEYS.PLAN, {}), ...p };
        setPlan(mergedPlan);
        saveJSON(KEYS.PLAN, mergedPlan);

        // STATUS global
        const s = await fetchStatus();
        if (s) {
          setStatus(s);
          saveJSON(KEYS.STATUS, s);
        }
      } catch (e) {
        // offline → on garde le cache local
        console.warn("[hydrate] offline/local cache", e?.message || e);
      }
    })();
  }, [range.start, range.end]);

  // Realtime plan
  useEffect(() => {
    const unsubscribe = subscribePlan((row) => {
      setPlan((prev) => {
        const next = { ...prev, [row.day]: row.payload || {} };
        saveJSON(KEYS.PLAN, next);
        return next;
      });
    });
    return () => unsubscribe?.();
  }, []);

  // ------------------- WRITE-THROUGH HELPERS -----------------
  async function saveWorkersAll(nextWorkers) {
    setWorkers(nextWorkers);
    saveJSON(KEYS.WORKERS, nextWorkers);
    try { await replaceWorkers(nextWorkers); } catch { /* queued in outbox */ }
  }
  async function saveCatalogAll(nextTasks, nextImpianti, nextActivities) {
    setTasks(nextTasks);
    setImpianti(nextImpianti);
    setActivities(nextActivities);
    saveJSON(KEYS.TASKS, nextTasks);
    saveJSON(KEYS.IMPIANTI, nextImpianti);
    saveJSON(KEYS.ACTIVITIES, nextActivities);
    try { await replaceCatalog({ tasks: nextTasks, impianti: nextImpianti, activities: nextActivities }); } catch {}
  }
  async function saveDayPlan(dayKey, payload) {
    const next = { ...plan, [dayKey]: payload };
    setPlan(next);
    saveJSON(KEYS.PLAN, next);
    try { await upsertDayPlan(dayKey, payload); } catch { /* outbox */ }
  }
  async function saveStatusAll(nextStatus) {
    setStatus(nextStatus);
    saveJSON(KEYS.STATUS, nextStatus);
    try { await saveStatusCloud(nextStatus); } catch {}
  }

  // ------------------- UI -------------------
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            <h1 className="text-2xl font-extrabold">Reportia</h1>
            <span className="text-xs opacity-60">— Sync Supabase + Offline</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setDark((v) => !v)} title="Toggle theme">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant={activeTab === "manager" ? "primary" : "ghost"} onClick={() => setActiveTab("manager")}>Manager</Button>
            <Button variant={activeTab === "capo" ? "primary" : "ghost"} onClick={() => setActiveTab("capo")}>Capo</Button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "manager" ? (
          <>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Card>
                <SectionTitle title="Menu Manager" subtitle="Actions rapides" right={<Settings className="w-4 h-4 opacity-60" />} />
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
                  setUser={(u) => { setUser(u); saveJSON(KEYS.USER, u); }}
                />
              </Card>

              <Card>
                <SectionTitle title="Organigramme" subtitle="Drag & drop" />
                <OrgBoard
                  workers={workers}
                  setWorkers={saveWorkersAll}
                />
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <SectionTitle title="Planning Semaine" subtitle={`${range.start} → ${range.end}`} />
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
                <SectionTitle title="Catalogue" subtitle="Tâches, Impianti, Activités" />
                <CatalogueManager
                  tasks={tasks} setTasks={(t)=>saveCatalogAll(t, impianti, activities)}
                  impianti={impianti} setImpianti={(i)=>saveCatalogAll(tasks, i, activities)}
                  activities={activities} setActivities={(a)=>saveCatalogAll(tasks, impianti, a)}
                />
              </Card>

              <Card>
                <SectionTitle title="Personnel" subtitle="Capi & Operai" />
                <WorkersAdmin
                  workers={workers}
                  setWorkers={saveWorkersAll}
                />
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="mt-6">
              <CapoPanel
                todayKey={todayKey}
                plan={plan}
                workers={workers}
                user={user}
                reports={reports}
                setReports={(r) => { setReports(r); saveJSON(KEYS.REPORT, r); }}
                tasks={tasks}
                impianti={impianti}
                activities={activities}
                status={status}
                setStatus={(s) => saveStatusAll(s)}
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-10 text-xs text-black/60 dark:text-white/60 flex flex-wrap items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} Reportia — Sync Supabase, cache offline & PDF.</div>
          {supabase ? <div className="opacity-70">Cloud: Supabase</div> : <div className="opacity-70">Cloud: Offline (vars manquantes)</div>}
        </div>
      </div>
    </div>
  );
}        if (data === undefined) delete next[day];
        else next[day] = data;
        saveJSON(KEYS.PLAN, next);
        return next;
      });
    });
    return unsub;
  }, []);

  const todayKey = isoDayKey(new Date());

  // Helpers
  const logout = () => {
    setUser(null); saveJSON(KEYS.USER, null); setView("capo");
  };

  // setter plan -> upsert serveur + cache local (optimistic)
  const setPlanForDay = (day, data) => {
    setPlan(prev => {
      const next = { ...prev, [day]: data };
      saveJSON(KEYS.PLAN, next);
      return next;
    });
    upsertPlanDay(day, data);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[radial-gradient(900px_520px_at_10%_-10%,rgba(99,102,241,0.10),transparent),radial-gradient(700px_420px_at_90%_-10%,rgba(168,85,247,0.10),transparent)] dark:bg-[radial-gradient(900px_520px_at_10%_-10%,rgba(99,102,241,0.16),transparent),radial-gradient(700px_420px_at_90%_-10%,rgba(168,85,247,0.16),transparent)] text-neutral-900 dark:text-neutral-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8">

        {/* Topbar */}
        <div className="flex items-center justify-between gap-2 md:gap-3 mb-4 md:mb-8 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shrink-0" />
            <div className="min-w-0">
              <div className="font-extrabold tracking-tight text-lg md:text-xl">Naval Planner</div>
              <div className="text-xs text-black/60 dark:text-white/60 truncate">
                Manager (planning & organigramme) • Capo (groupes + PDF) • Catalogue
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" icon={Sun} onClick={() => setDark(false)} />
            <Button variant="outline" size="sm" icon={Moon} onClick={() => setDark(true)} />
            {user?.role === "manager" && (
              <ExcelImporter
                onWorkers={(list) => { setWorkers(list); saveJSON(KEYS.WORKERS, list); }}
              />
            )}
            {user ? (
              <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>Se déconnecter</Button>
            ) : null}
            <Button variant="ghost" size="sm" icon={Settings}>Paramètres</Button>
          </div>
        </div>

        {/* Auth */}
        {!user && (
          <Card>
            <SectionTitle title="Connexion" subtitle="Choisis ton rôle." />
            <LoginInline
              workers={workers}
              onLogin={(u) => {
                setUser(u); saveJSON(KEYS.USER, u);
                setView(u.role === "manager" ? "m-planning" : "capo");
              }}
            />
          </Card>
        )}

        {user && (
          <>
            {/* Navigation */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {user.role === "manager" && (
                <ManagerMenu current={view} onSelect={(v) => setView(v)} />
              )}
              <button
                onClick={() => setView("capo")}
                className={`px-4 py-2 rounded-2xl text-sm border ${
                  view === "capo"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-neutral-900 border-black/10 dark:border-white/10"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Capo
                </span>
              </button>
            </div>

            {/* Views */}
            <div className="space-y-6">
              {user.role === "manager" && view === "m-catalogue" && (
                <>
                  <CatalogueManager
                    tasks={tasks} setTasks={setTasks}
                    impianti={impianti} setImpianti={setImpianti}
                    activities={activities} setActivities={setActivities}
                  />
                  <WorkersAdmin workers={workers} setWorkers={setWorkers} />
                </>
              )}

              {user.role === "manager" && view === "m-organigram" && (
                <OrgBoard
                  workers={workers}
                  plan={plan}
                  setPlan={(next)=>{ setPlan(next); saveJSON(KEYS.PLAN, next); }}
                  tasks={tasks}
                  impianti={impianti}
                  isManager
                />
              )}

              {user.role === "manager" && view === "m-planning" && (
                <ManagerPlanner
                  weekStart={startOfWeek()}
                  plan={plan}
                  setPlanForDay={setPlanForDay}
                  workers={workers}
                  tasks={tasks}
                  impianti={impianti}
                />
              )}

              {view === "capo" && (
                <CapoPanel
                  todayKey={todayKey}
                  plan={plan}
                  workers={workers}
                  user={user}
                  reports={reports}
                  setReports={(next) => {
                    setReports(next); saveJSON(KEYS.REPORT, next);
                    const row = {
                      id: crypto.randomUUID(),
                      date: new Date().toISOString().slice(0,10),
                      capo: user?.fullName || user?.name || "Capo",
                      plant: null,
                      payload: next[todayKey] || {},
                      updated_at: new Date().toISOString(),
                    };
                    saveReport(row); // offline-first
                  }}
                  tasks={tasks}
                  impianti={impianti}
                  activities={activities}
                  status={status}
                  setStatus={(s) => { setStatus(s); saveJSON(KEYS.STATUS, s); }}
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
