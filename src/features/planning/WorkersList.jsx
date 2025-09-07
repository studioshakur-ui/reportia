import React, { useMemo } from "react";
import { FixedSizeList as List } from "react-window";

export default function WorkersList({ workers, onPick, height=320, itemSize=42, filter="" }) {
  const data = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return workers;
    return workers.filter(w => w.name.toLowerCase().includes(q));
  }, [workers, filter]);

  const Row = ({ index, style }) => {
    const w = data[index];
    return (
      <div style={style} className="flex justify-between items-center px-2">
        <span className="truncate">{w.name}</span>
        <button className="btn btn-outline" onClick={() => onPick(w)}>Ajouter</button>
      </div>
    );
  };

  return <List height={height} width={"100%"} itemSize={itemSize} itemCount={data.length} itemData={data}>
    {Row}
  </List>;
}
