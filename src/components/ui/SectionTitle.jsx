export default function SectionTitle({ title, desc, right }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <div className="h2">{title}</div>
        {desc && <p className="muted mt-1">{desc}</p>}
      </div>
      {right}
    </div>
  );
}
