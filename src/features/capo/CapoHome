// src/features/capo/CapoHome.jsx
import React, { useEffect, useState } from "react";
import { t } from "../../lib/i18n";
import { supabase } from "../../lib/supabase";

export default function CapoHome({ readOnly }) {
  const [navi, setNavi] = useState([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase()
        .from("ships")
        .select("*")
        .order("year", { ascending: true });
      if (!error && data) setNavi(data);
      else console.warn(error);
    })();
  }, []);

  return (
    <div className="p-4">
      {readOnly && (
        <div className="mb-3 text-xs opacity-70">{t("readonly")}</div>
      )}

      <h2 className="text-2xl font-bold mb-4">{t("ships_title")}</h2>

      {navi.length === 0 ? (
        <p className="opacity-70">{t("ships_empty")}</p>
      ) : (
        <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
          {navi.map((ship) => (
            <div
              key={ship.id}
              className="rounded-2xl overflow-hidden border border-white/10"
            >
              <img
                src={ship.image_url}
                alt={ship.name}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <div className="font-semibold">{ship.name}</div>
                <div className="text-xs opacity-70">
                  {ship.class} · {ship.year} · {ship.yard}
                </div>
                <p className="text-sm mt-2 opacity-85">{ship.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
