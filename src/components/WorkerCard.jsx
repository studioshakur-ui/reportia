import React from "react";

export default function WorkerCard({ worker, onDragStart, setHours }) {
  return (
    <div
      className="card"
      draggable
      onDragStart={(e) => onDragStart(e, worker.id)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>{worker.name}</div>
        <div className="muted">ID: {worker.id}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number"
          min={0}
          max={24}
          value={worker.hours}
          onChange={(e) => setHours(worker.id, Number(e.target.value))}
          style={{
            width: 72,
            padding: 6,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        />
        <span className="muted">h</span>
      </div>
    </div>
  );
}
