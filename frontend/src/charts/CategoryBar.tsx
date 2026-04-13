import { ResponsiveBar } from '@nivo/bar';
import type { CategoryStat } from '../api/client';

interface Props { data: CategoryStat[] }

const theme = {
  axis: { ticks: { text: { fill: '#475569', fontSize: 11 } }, legend: { text: { fill: '#64748b' } } },
  grid: { line: { stroke: 'rgba(0,0,0,0.04)' } },
  tooltip: { container: { background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', color: '#1e293b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } },
};

export default function CategoryBar({ data }: Props) {
  const formatted = data.map(d => ({
    category: d.category.length > 12 ? d.category.slice(0, 11) + '…' : d.category,
    'Avg Score': parseFloat(d.avg_score.toFixed(3)),
    'Avg Lift':  parseFloat(d.avg_lift.toFixed(3)),
  }));

  return (
    <div style={{ height: 280 }}>
      <ResponsiveBar
        data={formatted}
        keys={['Avg Score', 'Avg Lift']}
        indexBy="category"
        groupMode="grouped"
        margin={{ top: 10, right: 20, bottom: 60, left: 48 }}
        padding={0.25}
        innerPadding={3}
        colors={['#6378ff', '#22d3ee']}
        borderRadius={4}
        axisBottom={{ tickRotation: -30 }}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        enableLabel={false}
        enableGridX={false}
        theme={theme}
        animate
      />
    </div>
  );
}
