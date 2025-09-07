import React, { useState } from "react";
import Button from "../../components/ui/Button";
import { CalendarDays, Map as MapIcon, Settings, ChevronDown } from "lucide-react";

export default function ManagerMenu({ current, onSelect }) {
  const [open, setOpen] = useState(false);
  const Item = ({ id, icon: Icon, label }) => (
    <button onClick={() => { onSelect(id); setOpen(false); }}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-black/5 dark:hover:bg-white/10 text-left ${current===id ? "bg-black/5 dark:bg-white/10" : ""}`}>
      <Icon className="w-4 h-4 opacity-70" /> {label}
    </button>
  );
  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(v => !v)} className="min-w-[160px] justify-between" icon={Settings}>
        Manager <ChevronDown className="w-4 h-4 opacity-60" />
      </Button>
      {open && (
        <div onMouseLeave={() => setOpen(false)}
          className="absolute z-50 mt-2 w-56 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-lg p-2">
          <Item id="m-planning"   icon={CalendarDays} label="Planning" />
          <Item id="m-organigram" icon={MapIcon}       label="Organigramme" />
          <Item id="m-catalogue"  icon={Settings}      label="Catalogue & Personnel" />
        </div>
      )}
    </div>
  );
}
