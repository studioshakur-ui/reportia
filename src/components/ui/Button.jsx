export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl2 font-medium transition active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-soft",
    ghost:
      "bg-white hover:bg-surface-100 text-gray-700 border border-gray-200 shadow-soft",
    subtle:
      "bg-surface-100 hover:bg-surface-200 text-gray-700",
    danger:
      "bg-danger-500 hover:brightness-95 text-white shadow-soft",
    outline:
      "border border-gray-300 hover:bg-surface-100 text-gray-800 bg-white",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
