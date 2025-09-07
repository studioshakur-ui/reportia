import Card, { CardBody, CardFooter, CardHeader } from "./ui/Card";
import Button from "./ui/Button";
import Chip from "./ui/Chip";

export default function GroupCard({
  title = "Groupe",
  activity,
  members = [],
  onAddMember,
  onRemoveMember,
  onDelete,
  footerRight,
  activitySelect,
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title={title}
        right={
          <div className="flex items-center gap-2">
            {/* action secondaire rangée dans un bouton discret */}
            <Button variant="subtle" onClick={onDelete}>Supprimer</Button>
          </div>
        }
      />
      <CardBody className="space-y-3">
        <div className="space-y-1">
          <div className="muted">Activité (commune)</div>
          {/* activitySelect = <select .../> fourni par le parent */}
          <div className="max-w-full">{activitySelect}</div>
        </div>

        <div className="space-y-2">
          <div className="muted">Membres (operatore)</div>
          <div className="min-h-[56px] rounded-xl2 border border-dashed border-gray-300 p-2 overflow-hidden">
            <div className="flex flex-wrap gap-2">
              {members.length === 0 && (
                <span className="muted">Glisser ici…</span>
              )}
              {members.map((m) => (
                <Chip key={m.id || m} label={m.name || m} />
              ))}
            </div>
          </div>
        </div>
      </CardBody>
      <CardFooter className="flex items-center justify-between gap-2">
        <div className="muted">Tous les membres partagent l’activité.</div>
        {footerRight}
      </CardFooter>
    </Card>
  );
}
