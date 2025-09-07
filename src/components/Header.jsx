import Button from "./ui/Button";

export default function Header({ onToggleTheme, onOpenSettings }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-gray-200">
      <div className="page py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl2 bg-brand-600 text-white grid place-items-center font-bold">NP</div>
          <div className="h2">Naval Planner</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="subtle" onClick={onToggleTheme}>Thème</Button>
          <Button variant="ghost" onClick={onOpenSettings}>Paramètres</Button>
        </div>
      </div>
    </header>
  );
}
