interface StatusBadgeProps {
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  IDLE: 'Idle',
  STARTING: 'Starting',
  RUNNING: 'Running',
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
  STOPPED: 'Stopped',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = status.toLowerCase();
  return (
    <span className={`status-badge status-${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
