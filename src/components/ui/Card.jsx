export default function Card({ className = "", children }) {
  return (
    <div className={`bg-surface rounded-xl2 shadow-soft border border-black/5 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, right }) {
  return (
    <div className="p-4 border-b border-black/5 flex items-center justify-between gap-3">
      <div>
        {title && <div className="h2">{title}</div>}
        {subtitle && <div className="mt-1 text-sm" style={{color:"rgb(var(--muted))"}}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function CardBody({ className="", children }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ className="", children }) {
  return <div className={`p-4 border-t border-black/5 ${className}`}>{children}</div>;
}
