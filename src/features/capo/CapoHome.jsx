// src/features/capo/CapoHome.jsx
import React from "react";

/**
 * CapoHome
 * - readOnly: affiche un bandeau "readonly" si true
 * - t: fonction de traduction (optionnelle)
 *
 * Ce composant est minimal pour assurer le build.
 * Tu pourras y remettre ton UI complète ensuite.
 */
export default function CapoHome({ readOnly = false, t = (s) => s }) {
  return (
    <div className="p-4">
      {readOnly && (
        <div className="mb-3 text-xs opacity-70">{t("readonly")}</div>
      )}
      {/* TODO: ajoute ici le contenu de la page Capo si besoin */}
    </div>
  );
}
