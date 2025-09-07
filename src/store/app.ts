import { create } from "zustand";

/** Clé unique d’un plan (par jour + capo) */
export const planKey = (dayKey, capoName) => `${dayKey}__${capoName}`;

export const useAppStore = create((set, get) => ({
  // ----- RÔLES -----
  role: "MANAGER", // "DIRECTION" | "MANAGER" | "CAPO"
  setRole: (r) => set({ role: r }),
  currentCapoName: "MAIGA HAMIDOU",
  setCurrentCapoName: (n) => set({ currentCapoName: n }),

  // ----- CATALOGUE -----
  tasks: [
    { id: "t1", name: "Stesura alimenti", refSize: 2 },
    { id: "t2", name: "Cablaggio cabine", refSize: 3 },
    { id: "t3", name: "Supporto IMPLM", refSize: 2 },
    { id: "t4", name: "Quadri/220V test", refSize: 2 },
  ],
  setTasks: (fn) => set((s) => ({ tasks: fn(s.tasks) })),

  impianti: ["IMPLM", "SDCN", "Cabine", "Quadri", "Altro"],
  setImpianti: (fn) => set((s) => ({ impianti: fn(s.impianti) })),

  capi: [
    { id: "c-maiga", name: "MAIGA HAMIDOU" },
    { id: "c-gianpiero", name: "GIANPIERO" },
    { id: "c-mogavero", name: "MOGAVERO" },
    { id: "c-fabio", name: "FABIO" },
    { id: "c-franco", name: "FRANCO" },
  ],

  // ----- PLANS PAR JOUR+CAPO -----
  plans: {},
  /** Crée / remplace complètement un plan */
  upsertPlan: (p) =>
    set((s) => {
      const k = planKey(p.dayKey, p.capoName);
      return { plans: { ...s.plans, [k]: { ...p, updatedAt: Date.now() } } };
    }),
  /** Patch un plan existant */
  updatePlan: (key, patch) =>
    set((s) => {
      const prev = s.plans[key];
      if (!prev) return {};
      return { plans: { ...s.plans, [key]: { ...prev, ...patch, updatedAt: Date.now() } } };
    }),
  /** Clôture par le Manager (verrouille l’équipe) */
  closeByManager: (key) =>
    set((s) => {
      const prev = s.plans[key];
      if (!prev) return {};
      return { plans: { ...s.plans, [key]: { ...prev, closedByManager: true, updatedAt: Date.now() } } };
    }),
  /** Marque “envoyé” par le Capo (rapport transmis) */
  markSentByCapo: (key) =>
    set((s) => {
      const prev = s.plans[key];
      if (!prev) return {};
      return { plans: { ...s.plans, [key]: { ...prev, sentByCapo: true, updatedAt: Date.now() } } };
    }),
  /** Duplique un plan J-1 → J (même capo) */
  copyFromTo: (fromKey, toKey) =>
    set((s) => {
      const src = s.plans[fromKey];
      if (!src) return {};
      const clone = {
        ...src,
        dayKey: toKey.split("__")[0],
        closedByManager: false,
        sentByCapo: false,
        updatedAt: Date.now(),
      };
      return { plans: { ...s.plans, [toKey]: clone } };
    }),
}));
