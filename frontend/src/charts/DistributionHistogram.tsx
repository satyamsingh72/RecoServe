import { ResponsiveBar } from '@nivo/bar';

interface Props {
  data: { bucket: string; count: number }[];
  color?: string;
  label?: string;
}

const theme = {
  axis: { ticks: { text: { fill: '#475569', fontSize: 10 } } },
  grid: { line: { stroke: 'rgba(0,0,0,0.04)' } },
  tooltip: { container: { background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', color: '#1e293b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } },
};

export default function DistributionHistogram({ data, color = '#a78bfa', label = 'Count' }: Props) {
  const formatted = data.map(d => ({ bucket: d.bucket, [label]: d.count }));

  return (
    <div style={{ height: 240 }}>
      <ResponsiveBar
        data={formatted}
        keys={[label]}
        indexBy="bucket"
        margin={{ top: 10, right: 10, bottom: 65, left: 48 }}
        padding={0.15}
        colors={[color]}
        borderRadius={3}
        axisBottom={{ tickRotation: -40, tickSize: 0 }}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        enableLabel={false}
        enableGridX={false}
        theme={theme}
        animate
      />
    </div>
  );
}
