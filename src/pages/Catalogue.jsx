import React from "react";
import TasksCatalog from "../components/TasksCatalog.jsx";
import ImpiantiCatalog from "../components/ImpiantiCatalog.jsx";

export default function Catalogue({ tasks, setTasks, impianti, setImpianti }) {
  return (
    <div className="grid md:grid-cols-2 gap-6 mt-6">
      <TasksCatalog tasks={tasks} setTasks={setTasks} />
      <ImpiantiCatalog impianti={impianti} setImpianti={setImpianti} />
    </div>
  );
}
