
import { ResponsivePie } from '@nivo/pie';
import type { CategoryStat } from '../api/client';

interface Props { data: CategoryStat[] }

const theme = {
  labels: { text: { fill: '#475569', fontSize: 11, fontWeight: 600 } },
  tooltip: { container: { background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', color: '#1e293b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } },
};

export default function CategoryPie({ data }: Props) {
  const formatted = data.map(d => ({
    id: d.category,
    label: d.category,
    value: d.count,
  }));

  return (
    <div style={{ height: 280 }}>
      <ResponsivePie
        data={formatted}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.6}
        padAngle={1}
        cornerRadius={4}
        activeOuterRadiusOffset={8}
        colors={{ scheme: 'nivo' }}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        enableArcLabels={true}
        arcLabelsTextColor="#ffffff"
        arcLabelsSkipAngle={10}
        theme={theme}
        animate
      />
    </div>
  );
}
