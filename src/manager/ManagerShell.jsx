import React, { useState } from "react";
import ManagerPlanning from "./Planning.jsx";
import ManagerOrg from "./Organigram.jsx";
import Catalogue from "../pages/Catalogue.jsx";

export default function ManagerShell() {
  const [tab, setTab] = useState("planning"); // planning | org | catalogue

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Navigation Manager">
        <button role="tab" aria-selected={tab==="planning"} className={tab==="planning"?"active":"inactive"} onClick={()=>setTab("planning")}>
          Planning
        </button>
        <button role="tab" aria-selected={tab==="org"} className={tab==="org"?"active":"inactive"} onClick={()=>setTab("org")}>
          Organigramme
        </button>
        <button role="tab" aria-selected={tab==="catalogue"} className={tab==="catalogue"?"active":"inactive"} onClick={()=>setTab("catalogue")}>
          Catalogue
        </button>
      </div>

      {tab === "planning" && <ManagerPlanning />}
      {tab === "org" && <ManagerOrg />}
      {tab === "catalogue" && <Catalogue />}
    </>
  );
}
