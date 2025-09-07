import React from "react";

export default function SectionTitle({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
      <div className="flex items-center gap-3">
        {Icon ? <div className="p-2 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400"><Icon className="w-5 h-5" /></div> : null}
        <div>
          <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-black/60 dark:text-white/60">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}
