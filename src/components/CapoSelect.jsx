import React from "react";

export default function CapoSelect({ value, onChange, options = [] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: 8,
        borderRadius: 8,
        border: "1px solid #e5e7eb",
      }}
    >
      <option value="">-- Choisir un capo --</option>
      {options.map((c) => (
        <option key={c.id} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
