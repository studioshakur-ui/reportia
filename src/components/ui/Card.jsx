import React from "react";
export default function Card({ children, className = "" }) {
  return (
    <div className={`rounded-3xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 backdrop-blur p-4 md:p-6 shadow-sm ${className}`}>{children}</div>
  );
}
