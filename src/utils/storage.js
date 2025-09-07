export function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
export function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// yyyy-mm-dd
export function formatISODateKey(d) {
  if (typeof d === "string") return d;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// semaine (lun→dim) autour d'une date
export function weekdaysFor(date) {
  const base = new Date(date);
  const day = base.getDay(); // 0=dim
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);

  const out = [];
  const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const key = formatISODateKey(d);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    out.push({ date: d, key, labelShort: labels[i], ddmmyyyy: `${dd}/${mm}/${yyyy}` });
  }
  return out;
}
