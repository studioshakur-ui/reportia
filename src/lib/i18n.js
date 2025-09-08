const it = {
  appName: "Reportia",
  role_manager: "Responsabile",
  role_capo: "Caposquadra",
  syncing: "Sync Supabase",
  offline: "Offline",
  restricted_title: "Accesso ristretto",
  restricted_msg: "Questa giornata non è assegnata alla tua squadra.",
  readonly: "Modalità sola lettura — giornata non assegnata.",
  error_title: "Qualcosa è andato storto",
  error_hint: "Ricarica la pagina. I dati locali rimangono intatti.",
  ships_title: "Navi progettate/costruite a Monfalcone",
  ships_empty: "Nessuna nave trovata.",
  pdf: "Esporta PDF",
  sync_now: "Sincronizza ora",
};

export function t(key){
  return it[key] ?? key;
}
