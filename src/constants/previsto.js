// src/constants/previsto.js
// "Previsto a persona": quantité prévue par activité (affichage & valeur)
export const PREVISTO = {
  "Stesura cavi alimento": { qty: 350, unit: "mt" },
  "Montaggio utenze":      { qty: 24,  unit: "pz" },
  // Exemple composite : on laisse un display texte si c'est mixte
  "Stesura cucito":        { display: "20 pz + 300 mt" },
  "Collegamenti utenze":   { qty: 40,  unit: "cavi" },
};

// Utilitaires
export function previstoFor(label) {
  const p = PREVISTO[label];
  if (!p) return { display: "", qtyNum: null, unit: "" };
  if (typeof p.display === "string") return { display: p.display, qtyNum: null, unit: "" };
  if (typeof p.qty === "number")     return { display: `${p.qty} ${p.unit||""}`.trim(), qtyNum: p.qty, unit: p.unit||"" };
  return { display: "", qtyNum: null, unit: "" };
}

// Essai de parsing numérique à partir d'une "quantité (fatto)" comme "280 mt" → {qtyNum:280, unit:"mt"}
export function parseQtyDisplay(s) {
  if (!s) return { qtyNum: null, unit: "" };
  const m = String(s).trim().match(/^(-?\d+(?:[.,]\d+)?)\s*([a-zA-Z]*)/);
  if (!m) return { qtyNum: null, unit: "" };
  const qtyNum = Number(String(m[1]).replace(",", "."));
  const unit = (m[2]||"").toLowerCase();
  return { qtyNum: isNaN(qtyNum) ? null : qtyNum, unit };
}
