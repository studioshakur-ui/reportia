// src/constants/defaults.js
import slug from "../Lib/slug";

export const DEFAULT_TASKS = [
  { id: "stesura",  label: "Stesura alimenti", defaultTeamSize: 2 },
  { id: "cablaggio",label: "Cablaggio cabine", defaultTeamSize: 3 },
  { id: "supporto", label: "Supporto IMPLM",   defaultTeamSize: 2 },
  { id: "quadri",   label: "Quadri/220V test", defaultTeamSize: 2 },
];

export const DEFAULT_IMPIANTI = ["IMPLM", "SDCN", "Cabine", "Quadri", "Altro"];

export const DEFAULT_ACTIVITIES = [
  { id: "mont-lampade", label: "Montaggio lampade", unit: "pz" },
  { id: "mont-prese",   label: "Montaggio prese",   unit: "pz" },
  { id: "coll-lampade", label: "Collegamenti lampade", unit: "pz" },
  { id: "coll-prese",   label: "Collegamenti prese",   unit: "pz" },
  { id: "stesura",      label: "Stesura cavi/alimenti", unit: "m" },
  { id: "altro",        label: "Autre", unit: "" },
];

// NB: Massimo Coccolone supprimé
export const DEFAULT_WORKERS = [
  { id: slug("MAIGA HAMIDOU"),        name: "MAIGA HAMIDOU",        role: "capo" },
  { id: slug("MOGAVERO GIANPIERO"),   name: "MOGAVERO GIANPIERO",   role: "capo" },
  { id: slug("GIUNTA CARMELO"),       name: "GIUNTA CARMELO",       role: "capo" },
  { id: slug("SCICOLONE MASSIMO"),    name: "SCICOLONE MASSIMO",    role: "capo" },

  { id: "diallo",     name: "Diallo",            role: "operaio" },
  { id: "rossi",      name: "Rossi",             role: "operaio" },
  { id: "traore",     name: "Traoré",            role: "operaio" },
  { id: "ndiaye",     name: "Ndiaye",            role: "operaio" },
];

export const DAYS_ORDER = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
