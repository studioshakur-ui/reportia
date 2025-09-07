import { ChevronDown } from "lucide-react";

export default function Select({ className = "", children, ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select
        {...props}
        className="w-full h-11 rounded-xl2 border border-black/10 dark:border-white/10
                   bg-surface text-text pl-3 pr-10 appearance-none"
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60 pointer-events-none" />
    </div>
  );
}
