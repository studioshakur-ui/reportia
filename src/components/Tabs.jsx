import React from "react";

const tabs = [
  { id: "catalogue", label: "Catalogue" },
  { id: "manager", label: "Manager" },
  { id: "capo", label: "Capo" },
];

export default function Tabs({ value, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={value === t.id ? "active" : "inactive"}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
