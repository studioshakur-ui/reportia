export function startOfWeek(date=new Date()){ const d=new Date(date); const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); d.setHours(0,0,0,0); return d; }
export function addDays(date,n){ const d=new Date(date); d.setDate(d.getDate()+n); return d; }
export function fmtDate(d){ return d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}); }
export function isoDayKey(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const dd=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${dd}`; }
