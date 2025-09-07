import Card, { CardBody, CardHeader } from "./ui/Card";
import Button from "./ui/Button";

export default function RoleSelect({ value, onChange, onConfirm }) {
  const roles = [
    { key: "manager", label: "Manager", desc: "Planning, organigramme, catalogue." },
    { key: "capo", label: "Capo Squadra", desc: "Groupes, activités, export PDF." },
  ];
  return (
    <div className="page py-6">
      <Card>
        <CardHeader title="Connexion" subtitle="Choisis ton rôle pour accéder au plan et aux rapports." />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roles.map(r => {
              const selected = value === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => onChange(r.key)}
                  className={`text-left rounded-xl2 border p-4 transition ${selected ? "border-brand-400 bg-brand-50" : "border-gray-200 hover:bg-surface-100"}`}
                >
                  <div className="font-semibold">{r.label}</div>
                  <div className="muted mt-1">{r.desc}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex gap-2">
            <Button onClick={onConfirm}>Se connecter</Button>
            <Button variant="outline" onClick={() => onChange(null)}>Réinitialiser</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
