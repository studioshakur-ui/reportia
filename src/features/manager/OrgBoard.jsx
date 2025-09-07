import { useMemo, useState } from "react";
import DndProvider from "../../components/dnd/DndProvider";
import SortableItem from "../../components/dnd/SortableItem";
import Card, { CardHeader, CardBody } from "../../components/ui/Card";

/**
 * Props attendues :
 * - groups: [{ id:'A', title:'A', memberIds:['w1','w2'] }, ...]
 * - setGroups: (next) => void
 * - workers: [{id, name}, ...]  (ou map id->name, adapter si besoin)
 */
export default function OrgBoard({ groups, setGroups, workers }) {
  const idToWorker = useMemo(() => {
    const map = new Map();
    (workers || []).forEach(w => map.set(w.id || w, w.name || w));
    return map;
  }, [workers]);

  // items = tous les ids d'items et de colonnes (pour DnD scope)
  const allItemIds = groups.flatMap(g => g.memberIds);
  const [dragState, setDragState] = useState({ fromGroup: null });

  function moveBetween(groupsState, activeId, overId) {
    // Trouver source et destination
    let fromIdx = -1, toIdx = -1;
    let fromGroup = null, toGroup = null;

    groupsState.forEach((g, gi) => {
      const i = g.memberIds.indexOf(activeId);
      if (i !== -1) { fromIdx = i; fromGroup = g; }
      if (g.memberIds.includes(overId)) { toGroup = g; }
    });

    if (!fromGroup) return groupsState;

    // Si on drop sur une colonne vide (overId = id colonne), prévoir un dropzone id
    if (!toGroup) {
      // try: si overId est un id de colonne
      toGroup = groupsState.find(g => g.id === overId) || fromGroup;
    }

    // Si même colonne => la logique de tri intra-colonne sera gérée ailleurs
    if (fromGroup.id === toGroup.id) return groupsState;

    const next = groupsState.map(g => ({ ...g, memberIds: [...g.memberIds] }));
    // retirer de la source
    next.find(g => g.id === fromGroup.id).memberIds.splice(fromIdx, 1);
    // ajouter en fin de destination
    next.find(g => g.id === toGroup.id).memberIds.push(activeId);
    return next;
  }

  function reorderInSameGroup(groupsState, groupId, activeId, overId) {
    const grp = groupsState.find(g => g.id === groupId);
    if (!grp) return groupsState;
    const cur = [...grp.memberIds];
    const oldIndex = cur.indexOf(activeId);
    const newIndex = cur.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return groupsState;
    cur.splice(newIndex, 0, cur.splice(oldIndex, 1)[0]);
    return groupsState.map(g => g.id === groupId ? { ...g, memberIds: cur } : g);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-hidden">
      {groups.map(col => (
        <Card key={col.id} className="min-w-0">
          <CardHeader title={`Équipe ${col.title || col.id}`} />
          <CardBody>
            {/* Zone colonne = SortableContext implicite via DndProvider au-dessus */}
            <DndProvider
              items={col.memberIds}
              onChange={(e) => {
                const { active, over } = e;
                if (!over) return;
                const activeId = active.id;
                const overId = over.id;

                // Sur mobile, on ne sait pas toujours d'où vient l'item :
                // On mémorise le groupe source au start si besoin (exercice avancé).
                // Ici on détecte par recherche :
                const fromGroup = groups.find(g => g.memberIds.includes(activeId));
                const toGroup = groups.find(g => g.memberIds.includes(overId)) || groups.find(g => g.id === overId);

                let next = groups;

                if (fromGroup && toGroup && fromGroup.id === toGroup.id) {
                  // ré-ordonnancement dans la même colonne
                  next = reorderInSameGroup(groups, fromGroup.id, activeId, overId);
                } else {
                  // déplacement entre colonnes
                  next = moveBetween(groups, activeId, overId);
                }

                setGroups(next);
              }}
              renderItem={() => (
                <div className="space-y-2">
                  {/* Dropzone vide = permettre le drop sur la colonne elle-même */}
                  {col.memberIds.length === 0 && (
                    <SortableItem id={col.id}>
                      <div className="h-12 rounded-xl2 border border-dashed border-gray-300 grid place-items-center text-xs text-gray-500">
                        Glisser ici…
                      </div>
                    </SortableItem>
                  )}

                  {col.memberIds.map((wid) => (
                    <SortableItem key={wid} id={wid}>
                      <div className="drag-handle rounded-xl2 border border-gray-200 bg-white px-3 py-2 text-sm shadow-soft flex items-center justify-between">
                        <span className="truncate">{idToWorker.get(wid) || wid}</span>
                        <span className="text-xs text-gray-500">≡</span>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              )}
              renderOverlay={(id) => (
                <div className="rounded-xl2 border border-gray-200 bg-white px-3 py-2 text-sm shadow-soft">
                  {idToWorker.get(id) || id}
                </div>
              )}
            />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
