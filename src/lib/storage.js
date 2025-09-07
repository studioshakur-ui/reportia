export const KEYS = {
  PLAN: "planner.mgr.plan.v1",
  REPORT: "planner.capo.reports.v1",
  WORKERS: "planner.workers.v1",
  USER: "planner.auth.user.v1",
  GROUPS: "planner.orgchart.groups.v1",
  TASKS: "planner.catalog.tasks.v1",
  IMPIANTI: "planner.catalog.impianti.v1",
  ACTIVITIES: "planner.catalog.activities.v1",
  STATUS: "planner.capo.status.v1",
};

export function loadJSON(k, fallback){ try{ const r=localStorage.getItem(k); return r?JSON.parse(r):fallback; }catch{ return fallback; } }
export function saveJSON(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} }
