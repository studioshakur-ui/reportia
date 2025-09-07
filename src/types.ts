export type TeamMember = {
  id: string;
  name: string;
  hours: number;
  activity?: string;
  qty?: number;
};

export type DayCapoPlan = {
  dayKey: string;            // "2025-09-06"
  capoName: string;          // ex: "MAIGA HAMIDOU"
  taskId: string;            // id de la tâche
  impianto: string;          // ex: "IMPLM"
  includeCapo: boolean;      // si vrai, capo compte 8h par défaut
  team: TeamMember[];        // équipe décidée par le manager
  closedByManager?: boolean; // verrouillage de l’équipe par le manager
  sentByCapo?: boolean;      // le capo a envoyé son rapport
  updatedAt?: number;
};
