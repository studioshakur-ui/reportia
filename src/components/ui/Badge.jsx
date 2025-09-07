import React from "react";
export default function Badge({ children }) {
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/5 dark:bg-white/10">{children}</span>;
}
