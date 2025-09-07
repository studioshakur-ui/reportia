export default function Card({ className = "", children }) {
  return (
    <div className={`bg-white rounded-xl2 shadow-soft border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, right }) {
  return (
    <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
      <div>
        <div className="h2">{title}</div>
        {subtitle && <div className="muted mt-1">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function CardBody({ className="", children }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ className="", children }) {
  return <div className={`p-4 border-t border-gray-100 ${className}`}>{children}</div>;
}
