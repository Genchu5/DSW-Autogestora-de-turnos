import "../CRUDSLabel.css";

interface ProvinceLabelProps {
  name: string;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  active: boolean;
}

export function ProvinceLabel({ name, active }: ProvinceLabelProps) {
  const statusClass = active ? 'green' : 'red';

  return (
    <div className={`crud-label ${statusClass}`}>
      <span className="crud-name">
        <strong>{name}</strong>
      </span>
    </div>
  );
}