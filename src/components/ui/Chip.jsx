export default function Chip({ label, className = "" }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border border-gray-200 bg-surface-100 px-3 py-1 text-xs font-medium text-gray-700 ${className}`}>
      {label}
    </span>
  );
}
