import React from "react";
import { weekdaysFor, formatISODateKey } from "../../utils/dates";

export default function WeekBar({ anchorDate = new Date(), activeKey, onChange }) {
  const days = weekdaysFor(anchorDate);
  return (
    <div className="sticky top-0 z-10 bg-indigo-50/80 backdrop-blur px-1 py-2 border-b">
      <div className="flex gap-2 flex-wrap">
        {days.map((d) => {
          const isActive = d.key === activeKey;
          return (
            <button
              key={d.key}
              onClick={() => onChange(d.key)}
              className={`px-4 py-2 rounded-xl font-semibold ${
                isActive ? "bg-indigo-600 text-white shadow" : "bg-white text-slate-700 border"
              }`}
            >
              <div>{d.labelShort}</div>
              <div className="text-xs opacity-80">{d.ddmmyyyy}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
