export default function SectionTitle({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-3 p-4 sm:p-0">
      <div className="min-w-0">
        <div className="h1 flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-brand-600" />}
          <span className="truncate">{title}</span>
        </div>
        {subtitle && (
          <p className="mt-1 text-sm" style={{color:"rgb(var(--muted))"}}>{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}
