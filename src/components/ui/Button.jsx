export default function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl2 font-medium transition active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none";
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-soft",
    ghost: "bg-surface hover:bg-bg text-text border border-black/10",
    outline: "bg-transparent border border-black/15 text-text hover:bg-bg",
    subtle: "bg-bg text-text",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft",
    danger: "bg-danger hover:brightness-95 text-white shadow-soft",
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}
