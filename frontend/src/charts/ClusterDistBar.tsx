
import { ResponsiveBar } from '@nivo/bar';

interface Props { 
  data: Record<string, number>; 
}

const theme = {
  axis: { ticks: { text: { fill: '#475569', fontSize: 11 } }, legend: { text: { fill: '#64748b' } } },
  grid: { line: { stroke: 'rgba(0,0,0,0.04)' } },
  tooltip: { container: { background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', color: '#1e293b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } },
};

export default function ClusterDistBar({ data }: Props) {
  const formatted = Object.entries(data).map(([k, v]) => ({
    k: `k=${k}`,
    count: v,
  }));

  return (
    <div style={{ height: 280 }}>
      <ResponsiveBar
        data={formatted}
        keys={['count']}
        indexBy="k"
        margin={{ top: 10, right: 20, bottom: 60, left: 48 }}
        padding={0.3}
        colors={['#a78bfa']}
        borderRadius={4}
        axisBottom={{ tickRotation: 0 }}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        enableLabel={false}
        enableGridX={false}
        theme={theme}
        animate
      />
    </div>
  );
}
