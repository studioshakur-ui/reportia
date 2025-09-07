import React from "react";

export default function Button({ className = "", children, icon: Icon, variant = "primary", onClick, size = "md", disabled }) {
  const base = "inline-flex items-center gap-2 rounded-2xl font-medium transition-all active:scale-[0.98]";
  const sizes = { sm:"px-3 py-1.5 text-sm", md:"px-4 py-2 text-sm", lg:"px-5 py-3 text-base" };
  const variants = {
    primary: "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-[0_8px_30px_rgba(79,70,229,0.35)] hover:brightness-110",
    ghost:   "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border border-white/10",
    outline: "bg-white/60 dark:bg-white/5 backdrop-blur border border-black/10 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10",
    danger:  "bg-rose-600 text-white hover:brightness-110",
    success: "bg-emerald-600 text-white shadow-[0_8px_30px_rgba(16,185,129,0.35)]",
  };
  return (
    <button disabled={disabled} onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-60 cursor-not-allowed":""} ${className}`}>
      {Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}
