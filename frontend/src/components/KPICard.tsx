interface KPICardProps {
  label: string;
  value: string | number;
  icon: string;
  color: 'indigo' | 'cyan' | 'violet' | 'emerald';
}

export default function KPICard({ label, value, icon, color }: KPICardProps) {
  return (
    <div className={`kpi-card ${color}`}>
      <div className={`kpi-icon ${color}`}>{icon}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
