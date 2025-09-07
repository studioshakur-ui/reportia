import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Users, ChevronDown, DoorOpen } from "lucide-react";
import Button from "../../components/ui/Button";

/**
 * Refonte visuelle de l'écran Login :
 * - Segmented control Manager/Capo
 * - Liste des Capi avec recherche
 * - Micro-animations & hiérarchie visuelle claire
 * - Compatible Tailwind (pas d'autres dépendances)
 */
export default function LoginInline({ workers = [], onLogin }) {
  const [role, setRole] = useState("manager"); // valeur par défaut = Manager
  const capi = useMemo(() => workers.filter((w) => w.role === "capo"), [workers]);

  // si on bascule vers "capo", auto-sélection du 1er capo
  const [capoId, setCapoId] = useState("");
  useEffect(() => {
    if (role === "capo" && capi.length && !capoId) setCapoId(capi[0].id);
  }, [role, capi, capoId]);

  const [q, setQ] = useState("");
  const capiFiltered = useMemo(() => {
    if (!q.trim()) return capi;
    const k = q.toLowerCase();
    return capi.filter((c) => c.name.toLowerCase().includes(k));
  }, [capi, q]);

  const connect = () => {
    if (role === "manager") {
      onLogin?.({ role: "manager", id: "manager", name: "Manager" });
      return;
    }
    if (!capoId) return;
    const me = capi.find((c) => c.id === capoId);
    onLogin?.({ role: "capo", id: capoId, name: me?.name || "Capo" });
  };

  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-5 md:p-8 shadow-sm">
      {/* Bandeau marque */}
      <div className="mb-6 flex items-center gap-3">
        <img
          src="/brand.svg"
          alt="Brand"
          className="h-9 w-9 rounded-2xl ring-1 ring-black/10 dark:ring-white/10 object-contain"
          onError={(e) => {
            // fallback discret si pas de logo
            e.currentTarget.style.display = "none";
          }}
        />
        <div>
          <div className="text-lg md:text-xl font-extrabold tracking-tight">Connexion</div>
          <div className="text-sm text-black/60 dark:text-white/60">
            Choisis ton rôle pour accéder au plan et aux rapports.
          </div>
        </div>
      </div>

      {/* Segmented control */}
      <div className="inline-flex rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 p-1">
        <button
          onClick={() => setRole("manager")}
          className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all ${
            role === "manager"
              ? "bg-indigo-600 text-white shadow-[0_6px_20px_rgba(79,70,229,0.35)]"
              : "text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Manager
        </button>
        <button
          onClick={() => setRole("capo")}
          className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all ${
            role === "capo"
              ? "bg-indigo-600 text-white shadow-[0_6px_20px_rgba(79,70,229,0.35)]"
              : "text-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          <Users className="w-4 h-4" />
          Capo Squadra
        </button>
      </div>

      {/* Contenu conditionnel */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {role === "capo" ? "Sélection du Capo" : "Rôle sélectionné"}
          </label>

          {role === "manager" ? (
            <div className="flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-4 py-3 text-sm">
              <ShieldCheck className="w-4 h-4 opacity-70" />
              Manager (accès complet)
            </div>
          ) : (
            <>
              {/* Barre de recherche */}
              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher un Capo…"
                  className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-4 py-2 pr-10 text-sm"
                />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
              </div>

              {/* Select capo */}
              <select
                className="w-full appearance-none rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-4 py-3 pr-10 text-sm"
                value={capoId}
                onChange={(e) => setCapoId(e.target.value)}
              >
                {capiFiltered.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        {/* Encadré d’aide / rassurance */}
        <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/60 dark:bg-indigo-500/10 p-4">
          <div className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
            Accès & permissions
          </div>
          <ul className="text-sm text-indigo-900/80 dark:text-indigo-200/90 list-disc pl-5 space-y-1">
            <li>Manager : planning, organigramme, catalogue.</li>
            <li>Capo : groupes, activités et export PDF.</li>
            <li>Connexion locale (hors réseau) supportée.</li>
          </ul>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-6 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="md"
          onClick={() => {
            setRole("manager");
            setQ("");
          }}
        >
          Réinitialiser
        </Button>
        <Button
          onClick={connect}
          icon={DoorOpen}
          className="animate-[pulse_1.6s_ease-in-out_1]"
        >
          Se connecter
        </Button>
      </div>

      {/* décor discret */}
      <div className="pointer-events-none absolute -z-10 inset-0 bg-[radial-gradient(600px_200px_at_20%_0%,rgba(99,102,241,0.10),transparent),radial-gradient(400px_200px_at_80%_0%,rgba(168,85,247,0.10),transparent)]" />
    </div>
  );
}
