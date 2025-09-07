export function formatISODateKey(d: Date | string): string {
  if (typeof d === "string") return d;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type WeekDay = {
  date: Date;
  key: string;          // yyyy-mm-dd
  labelShort: string;   // Lun, Mar...
  ddmmyyyy: string;     // 06/09/2025
};

export function weekdaysFor(date: Date): WeekDay[] {
  const base = new Date(date);
  const day = base.getDay(); // 0=dim
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);

  const labels: readonly string[] = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const out: WeekDay[] = [];

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
